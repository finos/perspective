/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "@finos/perspective-viewer";
import {Widget} from "@lumino/widgets";

export class PerspectiveViewerWidget extends Widget {
    constructor({viewer, node}) {
        super({node});
        this.viewer = viewer;
        this.master = false;
    }

    set master(value) {
        if (value !== undefined && this._master !== value) {
            if (value) {
                this.viewer.classList.add("workspace-master-widget");
                this.viewer.classList.remove("workspace-detail-widget");

                // TODO jsdom lacks `toggleAttribute` until 12.2.0
                // https://github.com/jsdom/jsdom/blob/master/Changelog.md#1220
                this.viewer.toggleAttribute?.("selectable", true);
            } else {
                this.viewer.classList.add("workspace-detail-widget");
                this.viewer.classList.remove("workspace-master-widget");
                this.viewer.removeAttribute("selectable");
            }
            this._master = value;
        }
    }

    get master() {
        return this._master;
    }

    get table() {
        return this.viewer.table;
    }

    set name(value) {
        if (value != null) {
            this.viewer.setAttribute("name", value);
            this.title.label = value;
            this._name = value;
        }
    }

    get name() {
        return this._name;
    }

    set linked(value) {
        if (value !== undefined) {
            if (value) {
                this.viewer.setAttribute("linked", "");
            } else {
                this.viewer.removeAttribute("linked");
            }
        }
    }
    get linked() {
        return this.viewer.hasAttribute("linked");
    }

    toggleConfig() {
        return this.viewer.toggleConfig();
    }

    async load(table) {
        this._is_table_loaded = true;
        let promises = [this.viewer.load(table)];
        if (this._restore_config) {
            promises.push(this._restore_config());
        }

        await Promise.all(promises);
    }

    async restore(config) {
        const restore_config = async () => {
            const {master, table, linked, name, ...viewerConfig} = config;
            this.master = master;
            this.name = name;
            if (table) {
                this.viewer.setAttribute("table", table);
            }

            this.linked = linked;
            await this.viewer.restore({...viewerConfig});
        };

        if (this._is_table_loaded) {
            return restore_config();
        } else {
            this._restore_config = restore_config;
        }
    }

    async save() {
        return {
            ...(await this.viewer.save()),
            master: this.master,
            name: this.viewer.getAttribute("name"),
            table: this.viewer.getAttribute("table"),
            linked: this.linked
        };
    }

    removeClass(name) {
        super.removeClass(name);
        this.viewer && this.viewer.classList.remove(name);
    }

    async onCloseRequest(msg) {
        super.onCloseRequest(msg);
        if (this.viewer.parentElement) {
            this.viewer.parentElement.removeChild(this.viewer);
        }
        await this.viewer.delete();
    }

    onResize(msg) {
        this.notifyResize();
        super.onResize(msg);
    }

    async notifyResize() {
        if (this.isVisible) {
            await this.viewer.notifyResize();
        }
    }
}
