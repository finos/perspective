// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

export type * from "../../dist/pkg/perspective-js.d.ts";
import type * as psp from "../../dist/pkg/perspective-js.d.ts";

import * as wasm_module from "../../dist/pkg/perspective-js.js";
import * as api from "./wasm/browser.ts";
import { load_wasm_stage_0 } from "./wasm/decompress.ts";

let GLOBAL_SERVER_WASM: Promise<ArrayBuffer>;

export function init_server(
    wasm: Promise<ArrayBuffer | Response> | ArrayBuffer | Response,
    disable_stage_0: boolean = false
) {
    if (wasm instanceof Response) {
        GLOBAL_SERVER_WASM = wasm.arrayBuffer();
    } else if (wasm instanceof Promise) {
        GLOBAL_SERVER_WASM = wasm.then((wasm: ArrayBuffer | Response) => {
            if (wasm instanceof Response) {
                return wasm.arrayBuffer();
            } else {
                return wasm;
            }
        });
    } else {
        GLOBAL_SERVER_WASM = Promise.resolve(wasm);
    }

    if (!disable_stage_0) {
        GLOBAL_SERVER_WASM = GLOBAL_SERVER_WASM.then(load_wasm_stage_0).then(
            (x) => x.buffer as ArrayBuffer
        );
    }
}

let GLOBAL_CLIENT_WASM: Promise<typeof psp>;

async function compilerize(
    wasm: ArrayBuffer | Response,
    disable_stage_0: boolean = false
) {
    const wasm_buff = disable_stage_0 ? wasm : await load_wasm_stage_0(wasm);
    await wasm_module.default(wasm_buff);
    await wasm_module.init();
    return wasm_module;
}

export type PerspectiveWasm =
    | ArrayBuffer
    | Response
    | typeof psp
    | Promise<ArrayBuffer | Response | Object>;

export function init_client(wasm: PerspectiveWasm, disable_stage_0 = false) {
    if (wasm instanceof ArrayBuffer) {
        GLOBAL_CLIENT_WASM = compilerize(wasm, disable_stage_0);
    } else if (wasm instanceof Response) {
        GLOBAL_CLIENT_WASM = wasm
            .arrayBuffer()
            .then((x) => compilerize(x, disable_stage_0));
    } else if (wasm instanceof Promise) {
        GLOBAL_CLIENT_WASM = wasm.then((wasm) => {
            if (wasm instanceof ArrayBuffer) {
                return compilerize(wasm, disable_stage_0);
            } else if (wasm instanceof Response) {
                return wasm
                    .arrayBuffer()
                    .then((x) => compilerize(x, disable_stage_0));
            } else {
                // } else if (wasm instanceof Object) {
                return wasm as typeof psp;
            }
        });
    } else if (wasm instanceof Object) {
        GLOBAL_CLIENT_WASM = Promise.resolve(wasm as typeof psp);
    }

    console.log(GLOBAL_CLIENT_WASM);
}

function get_client() {
    if (GLOBAL_CLIENT_WASM === undefined) {
        const viewer_class: any = customElements.get("perspective-viewer");
        if (viewer_class) {
            GLOBAL_CLIENT_WASM = Promise.resolve(viewer_class.__wasm_module__);
        } else {
            throw new Error("Missing perspective-client.wasm");
        }
    }

    return GLOBAL_CLIENT_WASM;
}

function get_server() {
    if (GLOBAL_SERVER_WASM === undefined) {
        throw new Error("Missing perspective-server.wasm");
    }

    return GLOBAL_SERVER_WASM.then((x) => x.slice(0));
}

export async function websocket(url: string | URL) {
    return await api.websocket(get_client(), url);
}

export async function worker() {
    return await api.worker(get_client(), get_server());
}

export default { websocket, worker, init_client, init_server };
