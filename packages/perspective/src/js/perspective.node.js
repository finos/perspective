/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require('./perspective.js');

const fs = require('fs');

const WebSocket = require('ws');

let Module;

if (typeof WebAssembly === "undefined") {
    const load_perspective = require("../../build/asmjs/psp.js").load_perspective;
    Module = load_perspective({
        wasmJSMethod: "asmjs",
        memoryInitializerPrefixURL: 'build/asmjs/',
        asmjsCodeFile: "asmjs/psp.js",
        ENVIRONMENT: "NODE"
    });
} else {
    const load_perspective = require("../../build/wasm_sync/psp.js").load_perspective;
    const wasm = fs.readFileSync('./build/wasm_sync/psp.wasm');
    Module = load_perspective({
        wasmBinary: wasm,
        wasmJSMethod: 'native-wasm',
        ENVIRONMENT: "NODE"
    });    
}

module.exports = perspective(Module);

/**
 * A Server instance for a remote perspective.
 */
class WebSocketHost extends module.exports.Host {

    constructor(port = 8080) {
        super();
        this.REQS = {};        
        this._wss = new WebSocket.Server({port: port});
        this._wss.on('connection', ws => {
            ws.on('message', msg => {
                msg = JSON.parse(msg);
                this.REQS[msg.id] = ws;
                this.process(msg);
            });
            ws.on('error', console.error);
        });
        console.log(`Listening on port ${port}`);
    }

    post(msg) {
        this.REQS[msg.id].send(JSON.stringify(msg));
        delete this.REQS[msg.id];
    }

    init() {
       
    }

    open(name, data, options) {
        this._tables[name] = module.exports.table(data, options);
    }
}

module.exports.WebSocketHost = WebSocketHost;