/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@finos/perspective-viewer";

import {Table, TableData, Aggregate, Sort, Expression, Filter, ColumnName} from "@finos/perspective";
import {Message} from "@lumino/messaging";
import {Widget} from "@lumino/widgets";
import {MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS, PSP_CONTAINER_CLASS_DARK} from "./utils";

import {PerspectiveViewerElement, PerspectiveViewerConfig} from "@finos/perspective-viewer";

let _increment = 0;

export interface PerspectiveWidgetOptions extends PerspectiveViewerConfig {
    dark?: boolean;
    client?: boolean;
    server?: boolean;
    title?: string;
    bindto?: HTMLElement;

    // these shouldn't exist, PerspectiveViewerOptions should be sufficient e.g.
    // ["row-pivots"]
    column_pivots?: Array<ColumnName>;
    row_pivots?: Array<ColumnName>;
    expressions?: Array<Expression>;
    editable?: boolean;
}

/**
 * Class for perspective lumino widget.
 *
 * @class PerspectiveWidget (name) TODO: document
 */
export class PerspectiveWidget extends Widget {
    constructor(name = "Perspective", options: PerspectiveWidgetOptions = {}) {
        super({node: options.bindto || document.createElement("div")});
        this._viewer = PerspectiveWidget.createNode(this.node as HTMLDivElement);

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
    _set_attributes(options: PerspectiveViewerConfig & PerspectiveWidgetOptions): void {
        const plugin: string = options.plugin || "datagrid";
        const columns: ColumnName[] = options.columns || [];
        const row_pivots: ColumnName[] = options.row_pivots || options.row_pivots || [];
        const column_pivots: ColumnName[] = options.column_pivots || options.column_pivots || [];
        const aggregates: {[column: string]: Aggregate} = options.aggregates || {};
        const sort: Sort[] = options.sort || [];
        const filter: Filter[] = options.filter || [];
        const expressions: Expression[] = options.expressions || options.expressions || [];
        const plugin_config: object = options.plugin_config || {};
        const dark: boolean = options.dark || false;
        const editable: boolean = options.editable || false;
        const server: boolean = options.server || false;
        const client: boolean = options.client || false;
        // const selectable: boolean = options.selectable || false;

        this.server = server;
        this.client = client;
        this.dark = dark;
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
            filter
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
    onAfterShow(msg: Message): void {
        this.notifyResize();
        super.onAfterShow(msg);
    }

    /**
     * Lumino: widget resize
     *
     */
    onResize(msg: Widget.ResizeMessage): void {
        this.notifyResize();
        super.onResize(msg);
    }

    protected onActivateRequest(msg: Message): void {
        if (this.isAttached) {
            this.viewer.focus();
        }
        super.onActivateRequest(msg);
    }

    async notifyResize(): Promise<void> {
        await this.viewer.notifyResize();
    }

    async toggleConfig(): Promise<void> {
        await this.viewer.toggleConfig();
    }

    async save(): Promise<PerspectiveViewerConfig> {
        return await this.viewer.save();
    }

    async restore(config: PerspectiveViewerConfig): Promise<void> {
        return await this.viewer.restore(config);
    }

    /**
     * Load a `perspective.table` into the viewer.
     *
     * @param table A `perspective.table` object.
     */
    async load(table: Promise<Table>): Promise<void> {
        this.viewer.load(table);
        await this.viewer.restore(this._viewer_config);
    }

    /**
     * Update the viewer with new data.
     *
     * @param data
     */
    async _update(data: TableData): Promise<void> {
        const table = await this.viewer.getTable();
        await table.update(data);
    }

    /**
     * Removes all rows from the viewer's table. Does not reset viewer state.
     */
    async clear(): Promise<void> {
        const table = await this.viewer.getTable();
        await table.clear();
    }

    /**
     * Replaces the data of the viewer's table with new data. New data must
     * conform to the schema of the Table.
     *
     * @param data
     */
    async replace(data: TableData): Promise<void> {
        const table = await this.viewer.getTable();
        await table.replace(data);
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state). This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     */
    delete(): void {
        this.viewer.delete();
    }

    /**
     * Returns a promise that resolves to the element's edit port ID, used
     * internally when edits are made using datagrid in client/server mode.
     */
    async getEditPort(): Promise<number> {
        return await this.viewer.getEditPort();
    }

    async getTable(): Promise<Table> {
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
    get viewer(): PerspectiveViewerElement {
        return this._viewer;
    }

    /**
     * Returns the name of the widget.
     *
     * @returns {string} the widget name - "Perspective" if not set by the user.
     */
    get name(): string {
        return this.title.label;
    }

    // `plugin_config` cannot be synchronously read from the viewer, as it is
    // not part of the attribute API and only emitted from save(). Users can
    // pass in a plugin config and have it applied to the viewer, but they
    // cannot read the current `plugin_config` of the viewer if it has not
    // already been set from Python.
    get plugin_config(): object {
        return this._plugin_config;
    }
    set plugin_config(plugin_config: object) {
        this._plugin_config = plugin_config;

        // Allow plugin configs passed from Python to take effect on the viewer
        if (this._plugin_config) {
            this.viewer.restore({plugin_config: this._plugin_config});
        }
    }

    /**
     * True if the widget is in client-only mode, i.e. the browser has ownership
     * of the widget's data.
     */
    get client(): boolean {
        return this._client;
    }
    set client(client: boolean) {
        this._client = client;
    }

    /**
     * True if the widget is in server-only mode, i.e. the Python backend has
     * full ownership of the widget's data, and the widget does not have a
     * `perspective.Table` of its own.
     */
    get server(): boolean {
        return this._server;
    }
    set server(server: boolean) {
        this._server = server;
    }

    /**
     * Enable or disable dark mode by re-rendering the viewer.
     */
    get dark(): boolean {
        return this._dark;
    }
    set dark(dark: boolean) {
        this._dark = dark;
        if (this._dark) {
            this.node.classList.add(PSP_CONTAINER_CLASS_DARK);
            this.node.classList.remove(PSP_CONTAINER_CLASS);
        } else {
            this.node.classList.add(PSP_CONTAINER_CLASS);
            this.node.classList.remove(PSP_CONTAINER_CLASS_DARK);
        }
        if (this.isAttached) {
            this.viewer.restyleElement();
        }
    }

    get editable(): boolean {
        return this._editable;
    }
    set editable(editable: boolean) {
        this._editable = editable;
        if (this._editable) {
            this.viewer.setAttribute("editable", "");
        } else {
            this.viewer.removeAttribute("editable");
        }
    }

    get selectable(): boolean {
        return this.viewer.hasAttribute("selectable");
    }

    set selectable(row_selection: boolean) {
        if (row_selection) {
            this.viewer.setAttribute("selectable", "");
        } else {
            this.viewer.removeAttribute("selectable");
        }
    }

    static createNode(node: HTMLDivElement): PerspectiveViewerElement {
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
        viewer.addEventListener("contextmenu", event => event.stopPropagation(), false);

        const div = document.createElement("div");
        div.style.setProperty("display", "flex");
        div.style.setProperty("flex-direction", "row");
        node.appendChild(div);

        if (!viewer.notifyResize) {
            console.warn("Warning: not bound to real element");
        } else {
            const resize_observer = new MutationObserver(mutations => {
                if (mutations.some(x => x.attributeName === "style")) {
                    viewer.notifyResize.call(viewer);
                }
            });
            resize_observer.observe(node, {attributes: true});
            viewer.toggleConfig();
        }

        return viewer;
    }

    private _viewer: PerspectiveViewerElement;
    private _plugin_config: object;
    private _client: boolean;
    private _server: boolean;
    private _dark: boolean;
    private _editable: boolean;
    private _viewer_config: PerspectiveViewerConfig;
}
