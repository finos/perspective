/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {
  Widget
} from '@phosphor/widgets';

import {
  Message
} from '@phosphor/messaging';

import {
  Session
} from '@jupyterlab/services';

import {
  IRenderMime
} from '@jupyterlab/rendermime-interfaces';

import '../src/css/index.css';

import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";

export
const MIME_TYPE = 'application/psp+json';

export
const PSP_CLASS = 'jp-PSPViewer';

export
const PSP_CONTAINER_CLASS = 'jp-PSPContainer';

export
class RenderedPSP extends Widget implements IRenderMime.IRenderer {
  constructor() {
    super({ node: Private.createNode() });
  }

  onAfterAttach(msg: Message) : void{
      if (this._loaded) return;
      let psp = (<any>(this.node.querySelector('perspective-viewer')));

      if(this.datatype === 'static'){
        psp.load(this.data);

      } else if (this.datatype === 'ws' || this.datatype === 'wss'){
        // TODO finish this part eventually
        let socket = new WebSocket(this.datasrc);
        socket.onopen = function (event: any) {
          console.log('connected to ' + this.datasrc);
        }.bind(this);
        socket.onmessage = function (event: any) {
          console.log(event.data);
        }.bind(this);

      } else if (this.datatype === 'http' || this.datatype === 'https'){
        // TODO

      } else if (this.datatype === 'comm'){
        //grab session id 
        let els = this.datasrc.replace('comm://', '').split('/');
        let kernelId = els[0];
        let name = els[1];
        let channel = els[2];

        Session.listRunning().then(sessionModels => {
          for(let i=0; i<sessionModels.length; i++){
            console.log(sessionModels[i]);
            if(sessionModels[i].kernel.id === kernelId){
              Session.connectTo(sessionModels[i]).then((session) => {

                let comm = session.kernel.connectToComm(name + '/' + channel);
                comm.open('ack');
                comm.onMsg = (msg: any) => {
                  console.log(msg);  // 'hello'
                  let dat = msg['content']['data'];
                  let tmp = JSON.parse(dat);
                  psp.update(tmp);
                };
                comm.onClose = (msg: any) => {
                  console.log(msg);  // 'bye'
                };

              });
            }
          }
        });
      }
  }

  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    let data = model.data[MIME_TYPE] as string;
    console.log(data);
    try {
      this.data = JSON.parse(data) as object;
      this.datatype = 'static';
      this.datasrc = '';

      if(Object.keys(this.data).length === 0){
        this.data = [   
            {'x': 1, 'y':'a', 'z': true},
            {'x': 2, 'y':'b', 'z': false},
            {'x': 3, 'y':'c', 'z': true},
            {'x': 4, 'y':'d', 'z': false}
        ];
      }


    return Promise.resolve();
    } catch (e) {
      this.datasrc = data;
      if(data.indexOf('ws://') !== -1){
        this.datatype = 'ws';
      } else if(data.indexOf('wss://') !== -1){
        this.datatype = 'wss';
      } else if(data.indexOf('http://') !== -1){
        this.datatype = 'http';
      } else if(data.indexOf('https://') !== -1){
        this.datatype = 'http';
      } else if(data.indexOf('comm://') !== -1){
        this.datatype = 'comm';
      } else{
        throw e;
      }
      return Promise.resolve();
    }
  }

  data: object;
  datatype: string;
  datasrc: string;
  private _loaded: boolean;
}


export
const rendererFactory: IRenderMime.IRendererFactory = {
  safe: false,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new RenderedPSP()
};


const extensions: IRenderMime.IExtension | IRenderMime.IExtension[] = [
  {
    id: 'perspective:factory',
    rendererFactory,
    dataType: 'string',
    fileTypes: [{
      name: 'perspective',
      fileFormat: 'base64',
      mimeTypes: [MIME_TYPE],
      extensions: ['psp']
    }],
    documentWidgetFactoryOptions: {
      name: 'perspective',
      modelName: 'base64',
      primaryFileType: 'psp',
      fileTypes: ['psp'],
      defaultFor: ['psp']
    },
  }
];

export default extensions;

namespace Private {
  export
  let _loaded = false;

  export
  function createNode(): HTMLElement {
    let node = document.createElement('div');
    node.className = PSP_CONTAINER_CLASS;
    let psp = document.createElement('perspective-viewer');
    psp.className = PSP_CLASS;
    psp.setAttribute('type', MIME_TYPE);
    node.appendChild(psp);
    return node;
  }
}
