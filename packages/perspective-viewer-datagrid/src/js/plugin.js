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
import TOOLBAR_STYLE from "../less/toolbar.less";
import {configureRowSelectable, deselect} from "./row_selection.js";
import {configureClick} from "./click.js";
import {configureEditable} from "./editing.js";
import {configureSortable} from "./sorting.js";
import {PLUGIN_SYMBOL} from "./plugin_menu.js";

export class PerspectiveViewerDatagridPluginElement extends HTMLElement {
    constructor() {
        super();
        this.datagrid = document.createElement("regular-table");
        this.datagrid.formatters = formatters;
        this._is_scroll_lock = true;
    }

    connectedCallback() {
        if (!this._toolbar) {
            this._toolbar = document.createElement(
                "perspective-viewer-datagrid-toolbar"
            );

            this._toolbar.setAttribute("slot", "plugin-settings");
            this._toolbar.attachShadow({mode: "open"});
            this._toolbar.shadowRoot.innerHTML = `
                <style>
                    ${TOOLBAR_STYLE}
                </style>
                <div id="toolbar">
                    <span id="scroll_lock" class="lock-scroll button"><span>Align Scroll</span></span>
                    <span id="edit_mode" class="button"><span>Read Only</span></span>
                </div>
            `;

            this._scroll_lock =
                this._toolbar.shadowRoot.querySelector("#scroll_lock");
            this._scroll_lock.addEventListener("click", () =>
                this._toggle_scroll_lock()
            );

            this._edit_mode =
                this._toolbar.shadowRoot.querySelector("#edit_mode");
            this._edit_mode.addEventListener("click", () => {
                this._toggle_edit_mode();
                this.datagrid.draw();
            });
        }

        this.parentElement.appendChild(this._toolbar);
    }

    disconnectedCallback() {
        this._toolbar.parentElement.removeChild(this._toolbar);
    }

    _toggle_edit_mode(force = undefined) {
        if (typeof force === "undefined") {
            force = !this._is_edit_mode;
        }

        this._is_edit_mode = force;
        this.classList.toggle("editable", force);
        this._edit_mode.classList.toggle("editable", force);
        if (force) {
            this._edit_mode.children[0].textContent = "Editable";
        } else {
            this._edit_mode.children[0].textContent = "Read Only";
        }
    }

    _toggle_scroll_lock(force = undefined) {
        if (typeof force === "undefined") {
            force = !this._is_scroll_lock;
        }

        this._is_scroll_lock = force;
        this.classList.toggle("sub-cell-scroll-enabled", !force);
        this._scroll_lock.classList.toggle("lock-scroll", force);
        if (!force) {
            this._scroll_lock.children[0].textContent = "Free Scroll";
        } else {
            this._scroll_lock.children[0].textContent = "Align Scroll";
        }
    }

    async activate(view) {
        let viewer = this.parentElement;
        let table = await viewer.getTable(true);
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
        if (this.parentElement) {
            await this.activate(view);
        }

        if (!this.isConnected || this.offsetParent == null) {
            return;
        }

        const old_sizes = this._save_column_size_overrides();
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

        this._toolbar.classList.toggle(
            "aggregated",
            this.model._config.group_by.length > 0 ||
                this.model._config.split_by.length > 0
        );
    }

    async update(view) {
        this.model._num_rows = await view.num_rows();
        await this.datagrid.draw();
    }

    async resize() {
        if (!this.isConnected || this.offsetParent == null) {
            return;
        }

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
            const token = {
                columns: {},
                scroll_lock: !!this._is_scroll_lock,
                editable: !!this._is_edit_mode,
            };

            for (const col of Object.keys(datagrid[PLUGIN_SYMBOL] || {})) {
                const config = Object.assign({}, datagrid[PLUGIN_SYMBOL][col]);
                if (config?.pos_color) {
                    config.pos_color = config.pos_color[0];
                    config.neg_color = config.neg_color[0];
                }

                if (config?.color) {
                    config.color = config.color[0];
                }

                token.columns[col] = config;
            }

            const column_size_overrides = this._save_column_size_overrides();

            for (const col of Object.keys(column_size_overrides || {})) {
                if (!token.columns[col]) {
                    token.columns[col] = {};
                }

                token.columns[col].column_size_override =
                    column_size_overrides[col];
            }

            return JSON.parse(JSON.stringify(token));
        }
        return {};
    }

    restore(token) {
        token = JSON.parse(JSON.stringify(token));
        const overrides = {};
        if (token.columns) {
            for (const col of Object.keys(token.columns)) {
                const col_config = token.columns[col];
                if (col_config.column_size_override !== undefined) {
                    overrides[col] = col_config.column_size_override;
                    delete col_config["column_size_override"];
                }

                if (col_config?.pos_color) {
                    col_config.pos_color = create_color_record(
                        col_config.pos_color
                    );
                    col_config.neg_color = create_color_record(
                        col_config.neg_color
                    );
                }

                if (col_config?.color) {
                    col_config.color = create_color_record(col_config.color);
                }

                if (Object.keys(col_config).length === 0) {
                    delete token.columns[col];
                }
            }
        }

        if ("editable" in token) {
            this._toggle_edit_mode(token.editable);
        }

        if ("scroll_lock" in token) {
            this._toggle_scroll_lock(token.scroll_lock);
        }

        const datagrid = this.datagrid;
        try {
            datagrid._resetAutoSize();
        } catch (e) {
            // Do nothing;  this may fail if no auto size info has been read.
            // TODO fix this regular-table API
        }

        this._restore_column_size_overrides(overrides, true);
        datagrid[PLUGIN_SYMBOL] = token.columns;
    }

    async restyle(view) {
        this.draw(view);
    }

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
        const {group_by, columns} = this.model._config;
        const tree_header_offset =
            group_by?.length > 0 ? group_by.length + 1 : 0;

        const old_sizes = {};
        for (const key of Object.keys(overrides)) {
            if (overrides[key] !== undefined) {
                const index = key - tree_header_offset;
                if (index > -1) {
                    old_sizes[this.model._column_paths[index]] = overrides[key];
                } else if (index === -1) {
                    old_sizes["__ROW_PATH__"] = overrides[key];
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
        const {group_by, columns} = this.model._config;
        const tree_header_offset =
            group_by?.length > 0 ? group_by.length + 1 : 0;

        for (const key of Object.keys(old_sizes)) {
            if (key === "__ROW_PATH__") {
                overrides[tree_header_offset - 1] = old_sizes[key];
            } else {
                const index = this.model._column_paths.indexOf(key);
                overrides[index + tree_header_offset] = old_sizes[key];
            }
        }

        this.datagrid._column_sizes.override = overrides;
    }
}

customElements.define(
    "perspective-viewer-datagrid",
    PerspectiveViewerDatagridPluginElement
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
