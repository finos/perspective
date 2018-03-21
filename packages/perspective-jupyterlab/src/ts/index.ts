/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {Widget} from '@phosphor/widgets';
import {Message} from '@phosphor/messaging';
import {Session} from '@jupyterlab/services';
import {IRenderMime} from '@jupyterlab/rendermime-interfaces';
import {Clipboard} from '@jupyterlab/apputils';
import '../src/css/index.css';

import {PSPHelper, PSPWebsocketHelper, PSPSocketIOHelper, PSPHttpHelper, convertToCSV} from './utils.js';

import "@jpmorganchase/perspective-viewer";
import "@jpmorganchase/perspective-viewer-hypergrid";
import "@jpmorganchase/perspective-viewer-highcharts";

export
const MIME_TYPE = 'application/psp+json';

export
const PSP_CLASS = 'jp-PSPViewer';

export
const PSP_CONTAINER_CLASS = 'jp-PSPContainer';

interface PerspectiveSpec {
    data: string,
    layout: string,
    config: string;
}


function createCopy(psp: any) : HTMLElement {
    let button = document.createElement('button');
    button.textContent = 'copy/dl';

    let viewtype: string;
    let data: any;
    let height: number;
    let width: number;

    button.onmousedown = () => {
        viewtype = psp.getAttribute('view');
        if (viewtype === 'hypergrid') {
            psp._view.to_json().then((dat: Array<Object>) => {
                data = dat;
            });
        } else if (viewtype === 'vertical' || 
                   viewtype === 'horizontal' || 
                   viewtype === 'heatmap' || 
                   viewtype === 'line' || 
                   viewtype === 'scatter'
            ) {
            let svg = psp.querySelector('svg') as SVGSVGElement;
            height = svg.height.baseVal.value;
            width = svg.width.baseVal.value;

            data = new XMLSerializer().serializeToString(svg);
        }
    }

    button.onclick = () => {
        let copied = false;
        let timeout = 100;
        while (timeout<=16000){
            setTimeout(() => {
                if(copied){
                    return;
                }
                if (data) {
                    if(viewtype === 'hypergrid'){
                        Clipboard.copyToSystem(convertToCSV(data));
                    } else if (viewtype === 'vertical' || 
                       viewtype === 'horizontal' || 
                       viewtype === 'heatmap' || 
                       viewtype === 'line' || 
                       viewtype === 'scatter') {

                        let canvas = document.createElement('canvas') as HTMLCanvasElement;
                        let ctx = canvas.getContext("2d");
                        let DOMURL = window.URL || (window as any).webkitURL || window;
                        let img = new Image();
                        let svg = new Blob([data], {type: "image/svg+xml;charset=utf-8"});

                        let url = DOMURL.createObjectURL(svg);
                        img.onload = function() {
                            ctx.drawImage(img, 0, 0, width, height);
                            let png = canvas.toDataURL("image/png");
                            var a = document.createElement('a');
                            a.download = 'psp.png';
                            a.target = "_blank";
                            a.href = png;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            DOMURL.revokeObjectURL(png);
                        };
                        img.src = url;
                        Clipboard.copyToSystem(data);
                    }
                    copied = true;
                } else if (timeout == 16000){
                    console.error('Timeout waiting for perspective!');
                }
            }, timeout);
            timeout *= 2;
        }
    };

    return button;
}


export class RenderedPSP extends Widget implements IRenderMime.IRenderer {

    constructor() {
        super({node: Private.createNode()});
    }

    onAfterAttach(msg: Message) : void {
        if (this._loaded) return;
        let psp = (<any>(this.node.querySelector('perspective-viewer')));
        
        let layout = JSON.parse(this._lyt);
        for(let key in layout){
            if(layout[key]){
                if(key !== 'view'){
                    psp.setAttribute(key, JSON.stringify(layout[key]));
                } else {
                    psp.setAttribute(key, layout[key]);
                }
            }
        }

        if (this._datatype === 'static') {
            psp.load(this._data);
        } else if (this._datatype === 'ws' || this._datatype === 'wss') {
            let config = JSON.parse(this._config);
            let send = config.send || '';
            let records = config.records || false;
            this._helper = new PSPWebsocketHelper(this._datasrc, send, records);
            this._helper.start(psp);

        } else if (this._datatype === 'http' || this._datatype === 'https') {
            let config = JSON.parse(this._config);
            let field = config.field || '';
            let records = config.records || false;
            let repeat = config.repeat || 1;
            this._helper = new PSPHttpHelper(this._datasrc, field, records, repeat);
            this._helper.start(psp);

        } else if (this._datatype === 'sio') {
            let config = JSON.parse(this._config);
            let channel = config.channel || '';
            let records = config.records || false;
            let addr = this._datasrc.replace('sio://', '');
            this._helper = new PSPSocketIOHelper(addr, channel, records);
            this._helper.start(psp);

        } else if (this._datatype === 'comm') {
            //grab session id 
            let els = this._datasrc.replace('comm://', '').split('/');
            let kernelId = els[0];
            let name = els[1];
            let channel = els[2];

            Session.listRunning().then(sessionModels => {
                for (let i=0; i<sessionModels.length; i++) {
                    if (sessionModels[i].kernel.id === kernelId) {
                        Session.connectTo(sessionModels[i]).then(session => {

                            let comm = session.kernel.connectToComm(name + '/' + channel);
                            comm.open('ack');
                            comm.onMsg = (msg: any) => {
                                let dat = msg['content']['data'];
                                let tmp = JSON.parse(dat);
                                psp.update(tmp);
                            };
                            comm.onClose = (msg: any) => {};

                        });
                    }
                }
            });
        }
    }

    renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        const {data, layout, config} = model.data[MIME_TYPE] as any | PerspectiveSpec;
        this._lyt = layout;

        try {
            this._data = JSON.parse(data) as object;
            this._datatype = 'static';
            this._datasrc = '';
            this._config = '';

            if (Object.keys(this._data).length === 0){
                this._data = [   
                        {'x': 1, 'y':'a', 'z': true},
                        {'x': 2, 'y':'b', 'z': false},
                        {'x': 3, 'y':'c', 'z': true},
                        {'x': 4, 'y':'d', 'z': false}
                ];
            }

            return Promise.resolve();

        } catch (e) {
            this._datasrc = data;
            this._config = config;
            if(data.indexOf('sio://') !== -1){
                this._datatype = 'sio';
            } else if(data.indexOf('ws://') !== -1){
                this._datatype = 'ws';
            } else if(data.indexOf('wss://') !== -1){
                this._datatype = 'wss';
            } else if(data.indexOf('http://') !== -1){
                this._datatype = 'http';
            } else if(data.indexOf('https://') !== -1){
                this._datatype = 'http';
            } else if(data.indexOf('comm://') !== -1){
                this._datatype = 'comm';
            } else{
                throw e;
            }
            return Promise.resolve();
        }
    }

    private _data: object;
    private _datatype: string;
    private _datasrc: string;
    private _lyt: string; // not widget layout
    private _config: string;
    private _loaded: boolean;
    private _helper: PSPHelper;
}


export const rendererFactory: IRenderMime.IRendererFactory = {
    safe: false,
    mimeTypes: [MIME_TYPE],
    createRenderer: options => new RenderedPSP()
};


const extensions: IRenderMime.IExtension | IRenderMime.IExtension[] = [{
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
}];

export default extensions;

namespace Private {
    export let _loaded = false;

    export function createNode(): HTMLElement {
        let node = document.createElement('div');
        node.className = PSP_CONTAINER_CLASS;
        let psp = document.createElement('perspective-viewer');
        psp.className = PSP_CLASS;
        psp.setAttribute('type', MIME_TYPE);

        let btn = createCopy(psp);

        node.appendChild(psp);
        node.appendChild(btn);
        return node;
    }
}
