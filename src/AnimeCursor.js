


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
        return window.matchMedia('(pointer: fine)').matches;
    }
    
    destroy() {
        if (this.disabled) return;
    }

    // ----------------------------
    // 配置校验（必填项）
    // ----------------------------
    _validateOptions() {
        if (!this.options || !this.options.cursors) {
            console.error('[AnimeCursor] 缺少 cursors 配置');
            throw new Error('AnimeCursor init failed');
        }

        for (const [name, cfg] of Object.entries(this.options.cursors)) {
            const required = ['tags', 'size', 'image', 'frames'];
            required.forEach(key => {
                if (cfg[key] === undefined) {
                    console.error(`[AnimeCursor] 光标 "${name}" 缺少必填项：${key}`);
                    throw new Error('AnimeCursor init failed');
                }
            });

            if (!Array.isArray(cfg.tags)) {
                console.error(`[AnimeCursor] 光标 "${name}" 的 tags 必须是数组`);
                throw new Error('AnimeCursor init failed');
            }

            if (cfg.duration !== undefined && typeof cfg.duration !== 'number') {
                console.error(`[AnimeCursor] 光标 "${name}" 的 duration 必须是数字（秒）`);
                throw new Error('AnimeCursor init failed');
            }
        }
    }

    // ----------------------------
    // 插入光标元素 HTML
    // ----------------------------
    _injectHTML() {
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
    // 插入基础 CSS
    // ----------------------------
    _injectCSS() {
        const style = document.createElement('style');
        let css = '';

        /* 通用样式和debug样式 */
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
    }

    // ----------------------------
    // 给元素自动添加 data-cursor
    // ----------------------------
    _bindElements() {
        for (const [type, cfg] of Object.entries(this.options.cursors)) {
            cfg.tags.forEach(tag => {
                const tagName = tag.toUpperCase();
                document.querySelectorAll(tagName).forEach(el => {
                    if (!el.dataset.cursor) {
                        el.dataset.cursor = type;
                    }
                });
            });
        }
    }

    // ----------------------------
    // 鼠标跟随 & 光标切换
    // ----------------------------
    _bindMouse() {
        document.addEventListener('mousemove', e => {
            const x = e.clientX;
            const y = e.clientY;

            this.cursorEl.style.left = x + 'px';
            this.cursorEl.style.top = y + 'px';

            if (this.debugEl) {
                this.debugEl.style.left = x + 'px';
                this.debugEl.style.top = y + 'px';
            }

            const target = document.elementFromPoint(x, y);
            if (!target) return;

            const cursorType = target.dataset.cursor || 'default';
            if (this.debugEl) {this.debugEl.textContent = `(${x}px , ${y}px) ${cursorType}`;}

            if (cursorType !== this.lastCursorType) {
                if (this.debugEl) {this.cursorEl.className = `cursor-${cursorType}` + ' cursor-debugmode';}
                else {this.cursorEl.className = `cursor-${cursorType}`;}
                this.lastCursorType = cursorType;
            }
        });
    }

    // ----------------------------
    // 获取可用最大 z-index
    // ----------------------------
    _getMaxZIndex() {
        return 2147483646; // 浏览器安全最大值 2147483647 减一为留给debug覆盖
    }
}