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
    const div = document.createElement('div');
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
export function registerElement(templateString, proto) {

    const template = importTemplate(templateString);
    setTemplateContent(template);

    const _perspective_element = class extends proto {

        attributeChangedCallback(name, old, value) {
            if (name[0] !== "_" && old != value) {
                this[name] = value;
            }
        }

        connectedCallback() {
            if (this._initialized) {
                return;
            }
            this._initializing= true;
            this._old_children = [];
            while (this.hasChildNodes()) {
                if (this.lastChild.nodeType === 1) {
                    this._old_children.push(this.lastChild);
                }
                this.removeChild(this.lastChild);
            };
            this._old_children = this._old_children.reverse();
            var node = document.importNode(template.content, true);
            this.appendChild(node);

            if (super.connectedCallback) {
                super.connectedCallback();
            }
    
            // Call all attributes bound to setters on the proto
            for (let key of Object.getOwnPropertyNames(proto.prototype)) {
                if (key !== "connectedCallback") {
                    if (this.hasAttribute(key) && key[0] !== "_") this[key] = this.getAttribute(key);
                }
            }
            this._initializing = false;
            this._initialized = true;
        };

        static get observedAttributes() {
            return Object.getOwnPropertyNames(proto.prototype);
        }
    }

    for (let key of Object.getOwnPropertyNames(proto.prototype)) {
        let descriptor = Object.getOwnPropertyDescriptor(proto.prototype, key);
        if (descriptor && descriptor.set) {
            let old = descriptor.set;
            descriptor.set = function(val) {
                if( this.getAttribute(key) !== val) {
                    this.setAttribute(key, val);
                    return;
                }
                if (!this._initializing && !this._initialized) {
                    return;
                }
                old.call(this, val);
            }
            Object.defineProperty(proto.prototype, key, descriptor);
        }
    }

    
    let name = template.getAttribute('id');
    console.log(`Registered ${name}`);

    window.customElements.define(name, _perspective_element)
}

export function bindTemplate(template) { 
    return function (cls) {
        return registerElement(template, cls);
    }
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
        const old_set = desc.set;
        desc.set = function (x) {
            let attr = this.getAttribute(name);
            try {
                if (x === null || x === undefined) {
                    x = _default();
                }
                if (typeof x !== "string") {
                    x = JSON.stringify(x);
                }
                if (x !== attr) {
                    this.setAttribute(name, x);
                    attr = x;
                    return;
                }
                attr = JSON.parse(attr);
            } catch (e) {
                console.error(`Invalid value for attribute "${name}": ${x}`);
                attr = _default();
            }
            old_set.call(this, attr);    
        }
        desc.get = function () {
            if (this.hasAttribute(name)) {
                return JSON.parse(this.getAttribute(name));
            }
        }
        return desc;
    }
}

export function copy_to_clipboard(csv) {
    let element = document.createElement('textarea');
    document.body.appendChild(element);
    element.value = csv;
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
}

export const json_attribute = _attribute(() => ({}));
export const array_attribute = _attribute(() => []);