/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { activate } from "../plugin/activate.js";
import { restore } from "../plugin/restore.js";
import { connectedCallback } from "../plugin/connected";
import { save } from "../plugin/save";
import { draw } from "../plugin/draw";

/**
 * The custom element class for this plugin.  The interface methods for this
 */
export class HTMLPerspectiveViewerDatagridPluginElement extends HTMLElement {
    constructor() {
        super();
        this.regular_table = document.createElement("regular-table");
        this._is_scroll_lock = true;
    }

    connectedCallback() {
        return connectedCallback.call(this);
    }

    disconnectedCallback() {
        this._toolbar.parentElement.removeChild(this._toolbar);
    }

    async activate(view) {
        return await activate.call(this, view);
    }

    get name() {
        return "Datagrid";
    }

    get category() {
        return "Basic";
    }

    get select_mode() {
        return "toggle";
    }

    get min_config_columns() {
        return undefined;
    }

    get config_column_names() {
        return undefined;
    }

    async draw(view) {
        return await draw.call(this, view);
    }

    async update(view) {
        this.model._num_rows = await view.num_rows();
        await this.regular_table.draw();
    }

    async resize() {
        if (!this.isConnected || this.offsetParent == null) {
            return;
        }

        if (this._initialized) {
            await this.regular_table.draw();
        }
    }

    async clear() {
        this.regular_table._resetAutoSize();
        this.regular_table.clear();
    }

    save() {
        return save.call(this);
    }

    restore(token) {
        return restore.call(this, token);
    }

    async restyle(view) {
        await this.draw(view);
    }

    delete() {
        if (this.regular_table.table_model) {
            this.regular_table._resetAutoSize();
        }
        this.regular_table.clear();
    }
}
