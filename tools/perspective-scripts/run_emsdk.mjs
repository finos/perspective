/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import sh from "./sh.mjs";
import * as url from "url";

const cwd = process.cwd();
const cmd = sh(process.argv.slice(2).join(" "));
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);
const emsdkdir = sh.path`${__dirname}/../../.emsdk`;
const {
    default: { emscripten },
} = await import(sh.path`${__dirname}/../../package.json`, {
    assert: { type: "json" },
});

if (!emscripten) {
    throw new Error("Emscripten version not specified in package.json");
}

sh`cd ${emsdkdir}`.sh`. ./emsdk_env.sh >/dev/null 2>&1`
    .sh`emsdk activate ${emscripten} >/dev/null`.sh`cd ${cwd}`
    .sh(cmd)
    .runSync();
