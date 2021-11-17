/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "regular-table";

import {
    createModel,
    configureRegularTable,
    formatters,
    create_color_record,
} from "./regular_table_handlers.js";
import MATERIAL_STYLE from "../less/regular_table.less";
import {configureRowSelectable, deselect} from "./row_selection.js";
import {configureClick} from "./click.js";
import {configureEditable} from "./editing.js";
import {configureSortable} from "./sorting.js";
import {PLUGIN_SYMBOL} from "./plugin_menu.js";

customElements.define(
    "perspective-viewer-datagrid",
    class extends HTMLElement {
        constructor() {
            super();
            this.datagrid = document.createElement("regular-table");
            this.datagrid.formatters = formatters;
        }

        async activate(view) {
            let viewer = this.parentElement;
            let table = await viewer.getTable();
            if (!this._initialized) {
                this.innerHTML = "";
                this.appendChild(this.datagrid);
                this.model = await createModel(this.datagrid, table, view);
                configureRegularTable(this.datagrid, this.model);
                await configureRowSelectable.call(
                    this.model,
                    this.datagrid,
                    viewer
                );
                await configureClick.call(this.model, this.datagrid, viewer);
                await configureEditable.call(this.model, this.datagrid, viewer);
                await configureSortable.call(this.model, this.datagrid, viewer);
                this._initialized = true;
            } else {
                await createModel(this.datagrid, table, view, this.model);
            }
        }

        get name() {
            return "Datagrid";
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
            const old_sizes = this._save_column_size_overrides();
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

            this._restore_column_size_overrides(old_sizes);
            await draw;
        }

        async update(view) {
            this.model._num_rows = await view.num_rows();
            await this.datagrid.draw();
        }

        async resize() {
            if (this._initialized) {
                await this.datagrid.draw();
            }
        }

        async clear() {
            this.datagrid._resetAutoSize();
            this.datagrid.clear();
        }

        save() {
            if (this.datagrid) {
                const datagrid = this.datagrid;
                const token = {};

                for (const col of Object.keys(datagrid[PLUGIN_SYMBOL] || {})) {
                    const config = Object.assign(
                        {},
                        datagrid[PLUGIN_SYMBOL][col]
                    );
                    if (config?.pos_color) {
                        config.pos_color = config.pos_color[0];
                        config.neg_color = config.neg_color[0];
                    }
                    token[col] = config;
                }

                const column_size_overrides =
                    this._save_column_size_overrides();

                for (const col of Object.keys(column_size_overrides || {})) {
                    if (!token[col]) {
                        token[col] = {};
                    }

                    token[col].column_size_override =
                        column_size_overrides[col];
                }

                return JSON.parse(JSON.stringify(token));
            }
            return {};
        }

        restore(token) {
            token = JSON.parse(JSON.stringify(token));
            const overrides = {};
            for (const col of Object.keys(token)) {
                const config = token[col];
                if (config.column_size_override !== undefined) {
                    overrides[col] = config.column_size_override;
                    delete config["column_size_override"];
                }

                if (config?.pos_color) {
                    config.pos_color = create_color_record(config.pos_color);
                    config.neg_color = create_color_record(config.neg_color);
                }

                if (Object.keys(config).length === 0) {
                    delete token[col];
                }
            }

            const datagrid = this.datagrid;
            try {
                datagrid._resetAutoSize();
            } catch (e) {
                // Do nothing;  this may fail if no auto size info has been read.
                // TODO fix this regular-table API
            }

            this._restore_column_size_overrides(overrides, true);
            datagrid[PLUGIN_SYMBOL] = token;
        }

        async restyle() {}

        delete() {
            if (this.datagrid.table_model) {
                this.datagrid._resetAutoSize();
            }
            this.datagrid.clear();
        }

        // Private

        /**
         * Extract the current user-overriden column widths from
         * `regular-table`.  This functiond depends on the internal
         * implementation of `regular-table` and may break!
         *
         * @returns An Object-as-dictionary keyed by column_path string, and
         * valued by the column's user-overridden pixel width.
         */
        _save_column_size_overrides() {
            if (!this._initialized) {
                return [];
            }

            if (this._cached_column_sizes) {
                const x = this._cached_column_sizes;
                this._cached_column_sizes = undefined;
                return x;
            }

            const overrides = this.datagrid._column_sizes.override;
            const {row_pivots, columns} = this.model._config;
            const tree_header_offset =
                row_pivots?.length > 0 ? row_pivots.length + 1 : 0;

            const old_sizes = {};
            for (const key of Object.keys(overrides)) {
                if (overrides[key] !== undefined) {
                    const index = key - tree_header_offset;
                    if (index > -1) {
                        old_sizes[this.model._column_paths[index]] =
                            overrides[key];
                    }
                }
            }

            return old_sizes;
        }

        /**
         * Restore a saved column width override token.
         *
         * @param {*} token An object previously returned by a call to
         * `_save_column_size_overrides()`
         * @param {*} [cache=false] A flag indicating whether this value should
         * be cached so a future `resetAutoSize()` call does not clear it.
         * @returns
         */
        _restore_column_size_overrides(old_sizes, cache = false) {
            if (!this._initialized) {
                return;
            }

            if (cache) {
                this._cached_column_sizes = old_sizes;
            }

            const overrides = {};
            const {row_pivots, columns} = this.model._config;
            const tree_header_offset =
                row_pivots?.length > 0 ? row_pivots.length + 1 : 0;

            for (const key of Object.keys(old_sizes)) {
                const index = this.model._column_paths.indexOf(key);
                overrides[index + tree_header_offset] = old_sizes[key];
            }

            this.datagrid._column_sizes.override = overrides;
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
    document.head.insertBefore(style, document.head.firstChild);
}

/******************************************************************************
 *
 * Main
 *
 */

function register_element() {
    customElements
        .get("perspective-viewer")
        .registerPlugin("perspective-viewer-datagrid");
}

customElements.whenDefined("perspective-viewer").then(register_element);
_register_global_styles();
