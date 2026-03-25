if(typeof hljs !== 'undefined') {
    hljs.highlightAll();
    hljs.addPlugin(new CopyButtonPlugin({
        autohide: false,
    }));
    console.log('highlightJS codes highlighted');
} else {
    console.log('highlightJS not found, will not render codes');
}

new AnimeCursor({
    //debug: true,
    combineAnimations: true,
    cursors: {
        default: {
            size: [32,32],
            image: '/i/cursor/cursor_newdefault1.png',
            frames: 12,
            duration: 1,
            default: true
        },
        pointer: {
            tags: ['a', 'button'],
            image: '/i/cursor/cursor_pointer (1).png',
            frames: 3,
            duration: 0.3,
            pingpong: true,
            offset: [10, 4],
        },
        text: {
            tags: ['p','h1','h2','h3','h4','span','td','th','pre','code','footer','b'],
            image: '/i/cursor/cursor_text.png',
            offset: [10, 16],
        }
    }
});