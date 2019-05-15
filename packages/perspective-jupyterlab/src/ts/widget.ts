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
import * as wasm from "arraybuffer-loader!@finos/perspective/build/psp.async.wasm";
import * as worker from "file-worker-loader?inline=true!@finos/perspective/build/perspective.wasm.worker.js";

if (perspective) {
    perspective.override({wasm, worker});
} else {
    console.warn('Perspective was undefined - wasm load errors may occur');
}

import {PerspectiveWidget} from '@finos/perspective-phosphor/src/ts/index';

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
            view: 'hypergrid',
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
    private psp: PerspectiveWidget;

    render() {
        this.psp = new PerspectiveWidget(undefined,
            {datasrc: this.model.get('datasrc'),
             data: this.model.get('datasrc') == 'arrow'?this.model.get('_bin_data') : this.model.get('_data'),
             schema: this.model.get('schema'),
             view: this.model.get('view'),
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

        this.model.on('change:_data', this.data_changed, this);
        this.model.on('change:_bin_data', this.bin_data_changed, this);
        // Dont trigger on datasrc change until data is updated
        this.model.on('change:schema', this.schema_changed, this);
        this.model.on('change:view', this.view_changed, this);
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
            this.psp._render();
        });
    }

    remove() {
        this.psp.delete();
    }

    _update(msg: any) {
        if (msg.type === 'update') {
            this.psp.pspNode.update(msg.data);
        } else if (msg.type === 'delete') {
            this.psp.delete();
        }
    }

    data_changed() {
        this.psp.data = this.model.get('_data');
        this.psp._render();
    }

    bin_data_changed() {
        this.psp.data = this.model.get('_bin_data');
        this.psp._render();
    }

    datasrc_changed(){
        this.psp.datasrc = this.model.get('datasrc');
        this.psp._render();
    }

    
    schema_changed(){
        this.psp.schema = this.model.get('schema');
        this.psp._render();
    }
    
    view_changed(){
        this.psp.view = this.model.get('view');
    }
    
    columns_changed(){
        this.psp.columns = this.model.get('columns');
    }
    
    rowpivots_changed(){
        this.psp.rowpivots = this.model.get('rowpivots');
    }
    
    columnpivots_changed(){
        this.psp.columnpivots = this.model.get('columnpivots');
    }
    
    aggregates_changed(){
        this.psp.aggregates = this.model.get('aggregates');
    }
    
    sort_changed(){
        this.psp.sort = this.model.get('sort');
    }
    
    computedcolumns_changed(){
        this.psp.computedcolumns = this.model.get('computedcolumns');
    }

    filters_changed(){
        this.psp.filters = this.model.get('filters');
    }

    plugin_config_changed(){
        this.psp.plugin_config = this.model.get('plugin_config');
    }

    limit_changed(){
        this.psp.limit = this.model.get('limit');
    }
    
    settings_changed(){
        this.psp.settings = this.model.get('settings');
    }
    
    embed_changed(){
        this.psp.embed = this.model.get('embed');
    }
    
    dark_changed(){
        this.psp.dark = this.model.get('dark');
    }
}