// AnimeCursor by github@ShuninYu
// v0.4.0

// 静态变量存储唯一实例
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
        // 如果已有实例，直接返回它
        if (_instance) {
            console.warn('[AnimeCursor] AnimeCursor already exists.');
            return _instance;
        }

        this.options = {
            displayOnLoad: false,
            enableTouch: false,
            debug: false,
            ...options
        };
        this.disabled = false;

        if (!this.options.enableTouch && !this.isMouseLikeDevice()) {
            this.disabled = true;

            if (this.options.debug) {
                console.warn('[AnimeCursor] Touch device detected, cursor disabled.');
            }
            return;
        }

        this.cursorEl = null;
        this.lastCursorType = null;
        this.debugEl = null;
        this.styleEl = null;
        this._onMouseMove = null;

        this._validateOptions();
        this._injectPreload();
        this._checkDomLoad();

        // 保存实例引用
        _instance = this;
    }
    
    isMouseLikeDevice() {
        if (this.disabled) return;

        return window.matchMedia('(pointer: fine)').matches;
    }
    
    // ----------------------------
    // 刷新 清理 关闭 开启
    // ----------------------------
    refresh() {
        if (this.disabled) return;
    
        if (this.options.debug) {
            console.info('[AnimeCursor] starting refresh...');
        }
    
        this._bindElements(true);
    }
    destroy() {
        if (this.disabled) return;

        // 1 移除事件监听
        if (this._onMouseMove) {
            document.removeEventListener('mousemove', this._onMouseMove);
            this._onMouseMove = null;
        }
    
        // 2 移除 cursor DOM
        if (this.cursorEl) {
            this.cursorEl.remove();
            this.cursorEl = null;
        }
    
        if (this.debugEl) {
            this.debugEl.remove();
            this.debugEl = null;
        }
    
        // 3 移除注入的 CSS
        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }
    
        // 4 清理 data-cursor（只清理由 AnimeCursor 添加的）
        for (const cfg of Object.values(this.options.cursors)) {
            // v0.2.1 添加检查：只有存在且为数组的 tags 才进行处理
            if (cfg.tags && Array.isArray(cfg.tags)) {
                cfg.tags.forEach(tag => {
                    document.querySelectorAll(tag).forEach(el => {
                        if (el.dataset.cursorBound) {
                            delete el.dataset.cursor;
                            delete el.dataset.cursorBound;
                        }
                    });
                });
            }
        }
    
        // 5 重置状态
        this.lastCursorType = null;

        // 清除静态引用
        if (_instance === this) {
            _instance = null;
        }
    }
    disable() {
        if (this.disabled) return;
        this.disabled = true;
    
        if (this.cursorEl) {
            this.cursorEl.style.display = 'none';
            this.styleEl.innerHTML = this.styleEl.innerHTML.replace('* {cursor: none !important;}', '');
            console.log('[AnimeCursor] AnimeCursor disabled!');
        }
    }
    enable() {
        if (!this.disabled) return;
        this.disabled = false;
    
        if (this.cursorEl) {
            this.cursorEl.style.display = '';
            this.styleEl.innerHTML += '* {cursor: none; !important;}';
            console.log('[AnimeCursor] AnimeCursor enabled!');
        }
    }
    
    // ----------------------------
    // 配置校验（必填项）
    // ----------------------------
    _validateOptions() {
        if (this.disabled) return;
    
        if (!this.options || !this.options.cursors) {
            console.error('[AnimeCursor] missing cursors set up');
            throw new Error('AnimeCursor init failed');
        }
    
        this.defaultCursorType = null;
    
        for (const [name, cfg] of Object.entries(this.options.cursors)) {
            if (cfg.default === true) {
                if (this.defaultCursorType) {
                    throw new Error('[AnimeCursor] There can only be one default cursor');
                }
                this.defaultCursorType = name;
            }
        }
    
        for (const [name, cfg] of Object.entries(this.options.cursors)) {
            const required = ['size', 'image'];
            required.forEach(key => {
                if (cfg[key] === undefined) {
                    console.error(`[AnimeCursor] cursor "${name}" missing required setting: ${key}`);
                    throw new Error('AnimeCursor init failed');
                }
            });
    
            // 新增：校验 frames 与 duration 的类型一致性
            if (cfg.frames !== undefined) {
                if (Array.isArray(cfg.frames)) {
                    // frames 为数组时，duration 必须为等长数组
                    if (!Array.isArray(cfg.duration) || cfg.duration.length !== cfg.frames.length) {
                        console.error(`[AnimeCursor] cursor "${name}" has frames as array but duration is not an array of same length`);
                        throw new Error('AnimeCursor init failed');
                    }
                    // 检查 frames 数组元素是否为正整数
                    for (let f of cfg.frames) {
                        if (!Number.isInteger(f) || f <= 0) {
                            console.error(`[AnimeCursor] cursor "${name}" frames array must contain positive integers`);
                            throw new Error('AnimeCursor init failed');
                        }
                    }
                    // 检查 duration 数组元素是否为正数
                    for (let d of cfg.duration) {
                        if (typeof d !== 'number' || d <= 0) {
                            console.error(`[AnimeCursor] cursor "${name}" duration array must contain positive numbers`);
                            throw new Error('AnimeCursor init failed');
                        }
                    }
                } else if (typeof cfg.frames === 'number') {
                    // frames 为数字时，duration 可选，但不能是数组
                    if (Array.isArray(cfg.duration)) {
                        console.error(`[AnimeCursor] cursor "${name}" frames is number but duration is array, must be consistent`);
                        throw new Error('AnimeCursor init failed');
                    }
                    if (!Number.isInteger(cfg.frames) || cfg.frames <= 0) {
                        console.error(`[AnimeCursor] cursor "${name}" frames must be a positive integer`);
                        throw new Error('AnimeCursor init failed');
                    }
                    if (cfg.duration !== undefined && (typeof cfg.duration !== 'number' || cfg.duration <= 0)) {
                        console.error(`[AnimeCursor] cursor "${name}" duration must be a positive number`);
                        throw new Error('AnimeCursor init failed');
                    }
                } else {
                    console.error(`[AnimeCursor] cursor "${name}" frames must be a number or an array`);
                    throw new Error('AnimeCursor init failed');
                }
            }
    
            if (cfg.tags !== undefined && !Array.isArray(cfg.tags)) {
                console.error(`[AnimeCursor] cursor "${name}" 's tags must be an array if provided`);
                throw new Error('AnimeCursor init failed');
            }
        }
    }

    // ----------------------------
    // 等待 DOM 加载完成
    // ----------------------------
    _checkDomLoad() {
        const init = () => {
            this._injectHTML();
            this._injectCSS();
            this._bindElements();
            this._bindMouse();
        };
    
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // ----------------------------
    // 插入光标图片预加载（）
    // ----------------------------
    _injectPreload() {
        if (this.disabled) return;
        
        // 收集所有需要预加载的图片URL
        const imageUrls = new Set();
        
        // 遍历所有光标配置，提取图片URL
        for (const cfg of Object.values(this.options.cursors)) {
            if (cfg.image) {
                imageUrls.add(cfg.image);
            }
        }
        
        // 为每个图片URL创建预加载标签
        imageUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            
            // 可选：添加跨域处理（如果图片来自不同域名）
            if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
                link.crossOrigin = 'anonymous';
            }
            
            document.head.appendChild(link);
            
            if (this.options.debug) {
                console.info(`[AnimeCursor] Preloading image: ${url}`);
            }
        });
        
        if (this.options.debug && imageUrls.size > 0) {
            console.info(`[AnimeCursor] Preloaded ${imageUrls.size} cursor image(s)`);
        }
    }

    // ----------------------------
    // 插入光标元素 HTML
    // ----------------------------
    _injectHTML() {
        if (this.disabled) return;

        const cursor = document.createElement('div');
        cursor.id = 'anime-cursor';
        
        // 如果debug选项存在，则添加debug元素
        if (this.options.debug) {
            cursor.className = 'cursor-default cursor-debugmode';
            const debuger = document.createElement('div');
            debuger.className = 'anime-cursor-debug';
            document.body.appendChild(debuger);
            this.debugEl = debuger;
        }
        else {cursor.className = 'cursor-default';}
        
        // 检查是否设置初始化时显示光标
        if (this.options.displayOnLoad) {
            cursor.style.display = 'block';
        } else {
            cursor.style.display = 'none';
            cursor.dataset.animecursorHide = 'true';
        }
        document.body.appendChild(cursor);
        this.cursorEl = cursor;
    }

    // ----------------------------
    // 插入样式 CSS
    // ----------------------------
    _injectCSS() {
        if (this.disabled) return;

        const style = document.createElement('style');
        style.id = 'animecursor-styles';
        let css = '';

        /* 通用样式 */
        css += `
        * {cursor: none !important;}
        #anime-cursor {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        background-repeat: no-repeat;
        transform-origin: 0 0;
        transform-style: preserve-3d;
        z-index: ${this._getMaxZIndex()};
        }
        .cursor-debugmode {
            border: 1px solid green;
        }
        .anime-cursor-debug {
            position: fixed;
            top: 0;
            left: 0;
            width: fit-content;
            height: fit-content;
            padding: 5px;
            font-size: 16px;
            text-wrap: nowrap;
            color: red;
            pointer-events: none;
            overflow: visible;
            z-index: 2147483647;
        }
        .anime-cursor-debug::before {
            position: absolute;
            content: "";
            top: 0;
            left: 0;
            width: 100vw;
            height: 1px;
            background-color: red;
        }
        .anime-cursor-debug::after {
            position: absolute;
            content: "";
            top: 0;
            left: 0;
            width: 1px;
            height: 100vh;
            background-color: red;
        }
        `;

        /* 每种光标以及debug生成 CSS */
        for (const [type, cfg] of Object.entries(this.options.cursors)) {
        const className = `.cursor-${type}`;
        const size = cfg.size;
        const image = cfg.image;
        const offset = cfg.offset;
        const zIndex = cfg.zIndex;
        const scale = cfg.scale;
        const isGif = image.toLowerCase().endsWith('.gif');
        const pixel = cfg.pixel ? 'pixelated' : 'auto';

        // 基础样式
        css += `
        ${className} {
            width: ${size[0]}px;
            height: ${size[1]}px;
            background-image: url("${image}");
            image-rendering: ${pixel};
            ${(scale || offset) ? `transform: ${[scale && `scale(${scale[0]}, ${scale[1]})`, offset && `translate(-${offset[0]}px, -${offset[1]}px)`].filter(Boolean).join(' ')};` : ''}
            ${zIndex !== undefined ? `z-index:${zIndex};` : ''}
        }`;

        // 动画生成
        const frames = cfg.frames;
        const duration = cfg.duration;

        // 判断是否使用新逻辑（数组形式）
        if (Array.isArray(frames) && Array.isArray(duration) && frames.length === duration.length) {
            // 计算总帧数和总时长
            const totalFrames = frames.reduce((a, b) => a + b, 0);
            const totalDuration = duration.reduce((a, b) => a + b, 0);
            const hasAnimation = !isGif && totalFrames > 1 && totalDuration > 0;

            if (hasAnimation) {
                const animName = `animecursor_${type}`;
                // 构建关键帧数组
                const keyframes = [];
                let cumPercent = 0;
                let frameIndex = 0;

                for (let p = 0; p < frames.length; p++) {
                    const segFrames = frames[p];
                    const segDuration = duration[p];
                    const segPercent = segDuration / totalDuration;
                    for (let j = 0; j < segFrames; j++) {
                        const startPercent = cumPercent + (j * segPercent) / segFrames;
                        keyframes.push({
                            percent: startPercent,
                            pos: -frameIndex * size[0]
                        });
                        frameIndex++;
                    }
                    cumPercent += segPercent;
                }
                // 添加最后一帧的结束点（100%）
                keyframes.push({
                    percent: 1.0,
                    pos: -(totalFrames - 1) * size[0]
                });

                // 生成动画属性
                css += `
                ${className} {
                    animation: ${animName} ${totalDuration}s infinite ${cfg.pingpong ? 'alternate' : ''};
                }`;

                // 生成 @keyframes
                css += `
                @keyframes ${animName} {`;
                for (let i = 0; i < keyframes.length; i++) {
                    const kf = keyframes[i];
                    let percent = (kf.percent * 100).toFixed(5);
                    if (kf.percent === 1.0) percent = '100'; // 确保100%显示为整数
                    css += `
                    ${percent}% {
                        background-position: ${kf.pos}px 0;
                        ${i < keyframes.length - 1 ? 'animation-timing-function: steps(1, end);' : ''}
                    }`;
                }
                css += `
                }`;
            }
        } else if (typeof frames === 'number' && typeof duration === 'number') {
            // 旧逻辑：均匀动画
            const hasAnimation = !isGif && frames > 1 && duration > 0;
            if (hasAnimation) {
                const animName = `animecursor_${type}`;
                css += `
                ${className} {
                    animation: ${animName} steps(${frames}) ${duration}s infinite ${cfg.pingpong ? 'alternate' : ''};
                }

                @keyframes ${animName} {
                    from { background-position: 0 0; }
                    to { background-position: -${size[0] * frames}px 0; }
                }`;
            }
        }
        // 若 frames 未定义或为单帧，则不生成动画，仅保留基础样式
    }

    style.textContent = css;
    document.head.appendChild(style);
    this.styleEl = style;
}

    // ----------------------------
    // 给元素自动添加 data-cursor
    // ----------------------------
    _bindElements(refresh) {
        if (this.disabled) return;

        for (const [type, cfg] of Object.entries(this.options.cursors)) {
            if (!cfg.tags || !Array.isArray(cfg.tags) || cfg.tags.length === 0) continue;
            
            cfg.tags.forEach(tag => {
                const tagName = tag.toUpperCase();
                document.querySelectorAll(tagName).forEach(el => {
                    if (!el.dataset.cursor) {
                        el.dataset.cursor = type;
                        el.dataset.cursorBound = 'true';
                    }
                });
            });
        }
        if (refresh) {
            console.info('[AnimeCursor] refresh done');
        }
    }

    // ----------------------------
    // 鼠标跟随 & 光标切换
    // ----------------------------
    _bindMouse() {
        if (this.disabled) return;

        this._onMouseMove = (e) => {
            if (this.disabled) return;

            const x = e.clientX;
            const y = e.clientY;

            this.cursorEl.style.left = x + 'px';
            this.cursorEl.style.top = y + 'px';

            if (this.cursorEl.dataset.animecursorHide) {
                this.cursorEl.style.display = 'block';
            }

            if (this.debugEl) {
                this.debugEl.style.left = x + 'px';
                this.debugEl.style.top = y + 'px';
            }

            let nextCursorType = null;

            // 获取命中的元素
            const target = document.elementFromPoint(x, y);

            // 优先使用元素自身的 data-cursor
            if (target && target.dataset && target.dataset.cursor) {
                nextCursorType = target.dataset.cursor;
            }
            // 否则 尝试使用 default 光标
            else if (this.defaultCursorType) {
                nextCursorType = this.defaultCursorType;
            }
            
            // 如果两者都没有 - 保持当前状态
            if (!nextCursorType) return;
            if (this.debugEl) {this.debugEl.textContent = `(${x}px , ${y}px) ${nextCursorType}`;}
            
            // 状态变化才切换 class
            if (nextCursorType !== this.lastCursorType) {
                if (this.debugEl) {this.cursorEl.className = `cursor-${nextCursorType}` + ' cursor-debugmode';}
                else {this.cursorEl.className = `cursor-${nextCursorType}`;}
                this.lastCursorType = nextCursorType;
            }
        };

        document.addEventListener('mousemove', this._onMouseMove);
        console.log('[AnimeCursor] AnimeCursor setted up.');
    }

    // ----------------------------
    // 获取可用最大 z-index
    // ----------------------------
    _getMaxZIndex() {
        if (this.disabled) return;

        return 2147483646; // 浏览器安全最大值 2147483647 减一为留给debug覆盖
    }
}