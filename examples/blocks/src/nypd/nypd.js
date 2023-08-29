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

import perspective from "/node_modules/@finos/perspective/dist/cdn/perspective.js";
import {
    BlobReader,
    ZipReader,
    TextWriter,
} from "https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.6.81/+esm";

// TODO: this does not have iPad/iPhone support like the old ccrb demo.

// TODO: Better options for hosting?
//       http://raw.githack.com/faq#no-uptime-guarantee
let DATA_URL =
    "https://rawcdn.githack.com/new-york-civil-liberties-union/NYPD-Misconduct-Complaint-Database-Updated/f6cea944b347c96eb26b76323013640dff4b3d00/CCRB%20Complaint%20Database%20Raw%2004.28.2023.zip?min=1";

async function init_tables() {
    const blob = await (await fetch(DATA_URL)).blob();
    const zipFileReader = new BlobReader(blob);
    const zipReader = new ZipReader(zipFileReader);
    const entries = await zipReader.getEntries();
    const csv = await entries[0].getData(new TextWriter(), {
        onprogress: (i, m) => {
            window.workspace.appendChild(`${i} / ${m}`);
            console.log(`${i} / ${m}`);
        },
    });
    await zipReader.close();
    const worker = perspective.worker();
    const t = await worker.table(csv);
    console.log("Table initialized.");
    return t;
}

window.addEventListener("DOMContentLoaded", async function () {
    let table_fut = init_tables();

    const layouts = await (await this.fetch("layout.json")).json();
    const layout_names = Object.keys(layouts);
    const select = document.querySelector("select");
    const workspace = document.querySelector("perspective-workspace");
    for (const layout_name of layout_names) {
        const option = document.createElement("option");
        option.value = layout_name;
        option.textContent = layout_name;
        select.appendChild(option);
    }
    select.addEventListener("change", async (event) => {
        await workspace.restore(layouts[event.target.value]);
    });
    window.workspace.addTable("ccrb", await table_fut);
    workspace.restore(layouts[layout_names[0]]);
    console.log("READY");
});
