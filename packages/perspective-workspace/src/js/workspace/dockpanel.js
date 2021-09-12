/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DockPanel} from "@lumino/widgets";
import {DiscreteDockPanel} from "./discrete";
import {PerspectiveTabBar} from "./tabbar";
import {PerspectiveTabBarRenderer} from "./tabbarrenderer";

class PerspectiveDockPanelRenderer extends DockPanel.Renderer {
    createTabBar() {
        const tabbar = new PerspectiveTabBar({
            renderer: new PerspectiveTabBarRenderer(),
        });
        tabbar.addClass("p-DockPanel-tabBar");
        return tabbar;
    }
}

export class PerspectiveDockPanel extends DiscreteDockPanel {
    constructor() {
        super({renderer: new PerspectiveDockPanelRenderer()});
        this._renderer.dock = this;
    }

    _onTabDetachRequested(sender, args) {
        super._onTabDetachRequested(sender, args);
        // blur widget on when it's being moved
        const widget = sender.titles[0].owner;
        widget.addClass("widget-blur");

        if (this._drag) {
            this._drag._promise.then(() => {
                widget.removeClass("widget-blur");
            });
        }
    }

    static getWidgets(layout) {
        if (layout?.hasOwnProperty("main")) {
            return PerspectiveDockPanel.getWidgets(layout.main);
        } else if (layout?.children) {
            return layout.children.flatMap((widget) =>
                PerspectiveDockPanel.getWidgets(widget)
            );
        } else if (layout?.widgets) {
            return layout.widgets;
        }
        return [];
    }

    static mapWidgets(widgetFunc, layout) {
        if (layout.main) {
            layout.main = PerspectiveDockPanel.mapWidgets(
                widgetFunc,
                layout.main
            );
        } else if (layout.children) {
            layout.children = layout.children.map((widget) =>
                PerspectiveDockPanel.mapWidgets(widgetFunc, widget)
            );
        } else if (layout.widgets) {
            layout.widgets = layout.widgets.map((widget) => widgetFunc(widget));
        }
        return layout;
    }

    onAfterAttach() {
        this.spacing =
            parseInt(window.getComputedStyle(this.node).padding) || 0;
    }
}
