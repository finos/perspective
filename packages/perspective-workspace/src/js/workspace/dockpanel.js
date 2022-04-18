/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DockPanel} from "@lumino/widgets/src/dockpanel";
import {PerspectiveTabBar} from "./tabbar";
import {PerspectiveTabBarRenderer} from "./tabbarrenderer";
import {toArray} from "@lumino/algorithm/src";

class PerspectiveDockPanelRenderer extends DockPanel.Renderer {
    createTabBar() {
        const tabbar = new PerspectiveTabBar({
            renderer: new PerspectiveTabBarRenderer(),
        });
        tabbar.addClass("p-DockPanel-tabBar");
        return tabbar;
    }
}

export class PerspectiveDockPanel extends DockPanel {
    constructor() {
        super({renderer: new PerspectiveDockPanelRenderer()});
        this._renderer.dock = this;
    }

    _onTabDetachRequested(sender, args) {
        super._onTabDetachRequested(sender, args);
        // blur widget on when it's being moved
        const widget = sender.titles[args.index].owner;
        const old = this.layout.saveLayout();
        if (toArray(this.layout.widgets()).length > 1) {
            this.layout.removeWidget(widget);
        }

        widget.addClass("widget-blur");

        if (this._drag) {
            this._drag._promise.then(() => {
                if (!widget.node.isConnected) {
                    this.layout.restoreLayout(old);
                }

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
