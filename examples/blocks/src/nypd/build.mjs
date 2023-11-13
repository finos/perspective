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

// Gets the updated data from the NYCLU and prepare it for Perspective.

import perspective from "@finos/perspective";
import { PerspectiveEsbuildPlugin } from "@finos/perspective-esbuild-plugin";
import { Uint8ArrayReader, ZipReader, TextWriter } from "@zip.js/zip.js";
import { build } from "esbuild";

import * as fs from "node:fs/promises";
import * as url from "url";
import * as fss from "node:fs";
import * as path from "node:path";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let DATA_URL =
    "https://rawcdn.githack.com/new-york-civil-liberties-union/NYPD-Misconduct-Complaint-Database-Updated/f6cea944b347c96eb26b76323013640dff4b3d00/CCRB%20Complaint%20Database%20Raw%2004.28.2023.zip?min=1";

async function fetch_progress(url) {
    const response = await fetch(url);
    const reader = response.body.getReader();
    const contentLength = +response.headers.get("Content-Length");
    let receivedLength = 0;
    let chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        chunks.push(value);
        receivedLength += value.length;
        let pct = ((100 * receivedLength) / contentLength).toFixed(1);
        console.log(`Downloading (${pct}%)`);
    }

    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }

    const zipFileReader = new Uint8ArrayReader(chunksAll);
    const zipReader = new ZipReader(zipFileReader);
    const entries = await zipReader.getEntries();
    const csv = await entries[0].getData(new TextWriter(), {
        onprogress: (p, t) => console.log(`(${p}b / ${t}b)`),
    });

    zipReader.close();

    let worker = perspective.worker();
    let t = await worker.table(csv);
    let view = await t.view();

    return new Uint8Array(await view.to_arrow());
}

async function main() {
    if (!fss.existsSync(`${__dirname}/nypdccrb.arrow`)) {
        await fs.writeFile(
            `${__dirname}/nypdccrb.arrow`,
            await fetch_progress(DATA_URL)
        );

        console.log("Wrote nypdccrb.arrow");
    }

    await build({
        entryPoints: [path.join(__dirname, "index.js")],
        outdir: __dirname,
        bundle: true,
        format: "esm",
        plugins: [PerspectiveEsbuildPlugin()],
        loader: {
            ".css": "css",
            ".png": "file",
        },
        // this build is done in a copied build folder, so nothing in-tree is overwritten.
        allowOverwrite: true,
        sourcemap: "linked",
    });
}

main();
