/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@finos/perspective-viewer";
import {Widget} from "@lumino/widgets";
import {MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS} from "./utils";

let _increment = 0;

/**
 * Class for perspective lumino widget.
 *
 * @class PerspectiveWidget (name) TODO: document
 */
export class PerspectiveWidget extends Widget {
    constructor(name = "Perspective", options = {}) {
        super({
            node: options.bindto || document.createElement("div"),
        });
        this._viewer = PerspectiveWidget.createNode(this.node);
        this.title.label = name;
        this.title.caption = `${name}`;
        this.id = `${name}-` + _increment;
        _increment += 1;
        this._set_attributes(options);
    }

    /**
     * Apply user-provided options to the widget.
     *
     * @param options
     */

    _set_attributes(options) {
        const plugin = options.plugin || "datagrid";
        const columns = options.columns || [];
        const row_pivots = options.row_pivots || options.row_pivots || [];
        const column_pivots =
            options.column_pivots || options.column_pivots || [];
        const aggregates = options.aggregates || {};
        const sort = options.sort || [];
        const filter = options.filter || [];
        const expressions = options.expressions || options.expressions || [];
        const plugin_config = options.plugin_config || {};
        const theme = options.theme || "Material Light";
        const settings =
            typeof options.settings === "boolean" ? options.settings : true;
        const editable = options.editable || false;
        const server = options.server || false;
        const client = options.client || false;
        // const selectable: boolean = options.selectable || false;
        this.server = server;
        this.client = client;
        this.editable = editable;
        this._viewer_config = {
            plugin,
            plugin_config,
            row_pivots,
            column_pivots,
            sort,
            columns,
            aggregates,
            expressions,
            filter,
            settings,
            theme,
        };
        // this.plugin_config = plugin_config;
        // this.selectable = selectable;
    }

    /**********************/
    /* Lumino Overrides */
    /**********************/
    /**
     * Lumino: after visible
     *
     */

    onAfterShow(msg) {
        this.viewer.notifyResize(true);
        super.onAfterShow(msg);
    }

    onActivateRequest(msg) {
        if (this.isAttached) {
            this.viewer.focus();
        }
        super.onActivateRequest(msg);
    }

    async toggleConfig() {
        await this.viewer.toggleConfig();
    }

    async save() {
        return await this.viewer.save();
    }

    async restore(config) {
        return await this.viewer.restore(config);
    }

    /**
     * Load a `perspective.table` into the viewer.
     *
     * @param table A `perspective.table` object.
     */

    async load(table) {
        this.viewer.load(table);
        await this.viewer.restore(this._viewer_config);
    }

    /**
     * Update the viewer with new data.
     *
     * @param data
     */

    async _update(data) {
        const table = await this.viewer.getTable(true);
        await table.update(data);
    }

    /**
     * Removes all rows from the viewer's table. Does not reset viewer state.
     */

    async clear() {
        const table = await this.viewer.getTable(true);
        await table.clear();
    }

    /**
     * Replaces the data of the viewer's table with new data. New data must
     * conform to the schema of the Table.
     *
     * @param data
     */

    async replace(data) {
        const table = await this.viewer.getTable(true);
        await table.replace(data);
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state). This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     */

    delete() {
        this.viewer.delete();
    }

    /**
     * Returns a promise that resolves to the element's edit port ID, used
     * internally when edits are made using datagrid in client/server mode.
     */

    async getEditPort() {
        return await this.viewer.getEditPort();
    }

    async getTable() {
        return await this.viewer.getTable();
    }

    /***************************************************************************
     *
     * Getters
     *
     */
    /**
     * Returns the underlying `PerspectiveViewer` instance.
     *
     * @returns {PerspectiveViewer} The widget's viewer instance.
     */

    get viewer() {
        return this._viewer;
    }

    /**
     * Returns the name of the widget.
     *
     * @returns {string} the widget name - "Perspective" if not set by the user.
     */

    get name() {
        return this.title.label;
    }

    // `plugin_config` cannot be synchronously read from the viewer, as it is
    // not part of the attribute API and only emitted from save(). Users can
    // pass in a plugin config and have it applied to the viewer, but they
    // cannot read the current `plugin_config` of the viewer if it has not
    // already been set from Python.

    get plugin_config() {
        return this._plugin_config;
    }

    set plugin_config(plugin_config) {
        this._plugin_config = plugin_config;

        // Allow plugin configs passed from Python to take effect on the viewer
        if (this._plugin_config) {
            this.viewer.restore({
                plugin_config: this._plugin_config,
            });
        }
    }

    /**
     * True if the widget is in client-only mode, i.e. the browser has ownership
     * of the widget's data.
     */

    get client() {
        return this._client;
    }

    set client(client) {
        this._client = client;
    }

    /**
     * True if the widget is in server-only mode, i.e. the Python backend has
     * full ownership of the widget's data, and the widget does not have a
     * `perspective.Table` of its own.
     */

    get server() {
        return this._server;
    }

    set server(server) {
        this._server = server;
    }

    get editable() {
        return this._editable;
    }

    set editable(editable) {
        this._editable = editable;
        if (this._editable) {
            this.viewer.setAttribute("editable", "");
        } else {
            this.viewer.removeAttribute("editable");
        }
    }

    get selectable() {
        return this.viewer.hasAttribute("selectable");
    }

    set selectable(row_selection) {
        if (row_selection) {
            this.viewer.setAttribute("selectable", "");
        } else {
            this.viewer.removeAttribute("selectable");
        }
    }

    static createNode(node) {
        node.classList.add("p-Widget");
        node.classList.add(PSP_CONTAINER_CLASS);
        const viewer = document.createElement("perspective-viewer");
        viewer.classList.add(PSP_CLASS);
        viewer.setAttribute("type", MIME_TYPE);
        while (node.lastChild) {
            node.removeChild(node.lastChild);
        }

        node.appendChild(viewer);

        // allow perspective's event handlers to do their work
        viewer.addEventListener(
            "contextmenu",
            (event) => event.stopPropagation(),
            false
        );

        const div = document.createElement("div");
        div.style.setProperty("display", "flex");
        div.style.setProperty("flex-direction", "row");
        node.appendChild(div);
        viewer.toggleConfig(true);

        return viewer;
    }
}
