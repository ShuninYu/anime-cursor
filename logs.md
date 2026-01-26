# AnimeCursor changelog
[[简体中文]](#zh-cn)
## Current Version
- ### `0.2.0`
    - #### [Major Update] Added the concept of a default cursor and revised the existing cursor switching logic
        - In previous versions, AnimeCursor did not have a true default cursor in the full sense. Although the example included a custom `default` cursor, it functioned as a pseudo-default cursor and could not fully fulfill the role of a true default cursor. We believe that `default` does not have to be a mandatory cursor type, and AnimeCursor should instead have a cursor that displays when the pointer is over an element that does not have a `data-cursor` attribute. This is the default cursor.
        - Added an optional `default` parameter at the same level as `size`. This parameter is a boolean value, which defaults to `false` if left empty. Only one cursor is allowed to have this parameter set to `true`. The cursor with `default` set to `true` will be treated as the default cursor.
        - When the mouse pointer is over an element that does not belong to any tag type configured by the user and does not have a `data-cursor` attribute, AnimeCursor will switch the cursor to the default cursor. It will remain as the default cursor until the pointer moves to an element that meets the criteria for switching cursors.
    - Added APIs for cleanup, rebuild, stop, and resume.
    - Added markers for DOM modifications to facilitate cleanup of changes.

## History Version
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
- ### `0.2.0`
	- #### 【主要更新】添加了默认光标概念，并修改了现有的光标切换逻辑
		- 在之前的版本中，AnimeCursor 并不存在真正意义上的默认光标，但是在示例中有自定义的default光标，这种光标是一种类似默认光标但功能不能完全承担默认光标功能的存在。我们认为，default 并不是必须有的光标类型，而 AnimeCursor 应该有一个在指针指向不含有 `data-cursor` 元素情况下显示的光标，这就是默认光标。
		- 增加了一个与 `size` 同级的非必填项 `default` ，该项为布尔数，留空情况下默认为 `false` ，并且只允许最多一种光标将该项设置为 `true` ，`default` 为 `true` 的光标将被视作默认光标。
		- 当鼠标指针所处的元素不属于任何被用户设置的标签种类、且自身不带有 `data-cursor` 时，AnimeCursor 会将光标切换为默认光标，直到鼠标指针指到符合切换光标的要求的元素。
	- 添加了 清理、重建、停止、恢复 的API
	- 为DOM影响添加了标记以方便清除修改

## 历史版本
- ### `0.1.3`
    - 为npm连接github仓库
- ### `0.1.2`
    - `frames`不再是必填项，现在没有`frames`的光标默认不生成CSS动画
    - 为README中的使用示例添加了注释
- ### `0.1.1`
    - 修改README图片链接
- ### `0.1.0`
    - 首个版本