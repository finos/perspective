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

import { ArrayExt } from "@lumino/algorithm";
import { ElementExt } from "@lumino/domutils";
import { TabBar } from "@lumino/widgets";
import { TabBarItems, PerspectiveTabBarRenderer } from "./tabbarrenderer";
import { VirtualDOM } from "@lumino/virtualdom";
import { CommandRegistry } from "@lumino/commands";
import { Menu } from "@lumino/widgets";
import { PerspectiveWorkspace } from "./workspace";
import { Message } from "@lumino/messaging";
import { Title } from "@lumino/widgets";
import { Signal } from "@lumino/signaling";
import { ReadonlyJSONObject, ReadonlyJSONValue } from "@lumino/coreutils";
import { WorkspaceMenu } from "./menu";

export class PerspectiveTabBar extends TabBar<any> {
    _workspace: PerspectiveWorkspace;
    __content_node__?: HTMLElement;
    _menu?: Menu;
    __titles: string[];

    constructor(workspace: PerspectiveWorkspace, options = {}) {
        super(options);
        this._addEventListeners();
        this.__content_node__ = undefined;
        this._workspace = workspace;
        this.__titles = [];
    }

    get private_titles(): Title<any>[] {
        let titles: Title<any>[] = (this as any)._titles;
        return titles;
    }

    onUpdateRequest(msg: Message) {
        // NOT INERT!  This is a lumino bug fix.
        // lumino/virtualdom keeps a weakmap on contentNode which is later
        // reset - this causes the diff to double some elements.  Memoizing
        // prevent collection from the weakmap.
        this.__content_node__ = this.contentNode;
        this.node.style.contain = "";

        // super.onUpdateRequest(msg);

        let titles: Title<any>[] = (this as any)._titles;
        let renderer = this.renderer;
        let currentTitle = this.currentTitle!;

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
                content[i] = (
                    renderer as unknown as PerspectiveTabBarRenderer
                ).renderTab(
                    {
                        title,
                        zIndex: titles.length + 1,
                        current,
                    } as TabBar.IRenderData<any>,
                    onClick,
                );
            } else {
                content[i] = (
                    renderer as unknown as PerspectiveTabBarRenderer
                ).renderInert();
            }
        }

        VirtualDOM.render(content, this.contentNode);
        this._check_shade();
    }

    onClick(otherTitles: Title<any>[], index: number, event: MouseEvent) {
        const commands = new CommandRegistry();
        this._menu = new WorkspaceMenu(
            this._workspace.menu_elem.shadowRoot!,
            this._workspace.element,
            {
                commands,
            },
        );

        this._menu.addClass("perspective-workspace-menu");
        this._menu.dataset.minwidth = this.__titles[index];
        for (const title of otherTitles) {
            this._menu.addItem({
                command: "tabbar:switch",
                args: { title } as unknown as ReadonlyJSONObject,
            });
        }

        commands.addCommand("tabbar:switch", {
            execute: async ({ title }) => {
                const psp_title = title as any as Title<any>;
                const index = this.__titles.findIndex((t) => t === title);
                this.currentTitle = psp_title;
                (
                    this.tabActivateRequested as unknown as Signal<
                        TabBar<any>,
                        TabBar.ITabActivateRequestedArgs<any>
                    >
                ).emit({
                    index,
                    title: psp_title,
                });
            },
            label: ({ title }) => {
                const psp_title = title as any as Title<any>;
                return psp_title.label || "untitled";
            },
            mnemonic: 0,
        });

        const box = (event.target as HTMLElement).getBoundingClientRect();
        const outer_box = this._workspace.element.getBoundingClientRect();
        this._menu.open(box.x - outer_box.x, box.y + box.height - outer_box.y);
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
                    x.classList.contains("lm-mod-current"),
            ).length > 0
        ) {
            this.contentNode.classList.add("inactive-blur");
        } else {
            this.contentNode.classList.remove("inactive-blur");
        }
    }

    handleEvent(event: MouseEvent) {
        this._menu?.close();
        this.retargetEvent(event);
        switch (event.type) {
            case "contextmenu":
                const widget = this.currentTitle?.owner;
                let parent = widget.parent;

                // TODO There is probably a better way to find the workspace
                // relative to a widget command
                while (parent && !(parent instanceof PerspectiveWorkspace)) {
                    parent = parent.parent;
                }

                (parent as unknown as PerspectiveWorkspace).showContextMenu(
                    widget,
                    event,
                );

                if (!event.shiftKey) {
                    event.preventDefault();
                }

                break;
            case "mousedown":
                if ((event.target as HTMLElement).id === TabBarItems.Label) {
                    return;
                }
                break;
            case "pointerdown":
                if ((event.target as HTMLElement).id === TabBarItems.Label) {
                    const tabs = this.contentNode.children;

                    // Find the index of the released tab.
                    const index = ArrayExt.findFirstIndex(tabs, (tab) => {
                        return ElementExt.hitTest(
                            tab,
                            event.clientX,
                            event.clientY,
                        );
                    });

                    if (index < 0) {
                        break;
                    }

                    const title = this.titles[index];
                    this._workspace._maximize(title.owner);
                    requestAnimationFrame(() =>
                        title.owner.viewer.toggleConfig(),
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
    retargetEvent(event: MouseEvent) {
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
