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

/**
 * A simple tool for creating Web Components v0.
 *
 * Params
 * ------
 * template : An HTML string representing a template.  Should have an 'id'
 *     attribute which will become the new Web Component's tag name.
 * proto : The new Web Component's prototype object, as per spec.
 */
export function registerElement(template, proto) {

    template = importTemplate(template);
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
                old.bind(this)(val);
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