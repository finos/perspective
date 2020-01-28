/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {h} from "@phosphor/virtualdom";
import {TabBar} from "@phosphor/widgets";

export const TabBarActions = {
    Config: "config"
};

export class PerspectiveTabBarRenderer extends TabBar.Renderer {
    constructor(maximized) {
        super();
        this.maximized = maximized;
    }

    renderTab(data) {
        const title = data.title.caption;
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        let className = this.createTabClass(data);
        const dataset = this.createTabDataset(data);

        // eslint-disable-next-line prettier/prettier
        return h.li(
            {key, className, title, style, dataset},
            this.renderConfigIcon(),
            this.renderLabel(data),
            this.renderCloseIcon(data),
            h.div({className: "divider"})
        );
    }

    renderConfigIcon() {
        return h.div({className: "p-TabBar-tabConfigIcon", id: TabBarActions.Config});
    }
}
