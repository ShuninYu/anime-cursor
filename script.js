document.addEventListener('DOMContentLoaded', function() {
    injectDocsPanel();
    injectFoldbtn();
    injectFooter();
});

// 插入 footer 内容
function injectFooter() {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    document.querySelector('footer').innerHTML = '© ' + currentYear + ' AnimeCursor - by <a href="https://shuninyu.fun">ShuninYu</a>.<br>All rights reserved.';
}

// 跳转到 link
function jumpTo(link) {
    window.location.href = link;
}

// 给文档导航栏添加折叠按钮
function injectFoldbtn() {
    const folders = document.querySelectorAll('.docs-panel-list-folder');
    folders.forEach(element => {
        const folderIcon = document.createElement('div');
        folderIcon.className = 'docs-panel-list-folder-icon';
        folderIcon.dataset.cursor = 'pointer';
        folderIcon.setAttribute('onclick' , 'docFolder(this)');
        element.appendChild(folderIcon);
    })
}
// 文档导航栏折叠
function docFolder(element) {
    const parent = element.parentNode;
    parent.classList.toggle('unfold');
}

// 插入文档导航栏
function injectDocsPanel() {
    const docsPanel = document.querySelector('.docs-panel');
    if (docsPanel && docsPanel.classList.contains('zh-CN')) {
        docsPanel.innerHTML = `
        <div class="docs-panel-topbar">
            <a class="docs-panel-topbar-logo"></a>
            <div class="docs-panel-topbar-navbar">
                <a href="../../" class="docs-panel-topbar-navbtn">主页<div></div></a>
                <a href="../../examples" class="docs-panel-topbar-navbtn">查看示例<div></div></a>
                <a href="../../changelog" class="docs-panel-topbar-navbtn">更新日志<div></div></a>
            </div>
        </div>
        <div class="docs-panel-list">
            <div class="docs-panel-list-folder"><p onclick="jumpTo('../zh')" data-cursor="pointer">简介</p>
                <a class="docs-panel-list-item" href="../zh/">什么是 AnimeCursor</a>
                <a class="docs-panel-list-item">特性</a>
                <a class="docs-panel-list-item">浏览器支持</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('getting-Started')" data-cursor="pointer">快速开始</p>
                <a class="docs-panel-list-item">安装</a>
                <a class="docs-panel-list-item">基本用法</a>
                <a class="docs-panel-list-item">示例</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('configuration')" data-cursor="pointer">配置</p>
                <a class="docs-panel-list-item">光标类型</a>
                <a class="docs-panel-list-item">参数选项</a>
                <a class="docs-panel-list-item">高级设置</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('api')" data-cursor="pointer">API</p>
                <a class="docs-panel-list-item">构造函数</a>
                <a class="docs-panel-list-item">refresh</a>
                <a class="docs-panel-list-item">enable / disable</a>
                <a class="docs-panel-list-item">destroy</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('lcbp')" data-cursor="pointer">LC & BP</p><!-- 生命周期与最佳实践 -->
                <a class="docs-panel-list-item">DOM 注入时机</a>
                <a class="docs-panel-list-item">配合 Markdown 使用</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('debug')" data-cursor="pointer">调试/排障</p>
                <a class="docs-panel-list-item">debug 模式</a>
                <a class="docs-panel-list-item">常见问题</a>
                <a class="docs-panel-list-item">FAQ</a>
            </div>
        </div>`;
        console.log('[AnimeCursor 官方文档] 文档导航栏插入完成')
    } else {
        //
    }
}