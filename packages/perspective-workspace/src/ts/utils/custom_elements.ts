// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

/**
 * Instantiate a Template DOM object from an HTML text string.
 *
 * Params
 * ------
 * template : An HTML string representing a template.
 *
 * Returns
 * -------
 * A Template DOM object.
 */
function importTemplate(template: string): HTMLTemplateElement {
    const div = document.createElement("div");
    div.innerHTML = template;
    return Array.prototype.slice.call(div.children)[0];
}

export interface CustomElementProto extends CustomElementConstructor {
    connectedCallback(): void;
}

/**
 * A simple tool for creating Web Components v0.
 *
 * Params
 * ------
 * template : An HTML string representing a template.  Should have an 'id'
 *     attribute which will become the new Web Component's tag name.
 * proto : The new Web Component's prototype object, as per spec.
 */
export function registerElement(
    templateString: string,
    styleString: string,
    proto: CustomElementProto,
) {
    const template = importTemplate(templateString);
    if (styleString) {
        template.innerHTML =
            `<style>${styleString.toString()}</style>` + template.innerHTML;
    }

    const _perspective_element = class extends proto {
        private _initialized: boolean;
        private _initializing: boolean;

        constructor() {
            super();
            this._initialized = false;
            this._initializing = false;
        }

        connectedCallback() {
            if (this._initialized) {
                return;
            }

            this._initializing = true;
            const node = document.importNode(template.content, true);
            const root = this.attachShadow({ mode: "open" });
            root.appendChild(node);
            if (proto.prototype.connectedCallback) {
                proto.prototype.connectedCallback.call(this);
            }

            this._initializing = false;
            this._initialized = true;
        }

        static get observedAttributes() {
            return Object.getOwnPropertyNames(proto.prototype);
        }
    };

    let name = template.getAttribute("id")!;
    window.customElements.define(name, _perspective_element);
}

export function bindTemplate(template: string, ...styleStrings: string[]) {
    const style = styleStrings.map((x) => x.toString()).join("\n");
    return function (cls: CustomElementProto) {
        return registerElement(template, style, cls);
    };
}
