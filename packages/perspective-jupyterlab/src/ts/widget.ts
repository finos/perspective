/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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

import {PerspectiveWidget} from '@finos/perspective-phosphor';

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


export
class PerspectiveView extends DOMWidgetView {
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
             view: this, // necessary for ipywidgets
        });
        return this.pWidget.node;
    }

    _setElement(el: HTMLElement) {
        if (this.el || el !== this.pWidget.node) {
            // Accordions don't allow setting the element beyond the initial creation.
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
            (this.pWidget as PerspectiveWidget)._render();
        });
    }

    remove() {
        (this.pWidget as PerspectiveWidget).delete();
    }

    _update(msg: any) {
        if (msg.type === 'update') {
            (this.pWidget as PerspectiveWidget)._update(msg.data);
        } else if (msg.type === 'delete') {
            (this.pWidget as PerspectiveWidget).delete();
        }
    }

    data_changed() {
        if(this.model.get('datasrc') === 'arrow'){
            return;
        }
        (this.pWidget as PerspectiveWidget).data = this.model.get('_data');
        (this.pWidget as PerspectiveWidget)._render();
    }

    bin_data_changed() {
        if(this.model.get('datasrc') !== 'arrow'){
            return;
        }
        (this.pWidget as PerspectiveWidget).data = this.model.get('_bin_data').buffer;
        (this.pWidget as PerspectiveWidget)._render();
    }

    datasrc_changed(){
        (this.pWidget as PerspectiveWidget).datasrc = this.model.get('datasrc');
        (this.pWidget as PerspectiveWidget)._render();
    }


    schema_changed(){
        (this.pWidget as PerspectiveWidget).schema = this.model.get('schema');
        (this.pWidget as PerspectiveWidget)._render();
    }

    plugin_changed(){
        (this.pWidget as PerspectiveWidget).plugin = this.model.get('plugin');
    }

    columns_changed(){
        (this.pWidget as PerspectiveWidget).columns = this.model.get('columns');
    }

    rowpivots_changed(){
        (this.pWidget as PerspectiveWidget).rowpivots = this.model.get('rowpivots');
    }

    columnpivots_changed(){
        (this.pWidget as PerspectiveWidget).columnpivots = this.model.get('columnpivots');
    }

    aggregates_changed(){
        (this.pWidget as PerspectiveWidget).aggregates = this.model.get('aggregates');
    }

    sort_changed(){
        (this.pWidget as PerspectiveWidget).sort = this.model.get('sort');
    }

    computedcolumns_changed(){
        (this.pWidget as PerspectiveWidget).computedcolumns = this.model.get('computedcolumns');
    }

    filters_changed(){
        (this.pWidget as PerspectiveWidget).filters = this.model.get('filters');
    }

    plugin_config_changed(){
        (this.pWidget as PerspectiveWidget).plugin_config = this.model.get('plugin_config');
    }

    limit_changed(){
        (this.pWidget as PerspectiveWidget).limit = this.model.get('limit');
    }

    settings_changed(){
        (this.pWidget as PerspectiveWidget).settings = this.model.get('settings');
    }

    embed_changed(){
        (this.pWidget as PerspectiveWidget).embed = this.model.get('embed');
    }

    dark_changed(){
        (this.pWidget as PerspectiveWidget).dark = this.model.get('dark');
    }
}