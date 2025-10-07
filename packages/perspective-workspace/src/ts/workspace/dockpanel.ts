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

import { DockLayout, DockPanel, TabBar, Widget } from "@lumino/widgets";
import { PerspectiveTabBar } from "./tabbar";
import { PerspectiveTabBarRenderer } from "./tabbarrenderer";
import { PerspectiveWorkspace } from "./workspace";
import { PerspectiveViewerWidget } from "./widget";

class PerspectiveDockPanelRenderer extends DockPanel.Renderer {
    _workspace: PerspectiveWorkspace;

    constructor(workspace: PerspectiveWorkspace) {
        super();
        this._workspace = workspace;
    }

    createTabBar() {
        const tabbar = new PerspectiveTabBar(this._workspace, {
            renderer: new PerspectiveTabBarRenderer(false),
        });

        tabbar.addClass("lm-DockPanel-tabBar");
        return tabbar;
    }
}

// @ts-ignore: extending a private member `_onTabDetachRequested`
export class PerspectiveDockPanel extends DockPanel {
    constructor(workspace: PerspectiveWorkspace) {
        super({ renderer: new PerspectiveDockPanelRenderer(workspace) });

        // @ts-ignore: accessing a private member `_renderer`
        this._renderer.dock = this;
    }

    _onTabDetachRequested(
        sender: TabBar<Widget>,
        args: TabBar.ITabDetachRequestedArgs<Widget>,
    ) {
        // @ts-ignore: accessing a private member `_onTabDetachRequested`
        super._onTabDetachRequested(sender, args);

        // blur widget on when it's being moved
        const widget = sender.titles[args.index].owner;
        const layout = this.layout as DockLayout;
        const old = layout.saveLayout();
        if (Array.from(layout.widgets()).length > 1) {
            layout.removeWidget(widget);
        }

        widget.addClass("widget-blur");
        document.body.classList.add("lm-mod-override-cursor");

        // @ts-ignore: accessing a private member `_drag`
        const drag = this._drag;
        if (drag) {
            drag.dragImage?.parentElement.removeChild(drag.dragImage);
            drag.dragImage = null;
            drag._promise.then(() => {
                if (!widget.node.isConnected) {
                    layout.restoreLayout(old);
                }

                document.body.classList.remove("lm-mod-override-cursor");
                widget.removeClass("widget-blur");
            });
        }
    }

    static getWidgets(
        layout: DockPanel.ILayoutConfig,
    ): PerspectiveViewerWidget[] {
        if (!!layout.main) {
            return PerspectiveDockPanel.getAreaWidgets(layout.main);
        } else {
            return [];
        }
    }

    static getAreaWidgets(
        layout: DockLayout.AreaConfig,
    ): PerspectiveViewerWidget[] {
        if (layout?.hasOwnProperty("children")) {
            const split_panel = layout as DockLayout.ISplitAreaConfig;
            return split_panel.children.flatMap((widget) =>
                PerspectiveDockPanel.getAreaWidgets(widget),
            );
        } else if (layout?.hasOwnProperty("widgets")) {
            const tab_panel = layout as DockLayout.ITabAreaConfig;
            return tab_panel.widgets as PerspectiveViewerWidget[];
        }

        return [];
    }

    widgets(): IterableIterator<PerspectiveViewerWidget> {
        return super.widgets() as IterableIterator<PerspectiveViewerWidget>;
    }

    static mapWidgets(
        widgetFunc: (widget: any) => any,
        layout: any,
    ): DockPanel.ILayoutConfig {
        if (!!layout.main) {
            layout.main = PerspectiveDockPanel.mapAreaWidgets(
                widgetFunc,
                layout.main,
            );
        }

        return layout;
    }

    static mapAreaWidgets(
        widgetFunc: (widget: any) => any,
        layout: DockLayout.AreaConfig,
    ): DockLayout.AreaConfig {
        if (layout.hasOwnProperty("children")) {
            const split_panel = layout as DockLayout.ISplitAreaConfig;
            split_panel.children = split_panel.children.map((widget) =>
                PerspectiveDockPanel.mapAreaWidgets(widgetFunc, widget),
            );
        } else if (layout.hasOwnProperty("widgets")) {
            const tab_panel = layout as DockLayout.ITabAreaConfig;
            tab_panel.widgets = tab_panel.widgets.map(widgetFunc);
        }

        return layout;
    }

    onAfterAttach() {
        this.spacing =
            parseInt(window.getComputedStyle(this.node).padding) || 0;
    }
}
