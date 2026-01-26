# AnimeCursor

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/shuninyu/anime-cursor@main/title.gif" width="384px" alt="AnimeCursor"/>
</div>

[[简体中文]](#animecursorsc)
## [Visit the official website](https://shuninyu.github.io/anime-cursor/) for more informations
## [Read documents](https://shuninyu.github.io/anime-cursor/docs) to get started with AnimeCursor

AnimeCursor is a lightweight JavaScript library for animated custom cursors.

AnimeCursor has no dependencies on any frameworks, making it suitable for personal websites, creative portfolios, and experimental UI projects.

---

## ✨ Features

* Supports sprite sheet frame-by-frame animation
* Supports GIF (animated GIFs, not static GIFs used by native cursors)
* Customizable cursor types, automatically switched by AnimeCursor
* CSS-based animation implementation, high performance
* Prepare sprite sheets in the correct format, and AnimeCursor will automatically generate cursor animations based on your settings
* Built with native JavaScript, no third-party dependencies

## 📦 Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/anime-cursor/dist/anime-cursor.umd.min.js"></script>
```

### npm

```bash
npm i anime-cursor
```
```js
import AnimeCursor from 'anime-cursor';
new AnimeCursor({...});
```

### Local storage

```html
<script src="anime-cursor.umd.min.js"></script>
```

## 🚀 Basic Usage

Here is an example of how to use AnimeCursor:

```html
<script>
new AnimeCursor({
    cursors: {
        // each type of cursor needs tags, size and image
        idle: {
            size: [64,64],
            image: './cursor_default.png', // static cursor only needs image
            default: true // set this cursor as default cursor
            // only default cursor doesn't needs tags
        },
        // sprite animated cursor needs frames and duration
        pointer: {
            tags: ['a', 'button'],
            size: [64,64],
            image: './cursor_pointer.png',
            frames: 3,
            duration: 0.3,
            pingpong: true, // enable pingpong loop
            offset: [10, 4] // if the pointing spot is not at the top left of the image, set offset
        },
        // gif cursor doesn't needs frames and duration
        text: {
            tags: ['p', 'h1', 'h2', 'span'],
            size: [32, 64],
            image: './cursor_text.gif'
        }
    }
});
</script>
```

## ⚙️ Configuration Options

### `cursors` (Required)

An object used to define all cursor types.

Each key represents a cursor type (the name can be freely defined).

#### Cursor Configuration Parameters

For each key, the following parameters can be set. Missing required parameters will cause an error.

Check the [DOCUMENTATION](https://shuninyu.github.io/anime-cursor/docs/configuration#options) for details.

### `debug` (Optional)

Enables debugging overlay.

The debugging overlay shows the real mouse position and the current cursor type, helping to correct alignment offsets.

### `enableTouch` (Optional)

Enables animated cursors on mobile touch devices.

AnimeCursor automatically detects mobile touch devices (e.g., phones, tablets) and disables animated cursors on them by default.
If you want animated cursors to be displayed on these devices, add `enableTouch: true`.

## 📝 Notes

### 📁 Files

* **For any sprite animation cursor, its sprite sheet should be arranged in a single horizontal row.** AnimeCursor will automatically generate the PNG sprite animation.
  For example, if you set the `size` (width, height) for a `pointer` cursor to `[64px , 64px]` and `frames` to `3`, the prepared sprite sheet dimensions (width, height) should be: `[192px , 64px]`.

* For pixel art with a large number of frames, you can use the original image (whether GIF or sprite-sheet) to save storage space or bandwidth. Then, use the `scale` parameter in the configuration to resize the cursor and set `pixel` to `true` to avoid blurry scaling.

### 🧩 Tagging Mechanism

AnimeCursor automatically adds `data-cursor` attributes to page elements based on the configuration:

```html
<!-- Using the example configuration from the Basic Usage section -->
<button data-cursor="pointer"></button>
```

`data-cursor` will NOT be added in the following cases:

* The element's `tagName` is not included in the `tags` configuration of any custom cursor type.
* The element already had a `data-cursor` attribute *before* AnimeCursor was initialized.

Therefore, to assign a specific animated cursor to a particular element, simply add the corresponding `data-cursor` attribute to that element. AnimeCursor will not overwrite pre-existing `data-cursor` tags.

### 🎞️ Animation Rules

#### Sprite Sheets Animation Cursors

Animation is generated **only when all of the following conditions are met**:

* `frames` is set and `frames > 1`
* `duration` is set

If `duration` is not set, the cursor will be treated as a **static cursor**, even if `frames > 1`.

#### GIF Cursors

* GIFs do not use `frames`, `duration`, or `pingpong`
* Animation is controlled by the GIF file itself

## ❌ Error Handling

* Missing required configuration parameters will directly terminate initialization.
* Invalid optional configuration will also throw errors.
* All errors are prefixed with `[AnimeCursor]` when logged to the console.

---
# AnimeCursor(SC)

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/shuninyu/anime-cursor@main/title.gif" width="384px" alt="AnimeCursor"/>
</div>

## [访问官网](https://shuninyu.github.io/anime-cursor/)以获取更多信息
## [阅读文档](https://shuninyu.github.io/anime-cursor/docs/zh)快速上手 AnimeCursor

AnimeCursor 是一个轻量级自定义动画光标JavaScript库。

AnimeCursor 无需依赖任何框架，适合个人网站、创意作品集以及实验性 UI 项目。

---

## ✨ 特性

* 支持精灵图逐帧动画
* 支持 GIF（动态gif，而不是原生光标的静止gif）
* 自定义光标类型，由 AnimeCursor 自动切换
* 基于 CSS 的动画实现，高性能
* 按照格式准备好精灵图表，AnimeCursor 将基于你的设置自动生成光标动画
* 基于原生JavaScript，无任何第三方依赖

## 📦 部署方法

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/anime-cursor/dist/anime-cursor.umd.min.js"></script>
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
```html
<script>
new AnimeCursor({
    cursors: {
        // 每种光标都需要 tags size 和 image
        default: {
            size: [64,64],
            image: './cursor_default.png', // 静态光标只需要图片链接
            default: true // 将此光标设为默认光标
            // 默认光标不需要 tags
        },
        // 精灵图动画光标还需要 frames 和 duration
        pointer: {
            tags: ['a', 'button'],
            size: [64,64],
            image: './cursor_pointer.png',
            frames: 3,
            duration: 0.3,
            pingpong: true, // enable pingpong loop
            offset: [10, 4] // if the pointing spot is not at the top left of the image, set offset
        },
        // gif 光标不需要 frames 或 duration
        text: {
            tags: ['p', 'h1', 'h2', 'span'],
            size: [32, 64],
            image: './cursor_text.gif'
        }
    }
});
</script>
```

## ⚙️ 配置项说明

### `cursors`（必填）

用于定义所有光标类型的对象。

每一个 key 代表一种光标类型（名称可以自由定义）。

#### 光标配置参数

对于每个key，有以下参数可以设置，其中必填项如果缺失则会报错。

查看 [官方文档](https://shuninyu.github.io/anime-cursor/docs/zh/configuration#options) 查看详细可用参数。

### `debug`（选填）

用于启用debug覆盖。

debug覆盖会显示鼠标的真实位置以及当前光标类型，以帮助纠正对齐偏移量。

### `enableTouch`（选填）

用于启用移动触屏设备上的动画光标。

AnimeCursor 会自动识别移动触屏设备（比如手机、平板电脑）并默认屏蔽这些设备上的动画光标。
如果你想在这些设备上显示动画光标，可以添加 `enableTouch: true` 。

## 📝 注意事项

### 📁 文件

* **对于任何精灵图动画光标，它的精灵图表都应该为单行横向布局，** AnimeCursor 会自动生成 PNG 精灵图动画。
例如，你为 `pointer` 光标设置的`size`（长，宽）为 `[64px , 64px]` ，帧数为 `3` ，那么你准备的精灵图表尺寸（长，宽）应该为： `[192px , 64px]` 。

* 对于帧数特别多的像素图，你可以使用原尺寸图片（无论是gif还是精灵图表）以节省存储空间或带宽，并在参数中设置 `scale` 来缩放光标，并将 `pixel` 设置为 `true` 来避免缩放模糊。

### 🧩 标记机制

AnimeCursor 会根据配置自动为页面元素添加 `data-cursor`：

```html
<!-- 以上面的示例用法配置为例 -->
<button data-cursor="pointer"></button>
```

只有在以下情况不会添加 `data-cursor`：

* 元素的 `tagName` 不在任何自定义光标类型的配置中。
* 元素在 AnimeCursor 配置之前就已经存在 `data-cursor` 。

因此，如果想要给某个特定元素指定一种动画指针，只需要给该元素添加指定的 `data-cursor` 即可，AnimeCursor 不会覆盖事先设定好的标记。

### 🎞️ 动画判定

#### 精灵图表动画光标

只有在 **同时满足以下条件** 时，才会生成动画：

* 设置了 `frames` 且 `frames > 1`
* 设置了 `duration`

如果未设置 `duration`，即使帧数大于 1，也会被视为**静态光标**。

#### GIF 光标

* GIF 不使用 `frames`、`duration` 或 `pingpong`
* 动画由 GIF 自身控制

## ❌ 错误处理

* 缺少必填配置会直接终止初始化
* 非法的可选配置也会报错
* 所有错误均以 `[AnimeCursor]` 前缀输出到console