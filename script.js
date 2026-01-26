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

// 代码拷贝
async function copyCode(pre) {
    var code = pre.querySelector('code');
    try {
        await navigator.clipboard.writeText(code.innerText);
        console.log('[AnimeCursor documentation] code copied to clipboard')
    } catch (err) {
        console.error('[AnimeCursor documentation] failed to copy: ' , err);
    }
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
    const version = 'v0.2.0';
    const docsPanel = document.querySelector('.docs-panel');
    const codes = document.querySelectorAll('pre');
    if (docsPanel) {
        const docType = document.querySelector('.docs-page').id;
        //${(docsPanel.classList.contains('zh-CN'))?'':''}
        docsPanel.innerHTML = `
        <div class="docs-panel-topbar">
            <a class="docs-panel-topbar-logo"><p>${version}</p></a>
            <a class="home-lang" title="${(docsPanel.classList.contains('zh-CN'))?'Switch to English | 切换英文':'Switch to Chinese | 切换中文'}" href="${(docsPanel.classList.contains('zh-CN'))?`../../docs${(docType === 'introduction')? '':`/${docType}`}`:`zh${(docType === 'introduction')? '':`zh/${docType}`}`}">
                <svg class="line-svg">
                    <line class="line" x1="100%" y1="0" x2="0" y2="100%"/>
                </svg>
            </a>
            <div class="docs-panel-topbar-navbar">
                <a href="${(docsPanel.classList.contains('zh-CN'))?'../../':'../'}" class="docs-panel-topbar-navbtn">${(docsPanel.classList.contains('zh-CN'))?'主页':'home'}<div></div></a>
                <a href="${(docsPanel.classList.contains('zh-CN'))?'../../examples':'../examples'}" class="docs-panel-topbar-navbtn">${(docsPanel.classList.contains('zh-CN'))?'查看示例':'examples'}<div></div></a>
                <a href="${(docsPanel.classList.contains('zh-CN'))?'../../changelog':'../changelog'}" class="docs-panel-topbar-navbtn" target="_blank">${(docsPanel.classList.contains('zh-CN'))?'更新日志':'changelog'}<div></div></a>
            </div>
        </div>
        <div class="docs-panel-list">
            <div class="docs-panel-list-folder"><p onclick="jumpTo('${(docType === 'introduction')?'':`${(docsPanel.classList.contains('zh-CN'))?'../zh':'../docs'}`}')" data-cursor="pointer">${(docsPanel.classList.contains('zh-CN'))?'简介':'Introduction'}</p>
                <a class="docs-panel-list-item" href="${(docType === 'introduction')?'#what-is-animecursor':'../zh#what-is-animecursor'}">${(docsPanel.classList.contains('zh-CN'))?'什么是 AnimeCursor':'What is AnimeCursor'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'introduction')?'#features':'../zh#features'}">${(docsPanel.classList.contains('zh-CN'))?'特性':'Features'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'introduction')?'#browser-support':'../zh#browser-support'}">${(docsPanel.classList.contains('zh-CN'))?'浏览器支持':'Browser Support'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('getting-Started')" data-cursor="pointer">${(docsPanel.classList.contains('zh-CN'))?'快速开始':'quick-start'}</p>
                <a class="docs-panel-list-item" href="${(docType === 'getting-started')?'#installation':'getting-started#installation'}">${(docsPanel.classList.contains('zh-CN'))?'安装':'Installation'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'getting-started')?'#basic-usage':'getting-started#basic-usage'}">${(docsPanel.classList.contains('zh-CN'))?'基本用法':'Basic Usage'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'getting-started')?'#example':'getting-started#example'}">${(docsPanel.classList.contains('zh-CN'))?'示例':'Example'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('configuration')" data-cursor="pointer">${(docsPanel.classList.contains('zh-CN'))?'配置':'Configuration'}</p>
                <a class="docs-panel-list-item" href="${(docType === 'configuration')?'#cursor-types':'configuration#cursor-types'}">${(docsPanel.classList.contains('zh-CN'))?'光标类型':'Cursor Types'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'configuration')?'#options':'configuration#options'}">${(docsPanel.classList.contains('zh-CN'))?'光标参数':'Cursor Options'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'configuration')?'global-options':'configuration#global-options'}">${(docsPanel.classList.contains('zh-CN'))?'全局选项':'Global Options'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('api')" data-cursor="pointer">API</p>
                <a class="docs-panel-list-item" href="${(docType === 'api')?'#constructor':'api#constructor'}">${(docsPanel.classList.contains('zh-CN'))?'创建实例':'Constructor'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'api')?'#refresh':'api#refresh'}">refresh</a>
                <a class="docs-panel-list-item" href="${(docType === 'api')?'#enable-disable':'api#enable-disable'}">enable / disable</a>
                <a class="docs-panel-list-item" href="${(docType === 'api')?'#destroy':'api#destroy'}">destroy</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('lcbp')" data-cursor="pointer">LC & BP</p><!-- 生命周期与最佳实践 -->
                <a class="docs-panel-list-item" href="${(docType === 'lcbp')?'#dom':'lcbp#dom'}">${(docsPanel.classList.contains('zh-CN'))?'DOM 注入时机':'DOM Injection Timing'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'lcbp')?'#markdown':'lcbp#markdown'}">${(docsPanel.classList.contains('zh-CN'))?'配合 Markdown / SPA 使用':'Working With Markdown / SPA'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('debug')" data-cursor="pointer">${(docsPanel.classList.contains('zh-CN'))?'调试与排除故障':'Debug & Troubleshooting'}</p>
                <a class="docs-panel-list-item" href="${(docType === 'debug')?'#debug-mode':'debug#debug-mode'}">${(docsPanel.classList.contains('zh-CN'))?'debug 模式':'debug Mode'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'debug')?'#common-issues':'debug#common-issues'}">${(docsPanel.classList.contains('zh-CN'))?'常见问题':'Common Issues'}</a>
                <a class="docs-panel-list-item" href="${(docType === 'debug')?'#faq':'debug#faq'}">FAQ</a>
            </div>
        </div>`;
        console.log(`${(docsPanel.classList.contains('zh-CN'))?'[AnimeCursor 官方文档] 文档导航栏插入完成':'[AnimeCursor documentation] Panel injection done'}`);
    }
}