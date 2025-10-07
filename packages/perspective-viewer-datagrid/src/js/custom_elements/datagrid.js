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

import { PRIVATE_PLUGIN_SYMBOL } from "../model";
import { activate } from "../plugin/activate.js";
import { restore } from "../plugin/restore.js";
import { save } from "../plugin/save";
import { draw } from "../plugin/draw";
import column_style_controls from "../plugin/column_style_controls.js";
import datagridStyles from "../../../dist/css/perspective-viewer-datagrid.css";
import { format_raw } from "../data_listener/format_cell.js";

/**
 * The custom element class for this plugin.  The interface methods for this
 */
export class HTMLPerspectiveViewerDatagridPluginElement extends HTMLElement {
    static #global_stylesheet_installed = false;

    static #sheet;

    // Determines whether this datagrid renders in the light DOM. This will
    // break style encapsulation and may cause inconsistent behavior.
    static renderTarget =
        window.CSS?.supports &&
        window.CSS?.supports("selector(:host-context(foo))")
            ? "shadow"
            : "light";

    constructor() {
        super();
        this.regular_table = document.createElement("regular-table");
        this.regular_table.part = "regular-table";
        this._is_scroll_lock = false;
        this._edit_mode = "READ_ONLY";
        const Elem = HTMLPerspectiveViewerDatagridPluginElement;
        if (!Elem.#sheet) {
            Elem.#sheet = new CSSStyleSheet();
            Elem.#sheet.replaceSync(datagridStyles);
        }

        if (Elem.renderTarget === "shadow") {
            const shadow = this.attachShadow({ mode: "open" });
            shadow.adoptedStyleSheets.push(Elem.#sheet);
        } else if (
            Elem.renderTarget === "light" &&
            !Elem.#global_stylesheet_installed
        ) {
            Elem.#global_stylesheet_installed = true;
            document.adoptedStyleSheets.push(Elem.#sheet);
        }
    }

    connectedCallback() {
        if (!this._toolbar) {
            this._toolbar = document.createElement(
                "perspective-viewer-datagrid-toolbar",
            );
        }

        const parent = this.parentElement;
        if (parent) {
            parent.appendChild(this._toolbar);
        }
    }

    disconnectedCallback() {
        this._toolbar?.parentElement?.removeChild?.(this._toolbar);
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
        return ["Columns"];
    }

    /**
     * Give the Datagrid a higher priority so it is loaded
     * over the default charts by default.
     */
    get priority() {
        return 1;
    }

    can_render_column_styles(type, _group) {
        return type !== "boolean";
    }

    column_style_controls(type, group) {
        return column_style_controls.call(this, type, group);
    }

    async draw(view) {
        return await draw.call(this, view);
    }

    async update(view) {
        if (this.model === undefined) {
            await this.draw(view);
        } else if (this.model._config.split_by?.length > 0) {
            const dimensions = await view.dimensions();
            this.model._num_rows = dimensions.num_view_rows;
            // if (this.model._column_paths.length !== dimensions.num_view_columns) {
            // await this.draw(view);
            // } else {
            await this.regular_table.draw();
            // }
        } else {
            this.model._num_rows = await view.num_rows();
            await this.regular_table.draw();
        }
    }

    async render(viewport) {
        const view = await this.parentElement.getView();
        const json = await view.to_columns(viewport);
        const cols = await view.column_paths(viewport);

        const nrows = viewport.end_row - viewport.start_row;
        let out = "";
        for (let ridx = 0; ridx < nrows; ridx++) {
            for (const col_name of cols) {
                const col = json[col_name];
                const type = this.model._schema[col_name];
                const formatter = format_raw(
                    type,
                    this.regular_table[PRIVATE_PLUGIN_SYMBOL][
                        col_name.split("|").at(-1)
                    ] || {},
                );

                if (formatter) {
                    out += formatter.format(col[ridx]) + "\t";
                } else {
                    out += col[ridx] + "\t";
                }
            }
            out += "\n";
        }

        return out.trim();
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

    restore(token, columns_config) {
        return restore.call(this, token, columns_config);
    }

    async restyle(view) {
        await this.draw(view);
    }

    delete() {
        this._toolbar = undefined;
        if (this.regular_table.table_model) {
            this.regular_table._resetAutoSize();
        }

        this.regular_table.clear();
    }
}
