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

export const invertPromise = () => {
    let _resolve;
    const promise = new Promise(resolve => {
        _resolve = resolve;
    });

    promise.resolve = _resolve;
    return promise;
};

export function throttlePromise(target, property, descriptor, clear = false) {
    if (typeof target === "boolean") {
        return function(target, property, descriptor) {
            return throttlePromise(target, property, descriptor, true);
        };
    }

    // Each call to `throttlePromise` has a unique `lock`
    const lock = Symbol("private lock");
    const _super = descriptor.value;

    async function throttleOnce(id) {
        if (id !== this[lock].gen) {
            // This invocation got de-duped with a later one, but it will
            // wake up first, so if there is not a lock acquired here, push
            // it to the back of the event queue.
            if (!this[lock].lock) {
                await new Promise(requestAnimationFrame);
            }

            // Now await the currently-processing invocation (which
            // occurred after than this one) and return.
            await this[lock].lock;
            return true;
        }
    }

    // Wrap the underlying function
    descriptor.value = async function(...args) {
        // Initialize the lock for this Object instance, if it has never been
        // initialized.
        this[lock] = this[lock] || {gen: 0};

        // Assign this invocation a unique ID.
        let id = ++this[lock].gen;

        if (clear) {
            await new Promise(requestAnimationFrame);
        }

        // If the `lock` property is defined, a previous invocation is still
        // processing.
        if (this[lock].lock) {
            // `await` the previous call;  afterwards, the drawn state will be
            // updated but we need to draw again to incorporate this
            // invocation's state changes.
            await this[lock].lock;

            // We only want to execute the _last_ invocation, since each call
            // precludes the previous ones if they are still queue-ed.
            if (await throttleOnce.call(this, id)) {
                return;
            }
        } else if (clear) {
            // Even if the lock is clear, we need to debounce the queue-ed.
            const debounced = await throttleOnce.call(this, id);
            if (debounced) {
                return;
            }
        }

        // This invocation has made it to the render process, so "acquire" the
        // lock.
        this[lock].lock = invertPromise();

        // Call the decorated function itself
        let result;
        try {
            result = await _super.call(this, ...args);
        } finally {
            // Errors can leave promises which depend on this behavior
            // dangling.
            const l = this[lock].lock;
            delete this[lock]["lock"];

            // If this invocation is still the latest, clear the attribute
            // state.
            // TODO this is likely not he behavior we want for this event ..
            if (id === this[lock].gen && clear) {
                this.removeAttribute("updating");
                this.dispatchEvent(new Event("perspective-update-complete"));
            }

            l.resolve();
        }

        return result;
    };

    // A function which clears the lock just like the main wrapper, but then
    // does nothing.
    descriptor.value.flush = async function(obj) {
        if (obj[lock]?.lock) {
            await obj[lock].lock;
            await new Promise(requestAnimationFrame);
            if (obj[lock]?.lock) {
                await obj[lock].lock;
            }
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

/**
 * Given an expression, return its alias or undefined if it does not have one.
 *
 * @param {*} expression
 * @returns String
 */
export function getExpressionAlias(expression) {
    const matches = expression.match(/\/\/(.+)\n/);
    let alias;

    // Has an alias - use that to type check.
    if (matches && matches.length == 2) {
        alias = matches[1].trim();
    }

    return alias;
}

/**
 * Adds an alias to the given expression and returns it.
 *
 * @param {*} expression
 * @returns String
 */
export function addExpressionAlias(expression) {
    let alias;
    expression.length > 20
        ? (alias =
              expression
                  .replace("\n", " ")
                  .substr(0, 20)
                  .trim() + "...")
        : (alias = expression);
    return `//${alias}\n${expression}`;
}

/**
 * Given an alias and an array of string expressions, find the alias inside
 * the expressions array. This is important so we can map aliases back to
 * expressions inside _new_row.
 *
 * @param {String} alias
 * @param {Array<String>} expressions
 * @returns String
 */
export function findExpressionByAlias(alias, expressions) {
    for (const expr of expressions) {
        const expr_alias = getExpressionAlias(expr);
        if (alias === expr_alias) {
            return expr;
        }
    }
}

/**
 * Given an expression, strips the alias and returns the expression.
 *
 * @param {String} expression
 * @returns String
 */
export function getRawExpression(expression) {
    return expression.replace(/\/\/(.+)\n/, "");
}
