(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.AnimeCursor = factory());
})(this, (function () { 'use strict';

    // AnimeCursor by github@ShuninYu
    // v2.0.0-alpha.1

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
                console.warn('[AnimeCursor] Instance already exists, returning existing instance');
                return _instance;
            }

            this.options = {
                debug: false,
                enableTouch: false,
                fallbackCursor: 'auto',      // 备选光标类型（auto, pointer, etc.）
                excludeSelectors: 'input, textarea, [contenteditable]', // 排除原生光标元素
                ...options
            };

            this.disabled = false;
            this.cursors = this.options.cursors || {};

            // 检查是否应启用（触摸设备且未强制启用则禁用）
            if (!this.options.enableTouch && !this.isMouseLikeDevice()) {
                this.disabled = true;
                if (this.options.debug) {
                    console.warn('[AnimeCursor] Touch device, cursor animation disabled');
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

        // 验证配置
        _validateOptions() {
            if (this.disabled) return;

            if (!this.cursors || Object.keys(this.cursors).length === 0) {
                throw new Error('[AnimeCursor] At least one cursor must be defined');
            }

            let hasDefault = false;
            for (const [name, cfg] of Object.entries(this.cursors)) {
                // 检查必填项
                if (!cfg.frames) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" missing frames configuration`);
                }
                if (!cfg.image) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" missing image configuration`);
                }
                // 检查 frames 和 duration 一致性
                if (Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) {
                    if (cfg.frames.length !== cfg.duration.length) {
                        throw new Error(`[AnimeCursor] Cursor "${name}" frames and duration array lengths do not match`);
                    }
                } else if (typeof cfg.frames === 'number' && typeof cfg.duration === 'number') ; else {
                    throw new Error(`[AnimeCursor] Cursor "${name}" frames and duration types do not match, must both be numbers or both equal-length arrays`);
                }
                // 检查 tags
                if (cfg.tags && !Array.isArray(cfg.tags)) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" tags must be an array`);
                }
                // 检查 default
                if (cfg.default) {
                    if (hasDefault) throw new Error('[AnimeCursor] Only one default cursor allowed');
                    hasDefault = true;
                }
                // 检查 offset
                if (cfg.offset && (!Array.isArray(cfg.offset) || cfg.offset.length !== 2)) {
                    throw new Error(`[AnimeCursor] Cursor "${name}" offset must be an [x, y] array`);
                }
            }

            if (!hasDefault) {
                throw new Error('[AnimeCursor] A default cursor must be set (default: true)');
            }

            this.defaultCursorName = Object.keys(this.cursors).find(name => this.cursors[name].default);
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
                console.info(`[AnimeCursor] Preloading ${images.size} cursor images`);
            }
        }

        // 根据配置生成所有帧的 URL 数组
        _getFrameUrls(cfg) {
            const { frames, image } = cfg;
            const frameCount = typeof frames === 'number' ? frames : frames.length;
            if (frameCount === 1) return [image]; // 单帧

            // 解析文件名模板
            const { prefix, suffix, startNum, numFormat, ext } = this._parseImagePattern(image);
            const urls = [];
            for (let i = 0; i < frameCount; i++) {
                const frameNum = startNum + i;
                const numStr = numFormat ? this._formatNumber(frameNum, numFormat) : frameNum;
                const url = `${prefix}${numStr}${suffix}${ext}`;
                urls.push(url);
            }
            return urls;
        }

        // 解析图片路径，提取数字模板
        _parseImagePattern(path) {
            // 匹配最后一个数字部分（包括可能的前后括号/下划线等）
            // 示例：pointer_001.png → prefix='pointer_', num='001', suffix='', ext='.png'
            //       pointer(01).png → prefix='pointer(', num='01', suffix=')', ext='.png'
            //       pointer[1].png → prefix='pointer[', num='1', suffix=']', ext='.png'
            const extMatch = path.match(/\.[^.]+$/);
            const ext = extMatch ? extMatch[0] : '';
            const base = path.slice(0, -ext.length);
            const numMatch = base.match(/(\d+)(?!.*\d)/); // 最后一个数字串
            if (!numMatch) {
                // 无数字，则默认在扩展名前加 _%d
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
            const numFormat = numStr.length; // 数字位数，用于格式化
            const prefix = base.slice(0, numMatch.index);
            const suffix = base.slice(numMatch.index + numStr.length);
            // 判断是否有包裹字符（如括号）
            return { prefix, suffix, startNum, numFormat, ext };
        }

        _formatNumber(num, width) {
            return String(num).padStart(width, '0');
        }

        // 等待 DOM 加载
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

        // 注入所有 CSS 规则
        _injectStyles() {
            if (this.disabled) return;

            const style = document.createElement('style');
            style.id = 'animecursor-styles';
            let css = '';

            // 全局规则：隐藏原生光标并应用默认动画光标
            // 注意：默认光标通过 * 应用，但会被后面更具体的规则覆盖
            const defaultCfg = this.cursors[this.defaultCursorName];
            const defaultCursorDef = this._buildCursorCss(this.defaultCursorName, defaultCfg);
            css += `* { ${defaultCursorDef} }\n`;

            // 为每个光标生成独立的类和关键帧
            for (const [name, cfg] of Object.entries(this.cursors)) {
                const className = `.ac-cursor-${name}`;
                cfg.frames;
                const duration = cfg.duration;
                const offset = cfg.offset || [0, 0];
                const fallback = cfg.fallback || this.options.fallbackCursor;

                // 获取所有帧 URL
                const frameUrls = this._getFrameUrls(cfg);
                const frameCount = frameUrls.length;

                // 生成动画关键帧
                if (frameCount > 1) {
                    const keyframeName = `ac_anim_${name}`;
                    let keyframesCss = `@keyframes ${keyframeName} {\n`;

                    // 根据 duration 类型计算每个关键帧的百分比
                    let durations = [];
                    if (Array.isArray(duration)) {
                        durations = duration;
                    } else {
                        durations = new Array(frameCount).fill(duration / frameCount);
                    }
                    const totalTime = durations.reduce((a, b) => a + b, 0);
                    let acc = 0;
                    for (let i = 0; i < frameCount; i++) {
                        const percent = (acc / totalTime) * 100;
                        const cursorRule = `cursor: url("${frameUrls[i]}") ${offset[0]} ${offset[1]}, ${fallback};`;
                        keyframesCss += `  ${percent}% { ${cursorRule} }\n`;
                        acc += durations[i];
                    }
                    // 100% 使用最后一帧
                    keyframesCss += `  100% { cursor: url("${frameUrls[frameCount - 1]}") ${offset[0]} ${offset[1]}, ${fallback}; }\n`;
                    keyframesCss += `}\n`;
                    css += keyframesCss;

                    // 应用动画的类
                    const animation = `${keyframeName} ${totalTime}s steps(1) infinite ${cfg.pingpong ? 'alternate' : ''}`;
                    css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; animation: ${animation}; }\n`;
                } else {
                    // 单帧无动画
                    css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; }\n`;
                }

                // 为 tags 和 data-cursor 生成选择器规则
                if (cfg.tags && cfg.tags.length) {
                    const selector = cfg.tags.join(', ');
                    css += `${selector} { ${this._buildCursorCss(name, cfg)} }\n`;
                }
                // 支持 data-cursor 属性
                css += `[data-cursor="${name}"] { ${this._buildCursorCss(name, cfg)} }\n`;
            }

            // 排除原生文本光标元素
            if (this.options.excludeSelectors) {
                css += `${this.options.excludeSelectors} { cursor: text !important; animation: none !important; }\n`;
            }

            // 全局禁用类
            css += `body.animecursor-disabled * { cursor: auto !important; animation: none !important; }\n`;

            style.textContent = css;
            document.head.appendChild(style);
            this.styleEl = style;
        }

        // 生成单个光标的 CSS 声明（不包含动画）
        _buildCursorCss(name, cfg) {
            const frameUrls = this._getFrameUrls(cfg);
            const offset = cfg.offset || [0, 0];
            const fallback = cfg.fallback || this.options.fallbackCursor;
            return `cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback};${frameUrls.length > 1 ? ` animation: ac_anim_${name} ${cfg.duration}s steps(1) infinite ${cfg.pingpong ? 'alternate' : ''};` : ''
            }`;
        }

        // 调试模式：显示当前光标类型和坐标
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
                let cursorType = this.defaultCursorName;
                if (target) {
                    if (target.dataset.cursor && this.cursors[target.dataset.cursor]) {
                        cursorType = target.dataset.cursor;
                    } else {
                        // 检查匹配 tags
                        for (const [name, cfg] of Object.entries(this.cursors)) {
                            if (cfg.tags && cfg.tags.some(tag => target.matches(tag))) {
                                cursorType = name;
                                break;
                            }
                        }
                    }
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

        // 刷新：重新注入样式（用于动态添加新光标等场景）
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

        // 销毁实例
        destroy() {
            if (this.disabled) return;
            if (this.styleEl) this.styleEl.remove();
            if (this.debugEl) this.debugEl.remove();
            if (this._onMouseMove) {
                document.removeEventListener('mousemove', this._onMouseMove);
            }
            // 清除全局禁用类
            document.body.classList.remove('animecursor-disabled');
            _instance = null;
            console.log('[AnimeCursor] Destroyed');
        }

        // 禁用光标动画
        disable() {
            if (this.disabled) return;
            this.disabled = true;
            document.body.classList.add('animecursor-disabled');
            if (this.options.debug) console.log('[AnimeCursor] Disabled');
        }

        // 启用光标动画
        enable() {
            if (!this.disabled) return;
            this.disabled = false;
            document.body.classList.remove('animecursor-disabled');
            if (this.options.debug) console.log('[AnimeCursor] Enabled');
        }
    }

    return AnimeCursor;

}));
