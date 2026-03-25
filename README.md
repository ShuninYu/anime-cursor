# AnimeCursor v2

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/shuninyu/anime-cursor@main/title.gif" width="384px" alt="AnimeCursor"/>
</div>



[[简体中文]](#animecursorsc)

## [Visit the official website](https://shuninyu.github.io/anime-cursor/) for more informations

## [Read documents](https://shuninyu.github.io/anime-cursor/docs) to get started with AnimeCursor

AnimeCursor is a lightweight JavaScript library for frame-by-frame animated custom cursors.

AnimeCursor has no dependencies on any frameworks, making it suitable for personal websites, creative portfolios, and experimental UI projects.

---

## ✨ Features

* **Native CSS Cursor** – Uses the browser's native cursor, no simulated elements, high performance and accuracy.
* **Independent Frame Images** – Supports multi-frame animations using separate image files (PNG, SVG, etc.).
* **Smart Frame Detection** – Automatically detects numeric suffixes in image filenames (e.g., `cursor_01.png`, `cursor (02).png`, `cursor[3].png`). Just provide the first frame, and AnimeCursor will generate all frames.
* **Variable Speed Animation** – Use arrays for `frames` and `duration` to create complex timing patterns (e.g., `frames: [2, 3], duration: [0.2, 1]` means 2 frames in 0.2s, then 3 frames in 1s).
* **Static Cursor Support** – If `frames` or `duration` is missing or invalid, the cursor is treated as static (single image).
* **Automatic Cursor Switching** – Define cursor styles for specific HTML tags or via `data-cursor` attributes.
* **Lightweight & Zero Dependencies** – Built with vanilla JavaScript, no external libraries required.

## 📦 Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/anime-cursor@v2.0.1/dist/anime-cursor.umd.min.js"></script>
```

### npm

```bash
npm i anime-cursor
```

```js
import AnimeCursor from 'anime-cursor';
new AnimeCursor({...});
```

### Host Yourself

```html
<script src="anime-cursor.umd.min.js"></script>
```

## 🚀 How to use

Here is an example of how to use AnimeCursor:

**IMPORTANT**

- Ensure the initialization code is placed **within** the `<body>` tag of your HTML document.
- For optimal performance, it is recommended to initialize AnimeCursor **before** the DOM has fully loaded, as certain features require execution prior to the completion of DOM loading.

```javascript
new AnimeCursor({
    debug: true, // optional, shows debug overlay
    enableTouch: false, // optional, enable on touch devices
    fallbackCursor: 'auto', // optional, fallback cursor type
    excludeSelectors: 'input, textarea, [contenteditable]', // optional, restore native text cursor
    cursors: {
        // each cursor type must have an image and frames/duration
        idle: {
            image: 'https://example.com/cursor_default.png', // static cursor (no animation)
            default: true // set as default cursor
        },
        // variable speed animation with independent frames
        pointer: {
            tags: ['a', 'button'], // apply to these HTML tags
            image: 'https://example.com/pointer_001.png', // AnimeCursor will automatically find pointer_002.png, pointer_003.png, etc.
            frames: 4,               // total frames (uniform animation)
            duration: 0.4,           // total duration in seconds
            offset: [15, 25],        // hotspot offset (x, y) for url()
            pingpong: true           // enable alternate loop
        },
        // array-based variable speed animation
        custom: {
            image: 'https://example.com/custom_01.png',
            frames: [2, 3, 1],        // first 2 frames, then 3 frames, then 1 frame
            duration: [0.2, 1.0, 0.5], // each segment duration
            offset: [8, 8],
            pingpong: false
        },
        // static cursor (no frames or duration)
        text: {
            tags: ['p', 'h1', 'h2', 'span'],
            image: 'https://example.com/cursor_text.png'
        }
    }
});
```

For non-default cursors, if you need a specific element to trigger the cursor, manually add the `data-cursor` attribute to the element. For example: `<div class="custom-div" data-cursor="pointer"></div>`.

## ⚙️ Configuration Options

### `cursors` (Required)

An object that defines all cursor types. Each key is a cursor name (any string).

#### Cursor Configuration Parameters

| Parameter  | Type               | Required | Description                                                  |
| ---------- | ------------------ | -------- | ------------------------------------------------------------ |
| `image`    | string             | **Yes**  | URL of the first frame image. AnimeCursor will automatically detect numeric suffixes to generate subsequent frames (e.g., `image_001.png` → `image_002.png`, `image_003.png`). If you want a single static image, just provide one image. |
| `frames`   | number \| number[] | **Yes**  | Number of frames (for uniform animation) or an array of segment lengths (for variable speed). Total frames = sum of array elements. If not provided, the cursor is static. |
| `duration` | number \| number[] | **Yes**  | Total duration in seconds (for uniform) or array of segment durations (must match `frames` array length). |
| `tags`     | string[]           | No       | HTML tag names (e.g., `['a', 'button']`) that should use this cursor. If omitted, the cursor can only be applied via `data-cursor` attribute. |
| `offset`   | [number, number]   | No       | Hotspot offset (x, y) in pixels. Default: `[0, 0]`. The offset defines where the actual click point is relative to the top-left of the image. |
| `pingpong` | boolean            | No       | If `true`, the animation plays forward then backward alternately. Default: `false`. |
| `fallback` | string             | No       | Fallback cursor type (e.g., `auto`, `pointer`). Default: value of `fallbackCursor` in root options. |
| `default`  | boolean            | No       | Set this cursor as the default cursor (used when no other cursor applies). Only one cursor can be default. |

### Root Options

| Option             | Type    | Default                                | Description                                                  |
| ------------------ | ------- | -------------------------------------- | ------------------------------------------------------------ |
| `combineAnimations` | boolean | `false` | Automatically merges cursor animations with element‑defined animations (via `data-ac-animation`). When enabled, any element with the `data-ac-animation` attribute will have its own CSS animation combined with the cursor animation, allowing both to run simultaneously without overriding each other. |
| `debug`            | boolean | `false`                                | Enables a debug overlay showing current cursor type and coordinates. |
| `enableTouch`      | boolean | `false`                                | Allow animated cursors on touch devices (detected automatically, disabled by default). |
| `fallbackCursor`   | string  | `'auto'`                               | Global fallback cursor for all animated cursors (e.g., `'auto'`, `'pointer'`). |
| `excludeSelectors` | string  | `'input, textarea, [contenteditable]'` | CSS selectors that should always use the native text cursor. |

## 📝 Notes

### 🖼️ Independent Frame Images

- AnimeCursor expects the first frame file to contain a numeric suffix (e.g., `cursor_001.png`). It will automatically generate URLs for subsequent frames by incrementing the number while preserving formatting (leading zeros, parentheses, brackets).
- Supported patterns:
    - `cursor_01.png` → `cursor_02.png`, `cursor_03.png`, …
    - `cursor(01).png` → `cursor(02).png`, `cursor(03).png`, …
    - `cursor[1].png` → `cursor[2].png`, `cursor[3].png`, …
    - `cursor_1.png` → `cursor_2.png`, `cursor_3.png`, … (no padding)
    - If no number is found, the library will append `_%d` (e.g., `cursor.png` → `cursor_1.png`, `cursor_2.png`).
- **Important**: All frames must be the same size. The actual cursor size is the natural size of the images; scale them beforehand if needed.

### 🎞️ Animation Rules

- **Uniform Animation**: `frames` and `duration` are both numbers. The animation cycles through all frames evenly over the total duration.
- **Variable Speed Animation**: `frames` and `duration` are arrays of equal length. Each segment defines a number of frames and the time to play them. The frames are evenly distributed within each segment.
- **Static Cursor**: If `frames` or `duration` is missing, or if they are invalid (e.g., non-positive numbers, mismatched array lengths), the cursor is treated as static (only the first image is used). A warning will be logged in the console.

### 🎞️ Combining Animations

If your elements already have their own CSS animations (e.g., `animation: spin 2s infinite`), they may override AnimeCursor's cursor animations. To make both play together, enable the `combineAnimations` global option and add a `data-ac-animation` attribute to the element with your animation definition(s). AnimeCursor will then automatically combine them.

Example:

```html
<button data-ac-animation="mySpin 2s linear infinite">Click Me</button>
new AnimeCursor({
    combineAnimations: true,
    cursors: { ... }
});
```
Multiple animations can be listed, separated by commas.

### 🧩 Tagging Mechanism

AnimeCursor automatically adds the appropriate cursor style to elements based on `tags` and `data-cursor` attributes:

- If an element's tag name matches a `tags` list, the corresponding cursor will be applied.
- You can also manually set `data-cursor="cursorName"` on any element to force a specific cursor.
- The default cursor is used when no other rule matches.

### 🔧 Performance

Because v2 uses native CSS `cursor` property and CSS animations, there is no JavaScript `mousemove` listener (except when `debug` mode is enabled). This yields optimal performance and smooth cursor movement.

## ❌ Error Handling

- Missing required configuration will throw an error and stop initialization.
- Invalid optional configuration (e.g., mismatched array lengths) will log a warning and treat the cursor as static.
- All errors and warnings are prefixed with `[AnimeCursor]`.

---

# AnimeCursor v2

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/shuninyu/anime-cursor@main/title.gif" width="384px" alt="AnimeCursor"/>
</div>



## [访问官网](https://shuninyu.github.io/anime-cursor/)以获取更多信息

## [阅读文档](https://shuninyu.github.io/anime-cursor/docs/zh)快速上手 AnimeCursor

AnimeCursor 是一个轻量级自定义逐帧动画光标 JavaScript 库。

AnimeCursor 无需依赖任何框架，适合个人网站、创意作品集以及实验性 UI 项目。

---

## ✨ 特性

* **原生 CSS 光标** – 使用浏览器原生光标，无需模拟元素，性能更高，定位更精准。
* **独立帧图片支持** – 支持使用多张独立图片（PNG、SVG 等）制作逐帧动画。
* **智能帧识别** – 自动识别文件名中的数字序号（如 `cursor_01.png`、`cursor (02).png`、`cursor[3].png`），只需提供第一帧，库会自动生成后续帧。
* **变速动画** – `frames` 和 `duration` 可设置为数组，实现复杂的时间节奏（例如 `frames: [2, 3], duration: [0.2, 1]` 表示前 2 帧 0.2 秒，后 3 帧 1 秒）。
* **静态光标** – 如果不设置 `frames` 或 `duration`，或设置无效，则视为静态光标（仅使用第一帧）。
* **自动光标切换** – 通过 HTML 标签或 `data-cursor` 属性自动切换光标样式。
* **轻量无依赖** – 原生 JavaScript 编写，不依赖任何第三方库。

## 📦 部署方法

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/anime-cursor@v2.0.1/dist/anime-cursor.umd.min.js"></script>
```

### npm

```bash
npm i anime-cursor
```

```js
import AnimeCursor from 'anime-cursor';
new AnimeCursor({...});
```

### 本地部署

```html
<script src="anime-cursor.umd.min.js"></script>
```

## 🚀 基础用法

下面是一个 AnimeCursor 使用示例：

**重要提示**

- 请务必将初始化代码置于HTML文档的 **`<body>`** 标签内部。
- 为获得最佳性能，建议在DOM完全加载**之前**初始化AnimeCursor，因其部分功能需在DOM加载完成前执行。

```javascript
new AnimeCursor({
    debug: true, // 可选，显示调试浮层
    enableTouch: false, // 可选，在触屏设备上启用
    fallbackCursor: 'auto', // 可选，备用光标类型
    excludeSelectors: 'input, textarea, [contenteditable]', // 可选，恢复原生文本光标
    cursors: {
        // 每种光标必须有 image 和 frames/duration
        idle: {
            image: 'https://example.com/cursor_default.png', // 静态光标（无动画）
            default: true // 设为默认光标
        },
        // 变速动画 + 独立帧图片
        pointer: {
            tags: ['a', 'button'], // 应用到这些标签
            image: 'https://example.com/pointer_001.png', // 自动识别后续帧
            frames: 4,               // 总帧数（匀速动画）
            duration: 0.4,           // 总时长（秒）
            offset: [15, 25],        // 热点偏移 (x, y)
            pingpong: true           // 开启乒乓循环
        },
        // 数组形式的变速动画
        custom: {
            image: 'https://example.com/custom_01.png',
            frames: [2, 3, 1],        // 前2帧，接着3帧，最后1帧
            duration: [0.2, 1.0, 0.5], // 对应时长
            offset: [8, 8],
            pingpong: false
        },
        // 静态光标（无 frames/duration）
        text: {
            tags: ['p', 'h1', 'h2', 'span'],
            image: 'https://example.com/cursor_text.png'
        }
    }
});
```

对于非默认光标，如果需要某元素触发该光标，请手动为该元素添加 `data-cursor`。例如：`<div class="custom-div" data-cursor="pointer"></div>`。

## ⚙️ 配置项说明

### `cursors`（必填）

用于定义所有光标类型的对象。每一个 key 代表一种光标类型（名称可以自由定义）。

#### 光标配置参数

| 参数       | 类型               | 必填   | 描述                                                         |
| ---------- | ------------------ | ------ | ------------------------------------------------------------ |
| `image`    | string             | **是** | 第一帧图片的 URL。库会自动识别数字后缀生成后续帧（如 `image_001.png` → `image_002.png`、`image_003.png`）。如果只需要静态光标，则只需提供一张图片。 |
| `frames`   | number \| number[] | **是** | 帧数（匀速动画时为一个数字）或帧段数组（变速动画）。总帧数 = 数组元素之和。若不设置，则视为静态光标。 |
| `duration` | number \| number[] | **是** | 总时长（秒）（匀速动画）或时长数组（必须与 `frames` 数组长度一致）。 |
| `tags`     | string[]           | 否     | HTML 标签名数组（如 `['a', 'button']`），应用该光标的标签。若不提供，则只能通过 `data-cursor` 属性应用。 |
| `offset`   | [number, number]   | 否     | 热点偏移 (x, y)，单位像素。默认为 `[0, 0]`。偏移定义了相对于图片左上角的实际点击位置。 |
| `pingpong` | boolean            | 否     | 若为 `true`，动画会正向播放再反向播放，循环交替。默认为 `false`。 |
| `fallback` | string             | 否     | 备用光标类型（如 `auto`、`pointer`）。默认使用根选项中的 `fallbackCursor`。 |
| `default`  | boolean            | 否     | 将此光标设为默认光标（当没有其他光标匹配时使用）。只能有一个光标设为 `true`。 |

### 根选项

| 选项               | 类型    | 默认值                                 | 描述                                                         |
| ------------------ | ------- | -------------------------------------- | ------------------------------------------------------------ |
| `combineAnimations` | boolean | `false` | 自动将光标动画与元素自身定义的动画（通过 `data-ac-animation`）合并。开启后，任何带有 `data-ac-animation` 属性的元素，其光标动画与用户动画会同时播放，互不覆盖。 |
| `debug`            | boolean | `false`                                | 启用调试浮层，显示当前光标类型和坐标。                       |
| `enableTouch`      | boolean | `false`                                | 允许在触屏设备上显示动画光标（默认自动检测并禁用）。         |
| `fallbackCursor`   | string  | `'auto'`                               | 全局备用光标类型，用于所有动画光标（如 `'auto'`、`'pointer'`）。 |
| `excludeSelectors` | string  | `'input, textarea, [contenteditable]'` | 始终使用原生文本光标的 CSS 选择器。                          |

## 📝 注意事项

### 🖼️ 独立帧图片

- AnimeCursor 期望第一帧图片的文件名包含数字序号（如 `cursor_001.png`）。它会自动递增该数字并保留格式（前导零、括号、方括号等）来生成后续帧的 URL。
- 支持的格式示例：
    - `cursor_01.png` → `cursor_02.png`、`cursor_03.png`……
    - `cursor(01).png` → `cursor(02).png`、`cursor(03).png`……
    - `cursor[1].png` → `cursor[2].png`、`cursor[3].png`……
    - `cursor_1.png` → `cursor_2.png`、`cursor_3.png`……（无前导零）
    - 如果没有找到数字，库会自动添加 `_%d`（例如 `cursor.png` → `cursor_1.png`、`cursor_2.png`）。
- **重要**：所有帧的图片尺寸必须相同。光标实际大小即为图片的原始尺寸，如需缩放请预先处理好图片。

### 🎞️ 动画判定

- **匀速动画**：`frames` 和 `duration` 均为数字。总帧数均匀分布到总时长中。
- **变速动画**：`frames` 和 `duration` 均为等长数组。每个片段指定帧数和该片段的时长，片段内的帧均匀分布。
- **静态光标**：如果缺少 `frames` 或 `duration`，或者设置无效（如非正数、数组长度不匹配），则光标被视为静态（仅使用第一帧图片）。控制台会输出警告。

### 🎞️ 组合动画

如果元素自身已经拥有 CSS 动画（例如 `animation: spin 2s infinite`），这些动画可能会覆盖 AnimeCursor 的光标动画。要让两者同时播放，请启用 `combineAnimations` 全局选项，并为元素添加 `data-ac-animation` 属性，将你的动画定义写入其中。AnimeCursor 会自动将两者组合。

示例：

```html
<button data-ac-animation="mySpin 2s linear infinite">点我</button>
new AnimeCursor({
    combineAnimations: true,
    cursors: { ... }
});
```
多个动画可用逗号分隔。

### 🧩 标记机制

AnimeCursor 会根据 `tags` 和 `data-cursor` 自动应用光标样式：

- 若元素标签名匹配某个 `tags`，则应用对应的光标。
- 你也可以手动给任意元素添加 `data-cursor="光标名称"` 来强制指定光标。
- 当没有其他规则匹配时，使用默认光标。

### 🔧 性能表现

v2 版本使用原生 CSS `cursor` 属性和 CSS 动画，除了 `debug` 模式外，不再需要 JavaScript 监听鼠标移动。因此性能极佳，光标移动流畅。

## ❌ 错误处理

- 缺少必填配置会抛出错误并停止初始化。
- 无效的可选配置（如数组长度不匹配）会输出警告并将该光标视为静态。
- 所有错误和警告均以 `[AnimeCursor]` 前缀输出到控制台。