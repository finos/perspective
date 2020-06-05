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
import MATERIAL_STYLE from "regular-table/dist/less/material.less";

const VIEWER_MAP = new WeakMap();

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
            datagrid.clear();
            div.innerHTML = "";
            div.appendChild(document.createElement("slot"));
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
            await datagrid.draw({invalid_viewport: true});
        } catch (e) {
            return;
        }
    }

    static async create(div, view) {
        const datagrid = get_or_create_datagrid(this, div);
        const options = await datagrid.set_view(this.table, view);
        if (this._plugin_config) {
            datagrid.restore(this._plugin_config);
            delete this._plugin_config;
        }
        await datagrid.draw(options);
    }

    static async resize() {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            await datagrid.draw({invalid_viewport: true});
        }
    }

    static delete() {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            datagrid.clear();
        }
    }

    static save() {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            return datagrid.save();
        }
    }

    static restore(config) {
        if (this.view && VIEWER_MAP.has(this._datavis)) {
            const datagrid = VIEWER_MAP.get(this._datavis);
            datagrid.restore(config);
        } else {
            this._plugin_config = config;
        }
    }
}

/**
 * Appends the default tbale CSS to `<head>`, should be run once on module
 *  import.
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
