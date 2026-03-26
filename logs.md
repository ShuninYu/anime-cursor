# AnimeCursor changelog
[[简体中文]](#zh-cn)
## Current Version

- ### `2.1.2`

    - #### [Bug Fix] Static cursor now has a non-looping one-frame animation to prevent being overridden by default cursor animation
        - Previously, static cursors (without `frames`/`duration`) could still inherit the default cursor's animation due to CSS cascade, causing visual glitches.
        - Now, static cursors are given a one-frame animation that plays once and then stops (`forwards` fill mode), ensuring they correctly override the default cursor without causing continuous repaints.
        - This approach eliminates the performance overhead of an infinite loop animation.

## History Version

- ### `2.1.1`

    - #### [Bug Fix] Improved `disable()` / `enable()` to avoid affecting other animations
        - Previously, `disable()` added a global CSS rule `body.animecursor-disabled * { cursor: auto !important; animation: none !important; }`, which would accidentally disable all animations on the page.
        - Now, `disable()` removes AnimeCursor's injected style sheet and debug elements, restoring native cursors without touching any other animations.
        - `enable()` re-injects the style sheet and rebuilds the debug overlay, fully restoring AnimeCursor functionality.
        - This change makes the API safe to use in any context without side effects.

- ### `2.1.0`

    - #### [New Feature] Combine animations (`combineAnimations`)
        - Added global option `combineAnimations` (default `false`). When enabled, AnimeCursor automatically looks for elements with the `data-ac-animation` attribute and merges the user-defined animation(s) with the cursor animation, allowing both to run simultaneously. This solves the issue where an element's own animation would override the cursor animation.
        - Usage: set `combineAnimations: true` and add `data-ac-animation="yourAnimationString"` to the element.

    - #### [Improvement] Default cursor is now optional
        - It is no longer required to have a default cursor. If none is set, elements that do not match any custom cursor will use the system cursor, offering greater flexibility.

- ### `2.0.0`

    - #### [Major Update] Native CSS cursor animation
        - Completely refactored to use native CSS `cursor: url()` with keyframe animations, replacing the simulated cursor div. This improves performance and accuracy.
    - #### [New Feature] Independent frame image detection
        - Automatically detects numeric suffixes in filenames to generate subsequent frame URLs.
    - #### [Removed] Deprecated options: `size`, `scale`, `pixel`, `displayOnLoad`, sprite sheet support.
    - #### [Change] Default cursor is optional.
    - #### [Change] Debug mode now shows a floating overlay.

- ### `1.0.0`
    - #### [Major Update] Variable-speed sprite sheet animation support
        - Previous versions of sprite sheet animation could not set different frame intervals. This meant that if an animation had a longer static state, the only option was to use a GIF image. However, GIFs are honestly only suitable for pixel-style cursors. Because GIF supports only fully transparent or fully opaque pixels, GIF cursors are forced to have hard edges, which significantly impacts the visual experience. On the other hand, if you insisted on using a sprite sheet animation, the file size of the sprite sheet would increase dramatically—the longer the pause in the animation, the larger the file size. This was certainly unacceptable for a cursor.
        - Now, `frames` and `duration` can be set as arrays. The lengths of the two arrays must be identical (i.e., both arrays must have the same number of parameters). They correspond one-to-one: each segment of frame count corresponds to a segment of duration. This allows for more flexible configuration of sprite sheet animations.

- ### `0.3.1`

    - #### [Major Update] `tags` is no longer a required field
        - In most creative scenarios, many special cursor styles may only be triggered on specific elements. Cursors created for such elements are usually set by users manually adding the `data-cursor` attribute to the trigger elements, and there is no need to trigger them via `tags`. Making `tags` a required field for cursor configuration has arguably added unnecessary trouble to cursors triggered by such specific elements. Although triggering can be achieved with custom tags, this approach does not strictly comply with HTML specifications in essence and may lead to other issues. Therefore, `tags` has been removed from the required fields – farewell! Now there are only two required fields left in the cursor configuration of AnimeCursor – wow!

- ### `0.3.0`

    - #### **[Major Update]** Added the `displayOnLoad` option
        - Currently, after initialization, the cursor DOM is inserted and positioned at the top-left corner by default until the mouse moves within the page, which is visually jarring.
        - Added the `displayOnLoad` option at the same level as `debug`. Type: `boolean`. Default: `false`.
        - `displayOnLoad` controls whether the cursor DOM is displayed before mouse movement is detected. If enabled, the cursor will remain hidden until mouse movement (within the page viewport) is detected.

    - #### **[Major Update]** AnimeCursor is now a singleton (only one instance can be created)
        - Starting from `0.3.0`, it will be impossible to create a new AnimeCursor instance if one already exists on the page.
        - A warning will be logged to the console if an attempt is made to create an instance while one already exists.

    - #### **[New Feature]** AnimeCursor now automatically inserts preload tags for cursor images
        - AnimeCursor now generates and inserts preload tags for each cursor's `image` path during initialization. This ensures the image for each cursor type is loaded before it is switched to for the first time, helping to mitigate or prevent the cursor from disappearing when switching to a new cursor type due to the image still loading.

    - #### **[Bug Fix]** Fixed an error in `destroy()` when the default cursor had no `tags` set
        - The concept of a default cursor was introduced in the `0.2.0` update. Since `0.2.0` was a consolidated release containing multiple updates developed separately, the `destroy()` method, which was added earlier, initially lacked compatibility for the default cursor. (This issue has been resolved.)

    - #### **[Bug Fix]** Fixed the issue where `disable()` did not work
        - Fixed a problem caused by a missing `disable` condition check in the cursor positioning function.

    - #### Other Updates
        - The system cursor will now be shown when `disable()` is called.

- ### `0.2.0`
    - #### [Major Update] Added the concept of a default cursor and revised the existing cursor switching logic
        - In previous versions, AnimeCursor did not have a true default cursor in the full sense. Although the example included a custom `default` cursor, it functioned as a pseudo-default cursor and could not fully fulfill the role of a true default cursor. We believe that `default` does not have to be a mandatory cursor type, and AnimeCursor should instead have a cursor that displays when the pointer is over an element that does not have a `data-cursor` attribute. This is the default cursor.
        - Added an optional `default` parameter at the same level as `size`. This parameter is a boolean value, which defaults to `false` if left empty. Only one cursor is allowed to have this parameter set to `true`. The cursor with `default` set to `true` will be treated as the default cursor.
        - When the mouse pointer is over an element that does not belong to any tag type configured by the user and does not have a `data-cursor` attribute, AnimeCursor will switch the cursor to the default cursor. It will remain as the default cursor until the pointer moves to an element that meets the criteria for switching cursors.
    - Added APIs for cleanup, rebuild, stop, and resume.
    - Added markers for DOM modifications to facilitate cleanup of changes.
- ### `0.1.3`
    - Linked the npm package to the GitHub repository.
- ### `0.1.2`
    - `frames` is no longer a required parameter. Cursors without a `frames` setting will now default to not generating CSS animations.
    - Added comments to the usage example in the README.
- ### `0.1.1`
    - Modified the image links in the README.
- ### `0.1.0`
    - Initial release.
---
<h1 id="zh-cn">AnimeCursor 更新日志</h1>

## 当前版本

- ### `2.1.2`

    - #### 【Bug修复】静态光标现具有一次性一帧动画，避免被默认光标动画覆盖且无性能损耗
        - 之前当存在带有动画的默认光标时，静态光标（无 `frames`/`duration`）会因 CSS 层叠规则继承默认光标的动画，导致显示异常。
        - 现在静态光标也生成一帧动画，但仅播放一次（`forwards` 模式），动画结束后光标保持在最后一帧，既保证了覆盖默认光标动画，又避免了无限循环带来的持续重绘开销。

## 历史版本

- ### `2.1.1`

    - #### 【Bug修复】优化 `disable()` / `enable()`，避免影响页面其他动画
        - 之前版本中，`disable()` 会添加全局 CSS 规则 `body.animecursor-disabled * { cursor: auto !important; animation: none !important; }`，导致页面中所有动画都被意外禁用。
        - 现在，`disable()` 直接移除 AnimeCursor 注入的样式表和调试元素，恢复原生光标，完全不触碰其他动画。
        - `enable()` 重新注入样式表并重建调试浮层，完整恢复 AnimeCursor 功能。
        - 这一改进使 API 在任何场景下都能安全使用，无副作用。

- ### `2.1.0`

    - #### 【新增功能】组合动画支持（combineAnimations）
        - 新增全局选项 `combineAnimations`（默认 `false`）。启用后，AnimeCursor 会自动查找带有 `data-ac-animation` 属性的元素，将该元素的用户自定义动画与光标动画合并，使两者同时播放，解决元素自身动画覆盖光标动画的问题。
        - 用法：设置 `combineAnimations: true`，并在元素上添加 `data-ac-animation="你的动画定义"`。

    - #### 【优化】默认光标不再强制要求
        - 现在可以完全不设置默认光标。未匹配任何自定义光标的元素将使用系统光标，使库更灵活。

- ### `2.0.0`

    - #### 【重大更新】原生 CSS 光标动画
        - 彻底重构，使用原生 CSS `cursor: url()` 配合关键帧动画，不再模拟光标元素。性能更优，定位更准。
    - #### 【新增功能】独立帧图片自动识别
        - 自动识别文件名中的数字后缀，生成后续帧 URL。
    - #### 【移除项】弃用配置：`size`、`scale`、`pixel`、`displayOnLoad`、精灵图模式。
    - #### 【改动】默认光标可选。
    - #### 【改动】调试模式改为浮层显示。

- ### `1.0.0`
    - #### 【主要更新】变速精灵图动画支持
        - 之前版本的精灵图动画无法设置不同的帧间隔，这导致如果动画中有保持较久的静止状态的话，只能使用GIF图片，但是GIF图片说实话只适合像素风格的光标。因为GIF只有纯透明和纯不透明，这导致GIF光标只能有硬边缘，这是很影响视觉效果的。而如果强行要用精灵图动画的话，精灵图的体积就会大大增加，动画暂停时长越久，体积就越大，这对于一个光标来说肯定是无法接受的。
        - 现在， `frames` 和 `duration` 可以被设置为数组，二者数组长度必须相同（即两个数组得有一样多的参数），二者一一对应，每一段帧数对应一段持续时间，这样就可以更灵活的设置精灵图动画。


- ### `0.3.1`

    - #### 【主要更新】`tags` 不再是必填项
        - 在大多数创意性场景中，许多特殊的光标样式可能只会在特定的元素上触发。而为了这类元素创建的光标通常是由用户手动为触发元素添加 `data-cursor`，而不需要通过 `tags` 来触发。将 `tags` 作为光标设置的必填项，或许在某种程度上为这类特别元素触发的光标添加了不必要的烦恼。虽然可以通过自定义的标签来实现触发，但是这种效果本质上并未严格遵守 HTML 规范，并且可能导致其他问题，因此 `tags` 被移除出必填项，再见啦！现在 AnimeCursor 的光标设置中只有两个必填项了，哇哦！

- ### `0.3.0`

    - #### 【主要更新】添加可选项 `displayOnLoad`
        - 目前初始化插入光标 DOM 后默认在左上角，直到鼠标在页面中移动，这在视觉上是不舒服的。
        - 添加和 `debug` 同级的 `displayOnLoad`，类型 `boolean`，默认 `false`。
        - `displayOnLoad` 控制光标 DOM 在检测到鼠标移动前是否显示，如果启用此项，在检测到鼠标（在页面视窗内）移动前将保持隐藏。

    - #### 【主要更新】现在 AnimeCursor 只能创建一个实例
        - 从 `0.3.0` 开始，当页面已经存在 AnimeCursor 实例时将无法再次创建实例。
        - 如果在页面已存在 AnimeCursor 实例时尝试创建实例，控制台会弹出警告。

    - #### 【新增功能】现在 AnimeCursor 会自动为光标图片插入预加载标签
        - 现在 AnimeCursor 会在初始化时会以每个光标的 `image` 为路径生成并插入预加载标签，以保证每种光标在第一次被切换时光标图片已经被加载，这样可以缓解或避免切换到新的光标种类时才加载光标图片导致的光标消失。

    - #### 【bug修复】修复了 `destroy()` 在默认光标未设置 `tags` 时报错的问题
        - 在更新 `0.2.0` 时，默认光标的概念被添加进 AnimeCursor。由于 `0.2.0` 实际上是多个更新内容的整合发布版本，因此其各个更新并不是同时进行的，这导致先被添加的 `destroy()` 未包含对默认光标的兼容。

    - #### 【bug修复】修复了 `disable()` 不能生效的问题
        - 修复了由于光标定位函数的 `disable` 判断缺失所导致的问题。

    - #### 其他更新
        - 现在调用 `disable()` 以后会显示系统光标。

- ### `0.2.0`
	- #### 【主要更新】添加了默认光标概念，并修改了现有的光标切换逻辑
		- 在之前的版本中，AnimeCursor 并不存在真正意义上的默认光标，但是在示例中有自定义的default光标，这种光标是一种类似默认光标但功能不能完全承担默认光标功能的存在。我们认为，default 并不是必须有的光标类型，而 AnimeCursor 应该有一个在指针指向不含有 `data-cursor` 元素情况下显示的光标，这就是默认光标。
		- 增加了一个与 `size` 同级的非必填项 `default` ，该项为布尔数，留空情况下默认为 `false` ，并且只允许最多一种光标将该项设置为 `true` ，`default` 为 `true` 的光标将被视作默认光标。
		- 当鼠标指针所处的元素不属于任何被用户设置的标签种类、且自身不带有 `data-cursor` 时，AnimeCursor 会将光标切换为默认光标，直到鼠标指针指到符合切换光标的要求的元素。
	- 添加了 清理、重建、停止、恢复 的API
	- 为DOM影响添加了标记以方便清除修改
- ### `0.1.3`
    - 为npm连接github仓库
- ### `0.1.2`
    - `frames`不再是必填项，现在没有`frames`的光标默认不生成CSS动画
    - 为README中的使用示例添加了注释
- ### `0.1.1`
    - 修改README图片链接
- ### `0.1.0`
    - 首个版本