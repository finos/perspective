/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Detect Internet Explorer.
 *
 * Returns
 * -------
 * True if the current script is running in Internet Explorer.
 */
export function detectIE() {
    if (typeof window === "undefined") return false;
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    return false;
}

/**
 * Detect Chrome.
 *
 * Returns
 * -------
 * Detect if the current script is running in Chrome.
 */
export function detectChrome() {
    var isChromium = window.chrome,
        winNav = window.navigator,
        vendorName = winNav.vendor,
        isOpera = winNav.userAgent.indexOf("OPR") > -1,
        isIEedge = winNav.userAgent.indexOf("Edge") > -1,
        isIOSChrome = winNav.userAgent.match("CriOS");

    if (isIOSChrome) {
        return true;
    } else if (
        isChromium !== null &&
        typeof isChromium !== "undefined" &&
        vendorName === "Google Inc." &&
        isOpera === false &&
        isIEedge === false
    ) {
        return true;
    } else { 
        return false;
    }
}

/**
 * An Object for capturing details of the invoking script's origin.
 *
 * Returns
 * -------
 * An instance of a ScriptPath object.  Interesting methods on this object
 * include:
 *     fullPath : The complete path of this script.
 *     path : The path (no host).
 *     host : The host (no path).
 *     file : The file name itself.
 */
export function ScriptPath() {
    var scriptPath = '', pathParts;
    try {
        throw new Error();
    } catch(e) {
        var stackLines = e.stack.split('\n');
        var callerIndex = 0;
        for(var i in stackLines){
            if(!stackLines[i].match(/http[s]?:\/\//)) continue;
            callerIndex = Number(i);
            break;
        }
        pathParts = stackLines[callerIndex].match(/((http[s]?:\/\/.+\/)([^\/]+\.(js|html))).*?:/);
    }

    this.fullPath = function() {
        return pathParts ? pathParts[1] : window.location.origin + window.location.pathname;
    };
    this.path = function() {
        return pathParts ? pathParts[2] : window.location.pathname;
    };
    this.host = function() {
        let x = this.path().match(/.+?\/\/.+?\//);
        return x ? x[0] : window.location.hostname;
    }
    this.file = function() {
        return pathParts ? pathParts[3] : "";
    };
}

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