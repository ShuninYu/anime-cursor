// AnimeCursor by github@ShuninYu
// v2.1.3

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
            fallbackCursor: 'auto',
            excludeSelectors: 'input, textarea, [contenteditable]',
            combineAnimations: false,
            ...options
        };

        this.disabled = false;
        this.cursors = this.options.cursors || {};
        this.cursorAnimationStrings = {};
        this.combinedRules = new Map();

        if (!this.options.enableTouch && !this.isMouseLikeDevice()) {
            this.disabled = true;
            if (this.options.debug) {
                console.warn('[AnimeCursor] Touch device detected, cursor animations disabled');
            }
            return;
        }

        this.styleEl = null;
        this.debugEl = null;
        this.crosshairEl = null;
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

    _injectStyles() {
        if (this.disabled) return;
        this.combinedRules.clear();

        const style = document.createElement('style');
        style.id = 'animecursor-styles';
        let css = '';

        if (this.defaultCursorName) {
            const defaultCfg = this.cursors[this.defaultCursorName];
            const defaultCursorDef = this._buildCursorCss(this.defaultCursorName, defaultCfg);
            css += `* { ${defaultCursorDef} }\n`;
        }

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
                const staticKeyframeName = `ac_anim_${name}_static`;
                css += `@keyframes ${staticKeyframeName} {\n`;
                css += `  0%, 100% { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; }\n`;
                css += `}\n`;
                const staticAnimation = `${staticKeyframeName} 0.001s forwards steps(1)`;
                cursorAnimation = staticAnimation;
                css += `${className} { cursor: url("${frameUrls[0]}") ${offset[0]} ${offset[1]}, ${fallback}; animation: ${staticAnimation}; }\n`;
            }

            this.cursorAnimationStrings[name] = cursorAnimation;

            if (cfg.tags && cfg.tags.length) {
                const selector = cfg.tags.join(', ');
                css += `${selector} { ${this._buildCursorCss(name, cfg)} }\n`;
            }
            css += `[data-cursor="${name}"] { ${this._buildCursorCss(name, cfg)} }\n`;
        }

        if (this.options.excludeSelectors) {
            css += `${this.options.excludeSelectors} { cursor: text !important; animation: none !important; }\n`;
        }

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

    _getCursorTypeForElement(el) {
        if (el.dataset.cursor && this.cursors[el.dataset.cursor]) {
            return el.dataset.cursor;
        }
        for (const [name, cfg] of Object.entries(this.cursors)) {
            if (cfg.tags && cfg.tags.some(tag => el.matches(tag))) {
                return name;
            }
        }
        return this.defaultCursorName;
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
        // 创建左上角信息浮层（现有 debug 面板）
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
            pointer-events: auto;
            white-space: nowrap;
            transition: opacity 0.2s ease;
        `;
        // hover 时半透明，便于查看被遮挡内容
        debugDiv.addEventListener('mouseenter', () => { debugDiv.style.opacity = '0.5'; });
        debugDiv.addEventListener('mouseleave', () => { debugDiv.style.opacity = '1'; });
        document.body.appendChild(debugDiv);
        this.debugEl = debugDiv;

        // 创建跟随鼠标的十字辅助线层（横竖双色线）
        const crosshair = document.createElement('div');
        crosshair.className = 'animecursor-crosshair';
        crosshair.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: 0;
            pointer-events: none;
            z-index: 2147483646;
        `;
        // 横线
        const hLine = document.createElement('div');
        hLine.className = 'ac-crosshair-h';
        hLine.style.cssText = `
            position: fixed;
            left: 0;
            width: 100%;
            height: 1px;
            background-color: rgba(255,0,0,0.6);
            pointer-events: none;
            transform: translateY(-0.5px);
        `;
        // 竖线
        const vLine = document.createElement('div');
        vLine.className = 'ac-crosshair-v';
        vLine.style.cssText = `
            position: fixed;
            top: 0;
            width: 1px;
            height: 100%;
            background-color: rgba(255,0,0,0.6);
            pointer-events: none;
            transform: translateX(-0.5px);
        `;
        crosshair.appendChild(hLine);
        crosshair.appendChild(vLine);
        document.body.appendChild(crosshair);
        this.crosshairEl = { container: crosshair, hLine, vLine };

        let lastCursor = '';
        this._onMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;

            // 更新十字线位置
            if (this.crosshairEl) {
                this.crosshairEl.hLine.style.top = y + 'px';
                this.crosshairEl.vLine.style.left = x + 'px';
            }

            const target = document.elementFromPoint(x, y);
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
                debugDiv.textContent = `${cursorType} @ (${x}, ${y})`;
            } else {
                debugDiv.textContent = `${cursorType} @ (${x}, ${y})`;
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
            if (this.crosshairEl) this.crosshairEl.container.remove();
            this._initDebug();
        }
        console.log('[AnimeCursor] Refresh complete');
    }

    destroy() {
        if (this.disabled) return;
        if (this.styleEl) this.styleEl.remove();
        if (this.debugEl) this.debugEl.remove();
        if (this.crosshairEl) this.crosshairEl.container.remove();
        if (this._onMouseMove) {
            document.removeEventListener('mousemove', this._onMouseMove);
        }
        document.body.classList.remove('animecursor-disabled');
        _instance = null;
        console.log('[AnimeCursor] Destroyed');
    }

    disable() {
        if (this.disabled) return;
        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }
        if (this.debugEl) {
            this.debugEl.remove();
            this.debugEl = null;
        }
        if (this.crosshairEl) {
            this.crosshairEl.container.remove();
            this.crosshairEl = null;
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
        this._injectStyles();
        if (this.options.debug) {
            this._initDebug();
        }
        if (this.options.debug) console.log('[AnimeCursor] Enabled');
    }
}