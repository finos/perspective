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

import { Widget } from "@lumino/widgets";
import { Message } from "@lumino/messaging";

import type * as psp_viewer from "@finos/perspective-viewer";
import type * as psp from "@finos/perspective";

interface IPerspectiveViewerWidgetOptions {
    node: HTMLElement;
    viewer: psp_viewer.HTMLPerspectiveViewerElement;
}

export class PerspectiveViewerWidget extends Widget {
    viewer: psp_viewer.HTMLPerspectiveViewerElement;
    _master: boolean;
    _title: string;
    _is_table_loaded: boolean;
    _restore_config?: () => Promise<void>;
    task?: Promise<void>;

    constructor({ viewer, node }: IPerspectiveViewerWidgetOptions) {
        super({ node });
        this.viewer = viewer;
        this._master = false;
        this._title = "";
        this._is_table_loaded = false;
    }

    set master(value: boolean) {
        if (this._master !== value) {
            if (value) {
                this.viewer.classList.add("workspace-master-widget");
                this.viewer.toggleAttribute?.("selectable", true);
            } else {
                this.viewer.classList.remove("workspace-master-widget");
                this.viewer.removeAttribute("selectable");
            }

            this._master = value;
        }
    }

    get master(): boolean {
        return this._master;
    }

    get name(): string {
        return this._title;
    }

    toggleConfig(): Promise<void> {
        return this.viewer.toggleConfig();
    }

    async load(table: psp.Table | Promise<psp.Table>) {
        this._is_table_loaded = true;
        let promises = [this.viewer.load(table)];
        if (this._restore_config) {
            promises.push(this._restore_config());
        }

        await Promise.all(promises);
    }

    restore(
        config: psp_viewer.ViewerConfigUpdate & {
            master: boolean;
            table: string;
        }
    ) {
        const { master, table, ...viewerConfig } = config;
        this.master = master;
        this._title = config.title as string;
        this.title.label = config.title as string;
        if (table) {
            this.viewer.setAttribute("table", table);
        }

        // if (selectable) {
        //     this.viewer.setAttribute("selectable", selectable);
        // }

        // if (editable) {
        //     this.viewer.setAttribute("editable", editable);
        // }

        const restore_config = () => this.viewer.restore({ ...viewerConfig });

        if (this._is_table_loaded) {
            return restore_config();
        } else {
            this._restore_config = restore_config;
        }
    }

    async save() {
        let config = {
            ...(await this.viewer.save()),
            master: this.master,
            table: this.viewer.getAttribute("table"),
        };

        if (this.viewer.hasAttribute("selectable")) {
            config.selectable = this.viewer.getAttribute("selectable");
        }

        if (this.viewer.hasAttribute("editable")) {
            config.editable = this.viewer.getAttribute("editable");
        }

        return config;
    }

    removeClass(name: string) {
        super.removeClass(name);
        this.viewer && this.viewer.classList.remove(name);
    }

    async onCloseRequest(msg: Message) {
        super.onCloseRequest(msg);
        if (this.viewer.parentElement) {
            this.viewer.parentElement.removeChild(this.viewer);
        }

        await this.viewer.delete().then(() => this.viewer.free());
    }
}
