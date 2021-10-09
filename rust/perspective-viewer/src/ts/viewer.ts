/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import type * as perspective from "@finos/perspective";

import * as internal from "../../dist/pkg/perspective_viewer.js";
import {WASM_MODULE} from "./init.js";

export type PerspectiveViewerConfig = perspective.ViewConfig & {
    plugin?: string;
    settings?: boolean;
    plugin_config?: any;
};

/**
 * The Custom Elements implementation for `<perspective-viewer>`, as well at its
 * API.  `PerspectiveViewerElement` should not be constructed directly (like its
 * parent class `HTMLElement`);  instead, use `document.createElement()` or
 * declare your `<perspective-viewer>` element in HTML.  Once instantiated,
 * `<perspective-viewer>` works just like a standard `HTMLElement`, with a few
 * extra perspective-specific methods.
 *
 * @example
 * ```javascript
 * const viewer = document.createElement("perspective-viewer");
 * ```
 * @example
 * ```javascript
 * document.body.innerHTML = `
 *     <perspective-viewer id="viewer"></perspective-viewer>
 * `;
 * const viewer = document.body.querySelector("#viewer");
 * ```
 * @noInheritDoc
 */
export class PerspectiveViewerElement extends HTMLElement {
    private instance: internal.PerspectiveViewerElement;

    /**
     * Should not be called directly (will throw `TypeError: Illegal
     * constructor`).
     * @ignore
     */
    constructor() {
        super();
        this.load_wasm();
    }

    private async load_wasm(): Promise<void> {
        const module = await WASM_MODULE;
        if (!this.instance) {
            this.instance = new module.PerspectiveViewerElement(this);
        }
    }

    /**
     * Part of the Custom Elements API.  This method is called by the browser,
     * and should not be called directly by applications.
     *
     * @ignore
     */
    async connectedCallback(): Promise<void> {
        await this.load_wasm();
        this.instance.connected_callback();
    }

    /**
     * Register a new plugin via its custom element name.  This method is called
     * automatically as a side effect of importing a plugin module, so this
     * method should only typically be called by plugin authors.
     *
     * @category Plugin
     * @param name The `name` of the custom element to register, as supplied
     * to the `customElements.define(name)` method.
     * @example
     * ```javascript
     * customElements.get("perspective-viewer").registerPlugin("my-plugin");
     * ```
     */
    static async registerPlugin(name: string): Promise<void> {
        const module = await WASM_MODULE;
        module.register_plugin(name);
    }

    /**
     * Load a `perspective.Table`.  If `load` or `update` have already been
     * called on this element, its internal `perspective.Table` will _not_ be
     * deleted, but it will bed de-referenced by this `<perspective-viewer>`.
     *
     * @category Data
     * @param data A `Promise` which resolves to the `perspective.Table`
     * @returns {Promise<void>} A promise which resolves once the data is
     * loaded, a `perspective.View` has been created, and the active plugin has
     * rendered.
     * @example <caption>Load perspective.table</caption>
     * ```javascript
     * const my_viewer = document.getElementById('#my_viewer');
     * const tbl = perspective.table("x,y\n1,a\n2,b");
     * my_viewer.load(tbl);
     * ```
     * @example <caption>Load Promise<perspective.table></caption>
     * ```javascript
     * const my_viewer = document.getElementById('#my_viewer');
     * const tbl = perspective.table("x,y\n1,a\n2,b");
     * my_viewer.load(tbl);
     * ```
     */
    async load(
        table: Promise<perspective.Table> | perspective.Table
    ): Promise<void> {
        await this.load_wasm();
        await this.instance.js_load(table);
    }

    /**
     * Redraw this `<perspective-viewer>` and plugin when its dimensions or
     * visibility have been updated.  This method _must_ be called in these
     * cases, and will not by default respond to dimension or style changes to
     * its parent container.  `notifyResize()` does not recalculate the current
     * `View`, but all plugins will re-request the data window (which itself
     * may be smaller or larger due to resize).
     *
     * @category Util
     * @returns A `Promise<void>` which resolves when this resize event has
     * finished rendering.
     * @example <caption>Bind `notfyResize()` to browser dimensions</caption>
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * window.addEventListener("resize", () => viewer.notifyResize());
     * ```
     */
    async notifyResize(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_resize();
    }

    /**
     * Returns the `perspective.Table()` which was supplied to `load()`.  If
     * `load()` has been called but the supplied `Promise<perspective.Table>`
     * has not resolved, `getTable()` will `await`;  if `load()` has not yet
     * been called, an `Error` will be thrown.
     *
     * @category Data
     * @returns A `Promise` which resolves to a `perspective.Table`
     * @example <caption>Share a `Table`</caption>
     * ```javascript
     * const viewers = document.querySelectorAll("perspective-viewer");
     * const [viewer1, viewer2] = Array.from(viewers);
     * const table = await viewer1.getTable();
     * await viewer2.load(table);
     * ```
     */
    async getTable(): Promise<perspective.Table> {
        await this.load_wasm();
        const table = await this.instance.js_get_table();
        return table;
    }

    /**
     * Restore this element to a state as generated by a reciprocal call to
     * `save`.  In `json` (default) format, `PerspectiveViewerConfig`'s fields
     * have specific semantics:
     *
     *  - When a key is missing, this field is ignored;  `<perspective-viewer>`
     *    will maintain whatever settings for this field is currently applied.
     *  - When the key is supplied, but the value is `undefined`, the field is
     *    reset to its default value for this current `View`, i.e. the state it
     *    would be in after `load()` resolves.
     *  - When the key is defined to a value, the value is applied for this
     *    field.
     *
     * This behavior is convenient for explicitly controlling current vs desired
     * UI state in a single request, but it does make it a bit inconvenient to
     * use `restore()` to reset a `<perspective-viewer>` to default as you must
     * do so explicitly for each key;  for this case, use `reset()` instead of
     * restore.
     *
     * As noted in `save()`, this configuration state does not include the
     * `Table` or its `Schema`.  In order for `restore()` to work correctly, it
     * must be called on a `<perspective-viewer>` that has a `Table already
     * `load()`-ed, with the same (or a type-compatible superset) `Schema`.
     * It does not need have the same rows, or even be populated.
     *
     * @category Persistence
     * @param config returned by `save()`.  This can be any format returned by
     * `save()`; the specific deserialization is chosen by `typeof config`.
     * @returns A promise which resolves when the changes have been applied and
     * rendered.
     * @example <caption>Restore a viewer from `localStorage`</caption>
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * const token = localStorage.getItem("viewer_state");
     * await viewer.restore(token);
     * ```
     */
    async restore(
        config: PerspectiveViewerConfig | string | ArrayBuffer
    ): Promise<void> {
        await this.load_wasm();
        await this.instance.js_restore(config);
    }

    /**
     * Serialize this element's attribute/interaction state, but _not_ the
     * `perspective.Table` or its `Schema`.  `save()` is designed to be used in
     * conjunction with `restore()` to persist user settings and bookmarks, but
     * the `PerspectiveViewerConfig` object returned in `json` format can also
     * be written by hand quite easily, which is useful for authoring
     * pre-conceived configs.
     *
     * @category Persistence
     * @param format The serialization format - `json` (JavaScript object),
     * `arraybuffer` or `string`.  `restore()` uses the returned config's type
     * to infer format.
     * @returns a serialized element in the chosen format.
     * @example <caption>Save a viewer to `localStorage`</caption>
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * const token = await viewer.save("string");
     * localStorage.setItem("viewer_state", token);
     * ```
     */
    async save(): Promise<PerspectiveViewerConfig>;
    async save(format: "json"): Promise<PerspectiveViewerConfig>;
    async save(format: "arraybuffer"): Promise<ArrayBuffer>;
    async save(format: "string"): Promise<string>;
    async save(
        format?: "json" | "arraybuffer" | "string"
    ): Promise<PerspectiveViewerConfig | string | ArrayBuffer> {
        await this.load_wasm();
        const config = await this.instance.js_save(format);
        return config;
    }

    /**
     * Flush any pending modifications to this `<perspective-viewer>`.  Since
     * `<perspective-viewer>`'s API is almost entirely `async`, it may take
     * some milliseconds before any method call such as `restore()` affects
     * the rendered element.  If you want to make sure any invoked method which
     * affects the rendered has had its results rendered, call and await
     * `flush()`
     *
     * @category Util
     * @returns {Promise<void>} A promise which resolves when the current
     * pending state changes have been applied and rendered.
     * @example <caption>Flush an unawaited `restore()`</caption>
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * viewer.restore({row_pivots: ["State"]});
     * await viewer.flush();
     * console.log("Viewer has been rendered with a pivot!");
     * ```
     */
    async flush(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_flush();
    }

    /**
     * Reset's this element's view state and attributes to default.  Does not
     * delete this element's `perspective.table` or otherwise modify the data
     * state.
     *
     * @category Persistence
     * @example
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * await viewer.reset();
     * ```
     */
    async reset(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_reset();
    }

    /**
     * Deletes this element and clears it's internal state (but not its
     * user state).  This (or the underlying `perspective.view`'s equivalent
     * method) must be called in order for its memory to be reclaimed, as well
     * as the reciprocal method on the `perspective.table` which this viewer is
     * bound to.
     *
     * @category Util
     */
    async delete(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_delete();
    }

    /**
     * Download this element's data as a CSV file.
     *
     * @category UI Action
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
     * @category UI Action
     * @param flat Whether to use the element's current view
     * config, or to use a default "flat" view.
     * @example
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * const button = document.querySelector("button");
     * button.addEventListener("click", async () => {
     *     await viewer.copy();
     * });
     * ```
     */
    async copy(flat: boolean): Promise<void> {
        await this.load_wasm();
        await this.instance.js_copy(flat);
    }

    /**
     * Restyles the elements and to pick up any style changes.  While most of
     * perspective styling is plain CSS and can be updated at any time, some
     * CSS rules are read and cached, e.g. the series colors for
     * `@finos/perspective-viewer-d3fc` which are read from CSS then reapplied
     * as SVG and Canvas attributes.
     *
     * @category Util
     */
    async restyleElement(): Promise<void> {
        await this.load_wasm();
        await this.instance.js_restyle_element();
    }

    /**
     * Gets the edit port, the port number for which `Table` updates from this
     * `<perspective-viewer>` are generated.  This port number will be present
     * in the options object for a `View.on_update()` callback for any update
     * which was originated by the `<perspective-viewer>`/user, which can be
     * used to distinguish server-originated updates from user edits.
     *
     * @category Util
     * @returns A promise which resolves to the current edit port.
     * @example
     * ```javascript
     * const viewer = document.querySelector("perspective-viewer");
     * const editport = await viewer.getEditPort();
     * const table = await viewer.getTable();
     * const view = await table.view();
     * view.on_update(obj => {
     *     if (obj.port_id = editport) {
     *         console.log("User edit detected");
     *     }
     * });
     * ```
     */
    async getEditPort(): Promise<number> {
        await this.load_wasm();
        const port = await this.instance.js_get_edit_port();
        return port;
    }

    /**
     * Determines the render throttling behavior. Can be an integer, for
     * millisecond window to throttle render event; or, if `undefined`,
     * will try to determine the optimal throttle time from this component's
     * render framerate.
     *
     * @category Util
     * @param value an optional throttle rate in milliseconds (integer).  If not
     * supplied, adaptive throttling is calculated from the average plugin
     * render time.
     * @example <caption>Limit FPS to 1 frame per second</caption>
     * ```javascript
     * await viewer.setThrottle(1000);
     * ```
     */
    async setThrottle(value?: number): Promise<void> {
        await this.load_wasm();
        await this.instance.js_set_throttle(value);
    }

    /**
     * Opens/closes the element's config menu, equivalent to clicking the
     * settings button in the UI.  This method is equivalent to
     * `viewer.restore({settings: force})` when `force` is present, but
     * `restore()` cannot toggle as `toggleConfig()` can, you would need to
     * first read the settings state from `save()` otherwise.
     *
     * Calling `toggleConfig()` may be delayed if an async render is currently
     * in process, and it may only partially render the UI if `load()` has not
     * yet resolved.
     *
     * @category UI Action
     * @param force If supplied, explicitly set the config state to "open"
     * (`true`) or "closed" (`false`).
     * @example
     * ```javascript
     * await viewer.toggleConfig();
     * ```
     */
    async toggleConfig(force?: boolean): Promise<void> {
        await this.load_wasm();
        await this.instance.js_toggle_config(force);
    }

    /**
     * Get the currently active plugin custom element instance, or a specific
     * named instance if requested.  `getPlugin(name)` does not activate the
     * plugin requested, so if this plugin is not active the returned
     * `HTMLElement` will not have a `parentElement`.
     *
     * If no plugins have been registered (via `registerPlugin()`), calling
     * `getPlugin()` will cause `perspective-viewer-plugin` to be registered as
     * a side effect.
     *
     * @category Plugin
     * @param name Optionally a specific plugin name, defaulting to the current
     * active plugin.
     * @returns The active or requested plugin instance.
     */
    async getPlugin(name?: string): Promise<HTMLElement> {
        await this.load_wasm();
        const plugin = await this.instance.js_get_plugin(name);
        return plugin;
    }

    /**
     * Get all plugin custom element instances, in order of registration.
     *
     * If no plugins have been registered (via `registerPlugin()`), calling
     * `getAllPlugins()` will cause `perspective-viewer-plugin` to be registered
     * as a side effect.
     *
     * @category Plugin
     * @returns An `Array` of the plugin instances for this
     * `<perspective-viewer>`.
     */
    async getAllPlugins(): Promise<Array<HTMLElement>> {
        await this.load_wasm();
        const plugins = await this.instance.js_get_all_plugins();
        return plugins;
    }
}

if (document.createElement("perspective-viewer").constructor === HTMLElement) {
    window.customElements.define(
        "perspective-viewer",
        PerspectiveViewerElement
    );
}
