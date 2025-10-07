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

// Download a full Pyodide distribution from github and extract it to rust/target dir for
// use in integration tests

import { getPyodideVersion, getPyodideDownloadDir } from "./pyodide.mjs";

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import { execFileSync } from "node:child_process";
const pyodideVersion = getPyodideVersion();

function downloadPyodide() {
    const pyodideUrl = `https://github.com/pyodide/pyodide/releases/download/${pyodideVersion}/pyodide-${pyodideVersion}.tar.bz2`;
    const downloadDir = getPyodideDownloadDir(); // the download dir is versioned
    const tarball = path.join(downloadDir, `pyodide-${pyodideVersion}.tar.bz2`);
    const buildStamp = path.join(downloadDir, "psp-build-stamp.txt");
    const pyodideLock = path.join(downloadDir, "pyodide", "pyodide-lock.json");
    if (fs.existsSync(buildStamp) && fs.existsSync(pyodideLock)) {
        console.log(
            `Pyodide ${pyodideVersion} already extracted to ${downloadDir}`,
        );
    } else {
        fs.rmSync(buildStamp, { force: true });
        console.log(
            `Downloading Pyodide ${pyodideVersion} from ${pyodideUrl}...`,
        );
        fs.mkdirSync(downloadDir, { recursive: true });
        execFileSync("wget", ["-O", tarball, pyodideUrl], {
            stdio: "inherit",
        });
        console.log(`Extracting ${tarball}...`);
        execFileSync("tar", ["-xvf", tarball, "-C", downloadDir], {
            stdio: "inherit",
        });
        console.log(`Removing ${tarball}...`);
        fs.rmSync(tarball);
        // assert presence of a known file
        assert(fs.existsSync(pyodideLock), `${pyodideLock} not found`);
        console.log(`Extracted to ${downloadDir}`);
        fs.writeFileSync(buildStamp, ""); // prevent re-download/extract
    }
}

downloadPyodide();
