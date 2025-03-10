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

import { MessageLoop } from "@lumino/messaging";
import { Widget } from "@lumino/widgets";
import { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";
import type * as psp from "@finos/perspective";

export { PerspectiveWorkspace } from "./workspace";
export { PerspectiveViewerWidget } from "./workspace/widget";

import "./external";
import {
    PerspectiveWorkspace,
    PerspectiveWorkspaceConfig,
    ViewerConfigUpdateExt,
} from "./workspace";
import { bindTemplate, CustomElementProto } from "./utils/custom_elements";
import style from "../../build/css/workspace.css";
import template from "../html/workspace.html";

/**
 * A Custom Element for coordinating a set of `<perspective-viewer>` light DOM
 * children.  `<perspective-workspace>` is built on Lumino.js to allow a more
 * app-like experience than `<perspective-viewer>`, providing
 * these features additionally:
 *
 * - Docking, arranging, tabbing and max/min-ing of `<perspective-viewer>`s.
 * - Trivial `<perspective-viewer>` duplication.
 * - Global Filter sidebar, for using selection state of a pivot table to filter
 *   siblings.
 * - Total persistence/serializable state and child state.
 * - Easy sharing/ownership of `Table()` among different `<perspective-viewer>`.
 * - A cool DOM-reactive API.
 *
 * There are a few ways to use this Custom Element.  In plain HTML, you can
 * express your initial view simply:
 *
 * ```html
 * <perspective-workspace>
 *     <perspective-viewer
 *         name="View One"
 *         table="superstore">
 *     </perspective-viewer>
 *     <perspective-viewer
 *         name="View Two"
 *         table="superstore">
 *     </perspective-viewer>
 * </perspective-workspace>
 * ```
 *
 * You can also use the DOM API in Javascript:
 *
 * ```javascript
 * const workspace = document.createElement("perspective-workspace");
 * const viewer = document.createElement("perspective-viewer");
 * workspace.appendChild(viewer);
 * document.body.appendChild(workspace);
 * ```
 *
 * This will yield a `<perspective-workspace> with the default layout.  To load
 * a `Table()`, add it to `tables` via the `Map()` API where it will be
 * auto-wired into all matching `<perspective-viewer>`s immediately:
 *
 * ```javascript
 * workspace.tables.set("superstore", await worker.table(my_data));
 * ```
 *
 *
 */
export class HTMLPerspectiveWorkspaceElement extends HTMLElement {
    private workspace?: PerspectiveWorkspace;
    private _resize_observer?: ResizeObserver;

    constructor() {
        super();
        this.setAutoSize(true);
    }

    /***************************************************************************
     *
     * Public
     *
     */

    /**
     * Persists this `<perspective-workspace>` to a token `Object`.  This object
     * is JSON serializable and describes the state of the Workspace and it's
     * child `<perspective-viewer>` elements.  Some important keys:
     *
     * - `viewers`: The serialized state of `<perspective-viewer>` children,
     *   named by `slot`.
     * - `detail`: The main layout.
     * - `master`: The contents of the Global Filter sidebar.
     *
     * While the `table` attribute is persisted for each `perspective-viewer`,
     * `Table`s themselves must be added to the `tables` property `Map()`
     * separately.
     *
     * @return {Object} A configuration token, compatible with
     * `restore(config)`.
     * @example
     * // Save this layout to local storage
     * const workspace = document.querySelector("perspective-workspace");
     * localStorage.set("CONFIG", JSON.stringify(workspace.save()));
     */
    save() {
        return this.workspace!.save();
    }

    /**
     * Restore this `<perspective-workspace>` to a previous state captured by
     * `save()`.  Calling this method will completely rewrite this element's
     * `innerHTML`, but may reuse `<perspective-viewer>`  children depending
     * on the `slot` attribute names.  However, it should always be possible
     * to recreate any given state from within the UI itself, as the attributes
     * on `<perspective-viewer>` itself create immutable views.
     *
     * While the `table` attribute is set for each `perspective-viewer`,
     * `Table`s themselves must be added to the `tables` property `Map()`
     * separately.
     * @param {Object} config A configuration token, as returned by `save()`.
     * @example
     * // Restore this layout from local storage
     * const workspace = document.querySelector("perspective-workspace");
     * workspace.restore(JSON.parse(localStorage.get("CONFIG"));
     *
     * // Add `Table` separately.
     * workspace.tables.set("superstore", await worker.table(data));
     */
    async restore(layout: PerspectiveWorkspaceConfig<string>) {
        await this.workspace!.restore(layout);
    }

    /**
     * Await all asynchronous tasks for all viewers in this workspace. This is
     * useful to make sure asynchonous side effects of synchronous methods calls
     * are applied.
     */
    async flush() {
        await Promise.all(
            Array.from(this.querySelectorAll("perspective-viewer")).map((x) => {
                const psp_widget = x as HTMLPerspectiveViewerElement;
                return psp_widget.flush();
            })
        );
    }

    /**
     * Add a new viewer to the workspace for a given `ViewerConfigUpdateExt`.
     * @param config
     */
    async addViewer(config: ViewerConfigUpdateExt) {
        this.workspace!.addViewer(config);
        await this.flush();
    }

    load(client: any) {
        if (this.workspace) {
            this.workspace.client = client;
        }
    }

    /**
     * Invalidate this component's dimensions and recalculate.
     */
    async resize() {
        this.workspace!.update();
        await this.flush();
    }

    /**
     * Set whether this workspace element should auto-size itself via a
     * `ResizeObserver`.
     */
    setAutoSize(is_auto_size: boolean) {
        this._resize_observer?.unobserve(this);
        this._resize_observer = undefined;
        if (is_auto_size) {
            this._resize_observer = new ResizeObserver((...args) =>
                this.workspace?.update()
            );

            this._resize_observer.observe(this);
        }
    }

    connectedCallback() {
        if (!this.workspace) {
            const container = this.shadowRoot!.querySelector("#container")!;
            this.workspace = new PerspectiveWorkspace(this);
            this._register_light_dom_listener();
            MessageLoop.sendMessage(this.workspace, Widget.Msg.BeforeAttach);
            container.insertBefore(this.workspace.node, null);
            MessageLoop.sendMessage(this.workspace, Widget.Msg.AfterAttach);
        }
    }

    /***************************************************************************
     *
     * Private
     *
     */

    private _light_dom_changed() {
        const viewers = Array.from(
            this.childNodes
        ) as HTMLPerspectiveViewerElement[];

        for (const viewer of viewers) {
            if (viewer.nodeType !== Node.ELEMENT_NODE) {
                continue;
            }

            if (viewer.tagName !== "PERSPECTIVE-VIEWER") {
                console.warn("Not a <perspective-viewer>");
                continue;
            }

            this.workspace!.update_widget_for_viewer(
                viewer as HTMLPerspectiveViewerElement
            );
        }

        this.workspace!.remove_unslotted_widgets(viewers);
        this.workspace!.update_details_panel(viewers);
    }

    private _register_light_dom_listener() {
        let observer = new MutationObserver(this._light_dom_changed.bind(this));
        let config = { attributes: false, childList: true, subtree: false };
        observer.observe(this, config);
        this._light_dom_changed();
    }
}

bindTemplate(
    template,
    style
)(HTMLPerspectiveWorkspaceElement as unknown as CustomElementProto);
