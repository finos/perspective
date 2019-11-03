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
    line-height: initial;
    margin-bottom: -0.28em;
    margin-top: -0.35em;
}

:host .outer {
    overflow: hidden;
}

:host {
    display: inline-block;
    position: relative;
    ${x}color: rgb(249, 249, 249);
    ${y}color: #242526;
    font-family: "Source Code Pro";
    font-weight: bold;
    font-size: 2em;
    padding: 24px;
    letter-spacing: -0.166em;
}

:host span {
    padding-left: 0.05em;
    margin-left: -0.05em;
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
