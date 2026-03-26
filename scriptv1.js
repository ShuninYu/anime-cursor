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
    const version = 'v1';
    const docsPanel = document.querySelector('.docs-panel');
    const docPage = document.querySelector('.docs-page');
    if (!docsPanel || !docPage) return;

    // 判断语言
    const isZh = docsPanel.classList.contains('zh-CN');
    const docType = docPage.id;

    // 构建基础路径
    const basePath = isZh ? '/docs/v1/zh' : '/docs/v1';
    // 语言切换目标基础路径
    const targetBasePath = isZh ? '/docs/v1' : '/docs/v1/zh';
    // 当前页面是否是介绍页（index.html）
    const isIntro = docType === 'introduction';

    // 辅助函数：生成指向其他文档的绝对路径（带锚点）
    function getDocLink(targetPage, anchor) {
        if (targetPage === docType) {
            // 当前页面，只返回锚点
            return `#${anchor}`;
        }
        if (targetPage === 'introduction') {
            // 介绍页无 .html 后缀
            return `${basePath}/#${anchor}`;
        }
        return `${basePath}/${targetPage}.html#${anchor}`;
    }

    // 辅助函数：生成语言切换链接
    function getLangSwitchLink() {
        if (isIntro) {
            // 介绍页路径不带文件名
            return `${targetBasePath}/`;
        }
        return `${targetBasePath}/${docType}.html`;
    }

    docsPanel.innerHTML = `
        <div class="docs-panel-topbar">
            <a class="docs-panel-topbar-logo"><p>${version}</p></a>
            <a class="home-lang" title="${isZh ? 'Switch to English' : '切换到中文'}" href="${getLangSwitchLink()}">
                <svg class="line-svg">
                    <line class="line" x1="100%" y1="0" x2="0" y2="100%"/>
                </svg>
            </a>
            <div class="docs-panel-topbar-navbar">
                <a href="/" class="docs-panel-topbar-navbtn">${isZh ? '主页' : 'home'}<div></div></a>
                <a href="/showcase" class="docs-panel-topbar-navbtn">${isZh ? '在线演示' : 'showcase'}<div></div></a>
                <a href="/changelog" class="docs-panel-topbar-navbtn" target="_blank">${isZh ? '更新日志' : 'changelog'}<div></div></a>
            </div>
        </div>
        <div class="docs-panel-list">
            <div class="docs-panel-list-folder"><p onclick="jumpTo('${isZh ? 'index' : ''}')" data-cursor="pointer">${isZh ? '简介' : 'Introduction'}</p>
                <a class="docs-panel-list-item" href="${getDocLink('introduction', 'what-is-animecursor')}">${isZh ? '什么是 AnimeCursor' : 'What is AnimeCursor'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('introduction', 'features')}">${isZh ? '特性' : 'Features'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('introduction', 'browser-support')}">${isZh ? '浏览器支持' : 'Browser Support'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('getting-started')" data-cursor="pointer">${isZh ? '开始使用' : 'Getting Started'}</p>
                <a class="docs-panel-list-item" href="${getDocLink('getting-started', 'installation')}">${isZh ? '安装' : 'Installation'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('getting-started', 'basic-usage')}">${isZh ? '基本用法' : 'Basic Usage'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('getting-started', 'example')}">${isZh ? '示例' : 'Example'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('configuration')" data-cursor="pointer">${isZh ? '配置' : 'Configuration'}</p>
                <a class="docs-panel-list-item" href="${getDocLink('configuration', 'cursor-types')}">${isZh ? '光标类型' : 'Cursor Types'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('configuration', 'options')}">${isZh ? '光标参数' : 'Cursor Options'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('configuration', 'global-options')}">${isZh ? '全局选项' : 'Global Options'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('api')" data-cursor="pointer">API</p>
                <a class="docs-panel-list-item" href="${getDocLink('api', 'constructor')}">${isZh ? '创建实例' : 'Constructor'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('api', 'refresh')}">refresh</a>
                <a class="docs-panel-list-item" href="${getDocLink('api', 'disable-enable')}">disable / enable</a>
                <a class="docs-panel-list-item" href="${getDocLink('api', 'destroy')}">destroy</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('lcbp')" data-cursor="pointer">LC & BP</p>
                <a class="docs-panel-list-item" href="${getDocLink('lcbp', 'dom')}">${isZh ? 'DOM 注入时机' : 'DOM Injection Timing'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('lcbp', 'markdown')}">${isZh ? '配合 Markdown / SPA 使用' : 'Working With Markdown / SPA'}</a>
            </div>
            <div class="docs-panel-list-folder"><p onclick="jumpTo('debug')" data-cursor="pointer">${isZh ? '调试与排除故障' : 'Debug & Troubleshooting'}</p>
                <a class="docs-panel-list-item" href="${getDocLink('debug', 'debug-mode')}">${isZh ? 'debug 模式' : 'debug Mode'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('debug', 'common-issues')}">${isZh ? '常见问题' : 'Common Issues'}</a>
                <a class="docs-panel-list-item" href="${getDocLink('debug', 'faq')}">FAQ</a>
            </div>
        </div>`;

    console.log(`${isZh ? '[AnimeCursor 官方文档] 文档导航栏插入完成' : '[AnimeCursor documentation] Panel injection done'}`);
}