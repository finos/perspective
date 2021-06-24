/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {wasm} from "../../dist/esm/@finos/perspective-vieux";

/**
 *
 * @param {string} name a tag name for a Custom Element perspective plugin.
 * @returns
 */
global.registerPlugin = function registerPlugin(name) {
    return wasm.then(wasm => wasm.register_plugin(name));
};

if (global.__perspective_plugins__) {
    global.__perspective_plugins__.forEach(([name, plugin]) => global.registerPlugin(name, plugin));
}
