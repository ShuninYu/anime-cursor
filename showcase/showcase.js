// 让下一个元素（target）显示
function showNext(target) {
    document.getElementById(target).style.display = 'block';
}

// 修改背景图片
function changeBg(ele , imgpath) {
    ele.style.backgroundImage = `url(${imgpath})`;
}

// 移除dataset
function removeDataset(event) {
    event.target.removeAttribute('data-cursor');
}

if(typeof hljs !== 'undefined') {
    hljs.highlightAll();
    console.log('highlightJS codes highlighted');
} else {
    console.log('highlightJS not found, will not render codes');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        AnimeCursor.refresh()
    }, 1);
    injectFooter();
});
// 插入 footer 内容
function injectFooter() {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    document.querySelector('footer').innerHTML = '© ' + currentYear + ' AnimeCursor - by <a href="https://shuninyu.fun">ShuninYu</a>.<br>All rights reserved.';
}