/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import buffer from "../../build/wasm_sync/psp.wasm";

const perspective = require('./perspective.js');

const fs = require('fs');

const WebSocket = require('ws');

const load_perspective = require("../../build/wasm_sync/psp.js").load_perspective;

let Module = load_perspective({
    wasmBinary: buffer,
    wasmJSMethod: 'native-wasm',
    ENVIRONMENT: "NODE"
});    

module.exports = perspective(Module);

let CLIENT_ID_GEN = 0;

/**
 * A Server instance for a remote perspective.
 */
class WebSocketHost extends module.exports.Host {

    constructor(port = 8080) {
        super();
        this.REQS = {};        
        this._wss = new WebSocket.Server({port: port, perMessageDeflate: true});
        this._wss.on('connection', ws => {
            ws.id = CLIENT_ID_GEN++;
            ws.on('message', msg => {
                msg = JSON.parse(msg);
                this.REQS[msg.id] = ws;
                try {
                    this.process(msg, ws.id);
                } catch (e) {
                    console.error(e);
                }
            });
            ws.on('close', () => {
                this.clear_views(ws.id);
            });
            ws.on('error', console.error);
        });
        console.log(`Listening on port ${port}`);
    }

    post(msg) {
        this.REQS[msg.id].send(JSON.stringify(msg));
        delete this.REQS[msg.id];
    }

    open(name, data, options) {
        this._tables[name] = module.exports.table(data, options);
    }
}

module.exports.WebSocketHost = WebSocketHost;