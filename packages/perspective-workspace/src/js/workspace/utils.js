/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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

function importTemplate(template) {
    const div = document.createElement("div");
    div.innerHTML = template;
    return Array.prototype.slice.call(div.children)[0];
}

function setTemplateContent(template) {
    // return early in browsers that have template tag support
    if (template.content) {
        return;
    }
    template.content = document.createDocumentFragment();
    let child;
    while ((child = template.firstChild)) {
        Node.prototype.appendChild.call(template.content, child);
    }
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
export function registerElement(templateString, styleString, proto) {
    const template = importTemplate(templateString);
    setTemplateContent(template);
    if (styleString) {
        template.innerHTML =
            `<style>${styleString.toString()}</style>` + template.innerHTML;
    }
    template.innerHTML =
        `<style id="psp_styles" scope="${template.getAttribute(
            "id"
        )}">test{}</style>` + template.innerHTML;

    let is_locked = 0;
    const _perspective_element = class extends proto {
        attributeChangedCallback(name, old, value) {
            if (is_locked > 0) {
                return;
            }

            if (value === null) {
                value = "null";
            }

            if (
                name[0] !== "_" &&
                old != value &&
                !!Object.getOwnPropertyDescriptor(proto.prototype, name).set
            ) {
                this[name] = value;
            }
        }

        _setAttributeSafe(key, val) {
            is_locked++;
            try {
                this.setAttribute(key, val);
            } finally {
                is_locked--;
            }
        }

        connectedCallback() {
            if (this._initialized) {
                return;
            }
            this._initializing = true;
            var node = document.importNode(template.content, true);
            this.attachShadow({mode: "open"});
            if (this._vieux) {
                this._vieux.appendChild(node);
                node = this._vieux;
            }

            this.shadowRoot.appendChild(node);

            if (super.connectedCallback) {
                super.connectedCallback();
            }

            // Call all attributes bound to setters on the proto
            for (let key of Object.getOwnPropertyNames(proto.prototype)) {
                if (key !== "connectedCallback") {
                    if (
                        this.hasAttribute(key) &&
                        key[0] !== "_" &&
                        !!Object.getOwnPropertyDescriptor(proto.prototype, key)
                            .set
                    ) {
                        this[key] = this.getAttribute(key);
                    }
                }
            }
            this._initializing = false;
            this._initialized = true;
        }

        static get observedAttributes() {
            return Object.getOwnPropertyNames(proto.prototype);
        }
    };

    for (let key of Object.getOwnPropertyNames(proto.prototype)) {
        let descriptor = Object.getOwnPropertyDescriptor(proto.prototype, key);
        if (descriptor && descriptor.set) {
            let old = descriptor.set;
            descriptor.set = function (val) {
                if (!this.hasAttribute(key) || this.getAttribute(key) !== val) {
                    this.setAttribute(key, val);
                    return;
                }
                if (!this._initializing && !this._initialized) {
                    return;
                }
                old.call(this, val);
            };
            Object.defineProperty(proto.prototype, key, descriptor);
        }
    }

    let name = template.getAttribute("id");
    console.log(`Registered ${name}`);

    window.customElements.define(name, _perspective_element);
}

export function bindTemplate(template, ...styleStrings) {
    const style = styleStrings.map((x) => x.toString()).join("\n");
    return function (cls) {
        return registerElement(template, {toString: () => style}, cls);
    };
}
