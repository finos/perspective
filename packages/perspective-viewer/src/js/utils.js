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

export function importTemplate(template) {
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
        template.innerHTML = `<style>${styleString.toString()}</style>` + template.innerHTML;
    }
    template.innerHTML = `<style id="psp_styles" scope="${template.getAttribute("id")}">test{}</style>` + template.innerHTML;

    const _perspective_element = class extends proto {
        attributeChangedCallback(name, old, value) {
            if (value === null) {
                value = "null";
            }
            if (name[0] !== "_" && old != value && !!Object.getOwnPropertyDescriptor(proto.prototype, name).set) {
                this[name] = value;
            }
        }

        connectedCallback() {
            if (this._initialized) {
                return;
            }
            this._initializing = true;
            var node = document.importNode(template.content, true);
            this.attachShadow({mode: "open"});
            this.shadowRoot.appendChild(node);

            if (super.connectedCallback) {
                super.connectedCallback();
            }

            // Call all attributes bound to setters on the proto
            for (let key of Object.getOwnPropertyNames(proto.prototype)) {
                if (key !== "connectedCallback") {
                    if (this.hasAttribute(key) && key[0] !== "_" && !!Object.getOwnPropertyDescriptor(proto.prototype, key).set) {
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
            descriptor.set = function(val) {
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
    const style = styleStrings.map(x => x.toString()).join("\n");
    return function(cls) {
        return registerElement(template, {toString: () => style}, cls);
    };
}

/**
 * A decorator for declaring a setter property of an HTMLElement descendent
 * class as serialized JSON.  Handles converting these types before invoking
 * the underlying function/
 *
 * @param {object} _default the default value to supply the setter when
 * undefined, removed or invalid.
 */
function _attribute(_default) {
    return function(cls, name, desc) {
        const old_set = desc.value;
        desc.set = function(x) {
            let attr = this.getAttribute(name);
            try {
                if (x === null || x === undefined || x === "") {
                    x = _default();
                }
                if (typeof x !== "string") {
                    x = JSON.stringify(x);
                }
                if (x !== attr) {
                    attr = x;
                }
                attr = JSON.parse(attr);
            } catch (e) {
                console.warn(`Invalid value for attribute "${name}": ${x}`);
                attr = _default();
            }
            old_set.call(this, attr);
        };
        desc.get = function() {
            if (this.hasAttribute(name)) {
                return JSON.parse(this.getAttribute(name));
            } else {
                return _default();
            }
        };
        delete desc["value"];
        delete desc["writable"];
        return desc;
    };
}

/**
 * Just like `setTimeout` except it returns a promise which resolves after the
 * callback has (also resolved).
 *
 * @param {func} cb
 * @param {*} timeout
 */
export async function setPromise(cb = async () => {}, timeout = 0) {
    await new Promise(x => setTimeout(x, timeout));
    return await cb();
}

/**
 * Returns a promise whose resolve method can be called from elsewhere.
 */
export function invertPromise() {
    let resolve;
    let promise = new Promise(_resolve => {
        resolve = _resolve;
    });
    promise.resolve = resolve;
    return promise;
}

export function throttlePromise(target, property, descriptor) {
    const lock = Symbol("private lock");
    const f = descriptor.value;
    descriptor.value = async function(...args) {
        if (this[lock]) {
            await this[lock];
            if (this[lock]) {
                await this[lock];
                return;
            }
        }
        this[lock] = invertPromise();
        let result;
        try {
            result = await f.call(this, ...args);
        } catch (e) {
            console.error(e);
        } finally {
            const l = this[lock];
            this[lock] = undefined;
            l.resolve();
            return result;
        }
    };
    return descriptor;
}

/**
 * Swap 2 HTMLElements in a container.
 * @param {HTMLElement} container
 * @param {HTMLElement} elem1
 * @param {HTMLElement} elem2
 */
export function swap(container, ...elems) {
    if (elems[0] === elems[1]) return;
    if (elems.every(x => x.classList.contains("null-column"))) return;
    let [i, j] = elems.map(x => Array.prototype.slice.call(container.children).indexOf(x));
    if (j < i) {
        [i, j] = [j, i];
        elems = elems.reverse();
    }
    container.insertBefore(elems[1], elems[0]);
    if (j + 1 === container.children.length) {
        container.appendChild(elems[0]);
    } else {
        container.insertBefore(elems[0], container.children[j + 1]);
    }
}

export const json_attribute = _attribute(() => ({}));
export const array_attribute = _attribute(() => []);

export const registerPlugin = (name, plugin) => {
    if (global.registerPlugin) {
        global.registerPlugin(name, plugin);
    } else {
        global.__perspective_plugins__ = global.__perspective_plugins__ || [];
        global.__perspective_plugins__.push([name, plugin]);
    }
};
