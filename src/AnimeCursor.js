// AnimeCursor by github@ShuninYu
// v2.0.0

let _instance = null;

export default class AnimeCursor {
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

    // 验证配置
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
                // 检查类型一致性
                const framesType = typeof cfg.frames;
                const durationType = typeof cfg.duration;
                if (framesType !== durationType) {
                    console.warn(`[AnimeCursor] Cursor "${name}" has mismatched types for frames and duration, treating as static cursor`);
                    delete cfg.frames;
                    delete cfg.duration;
                } else if (Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) {
                    // 数组形式：必须长度相等
                    if (cfg.frames.length !== cfg.duration.length) {
                        console.warn(`[AnimeCursor] Cursor "${name}" frames and duration arrays have different lengths, treating as static cursor`);
                        delete cfg.frames;
                        delete cfg.duration;
                    } else {
                        // 验证数组元素为正整数/正数
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
                    // 数字形式：合法
                    if (cfg.frames <= 0 || cfg.duration <= 0) {
                        console.warn(`[AnimeCursor] Cursor "${name}" frames or duration <= 0, treating as static cursor`);
                        delete cfg.frames;
                        delete cfg.duration;
                    }
                } else {
                    // 其他情况（如一个数字一个数组）
                    console.warn(`[AnimeCursor] Cursor "${name}" frames and duration must be both numbers or both arrays, treating as static cursor`);
                    delete cfg.frames;
                    delete cfg.duration;
                }
            } else if (cfg.frames !== undefined || cfg.duration !== undefined) {
                // 只设置了一个
                console.warn(`[AnimeCursor] Cursor "${name}" has only frames or duration defined, treating as static cursor`);
                delete cfg.frames;
                delete cfg.duration;
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
                throw new Error(`[AnimeCursor] Cursor "${name}" offset must be [x, y] array`);
            }
        }

        if (!hasDefault) {
            throw new Error('[AnimeCursor] A default cursor (default: true) must be defined');
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
            console.info(`[AnimeCursor] Preloaded ${images.size} cursor images`);
        }
    }

    // 根据配置生成所有帧的 URL 数组
    _getFrameUrls(cfg) {
        // 确定总帧数
        let totalFrames = 1; // 默认单帧
        if (cfg.frames !== undefined) {
            if (Array.isArray(cfg.frames)) {
                totalFrames = cfg.frames.reduce((a, b) => a + b, 0);
            } else if (typeof cfg.frames === 'number') {
                totalFrames = cfg.frames;
            }
        }

        const { image } = cfg;
        if (totalFrames === 1) return [image];

        // 解析文件名模板
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

    // 解析图片路径，提取数字模板
    _parseImagePattern(path) {
        // 匹配最后一个数字部分（包括可能的前后括号/下划线等）
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
            const offset = cfg.offset || [0, 0];
            const fallback = cfg.fallback || this.options.fallbackCursor;

            // 获取所有帧 URL
            const frameUrls = this._getFrameUrls(cfg);
            const frameCount = frameUrls.length;

            // 判断是否有动画（有 frames 和 duration 且都有效）
            const hasAnimation = cfg.frames !== undefined && cfg.duration !== undefined &&
                ((Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) ||
                    (typeof cfg.frames === 'number' && typeof cfg.duration === 'number'));

            if (hasAnimation && frameCount > 1) {
                const keyframeName = `ac_anim_${name}`;
                let keyframesCss = `@keyframes ${keyframeName} {\n`;

                // 构建关键帧列表（百分比和对应图片）
                const keyframes = this._buildKeyframes(cfg, frameUrls);
                for (const kf of keyframes) {
                    let percent = (kf.percent * 100).toFixed(5);
                    if (kf.percent === 1.0) percent = '100';
                    const cursorRule = `cursor: url("${kf.url}") ${offset[0]} ${offset[1]}, ${fallback};`;
                    keyframesCss += `  ${percent}% { ${cursorRule} }\n`;
                }
                keyframesCss += `}\n`;
                css += keyframesCss;

                // 应用动画的类
                const totalDuration = Array.isArray(cfg.duration) ? cfg.duration.reduce((a, b) => a + b, 0) : cfg.duration;
                const animation = `${keyframeName} ${totalDuration}s steps(1) infinite ${cfg.pingpong ? 'alternate' : ''}`;
                css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; animation: ${animation}; }\n`;
            } else {
                // 静态光标
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

    // 根据 frames/duration 配置构建关键帧列表（百分比和对应图片 URL）
    _buildKeyframes(cfg, frameUrls) {
        let frames = cfg.frames;
        let durations = cfg.duration;
        const frameCount = frameUrls.length;

        // 统一转换为数组形式，方便处理
        if (typeof frames === 'number') {
            // 均匀分配
            const perFrameDuration = durations / frames;
            frames = new Array(frames).fill(1);
            durations = new Array(frames.length).fill(perFrameDuration);
        }
        // 此时 frames 和 durations 都是等长数组

        const keyframes = [];
        let totalTime = durations.reduce((a, b) => a + b, 0);
        let currentTime = 0;
        let frameIdx = 0;
        for (let seg = 0; seg < frames.length; seg++) {
            const segFrames = frames[seg];
            const segDuration = durations[seg];
            const stepTime = segDuration / segFrames; // 每帧时长
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
        // 确保最后一帧在 100%
        keyframes.push({
            percent: 1.0,
            url: frameUrls[frameCount - 1]
        });
        return keyframes;
    }

    // 生成单个光标的 CSS 声明（不包含动画，用于选择器规则）
    _buildCursorCss(name, cfg) {
        const frameUrls = this._getFrameUrls(cfg);
        const offset = cfg.offset || [0, 0];
        const fallback = cfg.fallback || this.options.fallbackCursor;
        let css = `cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback};`;
        // 如果有动画，附加动画属性
        const hasAnimation = cfg.frames !== undefined && cfg.duration !== undefined &&
            ((Array.isArray(cfg.frames) && Array.isArray(cfg.duration)) ||
                (typeof cfg.frames === 'number' && typeof cfg.duration === 'number'));
        if (hasAnimation && frameUrls.length > 1) {
            const totalDuration = Array.isArray(cfg.duration) ? cfg.duration.reduce((a, b) => a + b, 0) : cfg.duration;
            css += ` animation: ac_anim_${name} ${totalDuration}s steps(1) infinite ${cfg.pingpong ? 'alternate' : ''};`;
        }
        return css;
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