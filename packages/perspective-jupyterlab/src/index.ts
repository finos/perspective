// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import {
  Widget
} from '@phosphor/widgets';

import {
  Message
} from '@phosphor/messaging';

import {
  IRenderMime
} from '@jupyterlab/rendermime-interfaces';

import '../style/index.css';

import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";

export
const MIME_TYPE = 'application/psp';

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
      let x = (<any>(this.node.querySelector('perspective-viewer')));
      if(this.datatype === 'static'){
        x.load(this.data);
      } else if (this.datatype === 'ws' || this.datatype === 'wss'){
        let socket = new WebSocket(this.datasrc);
        socket.onopen = function (event: any) {
          console.log('connected to ' + this.datasrc);
        }.bind(this);
        socket.onmessage = function (event: any) {
          console.log(event.data);
        }.bind(this);
      }
      this._loaded = true;
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
    }
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

