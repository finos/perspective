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

import type { Table } from "@finos/perspective";
import type {
    HTMLPerspectiveViewerElement,
    PerspectiveViewerConfig,
} from "@finos/perspective-viewer";

import { Widget } from "@lumino/widgets";
import { Message } from "@lumino/messaging";
import { Workspace } from "./workspace";

/**
 * A Lumino Widget containing a <perspective-viewer>.
 */
export class PerspectiveViewer extends Widget {
    /**
     * The viewer object that this Widget wraps.
     */
    private _viewer: HTMLPerspectiveViewerElement;
    private _tableName: string;
    private _closed: boolean;
    private _owner: Workspace;

    constructor(config: PerspectiveViewerConfig, id: string, owner: Workspace) {
        super();
        if (!config.title) {
            throw new Error("Title must be provided.");
        }
        if (!config.table) {
            throw new Error("Table must be provided.");
        }

        this.addClass("psp-PerspectiveViewer-container");
        this._viewer = PerspectiveViewer.createNode(this.node);
        this._viewer.setAttribute("table", config.table);
        this._tableName = config.table;
        this._viewer.setAttribute("slot", id);
        this.title.label = config.title;
        this.title.closable = true;
        this.id = id;
        this._closed = false;
        this._owner = owner;
    }

    private static createNode(
        parent: HTMLElement
    ): HTMLPerspectiveViewerElement {
        const viewer = document.createElement("perspective-viewer");
        viewer.classList.add("psp-PerspectiveViewer-viewer");
        viewer.setAttribute("type", "application/psp+json");
        while (parent.lastChild) {
            parent.removeChild(parent.lastChild);
        }
        parent.appendChild(viewer);
        // TODO: support top-level context menu.
        // viewer.addEventListener(
        //     "contextmenu",
        //     (e) => e.stopPropagation(),
        //     false
        // );
        return viewer;
    }

    dispose() {
        if (this.isDisposed) {
            return;
        }

        super.dispose();
        if (this.viewer) {
            this.viewer.remove();
        }
    }

    /******** Viewer Functionality ********/

    toggleConfig(): Promise<void> {
        if (this.viewer) {
            return this.viewer.toggleConfig();
        } else {
            return Promise.reject(null);
        }
    }

    reset(all_expressions?: boolean): Promise<void> {
        if (this.viewer) {
            return this.viewer.reset(all_expressions);
        } else {
            return Promise.reject(null);
        }
    }

    save(): Promise<PerspectiveViewerConfig> {
        if (this.viewer) {
            return this.viewer.save();
        } else {
            return Promise.reject(null);
        }
    }

    restore(c: string | PerspectiveViewerConfig | ArrayBuffer): Promise<void> {
        if (this.viewer) {
            return this.viewer.restore(c);
        } else {
            return Promise.reject(null);
        }
    }

    load(table: Table): Promise<void> {
        if (this.viewer) {
            return this.viewer.load(table);
        } else {
            return Promise.reject(null);
        }
    }

    async getEditPort(): Promise<number> {
        if (this.viewer) {
            return this.viewer.getEditPort();
        } else {
            return Promise.reject(null);
        }
    }

    close(): Promise<void> {
        this._closed = true;
        if (this.viewer) {
            this.viewer?.parentElement?.removeChild(this.viewer);
            let p = this.viewer.delete();
            this._owner.onViewerClosed(this.id);
            super.close();
            return p;
        } else {
            return Promise.reject(null);
        }
    }

    /** Properties */

    get table(): Promise<Table> {
        if (this.viewer) {
            return this.viewer.getTable();
        } else {
            return Promise.reject(null);
        }
    }

    get tableName(): string {
        return this._tableName;
    }

    get viewer(): HTMLPerspectiveViewerElement {
        return this._viewer;
    }

    private set viewer(v: HTMLPerspectiveViewerElement) {
        this._viewer = v;
    }

    get name(): string {
        return this.title.label;
    }

    get closed(): boolean {
        return this._closed;
    }
}
