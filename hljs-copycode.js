class CopyButtonPlugin {
    constructor(options = {}) {
        this.hook = options.hook;
        this.callback = options.callback;
        this.autohide = typeof options.autohide !== "undefined" ? options.autohide : true
    }
    "after:highlightElement" ({
        el, text
    }) {
        if (el.parentElement.querySelector(".hljs-copy-button") || el.parentElement.querySelector(".no-copy")) return;
        let {
            hook, callback, autohide
        } = this;
        let container = Object.assign(document.createElement("div"), {
            className: "hljs-copy-container"
        });
        container.dataset.autohide = autohide;
        let button = Object.assign(document.createElement("a"), {
            innerHTML: "Copy",
            className: "hljs-copy-button",
        });
        button.dataset.copied = false;
        button.dataset.cursor = 'pointer';
        el.parentElement.classList.add("hljs-copy-wrapper");
        el.parentElement.appendChild(container);
        container.appendChild(button);
        button.onclick = function() {
            if (!navigator.clipboard) return;
            let newText = text;
            if (hook && typeof hook === "function") {
                newText = hook(text, el) || text
            }
            navigator.clipboard.writeText(newText).then(function() {
                button.innerHTML = "DONE";
                button.dataset.copied = true;
                setTimeout(() => {
                    button.innerHTML = "COPY";
                    button.dataset.copied = false;
                    el.parentElement.removeChild(alert);
                    alert = null
                }, 2e3)
            }).then(function() {
                if (typeof callback === "function") return callback(newText, el)
            })
        }
    }
}
if (typeof module != "undefined") {
    module.exports = CopyButtonPlugin
}