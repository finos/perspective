/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@finos/perspective-viewer";
import "@finos/perspective-viewer-hypergrid";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-viewer-highcharts";

import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import { MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS, PSP_CONTAINER_CLASS_DARK } from './utils';
import { Table } from '@finos/perspective';

import { PerspectiveViewer, PerspectiveViewerOptions } from '@finos/perspective-viewer';

let _increment = 0;

export type PerspectiveWidgetOptions = {
    dark?: boolean;
    bindto?: HTMLElement;
}


/**
 * Class for perspective phosphor widget.
 *
 * @class PerspectiveWidget (name)
 * TODO: document
 */
export
    class PerspectiveWidget extends Widget {
    constructor(name: string = 'Perspective',
        options: PerspectiveViewerOptions & PerspectiveWidgetOptions = {}) {
        super({ node: options.bindto || document.createElement('div') });
        this._viewer = Private.createNode(this.node as HTMLDivElement);

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
    _set_attributes(options: PerspectiveViewerOptions & PerspectiveWidgetOptions) {
        let plugin: string = options.plugin || "hypergrid";
        let columns: Array<string> = options.columns || [];
        let row_pivots: Array<string> = options.row_pivots || [];
        let column_pivots: Array<string> = options.column_pivots || [];
        let aggregates: { [column_name: string]: string } = options.aggregates || {};
        let sort: Array<Array<string>> = options.sort || [];
        let filters: Array<Array<string>> = options.filters || [];
        let computed_columns: { [colname: string]: string }[] = options.computed_columns || [];
        let plugin_config: any = options.plugin_config || {};
        let dark: boolean = options.dark || false;

        this.dark = dark;
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
     * Phospor: Called when phosphor widget is destroyed
     *
     */
    dispose(): void {
        super.dispose();
    }

    /**
     * Phosphor: onAfterAttach to dom
     *
     */
    onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
    }


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

    /**
     * other non-phosphor resizes
     *
     */
    notifyResize(): void {
        if(this.isAttached && !this.displayed){
            this._displayed = true;
            console.log("DISPLAYING", this);
        } else if (this.isAttached){
            this.viewer.notifyResize();
        }
    }

    /**
     * Load either a `perspective.table` into the viewer.
     *
     * @param table a `perspective.table` object.
     */
    load(table : Table | any) : void {
        this.viewer.load(table);
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
     * Defaults to "hypergrid" if not set by the user.
     */
    get plugin() { return this._plugin; }
    set plugin(plugin: string) {
        this._plugin = plugin;
        this.viewer.setAttribute('plugin', this._plugin);
    }

    /**
     * The column names that are displayed in the viewer's grid/visualizations.
     * 
     * If a column in the dataset is not in this array, it is not shown but can be used for aggregates, sort, and filter.
     */
    get columns() { return this._columns; }
    set columns(columns: Array<string>) {
        this._columns = columns;
        if (this._columns.length > 0) {
            this.viewer.setAttribute('columns', JSON.stringify(this._columns));
        } else {
            this.viewer.removeAttribute('columns');
        }
    }

    get row_pivots() { return this._row_pivots; }
    set row_pivots(row_pivots: Array<string>) {
        this._row_pivots = row_pivots;
        this.viewer.setAttribute('row-pivots', JSON.stringify(this._row_pivots));
    }

    get column_pivots() { return this._column_pivots; }
    set column_pivots(column_pivots: Array<string>) {
        this._column_pivots = column_pivots;
        this.viewer.setAttribute('column-pivots', JSON.stringify(this._column_pivots));
    }

    get aggregates() { return this._aggregates; }
    set aggregates(aggregates: { [colname: string]: string }) {
        this._aggregates = aggregates;
        this.viewer.setAttribute('aggregates', JSON.stringify(this._aggregates));
    }

    get sort() { return this._sort; }
    set sort(sort: Array<Array<string>>) {
        this._sort = sort;
        this.viewer.setAttribute('sort', JSON.stringify(this._sort));
    }

    get computed_columns() { return this._computed_columns; }
    set computed_columns(computed_columns: { [colname: string]: string }[]) {
        this._computed_columns = computed_columns;
        if (this._computed_columns.length > 0) {
            this.viewer.setAttribute('computed-columns', JSON.stringify(this._computed_columns));
        } else {
            this.viewer.removeAttribute('computed-columns');
        }
    }

    get filters() { return this._filters; }
    set filters(filters: Array<Array<string>>) {
        this._filters = filters;
        if (this._filters.length > 0) {
            this.viewer.setAttribute('filters', JSON.stringify(this._filters));
        } else {
            this.viewer.removeAttribute('filters');
        }
    }

    get plugin_config() { return this._plugin_config; }
    set plugin_config(plugin_config: any) {
        this._plugin_config = plugin_config;
        if (this._plugin_config) {
            this.viewer.restore(this._plugin_config);
        }
    }

    /**
     * Enable or disable dark mode by re-rendering the viewer.
     */
    get dark() { return this._dark; }
    set dark(dark: boolean) {
        this._dark = dark
        if (this._dark) {
            this.node.classList.add(PSP_CONTAINER_CLASS_DARK);
            this.node.classList.remove(PSP_CONTAINER_CLASS);
        } else {
            this.node.classList.add(PSP_CONTAINER_CLASS);
            this.node.classList.remove(PSP_CONTAINER_CLASS_DARK);
        }
        if (this._displayed){
            this.viewer.restyleElement();
        }
    }

    get displayed(){ return this._displayed; }

    private _viewer: PerspectiveViewer;
    private _plugin: string;
    private _columns: Array<string>;
    private _row_pivots: Array<string>;
    private _column_pivots: Array<string>;
    private _aggregates: { [colname: string]: string };
    private _sort: Array<Array<string>>;
    private _computed_columns: { [column_name: string]: string }[];
    private _filters: Array<Array<string>>;
    private _plugin_config: any;

    private _dark: boolean;

    private _displayed: boolean;
}


namespace Private {
    export let _loaded = false;

    export function createNode(node: HTMLDivElement): PerspectiveViewer {
        node.classList.add('p-Widget');
        node.classList.add(PSP_CONTAINER_CLASS);
        let viewer = (document.createElement('perspective-viewer') as any) as PerspectiveViewer;
        viewer.classList.add(PSP_CLASS);
        viewer.setAttribute('type', MIME_TYPE);

        while (node.lastChild) {
            node.removeChild(node.lastChild);
        }

        node.appendChild(viewer);

        // allow perspective's event handlers to do their work
        viewer.addEventListener('contextmenu', stop, false);

        function stop(event: MouseEvent) {
            event.stopPropagation();
        }

        let div = document.createElement('div');
        div.style.setProperty('display', 'flex');
        div.style.setProperty('flex-direction', 'row');
        node.appendChild(div);


        if (!viewer.notifyResize) {
            console.warn('Warning: not bound to real element');
        } else {
            let observer = new MutationObserver(viewer.notifyResize.bind(viewer));
            observer.observe(node, { attributes: true });
        }
        return viewer;
    }
}