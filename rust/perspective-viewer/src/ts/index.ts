/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import init, * as internal from "../../dist/pkg/perspective_viewer.js";
import * as perspective from "@finos/perspective";

/**
 * Module for the `<perspective-viewer>` custom element.  Though
 * `<perspective-viewer>` is written mostly in Rust, the nature of WebAssembly's
 * compilation makes it a dynamic module;  in order to guarantee that the
 * Custom Elements extension methods are registered synchronously with this
 * package's import, we need perform said registration within this wrapper module.
 *
 * This module has no (real) exports, but importing it has a side
 * effect: the {@link module:perspective_viewer~PerspectiveViewer} class is
 * registered as a custom element, after which it can be used as a standard DOM
 * element.
 *
 * The documentation in this module defines the instance structure of a
 * `<perspective-viewer>` DOM object instantiated typically, through HTML or any
 * relevent DOM method e.g. `document.createElement("perspective-viewer")` or
 * `document.getElementsByTagName("perspective-viewer")`.
 *
 * @module perspective-viewer
 */


// There is no way to provide a default rejection handler within a promise and
// also not lock the await-er, so this module attaches a global handler to
// filter out cancelled query messages.
window.addEventListener("unhandledrejection", event => {
    if (event.reason?.message === "View method cancelled") {
        event.preventDefault();
    }
});

const WASM_MODULE = import(
    /* webpackChunkName: "perspective-viewer.custom-element" */
    /* webpackMode: "eager" */
    "../../dist/pkg/perspective_viewer_bg.wasm"
).then(init_wasm);

async function init_wasm({default: wasm_module}) {
    await init(wasm_module);
    internal.set_panic_hook();
    return internal;
}

export type PerspectiveViewerConfig = perspective.ViewConfig & {
    plugin?: string;
    settings?: boolean;
};

export class PerspectiveViewerElement extends HTMLElement {
    private instance: internal.PerspectiveViewerElement;

    constructor() {
        super();
        this.load_wasm();
    }

    private async load_wasm() {
        const module = await WASM_MODULE;
        if (!this.instance) {
            this.instance = new module.PerspectiveViewerElement(this);
        }
    }

    /**
     * Part of the Custom Elements API.  This method is called by the browser, and 
     * should not be called directly by applications.
     */
    async connectedCallback() {
        await this.load_wasm();
        this.instance.connected_callback();
    }

    /**
     * Register a new plugin via its custom element name.  This method is called
     * automatically as a side effect of importing a plugin module, so this method
     * should only typically be called by plugin authors.
     *
     * @param name The `name` of the custom element to register
     */
    static async registerPlugin(name) {
        const module = await WASM_MODULE;
        module.register_plugin(name);
    }

    /**
     * Load a `perspective.Table`.  If `load` or `update` have already been called
     * on this element, its internal `perspective.Table` will _not_ be deleted.
     *
     * @async
     * @param data A `Promise` which resolves to the `perspective.Table`
     * @returns {Promise<void>} A promise which resolves once the data is loaded,
     * a `perspective.View` has been created, and the active plugin has rendered.
     * @example <caption>Load perspective.table</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * const tbl = perspective.table("x,y\n1,a\n2,b");
     * my_viewer.load(tbl);
     * @example <caption>Load Promise<perspective.table></caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * const tbl = perspective.table("x,y\n1,a\n2,b");
     * my_viewer.load(tbl);
     */
    async load(table: Promise<perspective.Table>) {
        await this.load_wasm();
        await this.instance.js_load(table);
    }

    /**
     * Redraw this `<perspective-viewer>` and plugin when its dimensions or visibility
     * have been updated.
     *
     * @returns A `Promise<void>` which resolves when this resize event has finished
     * rendering.
     */
    async notifyResize(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_resize();
    }

    /**
     * Returns the `perspective.Table()` which was supplied to `load()`.  If `load()`
     * has been called but the supplied `Promise<perspective.Table>` has not resolved,
     * `getTable()` will `await`;  if `load()` has not yet been called, an `Error`
     * will be thrown.
     *
     * @returns A `Promise` which resolves to a `perspective.Table`
     */
    async getTable(): Promise<perspective.Table> {
        await this.load_wasm();
        const table = await this.instance.js_get_table();
        return table;
    }

    /**
     * Restore this element to a state as generated by a reciprocal call to
     * `save`.
     *
     * @param config returned by `save()`.
     * @returns A promise which resolves when the changes have been applied and
     * rendered.
     */
    async restore(config: PerspectiveViewerConfig | string | ArrayBuffer): Promise<void> {
        await this.load_wasm();
        await this.instance.js_restore(config);
    }

    /**
     * Flush any pending modifications to this `<perspective-viewer>`.
     *
     * @returns {Promise<void>} A promise which resolves when the current pending
     * state changes have been applied and rendered.
     */
    async flush(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_flush();
    }

    /**
     * Reset's this element's view state and attributes to default.  Does not
     * delete this element's `perspective.table` or otherwise modify the data
     * state.
     */
    async reset(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_reset();
    }

    /**
     * Serialize this element's attribute/interaction state.
     *
     * @param format The serialization format - `json` (JavaScript object),
     * `arraybuffer` or `string`.  `restore()` uses the returned config's type
     * to infer format.
     * @returns {object} a serialized element.
     */
    async save(format?: "json" | "arraybuffer" | "string"): Promise<PerspectiveViewerConfig | string | ArrayBuffer> {
        await this.load_wasm();
        const config = await this.instance.js_save(format);
        return config;
    }

    /**
     * Deletes this element and clears it's internal state (but not its
     * user state).  This (or the underlying `perspective.view`'s equivalent
     * method) must be called in order for its memory to be reclaimed, as well
     * as the reciprocal method on the `perspective.table` which this viewer is
     * bound to.
     */
    async delete(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_delete();
    }

    /**
     * Download this element's data as a CSV file.
     *
     * @param flat Whether to use the element's current view
     * config, or to use a default "flat" view.
     */
    async download(flat: boolean): Promise<void> {
        await this.load_wasm();
        await this.instance.js_download(flat);
    }

    /**
     * Copies this element's view data (as a CSV) to the clipboard.  This method
     * must be called from an event handler, subject to the browser's
     * restrictions on clipboard access.  See
     * {@link https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard}.
     *
     * @param flat Whether to use the element's current view
     * config, or to use a default "flat" view.
     */
    async copy(flat: boolean): Promise<void> {
        await this.load_wasm();
        await this.instance.js_copy(flat);
    }

    /**
     * Restyles the elements and to pick up any style changes
     */
    async restyleElement(): Promise<void> {
        console.error("Not Implemented");
    }

    /**
     * Gets the edit port, the port number for which `Table` updates from this
     * `<perspective-viewer>` are generated.
     *
     * @returns A promise which resolves to the current edit port.
     */
    async getEditPort(): Promise<number> {
        console.error("Not Implemented");
        return -1;
    }

    /**
     * Determines the render throttling behavior. Can be an integer, for
     * millisecond window to throttle render event; or, if `undefined`,
     * will try to determine the optimal throttle time from this component's
     * render framerate.
     *
     * @param value an optional throttle rate in milliseconds (integer).  If not
     * supplied, adaptive throttling is calculated from the average plugin render
     * time.
     * @example
     * // Only draws at most 1 frame/sec.
     * await viewer.setThrottle(1000);
     */
    async setThrottle(value?: number): Promise<void> {
        await this.load_wasm();
        await this.instance.js_set_throttle(value);
    }

    /**
     * Opens/closes the element's config menu.
     *
     * @param force If supplied, explicitly set the config state to "open" (`true`)
     * or "closed" (`false`).
     */
    async toggleConfig(force): Promise<void> {
        await this.load_wasm();
        await this.instance.js_toggle_config(force);
    }

    /**
     * Get the currently active plugin custom element instance, or a specific
     * named instance if requested.  `getPlugin(name)` does not activate the plugin
     * requested, so if this plugin is not active the returned `HTMLElement` will
     * not have a `parentElement`.
     *
     * If no plugins have been registered (via `registerPlugin()`), calling
     * `getPlugin()` will cause `perspective-viewer-debug` to be registered as a
     * side effect.
     *
     * @param name Optionally a specific plugin name, defaulting to the current
     * active plugin.
     * @returns The active or requested plugin instance.
     */
    async getPlugin(name): Promise<HTMLElement> {
        await this.load_wasm();
        const plugin = await this.instance.js_get_plugin(name);
        return plugin;
    }

    /**
     * Get all plugin custom element instances, in order of registration.
     *
     * If no plugins have been registered (via `registerPlugin()`), calling
     * `getAllPlugins()` will cause `perspective-viewer-debug` to be registered as
     * a side effect.
     *
     * @returns An `Array` of the plugin instances for this `<perspective-viewer>`.
     */
    async getAllPlugins(): Promise<Array<HTMLElement>> {
        await this.load_wasm();
        const plugins = await this.instance.js_get_all_plugins();
        return plugins;
    }
}

if (document.createElement("perspective-viewer").constructor === HTMLElement) {
    window.customElements.define("perspective-viewer", PerspectiveViewerElement);
}

class PerspectiveColumnStyleElement extends HTMLElement {
    private instance: internal.PerspectiveColumnStyleElement;

    constructor() {
        super();
    }

    async open(target, config, default_config) {
        if (this.instance) {
            this.instance.reset(config, default_config);
        } else {
            this.instance = new internal.PerspectiveColumnStyleElement(this, config, default_config);
        }

        this.instance.open(target);
    }
}

if (document.createElement("perspective-column-style").constructor === HTMLElement) {
    window.customElements.define("perspective-column-style", PerspectiveColumnStyleElement);
}

interface ReactPerspectiveViewerAttributes<T> extends React.HTMLAttributes<T> {}

type JsxPerspectiveViewerElement = {class?: string} & React.DetailedHTMLProps<ReactPerspectiveViewerAttributes<PerspectiveViewerElement>, PerspectiveViewerElement>;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "perspective-viewer": JsxPerspectiveViewerElement;
        }
    }

    interface Document {
        createElement(tagName: "perspective-viewer", options?: ElementCreationOptions): PerspectiveViewerElement;
    }
}