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

import style from "../../build/css/workspace.css";
import template from "../html/workspace.html";
import { PerspectiveWorkspace, SIDE } from "./workspace";
export { PerspectiveWorkspace } from "./workspace";
import { MessageLoop } from "@lumino/messaging/src";
import { Widget } from "@lumino/widgets/src/widget";
import { bindTemplate } from "./workspace/utils.js";
export { PerspectiveViewerWidget } from "./workspace/widget";

import injectedStyles from "../../build/css/injected.css";

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
 *
 *     <perspective-viewer
 *         row-pivots='["State"]'
 *         name="View Two"
 *         table="superstore">
 *     </perspective-viewer>
 *
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

class PerspectiveWorkspaceElement extends HTMLElement {
    /***************************************************************************
     *
     * Public
     *
     */

    /**
     * The side the Global Filter sidebar is placed relative to the main panel.
     *
     * @param {('left'|'right')} value
     */
    set side(value) {
        this.setAttribute("side", value);
        if (this.workspace) {
            this.workspace.side = value;
        }
    }

    get side() {
        return this.getAttribute("side");
    }

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
        return this.workspace.save();
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
    async restore(layout) {
        await this.workspace.restore(layout);
    }

    async flush() {
        await Promise.all(
            Array.from(this.querySelectorAll("perspective-viewer")).map((x) =>
                x.flush()
            )
        );
    }

    addTable(name, table) {
        this.workspace.addTable(name, table);
    }

    getTable(name) {
        return this.workspace.getTable(name);
    }

    removeTable(name) {
        return this.workspace.removeTable(name);
    }

    /**
     * A `Map()` of `perspective.Table()` by name.  The names set here will auto
     * wire any child `perspective-viewer` elements in this Workspace's subtree,
     * by looking up their respective `table` attribute.
     *
     * Calling methods on this `Map()` may have side-effects, as
     * `PerspectiveViewerHTMLElement.load()` is called when a new `Table()` is
     * set with a name matching an existing child `perspective-viewer`.
     *
     * @readonly
     * @memberof PerspectiveWorkspaceElement
     */
    get tables() {
        return this.workspace.tables;
    }

    /**
     * Invalidate this component's dimensions and recalculate.
     */
    notifyResize() {
        this.workspace.update();
    }

    _light_dom_changed() {
        const viewers = Array.from(this.childNodes);
        for (const viewer of viewers) {
            if (viewer.tagName === "PERSPECTIVE-VIEWER") {
                this.workspace.update_widget_for_viewer(viewer);
            }
        }

        this.workspace.remove_unslotted_widgets(viewers);
        this.workspace.update_details_panel(viewers);
    }

    _register_light_dom_listener() {
        let observer = new MutationObserver(this._light_dom_changed.bind(this));
        let config = { attributes: false, childList: true, subtree: false };
        observer.observe(this, config);
        this._light_dom_changed();
    }

    connectedCallback() {
        if (!this.side) {
            this.side = this.side || SIDE.LEFT;

            const container = this.shadowRoot.querySelector("#container");
            this.workspace = new PerspectiveWorkspace(this, {
                side: this.side,
            });

            this._register_light_dom_listener();

            MessageLoop.sendMessage(this.workspace, Widget.Msg.BeforeAttach);
            container.insertBefore(this.workspace.node, null);
            MessageLoop.sendMessage(this.workspace, Widget.Msg.AfterAttach);

            window.onresize = this.workspace.update.bind(this.workspace);
        }
    }
}

const _injectStyle = document.createElement("style");
_injectStyle.toggleAttribute("injected", true);
_injectStyle.innerHTML = injectedStyles;
document.head.appendChild(_injectStyle);

bindTemplate(template, style)(PerspectiveWorkspaceElement);
