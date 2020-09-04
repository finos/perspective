/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {registerPlugin} from "@finos/perspective-viewer/dist/esm/utils.js";

import "regular-table";
import {createViewCache, configureRegularTable} from "regular-table/dist/examples/perspective.js";
import MATERIAL_STYLE from "../less/regular_table.less";

import {configureRowSelectable, deselect} from "./row_selection.js";
import {configureEditable} from "./editing.js";

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
        } catch (e) {
            throw e;
        } finally {
            lock = undefined;
            resolve();
        }
    };
}

const datagridPlugin = lock(async function(regular, viewer, view) {
    const is_installed = INSTALLED.has(regular);
    const table = viewer.table;
    if (!is_installed) {
        const new_model = await createViewCache(regular, table, view);
        await configureRegularTable(regular, new_model);
        await configureRowSelectable.call(new_model, regular, viewer);
        await regular.draw();
        await configureEditable.call(new_model, regular, viewer);
        INSTALLED.set(regular, new_model);
    } else {
        await createViewCache(regular, table, view, INSTALLED.get(regular));
    }
    regular.scrollTop = 0;
    regular.scrollLeft = 0;
    await regular.draw();
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
            return;
        }
    }

    static async create(div, view) {
        const datagrid = get_or_create_datagrid(this, div);
        try {
            await datagridPlugin(datagrid, this, view);
            deselect(datagrid, this);
            datagrid._resetAutoSize();
            await datagrid.draw();
        } catch (e) {
            return;
        }
    }

    static async resize() {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            await datagrid.draw();
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
 * Appends the default tbale CSS to `<head>`, should be run once on module
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
