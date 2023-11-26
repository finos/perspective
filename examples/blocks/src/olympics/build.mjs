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

import sh from "@finos/perspective-scripts/sh.mjs";

import perspective from "@finos/perspective";
import { PerspectiveEsbuildPlugin } from "@finos/perspective-esbuild-plugin";
import { ZipReader, TextWriter, TextReader } from "@zip.js/zip.js";
import { build } from "esbuild";

import * as url from "url";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
    const __dirname = url
        .fileURLToPath(new URL(".", import.meta.url))
        .slice(0, -1);

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

    if (fs.existsSync(`${__dirname}/olympics.arrow`)) {
        return;
    }

    sh`kaggle datasets download -d heesoo37/120-years-of-olympic-history-athletes-and-results`
        .cwd(__dirname)
        .runSync();

    const zip = fs.readFileSync(
        `${__dirname}/120-years-of-olympic-history-athletes-and-results.zip`
    );

    const textReader = new TextReader(zip);
    const zipReader = new ZipReader(textReader);
    const entries = await zipReader.getEntries();
    const csv = await entries[0].getData(new TextWriter(), {
        onprogress: (p, t) => console.log(`(${p}b / ${t}b)`),
    });

    zipReader.close();

    const table = await perspective.table(csv);
    const view = await table.view();
    const arrow = await view.to_arrow();
    fs.writeFileSync(`${__dirname}/olympics.arrow`, Buffer.from(arrow));
    fs.unlinkSync(
        `${__dirname}/120-years-of-olympic-history-athletes-and-results.zip`
    );
    await view.delete();
}

main();
