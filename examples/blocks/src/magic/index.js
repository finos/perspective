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

import { manaStyleListener } from "./mana_cost_utils.js";

import { Workspace } from "@finos/perspective-workspace";
import perspective from "@finos/perspective/dist/esm/perspective.js";
import { DockPanel } from "@lumino/widgets";

import "@finos/perspective-viewer/dist/esm/perspective-viewer.js";
import "@finos/perspective-viewer-datagrid/dist/esm/perspective-viewer-datagrid.js";
import "@finos/perspective-viewer-d3fc/dist/esm/perspective-viewer-d3fc.js";
import "@finos/perspective-viewer/dist/css/themes.css";
import "@lumino/default-theme/style/index.css";
import "./index.css";

import "./upload_dialog.js";

const WORKER = perspective.worker();

const LAYOUT = (async function () {
    const req = await fetch("./layouts.json");
    const resp = await req.json();
    return resp;
})();

const SYMBOLS = (async function () {
    const req = await fetch("https://api.scryfall.com/symbology");
    const json = await req.json();
    return json.data;
})();

class MagicApp extends HTMLElement {
    async get_all_cards() {
        if (!this._table) {
            this.querySelector("#message").textContent =
                "Downloading all cards...";
            let url = "./all_identifiers.arrow";
            const res = await fetch(url);
            const ab = await res.arrayBuffer();
            this._table = await WORKER.table(ab);
            this.querySelector("#message").textContent = "";
        }

        return this._table;
    }

    async create_deck(filter) {
        const table = await this.get_all_cards();
        const view = await table.view({ filter: [["name", "in", filter]] });
        const arrow = await view.to_arrow();
        const deck_table = WORKER.table(arrow);
        view.delete();
        return await deck_table;
    }

    async on_load_deck({ detail: { name, filter } }) {
        this._dialog.parentElement.removeChild(this._dialog);
        this._dialog = undefined;
        if (!this.workspace.tables.has(name)) {
            this.workspace.addTable(name, await this.create_deck(filter));
        }

        const layout = structuredClone(await LAYOUT);
        layout.viewers.viewer1.title = name;
        layout.viewers.viewer1.table = name;
        layout.viewers.viewer2.table = name;
        layout.viewers.viewer3.table = name;
        this.workspace.restore(layout);
    }

    async on_new_view(event) {
        const grid = await event.detail.widget.viewer.getPlugin("Datagrid");
        grid.regular_table.addStyleListener(
            manaStyleListener.bind(grid.regular_table, await SYMBOLS)
        );
    }

    on_open_dialog() {
        if (!this._dialog) {
            this._dialog = document.createElement("upload-dialog");
            document.body.appendChild(this._dialog);
            this._dialog.addEventListener(
                "upload-event",
                this.on_load_deck.bind(this)
            );
        } else {
            this._dialog.parentElement.removeChild(this._dialog);
            this._dialog = undefined;
        }
    }

    connectedCallback() {
        this.innerHTML = `
            <div id="app">
                <div id="header">
                    <a href="https://perspective.finos.org">
                        <img
                            height="12"
                            src="https://raw.githubusercontent.com/finos/perspective/master/docs/static/svg/perspective-logo-light.svg" />
                    </a>
                    <label>Magic: the Gathering Deck Demo</label>
                    <button>Load Deck</button>
                    <span id="message"></span>
                </div>
                <div id="content"></div>
            </div>
        `;

        let panel = new DockPanel();
        DockPanel.attach(panel, this.querySelector("#content"));
        this.workspace = new Workspace(panel);
        this.workspace.addTable("all_cards", this.get_all_cards());
        // this.workspace.addEventListener("workspace-new-view", this.on_new_view);
        this.workspace.addViewer({ table: "all_cards", title: "all_cards" });
        window.addEventListener("resize", () => {
            panel.fit();
        });
        this.querySelector("button").addEventListener(
            "click",
            this.on_open_dialog.bind(this)
        );
    }
}

window.customElements.define("magic-app", MagicApp);
