/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {Message} from '@phosphor/messaging';
import {DOMWidgetModel, DOMWidgetView, ISerializers} from '@jupyter-widgets/base';

import {PERSPECTIVE_VERSION} from './version';

import perspective from "@finos/perspective";

import * as wasm from "@finos/perspective/dist/umd/psp.async.wasm";
import * as worker from "!!file-worker-loader?inline=true!@finos/perspective/dist/umd/perspective.wasm.worker.js";

if (perspective) {
    perspective.override({wasm, worker});
} else {
    console.warn('Perspective was undefined - wasm load errors may occur');
}

import {PerspectiveWidget, PerspectiveWidgetOptions} from '@finos/perspective-phosphor';

export
class PerspectiveModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: PerspectiveModel.model_name,
            _model_module: PerspectiveModel.model_module,
            _model_module_version: PerspectiveModel.model_module_version,
            _view_name: PerspectiveModel.view_name,
            _view_module: PerspectiveModel.view_module,
            _view_module_version: PerspectiveModel.view_module_version,
            _data: [],
            _bin_data: [],

            datasrc: '',
            schema: {},
            plugin: 'hypergrid',
            columns: [],
            rowpivots: [],
            columnpivots: [],
            aggregates: [],
            sort: [],
            index: '',
            limit: -1,
            computedcolumns: [],
            filters: [],
            plugin_config: {},
            settings: false,
            embed: false,
            dark: false
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        // Add any extra serializers here
    }

    static model_name = 'PerspectiveModel';
    static model_module = '@finos/perspective-jupyterlab';
    static model_module_version = PERSPECTIVE_VERSION;
    static view_name = 'PerspectiveView';
    static view_module = '@finos/perspective-jupyterlab';
    static view_module_version = PERSPECTIVE_VERSION;
}


export type JupyterPerspectiveWidgetOptions = {
    view?: any;
}


export
class JupyterPerspectiveWidget extends PerspectiveWidget {
    constructor(name: string = 'Perspective', options: JupyterPerspectiveWidgetOptions & PerspectiveWidgetOptions) {
        let view = options.view;
        delete options.view;
        super(name, options as PerspectiveWidgetOptions);
        this._view = view;
    }

    /**
     * Process the phosphor message.
     *
     * Any custom phosphor widget used inside a Jupyter widget should override
     * the processMessage function like this.
     */
    processMessage(msg: Message) {
        super.processMessage(msg);
        this._view.processPhosphorMessage(msg);
    }

    /**
     * Dispose the widget.
     *
     * This causes the view to be destroyed as well with 'remove'
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        super.dispose();
        if (this._view) {
            this._view.remove();
        }
        this._view = null;
    }

    private _view: DOMWidgetView;
}



export
class PerspectiveView extends DOMWidgetView {
    pWidget: PerspectiveWidget;

    _createElement(tagName: string) {
        this.pWidget = new PerspectiveWidget(undefined,
            {datasrc: this.model.get('datasrc'),
             data: this.model.get('datasrc') === 'arrow' ? this.model.get('_bin_data').buffer : this.model.get('_data'),
             schema: this.model.get('schema'),
             plugin: this.model.get('plugin'),
             columns: this.model.get('columns'),
             rowpivots: this.model.get('rowpivots'),
             columnpivots: this.model.get('columnpivots'),
             aggregates: this.model.get('aggregates'),
             sort: this.model.get('sort'),
             index: this.model.get('index'),
             limit: this.model.get('limit'),
             computedcolumns: this.model.get('computedcolumns'),
             filters: this.model.get('filters'),
             plugin_config: this.model.get('plugin_config'),
             settings: this.model.get('settings'),
             embed: this.model.get('embed'),
             dark: this.model.get('dark'),
             bindto: this.el,
             key: '', // key: handled by perspective-python
             wrap: false, // wrap: handled by perspective-python
             delete_: true, // delete_: handled by perspective-python
        });
        return this.pWidget.node;
    }

    _setElement(el: HTMLElement) {
        if (this.el || el !== this.pWidget.node) {
            // Disallow allow setting the element beyond the initial creation.
            throw new Error('Cannot reset the DOM element.');
        }
        this.el = this.pWidget.node;
     }

    render() {
        super.render();
        this.model.on('change:_data', this.data_changed, this);
        this.model.on('change:_bin_data', this.bin_data_changed, this);
        // Dont trigger on datasrc change until data is updated
        this.model.on('change:schema', this.schema_changed, this);
        this.model.on('change:plugin', this.plugin_changed, this);
        this.model.on('change:columns', this.columns_changed, this);
        this.model.on('change:rowpivots', this.rowpivots_changed, this);
        this.model.on('change:columnpivots', this.columnpivots_changed, this);
        this.model.on('change:aggregates', this.aggregates_changed, this);
        this.model.on('change:sort', this.sort_changed, this);
        this.model.on('change:computedcolumns', this.computedcolumns_changed, this);
        this.model.on('change:filters', this.filters_changed, this);
        this.model.on('change:plugin_config', this.plugin_config_changed, this);
        this.model.on('change:settings', this.settings_changed, this);
        this.model.on('change:embed', this.embed_changed, this);
        this.model.on('change:dark', this.dark_changed, this);

        this.model.on('msg:custom', this._update, this);

        this.displayed.then(()=> {
            this.pWidget._render();
        });
    }

    remove() {
        this.pWidget.delete();
    }

    _update(msg: any) {
        if (msg.type === 'update') {
            this.pWidget._update(msg.data);
        } else if (msg.type === 'delete') {
            this.pWidget.delete();
        }
    }

    data_changed() {
        if(this.model.get('datasrc') === 'arrow'){
            return;
        }
        this.pWidget.data = this.model.get('_data');
        this.pWidget._render();
    }

    bin_data_changed() {
        if(this.model.get('datasrc') !== 'arrow'){
            return;
        }
        this.pWidget.data = this.model.get('_bin_data').buffer;
        this.pWidget._render();
    }

    datasrc_changed(){
        this.pWidget.datasrc = this.model.get('datasrc');
        this.pWidget._render();
    }


    schema_changed(){
        this.pWidget.schema = this.model.get('schema');
        this.pWidget._render();
    }

    plugin_changed(){
        this.pWidget.plugin = this.model.get('plugin');
    }

    columns_changed(){
        this.pWidget.columns = this.model.get('columns');
    }

    rowpivots_changed(){
        this.pWidget.rowpivots = this.model.get('rowpivots');
    }

    columnpivots_changed(){
        this.pWidget.columnpivots = this.model.get('columnpivots');
    }

    aggregates_changed(){
        this.pWidget.aggregates = this.model.get('aggregates');
    }

    sort_changed(){
        this.pWidget.sort = this.model.get('sort');
    }

    computedcolumns_changed(){
        this.pWidget.computedcolumns = this.model.get('computedcolumns');
    }

    filters_changed(){
        this.pWidget.filters = this.model.get('filters');
    }

    plugin_config_changed(){
        this.pWidget.plugin_config = this.model.get('plugin_config');
    }

    limit_changed(){
        this.pWidget.limit = this.model.get('limit');
    }

    settings_changed(){
        this.pWidget.settings = this.model.get('settings');
    }

    embed_changed(){
        this.pWidget.embed = this.model.get('embed');
    }

    dark_changed(){
        this.pWidget.dark = this.model.get('dark');
    }
}