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

const VIEWER_MAP = new WeakMap();
const INSTALLED = new WeakMap();

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

const datagridPlugin = lock(async function(regular, viewer, view) {
    const is_installed = INSTALLED.has(regular);
    const table = viewer.table;
    let model;
    if (!is_installed) {
        model = await createModel(regular, table, view);
        configureRegularTable(regular, model);
        await configureSortable.call(model, regular, viewer);
        await configureRowSelectable.call(model, regular, viewer);
        await configureEditable.call(model, regular, viewer);
        await configureClick.call(model, regular, viewer);
        INSTALLED.set(regular, model);
    } else {
        model = INSTALLED.get(regular);
        await createModel(regular, table, view, model);
    }

    try {
        const draw = regular.draw({invalid_columns: true});
        if (!model._preserve_focus_state) {
            regular.scrollTop = 0;
            regular.scrollLeft = 0;
            deselect(regular, viewer);
            regular._resetAutoSize();
        } else {
            model._preserve_focus_state = false;
        }

        await draw;
    } catch (e) {
        if (e.message !== "View is not initialized") {
            throw e;
        }
    }
});

/**
 * Initializes a new datagrid renderer if needed, or returns an existing one
 * associated with a rendering `<div>` from a cache.
 *
 * @param {*} element
 * @param {*} div
 * @returns
 */
function get_or_create_datagrid(element, div) {
    let datagrid;
    if (!VIEWER_MAP.has(div)) {
        datagrid = document.createElement("regular-table");
        datagrid.formatters = formatters;
        div.innerHTML = "";
        div.appendChild(document.createElement("slot"));
        element.appendChild(datagrid);
        VIEWER_MAP.set(div, datagrid);
    } else {
        datagrid = VIEWER_MAP.get(div);
        if (!datagrid.isConnected) {
            div.innerHTML = "";
            div.appendChild(document.createElement("slot"));
            datagrid.clear();
            element.appendChild(datagrid);
        }
    }

    return datagrid;
}

/**
 * <perspective-viewer> plugin.
 *
 * @class DatagridPlugin
 */
class DatagridPlugin {
    static name = "Datagrid";
    static selectMode = "toggle";
    static deselectMode = "pivots";

    static async update(div) {
        try {
            const datagrid = VIEWER_MAP.get(div);
            const model = INSTALLED.get(datagrid);
            model._num_rows = await model._view.num_rows();
            await datagrid.draw();
        } catch (e) {
            if (e.message !== "View is not initialized") {
                throw e;
            }
        }
    }

    static async create(div, view) {
        try {
            const datagrid = get_or_create_datagrid(this, div);
            await datagridPlugin(datagrid, this, view);
        } catch (e) {
            if (e.message !== "View is not initialized") {
                throw e;
            }
        }
    }

    static async resize() {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            try {
                await datagrid.draw();
            } catch (e) {
                if (e.message !== "View is not initialized") {
                    throw e;
                }
            }
        }
    }

    static delete() {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            datagrid.clear();
        }
    }

    static save() {}

    static restore() {}
}

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

registerPlugin("datagrid", DatagridPlugin);

_register_global_styles();
