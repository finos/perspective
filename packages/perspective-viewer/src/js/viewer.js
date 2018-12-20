/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@webcomponents/webcomponentsjs";
import "@webcomponents/shadycss/custom-style-interface.min.js";

import _ from "underscore";
import {polyfill} from "mobile-drag-drop";

import {bindTemplate, json_attribute, array_attribute, copy_to_clipboard} from "./utils.js";
import {renderers, register_debug_plugin} from "./viewer/renderers.js";
import {COMPUTATIONS} from "./computed_column.js";
import "./row.js";

import template from "../html/viewer.html";

import view_style from "../less/viewer.less";
import default_style from "../less/default.less";

import {ActionElement} from "./viewer/action_element.js";

polyfill({});

/**
 * HTMLElement class for `<perspective-viewer` custom element.
 *
 * @class PerspectiveViewer
 * @extends {ActionElement}
 */
@bindTemplate(template, view_style, default_style) // eslint-disable-next-line no-unused-vars
class PerspectiveViewer extends ActionElement {
    constructor() {
        super();
        this._register_debounce_instance();
        this._slaves = [];
        this._show_config = true;
        this._show_warnings = true;
        this._resize_handler = _.debounce(this.notifyResize, 250).bind(this);
        window.addEventListener("load", this._resize_handler);
        window.addEventListener("resize", this._resize_handler);
    }

    connectedCallback() {
        if (Object.keys(renderers.getInstance()).length === 0) {
            register_debug_plugin();
        }

        this.setAttribute("settings", true);

        this._register_ids();
        this._register_callbacks();
        this._register_view_options();
        this._register_data_attribute();
        this.toggleConfig();

        for (let attr of ["row-pivots", "column-pivots", "filters", "sort"]) {
            if (!this.hasAttribute(attr)) {
                this.setAttribute(attr, "[]");
            }
        }
    }

    /**
     * Sets this `perspective.table.view`'s `sort` property, an array of column
     * names.
     *
     * @name sort
     * @memberof PerspectiveViewer.prototype
     * @type {array<string>} Array of arrays tuples of column name and
     * direction, where the possible values are "asc", "desc", "asc abs",
     * "desc abs" and "none".
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('sort', JSON.stringify([["x","desc"]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer sort='[["x","desc"]]'></perspective-viewer>
     */
    @array_attribute
    set sort(sort) {
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
     * @name columns
     * @memberof PerspectiveViewer.prototype
     * @param {array} columns An array of strings, the names of visible columns.
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('columns', JSON.stringify(["x", "y'"]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer columns='["x", "y"]'></perspective-viewer>
     */
    @array_attribute
    set columns(show) {
        this._update_column_view(show, true);
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * The set of visible columns.
     *
     * @name computed-columns
     * @memberof PerspectiveViewer.prototype
     * @param {array} computed-columns An array of computed column objects
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('computed-columns', JSON.stringify([{name: "x+y", func: "add", inputs: ["x", "y"]}]));
     * @example <caption>via HTML</caption>
     * <perspective-viewer computed-columns="[{name:'x+y',func:'add',inputs:['x','y']}]""></perspective-viewer>
     */
    @array_attribute
    set "computed-columns"(computed_columns) {
        this.setAttribute("updating", true);
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
            }
            this.dispatchEvent(new Event("perspective-config-update"));
            this.dispatchEvent(new Event("perspective-computed-column-update"));
        })();
    }

    /**
     * The set of column aggregate configurations.
     *
     * @name aggregates
     * @memberof PerspectiveViewer.prototype
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
     * <perspective-viewer aggregates='{"x": "distinct count"}'></perspective-viewer>
     */
    @json_attribute
    set aggregates(show) {
        let lis = this._get_view_dom_columns();
        lis.map(x => {
            let agg = show[x.getAttribute("name")];
            if (agg) {
                x.setAttribute("aggregate", agg);
            }
        });
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * The set of column filter configurations.
     *
     * @name filters
     * @memberof PerspectiveViewer.prototype
     * @type {array} filters An arry of filter config objects.  A filter
     * config object is an array of three elements:
     *     * The column name.
     *     * The filter operation as a string.  See
     *       {@link perspective/src/js/defaults.js}
     *     * The filter argument, as a string, float or Array<string> as the
     *       filter operation demands.
     * @fires PerspectiveViewer#perspective-config-update
     * @example <caption>via Javascript DOM</caption>
     * let filters = [
     *     ["x", "<", 3],
     *     ["y", "contains", "abc"]
     * ];
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('filters', JSON.stringify(filters));
     * @example <caption>via HTML</caption>
     * <perspective-viewer filters='[["x", "<", 3], ["y", "contains", "abc"]]'></perspective-viewer>
     */
    @array_attribute
    set filters(filters) {
        if (!this._updating_filter && typeof this._table !== "undefined") {
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
    set view(v) {
        this._vis_selector.value = this.getAttribute("view");
        this._set_column_defaults();
        this.dispatchEvent(new Event("perspective-config-update"));
    }

    /**
     * Sets this `perspective.table.view`'s `column_pivots` property.
     *
     * @name column-pivots
     * @memberof PerspectiveViewer.prototype
     * @type {array<string>} Array of column names
     * @fires PerspectiveViewer#perspective-config-update
     */
    @array_attribute
    set "column-pivots"(pivots) {
        var inner = this._column_pivots.querySelector("ul");
        this._update_column_list(pivots, inner, pivot => this._new_row(pivot));
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * Sets this `perspective.table.view`'s `row_pivots` property.
     *
     * @name row-pivots
     * @memberof PerspectiveViewer.prototype
     * @type {array<string>} Array of column names
     * @fires PerspectiveViewer#perspective-config-update
     */
    @array_attribute
    set "row-pivots"(pivots) {
        var inner = this._row_pivots.querySelector("ul");
        this._update_column_list(pivots, inner, pivot => this._new_row(pivot));
        this.dispatchEvent(new Event("perspective-config-update"));
        this._debounce_update();
    }

    /**
     * When set, hide the data visualization and display the message.  Setting
     * `message` does not clear the internal `perspective.table`, but it does
     * render it hidden until the message is removed.
     *
     * @param {string} msg The message. This can be HTML - it is not sanitized.
     * @example
     * let elem = document.getElementById('my_viewer');
     * elem.setAttribute('message', '<h1>Loading</h1>');
     */
    set message(msg) {
        if (this.getAttribute("message") !== msg) {
            this.setAttribute("message", msg);
            return;
        }
        if (!this._inner_drop_target) return;
        this.shadowRoot.querySelector("#app").classList.remove("hide_message");
        this._inner_drop_target.innerHTML = msg;
        for (let slave of this._slaves) {
            slave.setAttribute("message", msg);
        }
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
     * This element's `perspective.table.view` instance.  The instance itself
     * will change after every `PerspectiveViewer#perspective-config-update` event.
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
     * @returns {Promise<void>} A promise which resolves once the data is
     * loaded and a `perspective.view` has been created.
     * @fires PerspectiveViewer#perspective-view-update
     * @example <caption>Load JSON</caption>
     * const my_viewer = document.getElementById('#my_viewer');
     * my_viewer.load([
     *     {x: 1, y: 'a'},
     *     {x: 2, y: 'b'}
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
        if (data.hasOwnProperty("_name")) {
            table = data;
        } else {
            table = this.worker.table(data, options);
            table._owner_viewer = this;
        }
        let _promises = [this._load_table(table)];
        for (let slave of this._slaves) {
            _promises.push(this._load_table.call(slave, table));
        }
        this._slaves = [];
        return Promise.all(_promises);
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
    notifyResize() {
        this._check_responsive_layout();
        if (!document.hidden && this.offsetParent) {
            this._plugin.resize.call(this);
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
        if (widget.hasAttribute("index")) {
            this.setAttribute("index", widget.getAttribute("index"));
        }
        if (this._inner_drop_target) {
            this._inner_drop_target.innerHTML = widget._inner_drop_target.innerHTML;
        }

        if (widget._table) {
            this._load_table(widget._table);
        } else {
            widget._slaves.push(this);
        }
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state).  This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     *
     * @returns {Promise<boolean>} Whether or not this call resulted in the
     * underlying `perspective.table` actually being deleted.
     */
    delete() {
        let x = this._clear_state();
        if (this._plugin.delete) {
            this._plugin.delete.call(this);
        }
        window.removeEventListener("load", this._resize_handler);
        window.removeEventListener("resize", this._resize_handler);
        return x;
    }

    /**
     * Serialize this element's attribute/interaction state.
     *
     * @returns {object} a serialized element.
     */
    save() {
        let obj = {};
        for (let key = 0; key < this.attributes.length; key++) {
            let attr = this.attributes[key];
            if (["id"].indexOf(attr.name) === -1) {
                obj[attr.name] = attr.value;
            }
        }
        return obj;
    }

    /**
     * Restore this element to a state as generated by a reciprocal call to
     * `save`.
     *
     * @param {object} x returned by `save`.
     * @returns {Promise<void>} A promise which resolves when the changes have
     * been applied.
     */
    async restore(x) {
        for (let key in x) {
            let val = x[key];
            if (typeof val !== "string") {
                val = JSON.stringify(val);
            }
            this.setAttribute(key, val);
        }
        await this._debounce_update();
    }

    /**
     * Reset's this element's view state and attributes to default.  Does not
     * delete this element's `perspective.table` or otherwise modify the data
     * state.
     *
     */
    reset() {
        this.setAttribute("row-pivots", JSON.stringify([]));
        this.setAttribute("column-pivots", JSON.stringify([]));
        this.setAttribute("filters", JSON.stringify([]));
        this.setAttribute("sort", JSON.stringify([]));
        this.removeAttribute("index");
        if (this._initial_col_order) {
            this.setAttribute("columns", JSON.stringify(this._initial_col_order || []));
        } else {
            this.removeAttribute("columns");
        }
        this.setAttribute("view", Object.keys(renderers.getInstance())[0]);
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
     */
    toggleConfig() {
        this._toggle_config();
    }
}

/**
 * `perspective-config-update` is fired whenever an configuration attribute has
 * been modified, by the user or otherwise.
 *
 * @event PerspectiveViewer#perspective-config-update
 * @type {string}
 */

/**
 * `perspective-view-update` is fired whenever underlying `view`'s data has
 * updated, including every invocation of `load` and `update`.
 *
 * @event PerspectiveViewer#perspective-view-update
 * @type {string}
 */
