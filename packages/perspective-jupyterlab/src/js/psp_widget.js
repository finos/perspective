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

import "@finos/perspective-viewer";
import { Widget } from "@lumino/widgets";
import { MIME_TYPE, PSP_CLASS, PSP_CONTAINER_CLASS } from "./utils";

let _increment = 0;

/**
 * Class for perspective lumino widget.
 *
 * @class PerspectiveWidget (name) TODO: document
 */
export class PerspectiveWidget extends Widget {
    constructor(name = "Perspective", elem, bindingMode) {
        super({
            node: elem || document.createElement("div"),
        });

        this.bindingMode = bindingMode;
        this._viewer = PerspectiveWidget.createNode(this.node);
        this.title.label = name;
        this.title.caption = `${name}`;
        this.id = `${name}-` + _increment;
        _increment += 1;
    }

    /**********************/
    /* Lumino Overrides */
    /**********************/
    /**
     * Lumino: after visible
     *
     */

    onAfterShow(msg) {
        this.viewer.resize(true);
        super.onAfterShow(msg);
    }

    onActivateRequest(msg) {
        if (this.isAttached) {
            this.viewer.focus();
        }
        super.onActivateRequest(msg);
    }

    async toggleConfig() {
        await this.viewer.toggleConfig();
    }

    async save() {
        return await this.viewer.save();
    }

    async restore(config) {
        return await this.viewer.restore(config);
    }

    /**
     * Load a `perspective.table` into the viewer.
     *
     * @param table A `perspective.table` object.
     */

    async load(table) {
        await this.viewer.load(table);
        this._load_complete = true;
    }

    /**
     * Update the viewer with new data.
     *
     * @param data
     */

    async _update(data) {
        const table = await this.viewer.getTable(true);
        await table.update(data);
    }

    /**
     * Removes all rows from the viewer's table. Does not reset viewer state.
     */

    async clear() {
        const table = await this.viewer.getTable(true);
        await table.clear();
    }

    /**
     * Replaces the data of the viewer's table with new data. New data must
     * conform to the schema of the Table.
     *
     * @param data
     */

    async replace(data) {
        const table = await this.viewer.getTable(true);
        await table.replace(data);
    }

    /**
     * Deletes this element's data and clears it's internal state (but not its
     * user state). This (or the underlying `perspective.table`'s equivalent
     * method) must be called in order for its memory to be reclaimed.
     */

    delete() {
        this.viewer.delete();
    }

    /**
     * Returns a promise that resolves to the element's edit port ID, used
     * internally when edits are made using datagrid in client/server mode.
     */

    async getEditPort() {
        return await this.viewer.getEditPort();
    }

    async getTable() {
        return await this.viewer.getTable();
    }

    /***************************************************************************
     *
     * Getters
     *
     */
    /**
     * Returns the underlying `PerspectiveViewer` instance.
     *
     * @returns {PerspectiveViewer} The widget's viewer instance.
     */

    get viewer() {
        return this._viewer;
    }

    /**
     * Returns the name of the widget.
     *
     * @returns {string} the widget name - "Perspective" if not set by the user.
     */

    get name() {
        return this.title.label;
    }

    get selectable() {
        return this.viewer.hasAttribute("selectable");
    }

    set selectable(row_selection) {
        if (row_selection) {
            this.viewer.setAttribute("selectable", "");
        } else {
            this.viewer.removeAttribute("selectable");
        }
    }

    static createNode(node) {
        node.classList.add("p-Widget");
        node.classList.add(PSP_CONTAINER_CLASS);
        const viewer = document.createElement("perspective-viewer");
        viewer.classList.add(PSP_CLASS);
        viewer.setAttribute("type", MIME_TYPE);
        while (node.lastChild) {
            node.removeChild(node.lastChild);
        }

        node.appendChild(viewer);

        // allow perspective's event handlers to do their work
        viewer.addEventListener(
            "contextmenu",
            (event) => event.stopPropagation(),
            false
        );

        const div = document.createElement("div");
        div.style.setProperty("display", "flex");
        div.style.setProperty("flex-direction", "row");
        node.appendChild(div);

        return viewer;
    }
}
