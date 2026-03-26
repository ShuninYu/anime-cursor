(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.AnimeCursor = factory());
})(this, (function () { 'use strict';

    // AnimeCursor by github@ShuninYu
    // v2.1.2

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
                fallbackCursor: 'auto',
                excludeSelectors: 'input, textarea, [contenteditable]',
                combineAnimations: false,     // 是否自动组合用户动画
                ...options
            };

            this.disabled = false;
            this.cursors = this.options.cursors || {};
            this.cursorAnimationStrings = {};     // 存储每个光标类型的动画字符串
            this.combinedRules = new Map();       // 存储已生成的组合类名

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

        isMouseLikeDevice() {
            return window.matchMedia('(pointer: fine)').matches;
        }

        _validateOptions() {
            if (this.disabled) return;

            if (!this.cursors || Object.keys(this.cursors).length === 0) {
                throw new Error('[AnimeCursor] At least one cursor must be defined');
            }

            let hasDefault = false;
            for (const [name, cfg] of Object.entries(this.cursors)) {
                if (!cfg.image) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" missing required setting: image`);
                }

                // 处理 frames 和 duration
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

            this.defaultCursorName = hasDefault ? Object.keys(this.cursors).find(name => this.cursors[name].default) : null;
        }

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

        // 核心注入样式
        _injectStyles() {
            if (this.disabled) return;
            this.combinedRules.clear();

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

                let cursorAnimation = '';
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
                    cursorAnimation = animation;
                    css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; animation: ${animation}; }\n`;
                } else {
                    // 静态光标：生成一帧动画，只播放一次，结束后保持最后一帧
                    const staticKeyframeName = `ac_anim_${name}_static`;
                    css += `@keyframes ${staticKeyframeName} {\n`;
                    css += `  0%, 100% { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; }\n`;
                    css += `}\n`;
                    const staticAnimation = `${staticKeyframeName} 0.001s forwards steps(1)`;
                    cursorAnimation = staticAnimation;
                    css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; animation: ${staticAnimation}; }\n`;
                }

                this.cursorAnimationStrings[name] = cursorAnimation;

                // 标签和 data-cursor 规则
                if (cfg.tags && cfg.tags.length) {
                    const selector = cfg.tags.join(', ');
                    css += `${selector} { ${this._buildCursorCss(name, cfg)} }\n`;
                }
                css += `[data-cursor="${name}"] { ${this._buildCursorCss(name, cfg)} }\n`;
            }

            if (this.options.excludeSelectors) {
                css += `${this.options.excludeSelectors} { cursor: text !important; animation: none !important; }\n`;
            }

            // 自动组合动画
            if (this.options.combineAnimations) {
                const elements = document.querySelectorAll('[data-ac-animation]');
                for (const el of elements) {
                    const userAnim = el.getAttribute('data-ac-animation');
                    if (!userAnim) continue;

                    let cursorName = this._getCursorTypeForElement(el);
                    if (!cursorName) continue;

                    const cursorAnim = this.cursorAnimationStrings[cursorName];
                    if (!cursorAnim) continue;

                    const key = `${cursorName}:${userAnim}`;
                    if (!this.combinedRules.has(key)) {
                        const hash = this._simpleHash(key);
                        const combinedClass = `ac-combined-${hash}`;
                        css += `.${combinedClass} { animation: ${cursorAnim}, ${userAnim}; }\n`;
                        this.combinedRules.set(key, combinedClass);
                    }
                    const combinedClass = this.combinedRules.get(key);
                    el.classList.add(combinedClass);
                }
            }

            css += `body.animecursor-disabled * { cursor: auto !important; animation: none !important; }\n`;

            style.textContent = css;
            document.head.appendChild(style);
            this.styleEl = style;
        }

        // 获取元素对应的光标类型（复用 debug 逻辑）
        _getCursorTypeForElement(el) {
            if (el.dataset.cursor && this.cursors[el.dataset.cursor]) {
                return el.dataset.cursor;
            }
            for (const [name, cfg] of Object.entries(this.cursors)) {
                if (cfg.tags && cfg.tags.some(tag => el.matches(tag))) {
                    return name;
                }
            }
            return this.defaultCursorName; // 可能为 null
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
            } else {
                // 静态光标：一帧动画，只播放一次，结束后保持
                css += ` animation: ac_anim_${name}_static 0.001s forwards steps(1);`;
            }
            return css;
        }

        _simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0;
            }
            return Math.abs(hash).toString(36);
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
            this.combinedRules.clear();
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
            // 移除样式表
            if (this.styleEl) {
                this.styleEl.remove();
                this.styleEl = null;
            }
            // 移除 debug 相关
            if (this.debugEl) {
                this.debugEl.remove();
                this.debugEl = null;
            }
            if (this._onMouseMove) {
                document.removeEventListener('mousemove', this._onMouseMove);
                this._onMouseMove = null;
            }
            this.disabled = true;
            if (this.options.debug) console.log('[AnimeCursor] Disabled');
        }

        enable() {
            if (!this.disabled) return;
            this.disabled = false;
            // 重新注入样式
            this._injectStyles();
            // 如果 debug 模式开启，重新初始化 debug
            if (this.options.debug) {
                this._initDebug();
            }
            if (this.options.debug) console.log('[AnimeCursor] Enabled');
        }
    }

    return AnimeCursor;

}));
