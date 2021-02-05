import {render, html} from "lit-html";

class PerspectiveLogo extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: "open"});
        this._inverted = false;
        render(this._template, shadowRoot);
    }

    get _template() {
        return html`
            ${this._style}
            <div class="outer">
                <div class="inner">PER<span>SPECTIVE</span></div>
            </div>
        `;
    }

    get _style() {
        let x = "",
            y = "";
        if (this._inverted) {
            x = "background-";
        } else {
            y = "background-";
        }
        let content = `
:host .inner {
    line-height: 0.67em;
    height: 0.71em;
    margin-right: -0.05em
}

:host .outer {
    overflow: hidden;
}

:host {
    display: inline-block;
    position: relative;
    ${x}color: rgb(249, 249, 249);
    ${y}color: #242526;
    font-family: "Orbitron";
    font-weight: bold;
    font-size: 1.2em;
    padding: 24px;
}

:host span {
    padding-left: 0.2em;
    margin-left: -0.2em;
    ${x}color: #242526;
    ${y}color: rgb(249, 249, 249);
}`;
        return html`
            <style>
                ${content}
            </style>
        `;
    }
}

window.customElements.define("perspective-logo", PerspectiveLogo);
