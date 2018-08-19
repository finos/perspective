/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import worker from "worker-loader?inline=true&fallback=false!@jpmorganchase/perspective/src/js/perspective.wasm.js";
import buffer from "arraybuffer-loader!@jpmorganchase/perspective/build/wasm_async/psp.wasm" 

window.__PSP_WORKER__ = worker;
window.__PSP_WASM__ = buffer;