/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {h, VirtualElement} from "@phosphor/virtualdom";
import {TabBar} from "@phosphor/widgets";

export enum TabBarActions {
    Maximize = "maximize",
    Config = "config"
}

export class PerspectiveTabBarRenderer extends TabBar.Renderer {
    private maximized = false;

    constructor(maximized: boolean) {
        super();
        this.maximized = maximized;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public renderTab(data: TabBar.IRenderData<any>): VirtualElement {
        const title = data.title.caption;
        const key = this.createTabKey(data);
        const style = this.createTabStyle(data);
        let className = this.createTabClass(data);
        const dataset = this.createTabDataset(data);

        // move these to tabbar as well
        if (!this.maximized) {
            className += ` p-mod-maximize`;
        } else {
            className += ` p-mod-minimize`;
        }

        return h.li(
            {key, className, title, style, dataset},
            this.renderConfigIcon(),
            this.renderLabel(data),
            this.renderCloseIcon(data),
            h.div({className: "divider"})
            // h.div({className: "shadow"})
        );
    }

    public renderConfigIcon(): VirtualElement {
        return h.div({className: "p-TabBar-tabConfigIcon", id: TabBarActions.Config});
    }
}
