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

import { ArrayExt } from "@lumino/algorithm/src";
import { ElementExt } from "@lumino/domutils/src";
import { TabBar } from "@lumino/widgets/src/tabbar";
import { TabBarItems, DEFAULT_TITLE } from "./tabbarrenderer";
import { VirtualDOM, VirtualElement } from "@lumino/virtualdom";
import { CommandRegistry } from "@lumino/commands/src";
import { MenuRenderer } from "./menu";
import { Menu } from "@lumino/widgets/src/menu";

export class PerspectiveTabBar extends TabBar {
    constructor(workspace, options = {}) {
        super(options);
        this._addEventListeners();
        this.__content_node__;
        this._workspace = workspace;
    }

    onUpdateRequest(msg) {
        // NOT INERT!  This is a lumino bug fix.
        // lumino/virtualdom keeps a weakmap on contentNode which is later
        // reset - this causes the diff to double some elements.  Memoizing
        // prevent collection from the weakmap.
        this.__content_node__ = this.contentNode;

        // super.onUpdateRequest(msg);

        let titles = this._titles;
        let renderer = this.renderer;
        let currentTitle = this.currentTitle;

        // Another hack. `TabBar` selects by index and I don't want to fork this
        // logic, so insert empty divs until the indices match.
        let content = new Array();
        for (let i = 0, n = titles.length; i < n; ++i) {
            let title = titles[i];
            let current = title === currentTitle;
            let otherTitles = titles.filter((x) => x !== currentTitle);
            let onClick;
            if (otherTitles.length > 0) {
                onClick = this.onClick.bind(this, otherTitles, i);
            }

            if (current) {
                content[i] = renderer.renderTab({
                    title,
                    zIndex: titles.length + 1,
                    current,
                    onClick,
                });
            } else {
                content[i] = renderer.renderInert();
            }
        }

        VirtualDOM.render(content, this.contentNode);
        this._check_shade();
    }

    onClick(otherTitles, index, event) {
        const commands = new CommandRegistry();
        const renderer = new MenuRenderer(null);
        this._menu = new Menu({ commands, renderer });
        this._menu.addClass("perspective-workspace-menu");
        this._menu.dataset.minwidth = this._titles[index];
        for (const title of otherTitles) {
            this._menu.addItem({
                command: "tabbar:switch",
                args: { title },
            });
        }

        commands.addCommand("tabbar:switch", {
            execute: async ({ title }) => {
                const index = this._titles.findIndex((t) => t === title);
                this.currentTitle = title;
                this.tabActivateRequested.emit({ index, title });
            },
            label: ({ title }) => title.label || "untitled",
            mnemonic: 0,
        });

        const box = event.target.getBoundingClientRect();
        this._menu.open(box.x, box.y + box.height);
        this._menu.aboutToClose.connect(() => {
            this._menu = undefined;
        });
        event.preventDefault();
        event.stopPropagation();
    }

    _check_shade() {
        if (
            Array.from(this.contentNode.children).filter(
                (x) =>
                    x.classList.contains("settings_open") &&
                    x.classList.contains("p-mod-current")
            ).length > 0
        ) {
            this.contentNode.classList.add("inactive-blur");
        } else {
            this.contentNode.classList.remove("inactive-blur");
        }
    }

    handleEvent(event) {
        this._menu?.close();
        this.retargetEvent(event);
        switch (event.type) {
            case "contextmenu":
                const widget = this.currentTitle.owner;
                this.parent.parent.parent.showContextMenu(widget, event);
                event.preventDefault();
                break;
            case "mousedown":
                if (event.target.id === TabBarItems.Label) {
                    return;
                }
                break;
            case "pointerdown":
                if (event.target.id === TabBarItems.Label) {
                    const tabs = this.contentNode.children;

                    // Find the index of the released tab.
                    const index = ArrayExt.findFirstIndex(tabs, (tab) => {
                        return ElementExt.hitTest(
                            tab,
                            event.clientX,
                            event.clientY
                        );
                    });

                    if (index < 0) {
                        break;
                    }

                    const title = this.titles[index];
                    this._workspace._maximize(title.owner);
                    requestAnimationFrame(() =>
                        title.owner.viewer.toggleConfig()
                    );

                    return;
                }
                break;
        }
        super.handleEvent(event);
    }

    /**
     * Shadow dom targets events at the host, not the clicked element, which
     * Lumino dislikes.  This makes the event look like it is not crossing
     * the ShadowDom boundary.
     *
     */
    retargetEvent(event) {
        Object.defineProperty(event, "target", {
            value: event.composedPath()[0],
            enumerable: true,
        });
        return event;
    }

    _addEventListeners() {
        this.node.addEventListener("dblclick", this);
        this.node.addEventListener("contextmenu", this);
    }
}
