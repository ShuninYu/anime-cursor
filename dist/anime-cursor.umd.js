(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.AnimeCursor = factory());
})(this, (function () { 'use strict';

    // AnimeCursor by github@ShuninYu
    // v2.0.1

    let _instance = null;

    class AnimeCursor {
        static get instance() {
            return _instance;
        }

        static destroy() {
            if (_instance) {
                _instance.destroy();
                return true;
            }
            return false;
        }

        static refresh() {
            if (_instance) {
                _instance.refresh();
                return true;
            }
            return false;
        }

        static disable() {
            if (_instance) {
                _instance.disable();
                return true;
            }
            return false;
        }

        static enable() {
            if (_instance) {
                _instance.enable();
                return true;
            }
            return false;
        }

        constructor(options = {}) {
            if (_instance) {
                console.warn('[AnimeCursor] Instance already exists, returning existing one');
                return _instance;
            }

            this.options = {
                debug: false,
                enableTouch: false,
                fallbackCursor: 'auto',           // Fallback cursor type (auto, pointer, etc.)
                excludeSelectors: 'input, textarea, [contenteditable]', // Exclude native cursor elements
                ...options
            };

            this.disabled = false;
            this.cursors = this.options.cursors || {};

            // 检查是否应启用（触摸设备且未强制启用则禁用）
            if (!this.options.enableTouch && !this.isMouseLikeDevice()) {
                this.disabled = true;
                if (this.options.debug) {
                    console.warn('[AnimeCursor] Touch device detected, cursor animations disabled');
                }
                return;
            }

            this.styleEl = null;
            this.debugEl = null;
            this._onMouseMove = null;

            this._validateOptions();
            this._preloadImages();
            this._checkDomLoad();

            _instance = this;
        }

        // 判断是否鼠标设备
        isMouseLikeDevice() {
            return window.matchMedia('(pointer: fine)').matches;
        }

        // 验证配置（修改点：默认光标可选）
        _validateOptions() {
            if (this.disabled) return;

            if (!this.cursors || Object.keys(this.cursors).length === 0) {
                throw new Error('[AnimeCursor] At least one cursor must be defined');
            }

            let hasDefault = false;
            for (const [name, cfg] of Object.entries(this.cursors)) {
                // 检查必填项
                if (!cfg.image) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" missing required setting: image`);
                }

                // 处理 frames 和 duration 配置
                if (cfg.frames !== undefined && cfg.duration !== undefined) {
                    const framesType = typeof cfg.frames;
                    const durationType = typeof cfg.duration;
                    if (framesType !== durationType) {
                        console.warn(`[AnimeCursor] Cursor "${name}" has mismatched types for frames and duration, treating as static cursor`);
                        delete cfg.frames;
                        delete cfg.duration;
                    } else if (Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) {
                        if (cfg.frames.length !== cfg.duration.length) {
                            console.warn(`[AnimeCursor] Cursor "${name}" frames and duration arrays have different lengths, treating as static cursor`);
                            delete cfg.frames;
                            delete cfg.duration;
                        } else {
                            for (let f of cfg.frames) {
                                if (!Number.isInteger(f) || f <= 0) {
                                    console.warn(`[AnimeCursor] Cursor "${name}" frames array contains invalid value, treating as static cursor`);
                                    delete cfg.frames;
                                    delete cfg.duration;
                                    break;
                                }
                            }
                            for (let d of cfg.duration) {
                                if (typeof d !== 'number' || d <= 0) {
                                    console.warn(`[AnimeCursor] Cursor "${name}" duration array contains invalid value, treating as static cursor`);
                                    delete cfg.frames;
                                    delete cfg.duration;
                                    break;
                                }
                            }
                        }
                    } else if (typeof cfg.frames === 'number' && typeof cfg.duration === 'number') {
                        if (cfg.frames <= 0 || cfg.duration <= 0) {
                            console.warn(`[AnimeCursor] Cursor "${name}" frames or duration <= 0, treating as static cursor`);
                            delete cfg.frames;
                            delete cfg.duration;
                        }
                    } else {
                        console.warn(`[AnimeCursor] Cursor "${name}" frames and duration must be both numbers or both arrays, treating as static cursor`);
                        delete cfg.frames;
                        delete cfg.duration;
                    }
                } else if (cfg.frames !== undefined || cfg.duration !== undefined) {
                    console.warn(`[AnimeCursor] Cursor "${name}" has only frames or duration defined, treating as static cursor`);
                    delete cfg.frames;
                    delete cfg.duration;
                }

                if (cfg.tags && !Array.isArray(cfg.tags)) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" tags must be an array`);
                }
                if (cfg.default) {
                    if (hasDefault) throw new Error('[AnimeCursor] Only one default cursor allowed');
                    hasDefault = true;
                }
                if (cfg.offset && (!Array.isArray(cfg.offset) || cfg.offset.length !== 2)) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" offset must be [x, y] array`);
                }
            }

            // 不再强制要求默认光标
            this.defaultCursorName = hasDefault ? Object.keys(this.cursors).find(name => this.cursors[name].default) : null;
        }

        // 预加载所有图片
        _preloadImages() {
            const images = new Set();
            for (const cfg of Object.values(this.cursors)) {
                const frameUrls = this._getFrameUrls(cfg);
                frameUrls.forEach(url => images.add(url));
            }
            images.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = url;
                if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
                    link.crossOrigin = 'anonymous';
                }
                document.head.appendChild(link);
            });
            if (this.options.debug && images.size) {
                console.info(`[AnimeCursor] Preloaded ${images.size} cursor images`);
            }
        }

        // 根据配置生成所有帧的 URL 数组
        _getFrameUrls(cfg) {
            let totalFrames = 1;
            if (cfg.frames !== undefined) {
                if (Array.isArray(cfg.frames)) {
                    totalFrames = cfg.frames.reduce((a, b) => a + b, 0);
                } else if (typeof cfg.frames === 'number') {
                    totalFrames = cfg.frames;
                }
            }

            const { image } = cfg;
            if (totalFrames === 1) return [image];

            const { prefix, suffix, startNum, numFormat, ext } = this._parseImagePattern(image);
            const urls = [];
            for (let i = 0; i < totalFrames; i++) {
                const frameNum = startNum + i;
                const numStr = numFormat ? this._formatNumber(frameNum, numFormat) : frameNum;
                const url = `${prefix}${numStr}${suffix}${ext}`;
                urls.push(url);
            }
            return urls;
        }

        _parseImagePattern(path) {
            const extMatch = path.match(/\.[^.]+$/);
            const ext = extMatch ? extMatch[0] : '';
            const base = path.slice(0, -ext.length);
            const numMatch = base.match(/(\d+)(?!.*\d)/);
            if (!numMatch) {
                return {
                    prefix: base + '_',
                    suffix: '',
                    startNum: 1,
                    numFormat: null,
                    ext
                };
            }
            const numStr = numMatch[0];
            const startNum = parseInt(numStr, 10);
            const numFormat = numStr.length;
            const prefix = base.slice(0, numMatch.index);
            const suffix = base.slice(numMatch.index + numStr.length);
            return { prefix, suffix, startNum, numFormat, ext };
        }

        _formatNumber(num, width) {
            return String(num).padStart(width, '0');
        }

        _checkDomLoad() {
            const init = () => {
                this._injectStyles();
                if (this.options.debug) this._initDebug();
                console.log('[AnimeCursor] Initialization complete');
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        }

        // 注入所有 CSS 规则（修改点：只有存在默认光标才生成 * 规则）
        _injectStyles() {
            if (this.disabled) return;

            const style = document.createElement('style');
            style.id = 'animecursor-styles';
            let css = '';

            // 如果有默认光标，生成全局规则
            if (this.defaultCursorName) {
                const defaultCfg = this.cursors[this.defaultCursorName];
                const defaultCursorDef = this._buildCursorCss(this.defaultCursorName, defaultCfg);
                css += `* { ${defaultCursorDef} }\n`;
            }

            // 为每个光标生成独立的类和关键帧
            for (const [name, cfg] of Object.entries(this.cursors)) {
                const className = `.ac-cursor-${name}`;
                const offset = cfg.offset || [0, 0];
                const fallback = cfg.fallback || this.options.fallbackCursor;

                const frameUrls = this._getFrameUrls(cfg);
                const frameCount = frameUrls.length;

                const hasAnimation = cfg.frames !== undefined && cfg.duration !== undefined &&
                    ((Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) ||
                        (typeof cfg.frames === 'number' && typeof cfg.duration === 'number'));

                if (hasAnimation && frameCount > 1) {
                    const keyframeName = `ac_anim_${name}`;
                    let keyframesCss = `@keyframes ${keyframeName} {\n`;
                    const keyframes = this._buildKeyframes(cfg, frameUrls);
                    for (const kf of keyframes) {
                        let percent = (kf.percent * 100).toFixed(5);
                        if (kf.percent === 1.0) percent = '100';
                        const cursorRule = `cursor: url("${kf.url}") ${offset[0]} ${offset[1]}, ${fallback};`;
                        keyframesCss += `  ${percent}% { ${cursorRule} }\n`;
                    }
                    keyframesCss += `}\n`;
                    css += keyframesCss;

                    const totalDuration = Array.isArray(cfg.duration) ? cfg.duration.reduce((a, b) => a + b, 0) : cfg.duration;
                    const animation = `${keyframeName} ${totalDuration}s steps(1) infinite ${cfg.pingpong ? 'alternate' : ''}`;
                    css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; animation: ${animation}; }\n`;
                } else {
                    css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; }\n`;
                }

                if (cfg.tags && cfg.tags.length) {
                    const selector = cfg.tags.join(', ');
                    css += `${selector} { ${this._buildCursorCss(name, cfg)} }\n`;
                }
                css += `[data-cursor="${name}"] { ${this._buildCursorCss(name, cfg)} }\n`;
            }

            if (this.options.excludeSelectors) {
                css += `${this.options.excludeSelectors} { cursor: text !important; animation: none !important; }\n`;
            }

            css += `body.animecursor-disabled * { cursor: auto !important; animation: none !important; }\n`;

            style.textContent = css;
            document.head.appendChild(style);
            this.styleEl = style;
        }

        _buildKeyframes(cfg, frameUrls) {
            let frames = cfg.frames;
            let durations = cfg.duration;
            const frameCount = frameUrls.length;

            if (typeof frames === 'number') {
                const perFrameDuration = durations / frames;
                frames = new Array(frames).fill(1);
                durations = new Array(frames.length).fill(perFrameDuration);
            }

            const keyframes = [];
            let totalTime = durations.reduce((a, b) => a + b, 0);
            let currentTime = 0;
            let frameIdx = 0;
            for (let seg = 0; seg < frames.length; seg++) {
                const segFrames = frames[seg];
                const segDuration = durations[seg];
                const stepTime = segDuration / segFrames;
                for (let f = 0; f < segFrames; f++) {
                    const percent = currentTime / totalTime;
                    keyframes.push({
                        percent: percent,
                        url: frameUrls[frameIdx]
                    });
                    currentTime += stepTime;
                    frameIdx++;
                }
            }
            keyframes.push({
                percent: 1.0,
                url: frameUrls[frameCount - 1]
            });
            return keyframes;
        }

        _buildCursorCss(name, cfg) {
            const frameUrls = this._getFrameUrls(cfg);
            const offset = cfg.offset || [0, 0];
            const fallback = cfg.fallback || this.options.fallbackCursor;
            let css = `cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback};`;
            const hasAnimation = cfg.frames !== undefined && cfg.duration !== undefined &&
                ((Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) ||
                    (typeof cfg.frames === 'number' && typeof cfg.duration === 'number'));
            if (hasAnimation && frameUrls.length > 1) {
                const totalDuration = Array.isArray(cfg.duration) ? cfg.duration.reduce((a, b) => a + b, 0) : cfg.duration;
                css += ` animation: ac_anim_${name} ${totalDuration}s steps(1) infinite ${cfg.pingpong ? 'alternate' : ''};`;
            }
            return css;
        }

        _initDebug() {
            const debugDiv = document.createElement('div');
            debugDiv.className = 'animecursor-debug';
            debugDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      background: rgba(0,0,0,0.7);
      color: #0f0;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 2147483647;
      pointer-events: none;
      white-space: nowrap;
    `;
            document.body.appendChild(debugDiv);
            this.debugEl = debugDiv;

            let lastCursor = '';
            this._onMouseMove = (e) => {
                const target = document.elementFromPoint(e.clientX, e.clientY);
                let cursorType = null;
                if (target) {
                    if (target.dataset.cursor && this.cursors[target.dataset.cursor]) {
                        cursorType = target.dataset.cursor;
                    } else {
                        for (const [name, cfg] of Object.entries(this.cursors)) {
                            if (cfg.tags && cfg.tags.some(tag => target.matches(tag))) {
                                cursorType = name;
                                break;
                            }
                        }
                    }
                }
                // 如果没有匹配到任何自定义光标，且没有默认光标，则显示 "native"
                if (!cursorType && !this.defaultCursorName) {
                    cursorType = 'native';
                } else if (!cursorType && this.defaultCursorName) {
                    cursorType = this.defaultCursorName;
                }
                if (cursorType !== lastCursor) {
                    lastCursor = cursorType;
                    debugDiv.textContent = `🎯 ${cursorType} @ (${e.clientX}, ${e.clientY})`;
                } else {
                    debugDiv.textContent = `🎯 ${cursorType} @ (${e.clientX}, ${e.clientY})`;
                }
            };
            document.addEventListener('mousemove', this._onMouseMove);
        }

        refresh() {
            if (this.disabled) return;
            if (this.styleEl) this.styleEl.remove();
            this._injectStyles();
            if (this.options.debug) {
                if (this.debugEl) this.debugEl.remove();
                this._initDebug();
            }
            console.log('[AnimeCursor] Refresh complete');
        }

        destroy() {
            if (this.disabled) return;
            if (this.styleEl) this.styleEl.remove();
            if (this.debugEl) this.debugEl.remove();
            if (this._onMouseMove) {
                document.removeEventListener('mousemove', this._onMouseMove);
            }
            document.body.classList.remove('animecursor-disabled');
            _instance = null;
            console.log('[AnimeCursor] Destroyed');
        }

        disable() {
            if (this.disabled) return;
            this.disabled = true;
            document.body.classList.add('animecursor-disabled');
            if (this.options.debug) console.log('[AnimeCursor] Disabled');
        }

        enable() {
            if (!this.disabled) return;
            this.disabled = false;
            document.body.classList.remove('animecursor-disabled');
            if (this.options.debug) console.log('[AnimeCursor] Enabled');
        }
    }

    return AnimeCursor;

}));
