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

import { ElementExt } from "@lumino/domutils";
import { MessageLoop } from "@lumino/messaging";
import { h } from "@lumino/virtualdom";
import { Menu, Widget } from "@lumino/widgets";

export class WorkspaceMenu extends Menu {
    private _host: ShadowRoot;
    private _workspace: HTMLElement;
    init_overlay?: () => void;

    constructor(
        host: ShadowRoot,
        workspace: HTMLElement,
        options: Menu.IOptions,
    ) {
        options.renderer = new MenuRenderer();
        super(options);
        this._host = host;
        this._workspace = workspace;
        (this as any)._openChildMenu = this._overrideOpenChildMenu.bind(this);
    }

    open(x: number, y: number, options?: Menu.IOpenOptions) {
        options ||= {};
        options.host = this._host as any as HTMLElement;
        const box = this._workspace.getBoundingClientRect();
        super.open(x, y, options);
        const menu_box = this.node.getBoundingClientRect();
        if (
            menu_box.height + y > box.height &&
            menu_box.height + y < document.documentElement.clientHeight
        ) {
            this.node.style.top = `-${menu_box.height}`;
        }

        if (menu_box.width + x > box.width) {
            if (menu_box.width + x < document.documentElement.clientWidth) {
                this.node.style.left = `-${menu_box.width + x - box.width}px`;
            } else {
                this.node.style.left = `-${
                    document.documentElement.clientWidth - box.width
                }px`;
            }
        }
    }

    // Override this lumino private method because it will otherwise always
    // attach to `document.body`.
    private _overrideOpenChildMenu(activateFirst = false) {
        const self = this as any;
        let item = this.activeItem;
        if (!item || item.type !== "submenu" || !item.submenu) {
            self._closeChildMenu();
            return;
        }

        let submenu = item.submenu;
        if (submenu === self._childMenu) {
            return;
        }

        Menu.saveWindowData();
        self._closeChildMenu();
        self._childMenu = submenu;
        self._childIndex = self._activeIndex;
        (submenu as any)._parentMenu = this;
        MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
        let itemNode = this.contentNode.children[self._activeIndex];
        openSubmenu(submenu, itemNode as HTMLElement, self._host);
        if (activateFirst) {
            submenu.activeIndex = -1;
            submenu.activateNextItem();
        }

        submenu.activate();
    }
}

class MenuRenderer extends Menu.Renderer {
    formatLabel(data: Menu.IRenderData) {
        let { label, mnemonic } = data.item;
        if (mnemonic < 0 || mnemonic >= label.length) {
            return label;
        }

        let prefix = label.slice(0, mnemonic);
        let suffix = label.slice(mnemonic + 1);
        let char = label[mnemonic];
        let span = h.span(
            {
                className: "lm-Menu-itemMnemonic p-Menu-itemMnemonic",
            },
            char,
        );

        return [prefix, span, suffix];
    }

    renderLabel(data: Menu.IRenderData) {
        let content = this.formatLabel(data);
        return h.div(
            {
                className: "lm-Menu-itemLabel p-Menu-itemLabel",
            },
            content,
        );
    }

    renderSubmenu(data: Menu.IRenderData) {
        return h.div({
            className: "lm-Menu-itemSubmenuIcon" + " p-Menu-itemSubmenuIcon",
        });
    }

    renderItem(data: Menu.IRenderData) {
        let className = this.createItemClass(data);
        let dataset = this.createItemDataset(data);
        let aria = this.createItemARIA(data);
        return h.li(
            {
                className,
                dataset,
                tabindex: "0",
                onfocus: data.onfocus,
                ...aria,
            },
            this.renderLabel(data),
            this.renderShortcut(data),
            this.renderSubmenu(data),
        );
    }
}

// Prevent submenus from attaching outside the Shadow DOM.
// Forked from [Lumino](https://github.com/jupyterlab/lumino/blob/main/packages/widgets/src/menu.ts).
// [License](https://github.com/jupyterlab/lumino/blob/main/LICENSE)
export function openSubmenu(
    submenu: Menu,
    itemNode: HTMLElement,
    host: HTMLElement,
): void {
    const windowData = getWindowData();
    let px = windowData.pageXOffset;
    let py = windowData.pageYOffset;
    let cw = windowData.clientWidth;
    let ch = windowData.clientHeight;
    const hostData = (host as any).host.getBoundingClientRect();
    let hx = hostData.x;
    let hy = hostData.y;
    MessageLoop.sendMessage(submenu, Widget.Msg.UpdateRequest);
    let maxHeight = ch;
    let node = submenu.node;
    let style = node.style;
    style.opacity = "0";
    style.maxHeight = `${maxHeight}px`;
    Widget.attach(submenu, host);
    let { width, height } = node.getBoundingClientRect();
    let box = ElementExt.boxSizing(submenu.node);
    let itemRect = itemNode.getBoundingClientRect();
    let x = itemRect.right - SUBMENU_OVERLAP - hx;
    if (x + width > px + cw + hx) {
        x = itemRect.left + SUBMENU_OVERLAP - width;
    }

    let y = itemRect.top - box.borderTop - box.paddingTop - hy;
    if (y + height > py + ch + hy) {
        y = itemRect.bottom + box.borderBottom + box.paddingBottom - height;
    }

    style.transform = `translate(${Math.max(0, x)}px, ${Math.max(0, y)}px`;
    style.opacity = "1";
}

export const SUBMENU_OVERLAP = 3;

let transientWindowDataCache: IWindowData | null = null;
let transientCacheCounter: number = 0;

function getWindowData(): IWindowData {
    if (transientCacheCounter > 0) {
        transientCacheCounter--;
        return transientWindowDataCache!;
    }
    return _getWindowData();
}

function _getWindowData(): IWindowData {
    return {
        pageXOffset: window.pageXOffset,
        pageYOffset: window.pageYOffset,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
    };
}

interface IWindowData {
    pageXOffset: number;
    pageYOffset: number;
    clientWidth: number;
    clientHeight: number;
}
