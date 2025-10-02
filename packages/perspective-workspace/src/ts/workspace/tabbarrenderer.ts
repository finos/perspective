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

import { h } from "@lumino/virtualdom";
import { TabBar } from "@lumino/widgets";

export const TabBarItems = {
    Config: "config",
    Label: "label",
};

export const DEFAULT_TITLE = "untitled";

export class PerspectiveTabBarRenderer extends TabBar.Renderer {
    maximized: boolean;

    constructor(maximized: boolean) {
        super();
        this.maximized = maximized;
    }

    renderLabel(data: { title: { label?: string } }) {
        return h.span(
            {
                className: "lm-TabBar-tabLabel",
                id: TabBarItems.Label,
            },
            data.title.label || DEFAULT_TITLE,
        );
    }

    renderInert() {
        return h.div();
    }

    renderTab(
        data: TabBar.IRenderData<any>,
        onclick?: (this: HTMLElement, event: MouseEvent) => any,
    ) {
        const title = data.title.caption;
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        let className = this.createTabClass(data);
        const dataset = this.createTabDataset(data);
        const more: h.Child[] = [];
        if (onclick) {
            more.push(
                h.div(
                    { onclick, className: "bookmarks-button" },
                    h.div({ className: "bookmarks" }),
                ),
            );
        }

        return h.li(
            { key, className, title, style, dataset },
            this.renderDragHandle(),
            ...more,
            this.renderLabel(data),
            this.renderCloseIcon(),
        );
    }

    renderDragHandle() {
        return h.div({
            className: "drag-handle",
        });
    }

    // renderConfigIcon() {
    //     return h.div({
    //         className: "lm-TabBar-tabConfigIcon",
    //         id: TabBarItems.Config,
    //     });
    // }

    renderCloseIcon() {
        return h.div({
            className: "lm-TabBar-tabCloseIcon" + " p-TabBar-tabCloseIcon",
        });
    }
}
