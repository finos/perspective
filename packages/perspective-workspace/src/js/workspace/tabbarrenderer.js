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

import { h } from "@lumino/virtualdom/src";
import { TabBar } from "@lumino/widgets/src/tabbar";

export const TabBarItems = {
    Config: "config",
    Label: "label",
};

export const DEFAULT_TITLE = "untitled";

export class PerspectiveTabBarRenderer extends TabBar.Renderer {
    constructor(maximized) {
        super();
        this.maximized = maximized;
    }

    renderLabel(data) {
        return h.span(
            {
                className: "p-TabBar-tabLabel",
                id: TabBarItems.Label,
            },
            data.title.label || DEFAULT_TITLE,
        );
    }

    renderOther(data, title) {
        return h.span({}, title.label || "untitled");
    }

    renderInert() {
        return h.div();
    }

    renderTab(data) {
        const title = data.title.caption;
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        let className = this.createTabClass(data);
        const dataset = this.createTabDataset(data);
        const more = [];
        if (data.onClick) {
            more.push(
                h.div(
                    { onclick: data.onClick, class: "bookmarks-button" },
                    h.div({ class: "bookmarks" }),
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
    //         className: "p-TabBar-tabConfigIcon",
    //         id: TabBarItems.Config,
    //     });
    // }

    renderCloseIcon() {
        return h.div({
            className: "lm-TabBar-tabCloseIcon" + " p-TabBar-tabCloseIcon",
        });
    }
}
