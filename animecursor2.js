if(typeof hljs !== 'undefined') {
    hljs.highlightAll();
    hljs.addPlugin(new CopyButtonPlugin({
        autohide: false,
    }));
    console.log('highlightJS codes highlighted');
} else {
    console.log('highlightJS not found, will not render codes');
}

document.addEventListener('DOMContentLoaded', function() {

    new AnimeCursor({
        debug: true,
        cursors: {
            default: {
                size: [32,32],
                image: '../i/cursor/cursor_default.gif',
                pixel: true,
                default: true
            },
            pointer: {
                tags: ['a', 'button'],
                size: [32,36],
                image: '../i/cursor/cursor_pointer.png',
                frames: 3,
                duration: 0.3,
                pingpong: true,
                offset: [10, 4],
                pixel: true
            },
            text: {
                tags: ['p','h1','h2','h3','h4','span','td','th','pre','code','footer'],
                size: [32,32],
                image: '../i/cursor/cursor_text.png',
                offset: [10, 16],
                pixel: true
            }
        }
    });
})