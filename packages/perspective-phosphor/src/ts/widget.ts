/* eslint-disable @typescript-eslint/camelcase */
/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@finos/perspective-viewer";

import {Table, TableData, TableOptions} from "@finos/perspective";
import {Message} from "@phosphor/messaging";
import {Widget} from "@phosphor/widgets";
import {MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS, PSP_CONTAINER_CLASS_DARK} from "./utils";

import {PerspectiveViewer, PerspectiveViewerOptions} from "@finos/perspective-viewer";

let _increment = 0;

export interface PerspectiveWidgetOptions extends PerspectiveViewerOptions {
    dark?: boolean;
    client?: boolean;
    title?: string;
    bindto?: HTMLElement;
    plugin_config?: PerspectiveViewerOptions;

    // these shouldn't exist, PerspectiveViewerOptions should be sufficient e.g. ["row-pivots"]
    column_pivots?: string[];
    row_pivots?: string[];
    computed_columns?: {[column_name: string]: string}[];
}

/**
 * Class for perspective phosphor widget.
 *
 * @class PerspectiveWidget (name)
 * TODO: document
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
    _set_attributes(options: PerspectiveWidgetOptions): void {
        const plugin: string = options.plugin || "hypergrid";
        const columns: Array<string> = options.columns || [];
        const row_pivots: Array<string> = options.row_pivots || options["row-pivots"] || [];
        const column_pivots: Array<string> = options.column_pivots || options["column-pivots"] || [];
        const aggregates: {[column_name: string]: string} = options.aggregates || {};
        const sort: Array<Array<string>> = options.sort || [];
        const filters: Array<Array<string>> = options.filters || [];
        const computed_columns: {[colname: string]: string}[] = options.computed_columns || options["computed-columns"] || [];
        const plugin_config: PerspectiveViewerOptions = options.plugin_config || {};
        const dark: boolean = options.dark || false;
        const editable: boolean = options.editable || false;
        const client: boolean = options.client || false;

        this.client = client;
        this.dark = dark;
        this.editable = editable;
        this.plugin = plugin;
        this.plugin_config = plugin_config;
        this.row_pivots = row_pivots;
        this.column_pivots = column_pivots;
        this.sort = sort;
        this.columns = columns;

        // do aggregates after columns
        this.aggregates = aggregates;

        // do computed last
        this.computed_columns = computed_columns;
        this.filters = filters;

        this._displayed = false;
    }

    /**********************/
    /* Phosphor Overrides */
    /**********************/

    /**
     * Phosphor: after visible
     *
     */
    onAfterShow(msg: Message): void {
        this.notifyResize();
        super.onAfterShow(msg);
    }

    /**
     * Phosphor: widget resize
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

    notifyResize(): void {
        if (this.isAttached && !this.displayed) {
            this._displayed = true;
        } else if (this.isAttached) {
            this.viewer.notifyResize();
        }
    }

    save(): PerspectiveViewerOptions {
        return this.viewer.save();
    }

    restore(config: PerspectiveViewerOptions): Promise<void> {
        return this.viewer.restore(config);
    }

    /**
     * Load either a `perspective.table` into the viewer.
     *
     * @param table a `perspective.table` object.
     */
    load(table: (TableData | Table), options?: TableOptions): void {
        this.viewer.load(table, options);
    }

    /**
     * Update the viewer with new data.
     * 
     * @param data 
     */
    _update(data: TableData): void {
        this.viewer.update(data);
    }

    /**
     * Removes all rows from the viewer's table. Does not reset viewer state.
     */
    clear(): void {
        this.viewer.clear();
    }

    /**
     * Replaces the data of the viewer's table with new data. New data must conform
     * to the schema of the Table.
     * 
     * @param data
     */
    replace(data: TableData): void {
        this.viewer.replace(data);
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state). This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     * 
     * If not running in client mode, delete_table defaults to false and the server should
     * handle memory cleanup.
     *
     * @param {boolean} delete_table Whether `delete()` should be called on the underlying `Table`.
     */
    delete(delete_table: boolean = true) {
        this.viewer.delete(delete_table || this.client);
    }

    get table(): Table {
        return this.viewer.table;
    }

    /******************************************************************************
     *
     * Getters
     *
     */

    /**
     * Returns the underlying `PerspectiveViewer` instance.
     *
     * @returns {PerspectiveViewer} The widget's viewer instance.
     */
    get viewer(): PerspectiveViewer {
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

    /**
     * The name of the plugin which visualizes the data in `PerspectiveViewer`.
     *
     */
    get plugin(): string {
        return this.viewer.getAttribute("plugin");
    }
    set plugin(plugin: string) {
        this.viewer.setAttribute("plugin", plugin);
    }

    /**
     * The column names that are displayed in the viewer's grid/visualizations.
     *
     * If a column in the dataset is not in this array, it is not shown but can
     * be used for aggregates, sort, and filter.
     */
    get columns(): string[] {
        return JSON.parse(this.viewer.getAttribute("columns"));
    }
    set columns(columns: string[]) {
        if (columns.length > 0) {
            this.viewer.setAttribute("columns", JSON.stringify(columns));
        } else {
            this.viewer.removeAttribute("columns");
        }
    }

    get row_pivots(): string[] {
        return JSON.parse(this.viewer.getAttribute("row-pivots"));
    }
    set row_pivots(row_pivots: string[]) {
        this.viewer.setAttribute("row-pivots", JSON.stringify(row_pivots));
    }

    get column_pivots(): string[] {
        return JSON.parse(this.viewer.getAttribute("column-pivots"));
    }
    set column_pivots(column_pivots: string[]) {
        this.viewer.setAttribute("column-pivots", JSON.stringify(column_pivots));
    }

    get aggregates(): {[column_name: string]: string} {
        return JSON.parse(this.viewer.getAttribute("aggregates"));
    }
    set aggregates(aggregates: {[colname: string]: string}) {
        this.viewer.setAttribute("aggregates", JSON.stringify(aggregates));
    }

    get sort(): string[][] {
        return JSON.parse(this.viewer.getAttribute("sort"));
    }
    set sort(sort: string[][]) {
        this.viewer.setAttribute("sort", JSON.stringify(sort));
    }

    get computed_columns(): {[column_name: string]: string}[] {
        return JSON.parse(this.viewer.getAttribute("computed-columns"));
    }
    set computed_columns(computed_columns: {[column_name: string]: string}[]) {
        if (computed_columns.length > 0) {
            this.viewer.setAttribute("computed-columns", JSON.stringify(computed_columns));
        } else {
            this.viewer.removeAttribute("computed-columns");
        }
    }

    get filters(): string[][] {
        return JSON.parse(this.viewer.getAttribute("filters"));
    }
    set filters(filters: string[][]) {
        if (filters.length > 0) {
            this.viewer.setAttribute("filters", JSON.stringify(filters));
        } else {
            this.viewer.removeAttribute("filters");
        }
    }

    get plugin_config(): PerspectiveViewerOptions {
        return this._plugin_config;
    }
    set plugin_config(plugin_config: PerspectiveViewerOptions) {
        this._plugin_config = plugin_config;
        if (this._plugin_config) {
            this.viewer.restore(this._plugin_config);
        }
    }

    /**
     * True if the widget is in client-only mode, i.e. the browser has ownership of the widget's data.
     */
    get client(): boolean {
        return this._client;
    }
    set client(client: boolean) {
        this._client = client;
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
        if (this._displayed) {
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

    toggleConfig() {
        this._viewer.toggleConfig();
    }

    get displayed(): boolean {
        return this._displayed;
    }

    static createNode(node: HTMLDivElement): PerspectiveViewer {
        node.classList.add("p-Widget");
        node.classList.add(PSP_CONTAINER_CLASS);
        const viewer = document.createElement("perspective-viewer") as PerspectiveViewer;
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
            viewer.notifyResize = viewer.notifyResize.bind(viewer);
        }
        return viewer;
    }

    private _viewer: PerspectiveViewer;
    private _plugin_config: PerspectiveViewerOptions;
    private _client: boolean;
    private _dark: boolean;
    private _editable: boolean;
    private _displayed: boolean;
}
