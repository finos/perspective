/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {
    DOMWidgetModel, DOMWidgetView, ISerializers
} from '@jupyter-widgets/base';

import {Session} from '@jupyterlab/services';

/* defines */
import {MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS, PSP_CONTAINER_CLASS_DARK} from './utils.ts';
import {PERSPECTIVE_VERSION} from './version.ts';

/* Helper methods */
import {
    datasourceToSource, createCopyDl
} from './utils.ts';

/* perspective components */
import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";

/* embed wasm */
import "../js/embed.js";

/* css */
import '../less/material.less';

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
            _data: null,

            schema: {},
            view: 'hypergrid',
            columns: [],
            rowpivots: [],
            columnpivots: [],
            aggregates: [],
            sort: [],
            settings: false,
            dark: false
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        // Add any extra serializers here
    }

    static model_name = 'PerspectiveModel';
    static model_module = '@jpmorganchase/perspective-jupyterlab';
    static model_module_version = PERSPECTIVE_VERSION;
    static view_name = 'PerspectiveView';
    static view_module = '@jpmorganchase/perspective-jupyterlab';
    static view_module_version = PERSPECTIVE_VERSION;
}


export
class PerspectiveView extends DOMWidgetView {
    private psp: any;

    render() {
        this.psp = Private.createNode(this.el);
        let observer = new MutationObserver(this.psp.notifyResize.bind(this.psp));
        observer.observe(this.el, {attributes: true});

        this.model.on('change:_data', this.data_changed, this);
        this.model.on('change:schema', this.schema_changed, this);
        this.model.on('change:view', this.view_changed, this);
        this.model.on('change:columns', this.columns_changed, this);
        this.model.on('change:rowpivots', this.rowpivots_changed, this);
        this.model.on('change:columnpivots', this.columnpivots_changed, this);
        this.model.on('change:aggregates', this.aggregates_changed, this);
        this.model.on('change:sort', this.sort_changed, this);
        this.model.on('change:settings', this.settings_changed, this);
        this.model.on('change:dark', this.dark_changed, this);

        this.model.on('msg:custom', this._update, this);

        this.displayed.then(()=> {
        let data = this.model.get('_data');
            if (data.length > 0){
                this.psp.update(this.model.get('_data'));
            } else {
                this.datasrc_changed();
            }
            this.settings_changed();
            this.dark_changed();
            this.view_changed();
            this.rowpivots_changed();
            this.columnpivots_changed();
            this.sort_changed();

            let columns = this.model.get('columns');
            if(columns.length > 0){
                this.columns_changed();
            }

            // do aggregates after columns
            this.aggregates_changed();
        });
    }

    remove() {
        this.psp.delete();
    }

    _update(msg: any) {
        if (msg.type === 'update') {
            this.psp.update(msg.data);
        } else if (msg.type === 'delete') {
            this.psp.delete();
        }
    }

    data_changed() {
        this.psp.delete();
        let schema = this.model.get('schema');
        let data = this.model.get('_data');

        if (Object.keys(schema).length > 0 ){
            this.psp.load(schema);
        }
        if (data.length > 0){
            this.psp.update(this.model.get('_data'));
        }
    }

    datasrc_changed(){
        this.psp.delete();
        let type = datasourceToSource(this.model.get('datasrc'));

        if (type === 'static') {
            this.data_changed();
        } else if (type === 'comm') {
            //grab session id 
            let els = this.model.get('datasrc').replace('comm://', '').split('/');
            let kernelId = els[0];
            let name = els[1];
            let channel = els[2];

            Session.listRunning().then(sessionModels => {
                for (let i=0; i<sessionModels.length; i++) {
                    if (sessionModels[i].kernel.id === kernelId) {
                        const session = Session.connectTo(sessionModels[i]);
                        const comm = session.kernel.connectToComm(name + '/' + channel);
                
                        comm.open('ack');
                        comm.onMsg = (msg: any) => {
                            let dat = msg['content']['data'];
                            let tmp = JSON.parse(dat);
                            this.psp.update(tmp);
                        };
                        comm.onClose = (msg: any) => {};
                    }
                }
            });
        } else {
            throw new Error('Source not recognized!');
        }
    }

    schema_changed(){
        this.psp.delete();
        let schema = this.model.get('schema');
        let data = this.model.get('_data');
        if (Object.keys(schema).length > 0 ){
            this.psp.load(schema);
        }
        if (data.length > 0){
            this.psp.update(this.model.get('_data'));
        }
    }

    view_changed(){
        this.psp.setAttribute('view', this.model.get('view'));
    }

    columns_changed(){
        let columns = this.model.get('columns');
        if(columns.length > 0){
            this.psp.setAttribute('columns', JSON.stringify(this.model.get('columns')));
        } else {
            this.psp.removeAttribute('columns');
        }
    }

    rowpivots_changed(){
        this.psp.setAttribute('row-pivots', JSON.stringify(this.model.get('rowpivots')));
    }

    columnpivots_changed(){
        this.psp.setAttribute('column-pivots', JSON.stringify(this.model.get('columnpivots')));
    }

    aggregates_changed(){
        this.psp.setAttribute('aggregates', JSON.stringify(this.model.get('aggregates')));
    }

    sort_changed(){
        this.psp.setAttribute('sort', JSON.stringify(this.model.get('sort')));
    }

    settings_changed(){
        this.psp.setAttribute('settings', this.model.get('settings'));
    }

    dark_changed(){
        let dark = this.model.get('dark');
        if(dark){
            this.el.classList.add(PSP_CONTAINER_CLASS_DARK);
        } else {
            this.el.classList.remove(PSP_CONTAINER_CLASS_DARK);
        }

        //FIXME dont do this, force a repaint instead
        this.data_changed();
    }
}



namespace Private {
    export let _loaded = false;

    export function createNode(node: HTMLDivElement): any {
        node.className = PSP_CONTAINER_CLASS;
        let psp = document.createElement('perspective-viewer');
        psp.className = PSP_CLASS;
        psp.setAttribute('type', MIME_TYPE);

        let btns = createCopyDl(psp);

        while(node.lastChild){
            node.removeChild(node.lastChild);
        }

        node.appendChild(psp);

        let div = document.createElement('div');
        div.style.setProperty('display', 'flex');
        div.style.setProperty('flex-direction', 'row');
        div.appendChild(btns['copy']);
        div.appendChild(btns['dl']);
        node.appendChild(div);
        return psp;
    }
}