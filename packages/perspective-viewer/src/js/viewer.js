/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@webcomponents/webcomponentsjs";
import "./polyfill.js";

import {bindTemplate, json_attribute, array_attribute, copy_to_clipboard, throttlePromise} from "./utils.js";
import {renderers, register_debug_plugin} from "./viewer/renderers.js";
import {COMPUTATIONS} from "./computed_column.js";
import "./row.js";

import template from "../html/viewer.html";

import view_style from "../less/viewer.less";
import default_style from "../less/default.less";

import {ActionElement} from "./viewer/action_element.js";

/**
 * Module for `<perspective-viewer>` custom element.  There are no exports from
 * this module, however importing it has a side effect:  the
 * {@link module:perspective_viewer~PerspectiveViewer} class is registered as a
 * custom element, after which it can be used as a standard DOM element.  The
 * documentation in this module defines the instance structure of a
 * `<perspective-viewer>` DOM object instantiated typically, through HTML or any
 * relevent DOM method e.g. `document.createElement("perspective-viewer")` or
 * `document.getElementsByTagName("perspective-viewer")`.
 *
 * @module perspective-viewer
 */

const PERSISTENT_ATTRIBUTES = ["selectable", "editable", "plugin", "row-pivots", "column-pivots", "aggregates", "filters", "sort", "computed-columns", "columns"];

/**
 * HTMLElement class for `<perspective-viewer>` custom element.  This class is
 * not exported, so this constructor cannot be invoked in the typical manner;
 * instead, instances of the class are created through the Custom Elements DOM
 * API.
 *
 * Properties of an instance of this class, such as
 * {@link module:perspective_viewer~PerspectiveViewer#columns}, are reflected on
 * the DOM element as Attributes, and should be accessed as such - e.g.
 * `instance.setAttribute("columns", JSON.stringify(["a", "b"]))`.
 *
 * @class PerspectiveViewer
 * @extends {HTMLElement}
 * @example
 * // Create a new `<perspective-viewer>`
 * const elem = document.createElement("perspective-viewer");
 * elem.setAttribute("columns", JSON.stringify(["a", "b"]));
 * document.body.appendChild(elem);
 *
 */
@bindTemplate(template, view_style, default_style) // eslint-disable-next-line no-unused-vars
class PerspectiveViewer extends ActionElement {
    constructor() {
        super();
        this._register_debounce_instance();
        this._show_config = true;
        this._show_warnings = true;
        this.__render_times = [];
        this._resize_handler = this.notifyResize.bind(this);
        window.addEventListener("resize", this._resize_handler);
    }

    connectedCallback() {
        if (Object.keys(renderers.getInstance()).length === 0) {
            register_debug_plugin();
        }

        this.toggleAttribute("settings", true);

        this._register_ids();
        this._register_callbacks();
        this._register_view_options();
        this._register_data_attribute();
        this.toggleConfig();
        this._check_loaded_table();
    }

    /**
     * Sets this `perspective.table.view`'s `sort` property, an array of column
     * names.
     *
     * @kind member
     * @type {array<string>} Array of arrays tuples of column name and
     * direction, where the possible values are "asc", "desc", "asc abs", "desc
     * abs" and "none".
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('sort', JSON.stringify([["x","desc"]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer sort='[["x","desc"]]'></perspective-viewer>
     */
    @array_attribute
    sort(sort) {
        if (sort === null || sort === undefined || sort.length === 0) {
            if (this.hasAttribute("sort")) {
                this.removeAttribute("sort");
            }
            sort = [];
        }
        var inner = this._sort.querySelector("ul");
        this._update_column_list(
            sort,
            inner,
            s => {
                let dir = "asc";
                if (Array.isArray(s)) {
                    dir = s[1];
                    s = s[0];
                }
                return this._new_row(s, false, false, false, dir);
            },
            (sort, node) => {
                if (Array.isArray(sort)) {
                    return node.getAttribute("name") === sort[0] && node.getAttribute("sort-order") === sort[1];
                }
                return node.getAttribute("name") === sort;
            }
        );
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * The set of visible columns.
     *
     * @kind member
     * @param {array} columns An array of strings, the names of visible columns.
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('columns', JSON.stringify(["x", "y'"]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer columns='["x", "y"]'></perspective-viewer>
     */
    @array_attribute
    columns(show) {
        if (show === null || show === undefined || show.length === 0) {
            if (this.hasAttribute("columns")) {
                if (this._initial_col_order) {
                    this.setAttribute("columns", JSON.stringify(this._initial_col_order));
                } else {
                    this.removeAttribute("columns");
                }
            }
            show = (this._initial_col_order || []).slice();
        }
        this._update_column_view(show, true);
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /* eslint-disable max-len */

    /**
     * The set of visible columns.
     *
     * @kind member
     * @param {array} computed-columns An array of computed column objects
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('computed-columns', JSON.stringify([{name: "x+y", func: "add", inputs: ["x", "y"]}]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer computed-columns="[{name:'x+y',func:'add',inputs:['x','y']}]""></perspective-viewer>
     */
    @array_attribute
    "computed-columns"(computed_columns) {
        if (computed_columns === null || computed_columns === undefined || computed_columns.length === 0) {
            if (this.hasAttribute("computed-columns")) {
                this.removeAttribute("computed-columns");
            }
            computed_columns = [];
        }
        const resolve = this._set_updating();
        this._computed_column._close_computed_column();
        (async () => {
            if (this._table) {
                for (let col of computed_columns) {
                    await this._create_computed_column({
                        detail: {
                            column_name: col.name,
                            input_columns: col.inputs.map(x => ({name: x})),
                            computation: COMPUTATIONS[col.func]
                        }
                    });
                }
                await this._debounce_update();
                resolve();
            }
            this.dispatchEvent(new Event("perspective-config-update"));
            this.dispatchEvent(new Event("perspective-computed-column-update"));
        })();
    }

    /* eslint-enable max-len */

    /**
     * The set of column aggregate configurations.
     *
     * @kind member
     * @param {object} aggregates A dictionary whose keys are column names, and
     * values are valid aggregations.  The `aggergates` attribute works as an
     * override;  in lieu of a key for a column supplied by the developers, a
     * default will be selected and reflected to the attribute based on the
     * column's type.  See {@link perspective/src/js/defaults.js}
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('aggregates', JSON.stringify({x: "distinct count"}));
     * @example <caption>via HTML</caption>
     * <perspective-viewer aggregates='{"x": "distinct count"}'>
     * </perspective-viewer>
     */
    @json_attribute
    aggregates(show) {
        if (show === null || show === undefined || Object.keys(show).length === 0) {
            if (this.hasAttribute("aggregates")) {
                this.removeAttribute("aggregates");
            }
            show = {};
        }

        let lis = this._get_view_dom_columns();
        lis.map(x => {
            let agg = show[x.getAttribute("name")];
            if (agg) {
                x.setAttribute("aggregate", Array.isArray(agg) ? JSON.stringify(agg) : agg);
            }
        });
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * The set of column filter configurations.
     *
     * @kind member
     * @type {array} filters An arry of filter config objects.  A filter config
     * object is an array of three elements: * The column name. * The filter
     * operation as a string.  See
     * {@link perspective/src/js/config/constants.js} * The filter argument, as
     * a string, float or Array<string> as the filter operation demands.
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let filters = [
     *     ["x", "<", 3],
     *     ["y", "contains", "abc"]
     * ];
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('filters', JSON.stringify(filters));
     * @example <caption>via HTML</caption>
     * <perspective-viewer filters='[["x", "<", 3], ["y", "contains", "abc"]]'>
     * </perspective-viewer>
     */
    @array_attribute
    filters(filters) {
        if (filters === null || filters === undefined || filters.length === 0) {
            if (this.hasAttribute("filters")) {
                this.removeAttribute("filters");
            }
            filters = [];
        }
        if (!this._updating_filter) {
            var inner = this._filters.querySelector("ul");
            this._update_column_list(
                filters,
                inner,
                filter => {
                    const fterms = JSON.stringify({
                        operator: filter[1],
                        operand: filter[2]
                    });
                    return this._new_row(filter[0], undefined, undefined, fterms);
                },
                (filter, node) =>
                    node.getAttribute("name") === filter[0] &&
                    node.getAttribute("filter") ===
                        JSON.stringify({
                            operator: filter[1],
                            operand: filter[2]
                        })
            );
        }
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * Sets the currently selected plugin, via its `name` field.
     *
     * @type {string}
     * @fires PerspectiveViewer#perspective-config-update
     */
    set plugin(v) {
        if (v === "null" || v === null || v === undefined) {
            this.setAttribute("plugin", this._vis_selector.options[0].value);
            return;
        }

        const plugin_names = Object.keys(renderers.getInstance());
        if (this.hasAttribute("plugin")) {
            let plugin = this.getAttribute("plugin");
            if (plugin_names.indexOf(plugin) === -1) {
                const guess_plugin = plugin_names.find(x => x.indexOf(plugin) > -1);
                if (guess_plugin) {
                    console.warn(`Unknown plugin "${plugin}", using "${guess_plugin}"`);
                    this.setAttribute("plugin", guess_plugin);
                } else {
                    console.error(`Unknown plugin "${plugin}"`);
                    this.setAttribute("plugin", this._vis_selector.options[0].value);
                }
            } else {
                if (this._vis_selector.value !== plugin) {
                    this._vis_selector.value = plugin;
                    this._vis_selector_changed();
                }
                this._set_row_styles();
                this._set_column_defaults();
                this.dispatchEvent(new Event("perspective-config-update"));
            }
        } else {
            this.setAttribute("plugin", this._vis_selector.options[0].value);
        }
    }

    /**
     * Sets this `perspective.table.view`'s `column_pivots` property.
     *
     * @kind member
     * @type {Array<String>} Array of column names
     * @fires PerspectiveViewer#perspective-config-update
     */
    @array_attribute
    "column-pivots"(pivots) {
        if (pivots === null || pivots === undefined || pivots.length === 0) {
            if (this.hasAttribute("column-pivots")) {
                this.removeAttribute("column-pivots");
            }
            pivots = [];
        }

        var inner = this._column_pivots.querySelector("ul");
        this._update_column_list(pivots, inner, pivot => this._new_row(pivot));
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * Sets this `perspective.table.view`'s `row_pivots` property.
     *
     * @kind member
     * @type {array<string>} Array of column names
     * @fires PerspectiveViewer#perspective-config-update
     */
    @array_attribute
    "row-pivots"(pivots) {
        if (pivots === null || pivots === undefined || pivots.length === 0) {
            if (this.hasAttribute("row-pivots")) {
                this.removeAttribute("row-pivots");
            }
            pivots = [];
        }

        var inner = this._row_pivots.querySelector("ul");
        this._update_column_list(pivots, inner, pivot => this._new_row(pivot));
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * Determines whether this viewer is editable or not (though it is
     * ultimately up to the plugin as to whether editing is implemented).
     *
     * @kind member
     * @type {boolean} Is this viewer editable?
     * @fires PerspectiveViewer#perspective-config-update
     */
    set editable(x) {
        if (x === "null") {
            if (this.hasAttribute("editable")) {
                this.removeAttribute("editable");
            }
        } else {
            this.toggleAttribute("editable", true);
        }
        this._debounce_update({force_update: true});
        this.dispatchEvent(new Event("perspective-config-update"));
    }

    /**
     * Determines the render throttling behavior.  Can be an integer, for
     * millisecond window to throttle render event;  or, if `undefined`,
     * will try to determine the optimal throttle time from this component's
     * render framerate.
     *
     * @kind member
     * @type {integer|string} The throttle rate - milliseconds (integer), or the
     * enum "adaptive" for a dynamic throttle based on render time.
     * @example
     * <!-- Only draws at most 1 frame/sec. -->
     * <perspective-viewer throttle="1000"></perspective-viewer>
     */
    set throttle(x) {
        if (x === "null") {
            if (this.hasAttribute("throttle")) {
                this.removeAttribute("throttle");
            }
        }
        // Returns the throttle time, but also perform validaiton - we only want
        // the latter here.
        this._calculate_throttle_timeout();
    }

    /*
     * Determines whether row selections is enabled on this viewer (though it is
     * ultimately up to the plugin as to whether selectable is implemented).
     *
     * @kind member
     * @type {boolean} Is this viewer editable?
     * @fires PerspectiveViewer#perspective-config-update
     */
    set selectable(x) {
        if (x === "null") {
            if (this.hasAttribute("selectable")) {
                this.removeAttribute("selectable");
            }
        } else {
            this.toggleAttribute("selectable", true);
        }
        this._debounce_update({force_update: true});
        this.dispatchEvent(new Event("perspective-config-update"));
    }

    /**
     * This element's `perspective` worker instance.  This property is not
     * reflected as an HTML attribute, and is readonly;  it can be effectively
     * set however by calling the `load() method with a `perspective.table`
     * instance from the preferred worker.
     *
     * @readonly
     * @example
     * let elem = document.getElementById('my_viewer');
     * let table = elem.worker.table([{x:1, y:2}]);
     * elem.load(table);
     */
    get worker() {
        return this._get_worker();
    }

    /**
     * This element's `perspective.table` instance.
     *
     * @readonly
     */
    get table() {
        return this._table;
    }

    /**
     * This element's `perspective.table.view` instance.  The instance itself
     * will change after every `PerspectiveViewer#perspective-config-update`
     * event.
     *
     * @readonly
     */
    get view() {
        return this._view;
    }

    /**
     * Load data.  If `load` or `update` have already been called on this
     * element, its internal `perspective.table` will also be deleted.
     *
     * @param {any} data The data to load.  Works with the same input types
     * supported by `perspective.table`.
     * @returns {Promise<void>} A promise which resolves once the data is loaded
     * and a `perspective.view` has been created.
     * @fires module:perspective_viewer~PerspectiveViewer#perspective-click
     * PerspectiveViewer#perspective-view-update
     * ]);
     * @example <caption>Load CSV</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * my_viewer.load("x,y\n1,a\n2,b");
     * @example <caption>Load perspective.table</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * const tbl = perspective.table("x,y\n1,a\n2,b");
     * my_viewer.load(tbl);
     */
    load(data, options) {
        try {
            data = data.trim();
        } catch (e) {}
        let table;
        if (data.hasOwnProperty("_name") && data.type === "table") {
            table = data;
        } else {
            table = this.worker.table(data, options);
            table._owner_viewer = this;
        }
        if (this.isConnected) {
            return this._load_table(table);
        } else {
            this._table = table;
        }
    }

    /**
     * Updates this element's `perspective.table` with new data.
     *
     * @param {any} data The data to load.  Works with the same input types
     * supported by `perspective.table.update`.
     * @fires PerspectiveViewer#perspective-view-update
     * @example
     * const my_viewer = document.getElementById('#my_viewer');
     * my_viewer.update([
     *     {x: 1, y: 'a'},
     *     {x: 2, y: 'b'}
     * ]);
     */
    update(data) {
        if (this._table === undefined) {
            this.load(data);
        } else {
            this._table.update(data);
        }
    }

    /**
     * Determine whether to reflow the viewer and redraw.
     *
     */
    @throttlePromise
    async notifyResize(immediate) {
        this._check_responsive_layout();
        if (!document.hidden && this.offsetParent) {
            await this._plugin.resize.call(this, immediate);
        }
    }

    /**
     * Duplicate an existing `<perspective-element>`, including data and view
     * settings.  The underlying `perspective.table` will be shared between both
     * elements
     *
     * @param {any} widget A `<perspective-viewer>` instance to clone.
     */
    clone(widget) {
        if (this._inner_drop_target) {
            this._inner_drop_target.innerHTML = widget._inner_drop_target.innerHTML;
        }

        this._load_table(widget.table);
        this.restore(widget.save());
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state).  This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     *
     * @param {boolean} delete_table Should a delete call also be made to the
     * underlying `table()`.
     * @returns {Promise<boolean>} Whether or not this call resulted in the
     * underlying `perspective.table` actually being deleted.
     */
    delete(delete_table = true) {
        let x = this._clear_state(delete_table);
        if (this._plugin.delete) {
            this._plugin.delete.call(this);
        }
        window.removeEventListener("load", this._resize_handler);
        window.removeEventListener("resize", this._resize_handler);
        return x;
    }

    /**
     * Restyles the elements and to pick up any style changes
     */
    restyleElement() {
        this._restyle_plugin();
    }

    /**
     * Serialize this element's attribute/interaction state.
     *
     * @returns {object} a serialized element.
     */
    save() {
        let obj = {};
        const cols = new Set(PERSISTENT_ATTRIBUTES);
        for (let key = 0; key < this.attributes.length; key++) {
            let attr = this.attributes[key];
            if (cols.has(attr.name)) {
                if (attr.value === "") {
                    obj[attr.name] = true;
                } else if (attr.name !== "plugin" && attr.value !== undefined && attr.value !== null) {
                    obj[attr.name] = JSON.parse(attr.value);
                } else {
                    obj[attr.name] = attr.value;
                }
                cols.delete(attr.name);
            }
        }
        for (const col of cols) {
            obj[col] = null;
        }
        if (this._plugin.save) {
            obj.plugin_config = this._plugin.save.call(this);
        }
        return obj;
    }

    /**
     * Restore this element to a state as generated by a reciprocal call to
     * `save` or `serialize`.
     *
     * @param {object|string} config returned by `save` or `serialize`.
     * @returns {Promise<void>} A promise which resolves when the changes have
     * been applied.
     */
    async restore(config) {
        if (typeof config === "string") {
            config = JSON.parse(config);
        }
        for (const key of PERSISTENT_ATTRIBUTES) {
            if (config.hasOwnProperty(key)) {
                let val = config[key];
                if (val === true) {
                    this.toggleAttribute(key, true);
                } else if (val !== undefined && val !== null && val !== false) {
                    if (typeof val !== "string") {
                        val = JSON.stringify(val);
                    }
                    this.setAttribute(key, val);
                } else {
                    this.removeAttribute(key);
                }
            }
        }

        if (this._plugin.restore && config.plugin_config) {
            this._plugin.restore.call(this, config.plugin_config);
        }
        await this._debounce_update();
    }

    /**
     * Flush any pending attribute modifications to this element.
     *
     * @returns {Promise<void>} A promise which resolves when the current
     * attribute state has been applied.
     */
    async flush() {
        await new Promise(setTimeout);
        while (this.hasAttribute("updating")) {
            await this._updating_promise;
        }
    }

    /**
     * Clears the rows in the current {@link table}.
     */
    clear() {
        this._table.clear();
    }

    /**
     * Replaces all rows in the current {@link table}.
     */
    replace(data) {
        this._table.replace(data);
    }

    /**
     * Reset's this element's view state and attributes to default.  Does not
     * delete this element's `perspective.table` or otherwise modify the data
     * state.
     */
    reset() {
        this.removeAttribute("row-pivots");
        this.removeAttribute("column-pivots");
        this.removeAttribute("filters");
        this.removeAttribute("sort");
        if (this._initial_col_order) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order));
        } else {
            this.removeAttribute("columns");
        }
        this.setAttribute("plugin", Object.keys(renderers.getInstance())[0]);
        this.dispatchEvent(new Event("perspective-config-update"));
        this._hide_context_menu();
    }

    /**
     * Download this element's data as a CSV file.
     *
     * @param {boolean} [flat=false] Whether to use the element's current view
     * config, or to use a default "flat" view.
     * @memberof PerspectiveViewer
     */
    async download(flat = false) {
        const view = flat ? this._table.view() : this._view;
        const csv = await view.to_csv();
        const element = document.createElement("a");
        const binStr = csv;
        const len = binStr.length;
        const arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
        }
        const blob = new Blob([arr]);
        element.setAttribute("href", URL.createObjectURL(blob));
        element.setAttribute("download", "perspective.csv");
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this._hide_context_menu();
    }

    /**
     * Copies this element's view data (as a CSV) to the clipboard.  This method
     * must be called from an event handler, subject to the browser's
     * restrictions on clipboard access.  See
     * {@link https://www.w3.org/TR/clipboard-apis/#allow-read-clipboard}.
     */
    copy(flat = false) {
        let data;
        const view = flat ? this._table.view() : this._view;
        view.to_csv()
            .then(csv => {
                data = csv;
            })
            .catch(err => {
                console.error(err);
                data = "";
            });
        let count = 0;
        let f = () => {
            if (typeof data !== "undefined") {
                copy_to_clipboard(data);
            } else if (count < 200) {
                count++;
                setTimeout(f, 50);
            } else {
                console.warn("Timeout expired - copy to clipboard cancelled.");
            }
        };
        f();
        this._hide_context_menu();
    }

    /**
     * Opens/closes the element's config menu.
     *
     * @async
     */
    async toggleConfig() {
        await this._toggle_config();
    }
}

/**
 * `perspective-click` is fired whenever underlying `view`'s grid or chart are
 * clicked providing a detail that includes a `config`, `column_names` and
 * `row`.
 *
 * @event module:perspective_viewer~PerspectiveViewer#perspective-click
 * @type {object}
 * @property {array} column_names - Includes a list of column names.
 * @property {object} config - Contains a property `filters` that can be applied
 * to a `<perspective-viewer>` through the use of `restore()` updating it to
 * show the filtered subset of data..
 * @property {array} row - Includes the data row.
 */

/**
 * `perspective-config-update` is fired whenever an configuration attribute has
 * been modified, by the user or otherwise.
 *
 * @event module:perspective_viewer~PerspectiveViewer#perspective-config-update
 * @type {string}
 */

/**
 * `perspective-view-update` is fired whenever underlying `view`'s data has
 * updated, including every invocation of `load` and `update`.
 *
 * @event module:perspective_viewer~PerspectiveViewer#perspective-view-update
 * @type {string}
 */
