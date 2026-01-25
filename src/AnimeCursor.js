// AnimeCursor by github@ShuninYu
// v0.2.0

export default class AnimeCursor {

    constructor(options = {}) {
        this.options = {
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

        this._validateOptions();
        this._injectHTML();
        this._injectCSS();
        this._bindElements();
        this._bindMouse();
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
    
        // 4 清理 data-cursor（只清理自己加的）
        for (const cfg of Object.values(this.options.cursors)) {
            cfg.tags.forEach(tag => {
                document.querySelectorAll(tag).forEach(el => {
                    if (el.dataset.cursor) {
                        delete el.dataset.cursor;
                    }
                });
            });
        }
    
        // 5 重置状态
        this.lastCursorType = null;
    }
    disable() {
        if (this.disabled) return;
        this.disabled = true;
    
        if (this.cursorEl) {
            this.cursorEl.style.display = 'none';
            console.log('[AnimeCursor] AnimeCursor disabled!');
        }
    }
    enable() {
        if (!this.disabled) return;
        this.disabled = false;
    
        if (this.cursorEl) {
            this.cursorEl.style.display = '';
            console.log('[AnimeCursor] AnimeCursor enabled!');
        }
    }
    
    // ----------------------------
    // 配置校验（必填项）
    // ----------------------------
    _validateOptions() {
        if (this.disabled) return;

        this.defaultCursorType = null;

        for (const [name, cfg] of Object.entries(this.options.cursors)) {
            if (cfg.default === true) {
                if (this.defaultCursorType) {
                    throw new Error('[AnimeCursor] 只能有一个 default 光标');
                }
                this.defaultCursorType = name;
            }
        }

        if (!this.options || !this.options.cursors) {
            console.error('[AnimeCursor] missing cursors set up');
            throw new Error('AnimeCursor init failed');
        }

        for (const [name, cfg] of Object.entries(this.options.cursors)) {
            const required = ['tags', 'size', 'image'];
            required.forEach(key => {
                if (cfg[key] === undefined) {
                    console.error(`[AnimeCursor] cursor "${name}" missing required setting: ${key}`);
                    throw new Error('AnimeCursor init failed');
                }
            });

            if (!cfg.default) {
                if (!Array.isArray(cfg.tags) || cfg.tags.length === 0) {
                    console.error(`[AnimeCursor] cursor "${name}" 's tags must be an array and should not be left empty`);
                    throw new Error('AnimeCursor init failed');
                }
            }

            if (cfg.duration !== undefined && typeof cfg.duration !== 'number') {
                console.error(`[AnimeCursor] cursor "${name}" 's duration must be a number(seconds)`);
                throw new Error('AnimeCursor init failed');
            }
        }
    }

    // ----------------------------
    // 插入光标元素 HTML
    // ----------------------------
    _injectHTML() {
        if (this.disabled) return;

        const cursor = document.createElement('div');
        cursor.id = 'anime-cursor';
        
        // 如果debug选项存在，则添加debug子元素
        if (this.options.debug) {
            cursor.className = 'cursor-default cursor-debugmode';
            const debuger = document.createElement('div');
            debuger.className = 'anime-cursor-debug';
            document.body.appendChild(debuger);
            this.debugEl = debuger;
        }
        else {cursor.className = 'cursor-default';}
        document.body.appendChild(cursor);
        this.cursorEl = cursor;
    }

    // ----------------------------
    // 插入样式 CSS
    // ----------------------------
    _injectCSS() {
        if (this.disabled) return;

        const style = document.createElement('style');
        let css = '';

        /* 通用样式 */
        css += `
        * {
        cursor: none !important;
        }
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
            const frames = cfg.frames;
            const image = cfg.image;
            const offset = cfg.offset;
            const zIndex = cfg.zIndex;
            const scale = cfg.scale;
            const isGif = image.toLowerCase().endsWith('.gif');
            var pixel;
            if (cfg.pixel) {pixel = 'pixelated';}
            else {pixel = 'auto';}

            css += `
            ${className} {
            width: ${size[0]}px;
            height: ${size[1]}px;
            background-image: url("${image}");
            image-rendering: ${pixel};
            ${(scale || offset) ? `transform: ${[scale && `scale(${scale[0]}, ${scale[1]})`, offset && `translate(-${offset[0]}px, -${offset[1]}px)`].filter(Boolean).join(' ')};` : ''}
            
            ${zIndex !== undefined ? `z-index:${zIndex};` : ''}
            }`;

            /* PNG 精灵图动画 */
            const duration = cfg.duration;
            const hasAnimation =
                !isGif &&
                frames > 1 &&
                typeof duration === 'number';

            if (hasAnimation) {
                const animName = `animecursor_${type}`;

                css += `
                ${className} {
                animation: ${animName} steps(${frames}) ${duration}s infinite ${cfg.pingpong ? 'alternate' : ''};
                }

                @keyframes ${animName} {
                from { background-position: 0 0; }
                to { background-position: -${size[0] * frames}px 0; }
                }
                `;
            }
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
            console.info('[AnimeCursor] refresh done!');
        }
    }

    // ----------------------------
    // 鼠标跟随 & 光标切换
    // ----------------------------
    _bindMouse() {
        if (this.disabled) return;

        this._onMouseMove = (e) => {
            const x = e.clientX;
            const y = e.clientY;

            this.cursorEl.style.left = x + 'px';
            this.cursorEl.style.top = y + 'px';

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