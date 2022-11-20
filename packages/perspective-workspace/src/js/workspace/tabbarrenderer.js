/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import { h } from "@lumino/virtualdom/src";
import { TabBar } from "@lumino/widgets/src/tabbar";

export const TabBarItems = {
    Config: "config",
    Label: "label",
};

export const DEFAULT_TITLE = "[untitled]";

export class PerspectiveTabBarRenderer extends TabBar.Renderer {
    constructor(maximized) {
        super();
        this.maximized = maximized;
    }

    renderLabel(data) {
        return h.input({
            className: "p-TabBar-tabLabel",
            readonly: true,
            id: TabBarItems.Label,
            value: data.title.label || DEFAULT_TITLE,
        });
    }

    renderTab(data) {
        const title = data.title.caption;
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        let className = this.createTabClass(data);
        const dataset = this.createTabDataset(data);

        return h.li(
            { key, className, title, style, dataset },
            this.renderConfigIcon(),
            this.renderLabel(data),
            this.renderCloseIcon(),
            h.div({ className: "divider" })
        );
    }

    renderConfigIcon() {
        return h.div({
            className: "p-TabBar-tabConfigIcon",
            id: TabBarItems.Config,
        });
    }

    renderCloseIcon() {
        return h.div({
            className: "lm-TabBar-tabCloseIcon" + " p-TabBar-tabCloseIcon",
        });
    }
}
