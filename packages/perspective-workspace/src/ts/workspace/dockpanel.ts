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
import {
    PerspectiveLayoutArea,
    PerspectiveLayoutConfig,
    PerspectiveSplitArea,
    PerspectiveTabArea,
    PerspectiveWorkspace,
    PerspectiveWorkspaceConfig,
} from "./workspace";
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
        args: TabBar.ITabDetachRequestedArgs<Widget>
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
        layout: PerspectiveLayoutConfig<Widget>
    ): PerspectiveViewerWidget[] {
        if (!!layout.main) {
            return PerspectiveDockPanel.getAreaWidgets(layout.main);
        } else {
            return [];
        }
    }

    static getAreaWidgets(
        layout: PerspectiveLayoutArea<Widget>
    ): PerspectiveViewerWidget[] {
        if (layout.type === "split-area") {
            const split_panel = layout as DockLayout.ISplitAreaConfig;
            return split_panel.children.flatMap((widget) =>
                PerspectiveDockPanel.getAreaWidgets(widget)
            );
        } else if (layout.type === "tab-area") {
            const tab_panel = layout as DockLayout.ITabAreaConfig;
            return tab_panel.widgets as PerspectiveViewerWidget[];
        }

        return [];
    }

    widgets(): IterableIterator<PerspectiveViewerWidget> {
        return super.widgets() as IterableIterator<PerspectiveViewerWidget>;
    }

    /// transforms a layout, either a Lumino DockLayout or a PerspectiveWorkspaceConfig
    /// each widget in the layout tree is passed to the mapping function
    static mapWidgets<T, U>(
        widgetFunc: (widget: T) => U,
        layout: PerspectiveLayoutConfig<T>
    ): PerspectiveLayoutConfig<U> {
        if (!!layout.main) {
            return {
                ...layout,
                main: PerspectiveDockPanel.mapAreaWidgets(
                    widgetFunc,
                    layout.main
                ),
            };
        }

        // this is safe because without a main there are no `T`s or `U`s
        // within the object, so it can be cast from one to the other.
        return layout as unknown as PerspectiveLayoutConfig<U>;
    }

    static mapAreaWidgets<T, U>(
        widgetFunc: (widget: T) => U,
        layout: PerspectiveLayoutArea<T>
    ): PerspectiveLayoutArea<U> {
        if (layout.type === "split-area") {
            const split = layout as PerspectiveSplitArea<T>;
            return {
                ...split,
                children: split.children.map((w: PerspectiveLayoutArea<T>) =>
                    PerspectiveDockPanel.mapAreaWidgets(widgetFunc, w)
                ),
            };
        } else if (layout.type === "tab-area") {
            const tab = layout as PerspectiveTabArea<T>;
            return {
                ...tab,
                widgets: tab.widgets.map(widgetFunc),
            };
        } else {
            throw new Error("Unknown layout type");
        }
    }

    onAfterAttach() {
        this.spacing =
            parseInt(window.getComputedStyle(this.node).padding) || 0;
    }
}
