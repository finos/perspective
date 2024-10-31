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

import * as api from "./browser.ts";
export type * from "../../dist/pkg/perspective-js.d.ts";

import * as wasm_module from "../../dist/pkg/perspective-js.js";
import wasm_binary from "../../dist/pkg/perspective-js.wasm";
import { load_wasm_stage_0 } from "@finos/perspective/src/ts/decompress.ts";

import type * as psp from "../../dist/pkg/perspective-js.d.ts";

type WasmElement = {
    __wasm_module__: Promise<typeof psp>;
};

export async function compile_perspective() {
    let elem = customElements.get(
        "perspective-viewer"
    ) as unknown as WasmElement;

    if (!elem) {
        console.warn(
            "No `<perspective-viewer>` Custom Element found, using inline `Client`."
        );

        const module = await load_wasm_stage_0(
            wasm_binary as unknown as ArrayBuffer
        );

        await wasm_module.default(module);
        await wasm_module.init();
        return wasm_module;
    }

    return elem.__wasm_module__;
}

export async function websocket(url: string | URL) {
    const wasm_module = compile_perspective();
    return await api.websocket(wasm_module, url);
}

export async function worker() {
    const wasm_module = compile_perspective();
    return await api.worker(wasm_module);
}

export default { websocket, worker };
