/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
/**************************/
/* perspective components */
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-hypergrid";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-viewer-highcharts";

import { Message } from '@phosphor/messaging';
import { Widget } from '@phosphor/widgets';
import { MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS, PSP_CONTAINER_CLASS_DARK } from './utils';
import {TableData, TableOptions, Schema} from '@finos/perspective';

import { PerspectiveViewer } from '@finos/perspective-viewer';

let _increment = 0;

export type PerspectiveWidgetOptions = {
    datasrc?: string;
    data?: TableData;
    schema?: Schema;
    plugin?: string;
    columns?: Array<string>;
    rowpivots?: Array<string>;
    columnpivots?: Array<string>;
    aggregates?: { [colname: string]: string };
    sort?: Array<string>;
    index?: string;
    limit?: number;
    computedcolumns?: { [colname: string]: string }[];
    filters?: Array<Array<string>>;
    plugin_config?: any;
    settings?: boolean;
    embed?: boolean;
    dark?: boolean;
    bindto?: HTMLElement;
    key?: string;
    wrap?: boolean;
    delete_?: boolean;
}


/**
 * Class for perspective phosphor widget.
 *
 * @class      PerspectiveWidget (name)
 * @param {options} options object consisting of the fields below
 * @param {string} name - Name of phosphor widget
 * @param {string} datasrc - type of datasrc, either '' for json or 'pyarrow' for arrow TODO
 * @param {Schema} schema - Perspective schema to load
 * @param {string} plugin - PerspectiveViewer plugin type
 * @param {Array<string>} columns - Columns to show
 * @param {Array<string>} rowpivots - Row pivots to use
 * @param {Array<string>} columnpivots - Column pivots to use
 * @param {{[colname: string]: string}} aggregates - Aggregates to apply to pivoted data
 * @param {Array<string>} sort - sort by these [column, {'asc', 'dsc',...}]
 * @param {string} index - Primary key column name
 * @param {number} limit - limit to this many records
 * @param {{[colname: string]: string}[]} computedcolumns - Computed columns to use
 * @param {Array<Array<string>>} filters - list of filters to use
 * @param {any} filters - configuration for plugin restore
 * @param {boolean} settings - show settings 
 * @param {boolean} embed - Embed mode TODO
 * @param {boolean} dark - use dark CSS
 * @param {HTMLElement} bindto - bind to this dom element (otherwise will use div)
 * @param {string} key - index object data by key
 * @param {boolean} wrap - wrap data in list
 * @param {boolean} delete_ - delete existing data on new data
 */
export
    class PerspectiveWidget extends Widget {
    constructor(name: string = 'Perspective',
        options: PerspectiveWidgetOptions = {}) {
        super({ node: options.bindto || document.createElement('div') });
        this._psp = Private.createNode(this.node as HTMLDivElement);

        this.title.label = name;
        this.title.caption = `${name}`;
        this.id = `${name}-` + _increment;
        _increment += 1;

        this._load(options);
    }


    /***********/
    /* Getters */
    /***********/

    /**
     * getter for underlying PerspectiveViewer
     *
     * @return     {PerspectiveViewer}  { underlying PerspectiveViewer instance }
     */
    get pspNode(): PerspectiveViewer {
        return this._psp;
    }


    /**
     * getter for name
     *
     * @return     {string}  {name of the widget}
     */
    get name(): string {
        return this.title.label;
    }

    _load(options: PerspectiveWidgetOptions) {
        let data: TableData = options.data || [];
        this._data = data;

        let datasrc: string = options.datasrc || '';
        let schema: Schema = options.schema || {};
        let plugin: string = options.plugin || 'hypergrid';
        let columns: Array<string> = options.columns || [];
        let rowpivots: Array<string> = options.rowpivots || [];
        let columnpivots: Array<string> = options.columnpivots || [];
        let aggregates: { [colname: string]: string } = options.aggregates || {};
        let sort: Array<string> = options.sort || [];
        let index: string = options.index || '';
        let limit: number = options.limit || -1;
        let computedcolumns: { [colname: string]: string }[] = options.computedcolumns || [];
        let filters: Array<Array<string>> = options.filters || [];
        let plugin_config: any = options.plugin_config || {};
        let settings: boolean = options.settings || false;
        let embed: boolean = options.embed || false;
        let dark: boolean = options.dark || false;
        let key: string = options.key || '';
        let wrap: boolean = options.wrap || false;
        let delete_: boolean = options.delete_ || true;

        this.settings = settings;
        this.dark = dark;
        this._schema = schema; // dont trigger setter
        this.plugin = plugin;
        this.plugin_config = plugin_config;
        this.rowpivots = rowpivots;
        this.columnpivots = columnpivots;
        this.sort = sort;
        this.columns = columns;
        this.index = index;
        this.limit = limit;
        this.embed = embed;

        // do aggregates after columns
        this.aggregates = aggregates;

        //always last
        this.datasrc = datasrc;

        // do computed last
        this.computedcolumns = computedcolumns;
        this.filters = filters;

        this._key = key;
        this._wrap = wrap;
        this._delete = delete_;
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
        this.delete();
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
            this.pspNode.focus();
        }
        super.onActivateRequest(msg);
    }

    /***********************/
    /* PSP Integration     */
    /***********************/
    /**
     * delete underlying perspective table
     *
     */
    delete(): void {
        this.pspNode.delete();
    }

    /**
     * update underlying perspective table
     *
     */
    _update(data: any): void {
        this.pspNode.update(data);
    }


    /**
     * other non-phosphor resizes
     *
     */
    notifyResize(): void {
        if(this.isAttached && !this.displayed){
            if(this.data.length === 0 && Object.keys(this.data).length === 0){
                return
            }
            this._render();
            this._displayed = true;
        } else if (this.isAttached){
            this.pspNode.notifyResize();

        }
    }

    /**
     * underlying data has changed, reinitialize perspective-viewer
     *
     */
    _render(): void {
        /*****************/
        /* Arrow Loading */
        /*****************/
        if (this.datasrc === 'arrow') { // or other binary formats
            if (this._delete) {
                this.delete();
            }

            let data = this.data;

            // Arrow provides its own schema
            let limit = this.limit;
            let index = this.index;
            let options = {} as { [key: string]: any };

            if (limit > 0) {
                options['limit'] = limit;
            }
            if (index) {
                options['index'] = index;
            }
            if (data) {
                this.pspNode.load(data, options as TableOptions);
            }
            
            /*****************/
        } else {
            /****************/
            /* JSON Loading */
            /****************/
            if (this._delete) {
                this.delete();
            }

            let data;
            if (this._key && !Array.isArray(this.data)) {
                data = this.data[this._key];
            } else {
                data = this.data;
            }

            if (Object.keys(this.schema).length > 0) {
                let limit = this.limit;
                let index = this.index;
                let options = {} as { [key: string]: any };

                if (limit > 0) {
                    options['limit'] = limit;
                }
                if (index) {
                    options['index'] = index;
                }

                this.pspNode.load(this.schema as Schema, options as TableOptions);
            }

            if (Array.isArray(data) && data.length > 0) {
                if (this._wrap) {
                    this.pspNode.update([data]);
                } else {
                    this.pspNode.update(data);
                }
            } else {
                if(Object.keys(data)){
                    this.pspNode.update(data);
                } else {
                    console.warn('Perspective received length 0 data');
                }
            }
            /****************/
        }
    }

    get data() { return this._data; }
    /**
     * change underlying json data
     *
     * @param      {any}  data    The data to load
     */
    set data(data: any) {
        this._data = data;
    }


    /**
     * get datasrc
     *
     * @return     {string}  { data source type }
     */
    get datasrc() { return this._datasrc; }

    /**
     * Change datasrc between '' (json) and 'arrow' (arrow) data
     *
     * @param      {any}  datasrc  The datasrc to configure for
     */
    set datasrc(datasrc: string) {
        this.delete();
        this._datasrc = datasrc
    }

    /**
     * get schema
     *
     * @return     {{[colname: string]: string}}  { schema value }
     */
    get schema() { return this._schema; }

    /**
     * set schema
     *
     * @param      {{[colname: string]: string}}  schema   The schema to set
     */
    set schema(schema: { [colname: string]: string }) {
        this._schema = schema;
    }

    get plugin() { return this._plugin; }
    set plugin(plugin: string) {
        this._plugin = plugin;
        this.pspNode.setAttribute('plugin', this._plugin);
    }

    get columns() { return this._columns; }
    set columns(columns: Array<string>) {
        this._columns = columns;
        if (this._columns.length > 0) {
            this.pspNode.setAttribute('columns', JSON.stringify(this._columns));
        } else {
            this.pspNode.removeAttribute('columns');
        }
    }

    get rowpivots() { return this._rowpivots; }
    set rowpivots(rowpivots: Array<string>) {
        this._rowpivots = rowpivots;
        this.pspNode.setAttribute('row-pivots', JSON.stringify(this._rowpivots));
    }

    get columnpivots() { return this._columnpivots; }
    set columnpivots(columnpivots: Array<string>) {
        this._columnpivots = columnpivots;
        this.pspNode.setAttribute('column-pivots', JSON.stringify(this._columnpivots));
    }

    get aggregates() { return this._aggregates; }
    set aggregates(aggregates: { [colname: string]: string }) {
        this._aggregates = aggregates;
        this.pspNode.setAttribute('aggregates', JSON.stringify(this._aggregates));
    }

    get sort() { return this._sort; }
    set sort(sort: Array<string>) {
        this._sort = sort;
        this.pspNode.setAttribute('sort', JSON.stringify(this._sort));
    }

    get index() { return this._index; }
    set index(index: string) {
        this._index = index;
        if (this._index) {
            this.pspNode.setAttribute('index', JSON.stringify(this._index));
        } else {
            this.pspNode.removeAttribute('index');
        }
    }

    get computedcolumns() { return this._computedcolumns; }
    set computedcolumns(computedcolumns: { [colname: string]: string }[]) {
        this._computedcolumns = computedcolumns;
        if (this._computedcolumns.length > 0) {
            this.pspNode.setAttribute('computed-columns', JSON.stringify(this._computedcolumns));
        } else {
            this.pspNode.removeAttribute('computed-columns');
        }
    }

    get filters() { return this._filters; }
    set filters(filters: Array<Array<string>>) {
        this._filters = filters;
        if (this._filters.length > 0) {
            this.pspNode.setAttribute('filters', JSON.stringify(this._filters));
        } else {
            this.pspNode.removeAttribute('filters');
        }
    }

    get plugin_config() { return this._plugin_config; }
    set plugin_config(plugin_config: any) {
        this._plugin_config = plugin_config;
        if (this._plugin_config) {
            this.pspNode.restore(this._plugin_config);
        }
    }

    get limit() { return this._limit; }
    set limit(limit: number) {
        this._limit = limit;
        if (this._limit > 0) {
            this.pspNode.setAttribute('limit', this._limit.toString());
        } else {
            this.pspNode.removeAttribute('limit');
        }
    }

    get settings() { return this._settings; }
    set settings(settings: boolean) {
        this._settings = settings;
        this.pspNode.setAttribute('settings', this._settings.toString());
    }

    get embed() { return this._embed; }
    set embed(embed: boolean) {
        this._embed = embed
        if (this._embed) {
            console.log('Warning: embed not implemented');
        }
    }

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
            this.pspNode.restyleElement();
        }
    }

    get displayed(){ return this._displayed; }

    private _data: any = [];

    private _psp: PerspectiveViewer;
    private _datasrc: string;
    private _schema: { [colname: string]: string };
    private _plugin: string;
    private _columns: Array<string>;
    private _rowpivots: Array<string>;
    private _columnpivots: Array<string>;
    private _aggregates: { [colname: string]: string };
    private _sort: Array<string>;
    private _index: string;
    private _limit: number;
    private _computedcolumns: { [colname: string]: string }[];
    private _filters: Array<Array<string>>;
    private _plugin_config: any;

    private _settings: boolean;
    private _embed: boolean;
    private _dark: boolean;

    private _key: string;
    private _wrap: boolean;
    private _delete: boolean;

    private _displayed: boolean;
}


namespace Private {
    export let _loaded = false;

    export function createNode(node: HTMLDivElement): PerspectiveViewer {
        node.classList.add('p-Widget');
        node.classList.add(PSP_CONTAINER_CLASS);
        let psp = (document.createElement('perspective-viewer') as any) as PerspectiveViewer;
        psp.classList.add(PSP_CLASS);
        psp.setAttribute('type', MIME_TYPE);

        while (node.lastChild) {
            node.removeChild(node.lastChild);
        }

        node.appendChild(psp);

        // allow perspective's event handlers to do their work
        psp.addEventListener('contextmenu', stop, false);

        function stop(event: MouseEvent) {
            event.stopPropagation();
        }

        let div = document.createElement('div');
        div.style.setProperty('display', 'flex');
        div.style.setProperty('flex-direction', 'row');
        node.appendChild(div);


        if (!psp.notifyResize) {
            console.warn('Warning: not bound to real element');
        } else {
            let observer = new MutationObserver(psp.notifyResize.bind(psp));
            observer.observe(node, { attributes: true });
        }
        return psp;
    }
}