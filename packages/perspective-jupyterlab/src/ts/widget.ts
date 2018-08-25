// Copyright (c) Tim Paine.
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel, DOMWidgetView, ISerializers
} from '@jupyter-widgets/base';

import {
  PERSPECTIVE_VERSION
} from './version.ts';

import {Session} from '@jupyterlab/services';

/* Helper methods */
import {
  PSPHelper, PSPWebsocketHelper, PSPSocketIOHelper, PSPHttpHelper, datasourceToSource, createCopyDl
} from './utils.ts';

/* perspective components */
import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";

/* embed wasm */
import "../js/embed.js";

/* css */
import "@jpmorganchase/perspective-viewer/build/material.css";
import '../css/index.css';
import '../css/material.dark.css';

/* defines */
export
const MIME_TYPE = 'application/psp+json';

export
const PSP_CLASS = 'jp-PSPViewer';

export
const PSP_CONTAINER_CLASS = 'jp-PSPContainer';

export
const PSP_CONTAINER_CLASS_DARK = 'jp-PSPContainer-dark';



export
class PerspectiveModel extends DOMWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: PerspectiveModel.model_name,
      _model_module: PerspectiveModel.model_module,
      _model_module_version: PerspectiveModel.model_module_version,
      _view_name: PerspectiveModel.view_name,
      _view_module: PerspectiveModel.view_module,
      _view_module_version: PerspectiveModel.view_module_version,
      
      data: null,
      datasrc: 'static',
      schema: {},
      view: 'hypergrid',
      columns: [],
      rowpivots: [],
      columnpivots: [],
      aggregates: [],
      sort: [],
      settings: false,
      dark: false,
      helper_config: '{}'
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
  private helper: PSPHelper;

  render() {
    this.psp = Private.createNode(this.el);
    let observer = new MutationObserver(this.psp.notifyResize.bind(this.psp));
    observer.observe(this.el, {attributes: true});

    this.model.on('change:data', this.data_changed, this);
    this.model.on('change:datasrc', this.datasrc_changed, this);
    this.model.on('change:schema', this.schema_changed, this);
    this.model.on('change:view', this.view_changed, this);
    this.model.on('change:columns', this.columns_changed, this);
    this.model.on('change:rowpivots', this.rowpivots_changed, this);
    this.model.on('change:columnpivots', this.columnpivots_changed, this);
    this.model.on('change:aggregates', this.aggregates_changed, this);
    this.model.on('change:sort', this.sort_changed, this);
    this.model.on('change:settings', this.settings_changed, this);
    this.model.on('change:dark', this.dark_changed, this);
  }

  data_changed(){
    this.psp.update(this.model.get('data'));
  }

  datasrc_changed(){
    let type = datasourceToSource(this.model.get('datasrc'));
    if (type === 'static') {
      this.data_changed();
    } else if (type === 'ws' || type === 'wss') {
        let config = JSON.parse(this.model.get('helper_config'));
        let send = config.send || '';
        let records = config.records || false;
        this.helper = new PSPWebsocketHelper(this.model.get('datasrc'), send, records);
        this.helper.start(this.psp);
    } else if (type === 'http' || type === 'https') {
        let config = JSON.parse(this.model.get('helper_config'));
        let field = config.field || '';
        let records = config.records || false;
        let repeat = config.repeat || 1;
        this.helper = new PSPHttpHelper(this.model.get('datasrc'), field, records, repeat);
        this.helper.start(this.psp);

    } else if (type === 'sio') {
        let config = JSON.parse(this.model.get('helper_config'));
        let channel = config.channel || '';
        let records = config.records || false;
        let addr = this.model.get('datasrc').replace('sio://', '');
        this.helper = new PSPSocketIOHelper(addr, channel, records);
        this.helper.start(this.psp);

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
    }
  }

  schema_changed(){
    this.psp.delete();
    this.psp.load(this.model.get('schema'));
    this.data_changed();
  }

  view_changed(){
    this.psp.setAttribute('view', this.model.get('view'));
  }

  columns_changed(){
    this.psp.setAttribute('columns', JSON.stringify(this.model.get('columns')));
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