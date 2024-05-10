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

import pkg from "../../package.json" with {type:"json"};
import path from "path";
import os from "os";
import fs from "fs";
import * as dotenv from "dotenv";
import sh from "./sh.mjs";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

// console.log(pkg);
const emscripten = pkg.emscripten;

dotenv.config({
    path: "./.perspectiverc",
});

function base() {
    return sh.path`${__dirname}/../../.emsdk`;
}

function emsdk_checkout() {
    function git(args) {
        sh`git ${args}`.runSync();
    }

    git(["clone", "https://github.com/emscripten-core/emsdk.git", base()]);
}

function emsdk(...args) {
    const basedir = base();
    const suffix = os.type() == "Windows_NT" ? ".bat" : "";
    const emsdk = path.join(basedir, "emsdk" + suffix);
    sh`${emsdk} ${args}`.runSync();
}

function toolchain_install() {
    console.log(`-- Installing Emscripten ${emscripten}`);
    sh`git pull`.cwd(".emsdk").runSync();
    emsdk("install", emscripten);
    emsdk("activate", emscripten);
    console.log(`-- Emscripten ${emscripten} installed`);
}

function repo_check() {
    return fs.existsSync(path.join(base(), "emsdk_env.sh"));
}

if (!process.env.PSP_SKIP_EMSDK_INSTALL) {
    // if a stale toolchain is still activated in the shell, these vars break
    // emsdk install in a confusing way.  ensure they are unset
    for (let ev of ["EMSDK", "EMSDK_NODE", "EMSDK_PYTHON", "SSL_CERT_FILE"]) {
        delete process.env[ev];
    }

    if (!repo_check()) {
        emsdk_checkout();
    }

    toolchain_install();
}
