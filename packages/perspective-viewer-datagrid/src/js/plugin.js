/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {registerPlugin} from "@finos/perspective-viewer/src/js/utils.js";
import "regular-table";

import {createModel, configureRegularTable, formatters} from "./regular_table_handlers.js";
import MATERIAL_STYLE from "../less/regular_table.less";
import {configureRowSelectable, deselect} from "./row_selection.js";
import {configureClick} from "./click.js";
import {configureEditable} from "./editing.js";
import {configureSortable} from "./sorting.js";
import {PLUGIN_SYMBOL} from "./plugin_menu.js";

function lock(body) {
    let lock;
    return async function(...args) {
        while (lock) {
            await lock;
        }

        let resolve;
        try {
            lock = new Promise(x => (resolve = x));
            await body.apply(this, args);
        } finally {
            lock = undefined;
            resolve();
        }
    };
}

async function with_safe_view(f) {
    try {
        return await f();
    } catch (e) {
        if (e.message !== "View is not initialized") {
            throw e;
        }
    }
}

customElements.define(
    "perspective-viewer-datagrid",
    class extends HTMLElement {
        constructor() {
            super();
            this.datagrid = document.createElement("regular-table");
            this.datagrid.formatters = formatters;
            this.draw = lock(this.draw);
        }

        async activate(view) {
            let viewer = this.parentElement;
            let table = viewer.table;
            if (!this._initialized) {
                this._initialized = true;
                this.innerHTML = "";
                this.appendChild(this.datagrid);
                this.model = await createModel(this.datagrid, table, view);
                configureRegularTable(this.datagrid, this.model);
                await configureRowSelectable.call(this.model, this.datagrid, viewer);
                await configureClick.call(this.model, this.datagrid, viewer);
                await configureEditable.call(this.model, this.datagrid, viewer);
                await configureSortable.call(this.model, this.datagrid, viewer);
            } else {
                await createModel(this.datagrid, table, view, this.model);
            }
        }

        get name() {
            return "Datagrid";
        }

        get selectMode() {
            return "toggle";
        }

        get deselectMode() {
            return "pivots";
        }

        async draw(view) {
            await with_safe_view(async () => {
                await this.activate(view);
                let viewer = this.parentElement;
                const draw = this.datagrid.draw({invalid_columns: true});
                if (!this.model._preserve_focus_state) {
                    this.datagrid.scrollTop = 0;
                    this.datagrid.scrollLeft = 0;
                    deselect(this.datagrid, viewer);
                    this.datagrid._resetAutoSize();
                } else {
                    this.model._preserve_focus_state = false;
                }

                await draw;
            });
        }

        async update(view) {
            await with_safe_view(async () => {
                this.model._num_rows = await view.num_rows();
                await this.datagrid.draw();
            });
        }

        async resize() {
            await with_safe_view(async () => {
                if (this._initialized) {
                    await this.datagrid.draw();
                }
            });
        }

        async clear() {
            this.datagrid.clear();
        }

        save() {
            if (this.datagrid) {
                const datagrid = this.datagrid;
                if (datagrid[PLUGIN_SYMBOL]) {
                    return JSON.parse(JSON.stringify(datagrid[PLUGIN_SYMBOL]));
                }
            }
            return {};
        }

        restore(token) {
            const datagrid = this.datagrid;
            datagrid[PLUGIN_SYMBOL] = token;
        }
    }
);

/**
 * Appends the default table CSS to `<head>`, should be run once on module
 * import.
 *
 */
function _register_global_styles() {
    const style = document.createElement("style");
    style.textContent = MATERIAL_STYLE;
    document.head.appendChild(style);
}

/******************************************************************************
 *
 * Main
 *
 */

registerPlugin("perspective-viewer-datagrid");

_register_global_styles();
