/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {find} from "@phosphor/algorithm";
import {DockPanel, TabBar, Widget, DockLayout} from "@phosphor/widgets";
import {Menu} from "@phosphor/widgets";
import {createCommands} from "./contextmenu";
import {PerspectiveTabBar, TabMaximizeArgs} from "./tabbar";
import {PerspectiveTabBarRenderer} from "./tabbarrenderer";
import {PerspectiveWidget, PerspectiveWidgetOptions} from "../widget";
import {Signal} from "@phosphor/signaling";
import {CommandRegistry} from "@phosphor/commands";

export interface SerializableITabAreaConfig extends Omit<DockLayout.ITabAreaConfig, "widgets"> {
    widgets: PerspectiveWidgetOptions[];
}

export interface SerializableISplitAreaConfig extends Omit<DockLayout.ISplitAreaConfig, "widgets"> {
    widgets: PerspectiveWidgetOptions[];
}

export type SerilizableAreaConfig = SerializableITabAreaConfig | SerializableISplitAreaConfig;

export interface SerilizableILayoutConfig {
    main: SerilizableAreaConfig | null;
}

class PerspectiveDockPanelRenderer extends DockPanel.Renderer {
    public dock: PerspectiveDockPanel;

    public createTabBar(): TabBar<Widget> {
        const tabbar = new PerspectiveTabBar({renderer: new PerspectiveTabBarRenderer(this.dock.maximized)});
        tabbar.addClass("p-DockPanel-tabBar");
        tabbar.tabMaximizeRequested.connect(this.dock.onTabMaximizeRequested, this);
        tabbar.toggleConfigRequested.connect(this.dock.onToggleConfigRequested, this);
        return tabbar;
    }
}

export interface PerspectiveDockPanelOptions extends DockPanel.IOptions {
    enableContextMenu: boolean;
    node?: HTMLElement;
}

export interface ContextMenuArgs {
    widget: PerspectiveWidget;
    event: MouseEvent;
}
// tslint:disable-next-line: max-classes-per-file
export class PerspectiveDockPanel extends DockPanel {
    public id = "main";

    public maximized: boolean;

    public commands: CommandRegistry;
    private minimizedLayout: DockPanel.ILayoutConfig;
    private enableContextMenu = true;
    private _onContextMenu: Signal<PerspectiveDockPanel, ContextMenuArgs>;

    private listeners: WeakMap<PerspectiveWidget, Function>;

    constructor(name: string, options: PerspectiveDockPanelOptions = {enableContextMenu: true}) {
        super({renderer: new PerspectiveDockPanelRenderer(), ...options});

        // Need a cleaner way to do this
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._renderer.dock = this;
        this.commands = createCommands(this);
        this.addTabbarEventListeners();
        this.listeners = new WeakMap();
        this.enableContextMenu = options.enableContextMenu;
        this._onContextMenu = new Signal(this);
        if (this.enableContextMenu) {
            this._onContextMenu.connect(this.showMenu);
        }
        if (options.node) {
            Widget.attach(this, options.node);
        } else {
        }
    }

    public addWidget(widget: PerspectiveWidget, options: DockPanel.IAddOptions = {}): void {
        this.addWidgetEventListeners(widget);
        super.addWidget(widget, options);
    }

    public restore(layout: SerilizableILayoutConfig): void {
        const newLayout = PerspectiveDockPanel.mapWidgets((config: PerspectiveWidgetOptions) => this.createWidget(config.title, config), layout);
        this.restoreLayout(newLayout);
    }

    public save(): SerilizableILayoutConfig {
        const layout = this.saveLayout();
        return PerspectiveDockPanel.mapWidgets((widget: PerspectiveWidget) => widget.save(), layout);
    }

    public onToggleConfigRequested = (sender: PerspectiveTabBar, args: TabMaximizeArgs): void => {
        (args.title.owner as PerspectiveWidget).toggleConfig();
    };
    /**
     * Handle the `tabMaximizeRequested` signal from a tab bar.
     */
    // rethink maximize
    public onTabMaximizeRequested = (sender: PerspectiveTabBar, args: TabMaximizeArgs): void => {
        this.maximized = !this.maximized;
        if (this.maximized) {
            this.minimizedLayout = this.saveLayout();

            this.restoreLayout({
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: [args.title.owner]
                }
            });
        } else {
            this.restoreLayout(this.minimizedLayout);
            this.minimizedLayout = null;
        }
    };

    protected findTabbar(widget: PerspectiveWidget): PerspectiveTabBar {
        return find(this.tabBars(), bar => bar.titles[0].owner === widget) as PerspectiveTabBar;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private createMenu(widget: any): Menu {
        const contextMenu = new Menu({commands: this.commands});

        // could move these 3 to perspective widget
        contextMenu.addItem({command: "perspective:export", args: {widget}});
        contextMenu.addItem({command: "perspective:copy", args: {widget}});
        contextMenu.addItem({command: "perspective:reset", args: {widget}});
        return contextMenu;
    }

    private showMenu(sender: PerspectiveDockPanel, args: ContextMenuArgs): void {
        // create menu in add widget instead??
        const {event, widget} = args;
        const menu = this.createMenu(widget);
        const tabbar = this.findTabbar(widget);

        widget.node.classList.add("context-focus");
        tabbar.node.classList.add("context-focus");
        this.node.classList.add("context-menu-open");

        menu.aboutToClose.connect(() => {
            widget.node.classList.remove("context-focus");
            tabbar.node.classList.remove("context-focus");
            this.node.classList.remove("context-menu-open");
        });

        menu.open(event.clientX, event.clientY);
        event.preventDefault();
        event.stopPropagation();
    }

    get onContextMenu(): Signal<PerspectiveDockPanel, ContextMenuArgs> {
        return this._onContextMenu;
    }

    private addTabbarEventListeners(): void {
        this.node.addEventListener("contextmenu", event => {
            const tabBar = find(this.tabBars(), bar => {
                return bar.node.contains(event.target as Node);
            });
            const widget = tabBar.titles[0].owner as PerspectiveWidget;
            this._onContextMenu.emit({widget, event});
            event.preventDefault();
        });
    }

    private addWidgetEventListeners(widget: PerspectiveWidget): void {
        if (this.listeners.has(widget)) {
            this.listeners.get(widget)();
        }
        const settings = (event: CustomEvent): void => {
            widget.title.className = event.detail && "settings_open";
        };
        const contextMenu = (event: MouseEvent): void => this.onContextMenu.emit({widget, event});
        widget.viewer.addEventListener("contextmenu", contextMenu);
        widget.viewer.addEventListener("perspective-toggle-settings", settings);

        this.listeners.set(widget, () => {
            widget.viewer.removeEventListener("contextmenu", contextMenu);
            widget.viewer.removeEventListener("perspective-toggle-settings", settings);
        });
    }

    public createWidget = (title: string, config: PerspectiveWidgetOptions): PerspectiveWidget => {
        const widget = new PerspectiveWidget(title, config);
        this.addWidgetEventListeners(widget);
        return widget;
    };

    public static mapWidgets(widgetFunc: any, layout: any): any {
        if (layout.main) {
            layout.main = PerspectiveDockPanel.mapWidgets(widgetFunc, layout.main);
        } else if (layout.children) {
            layout.children = layout.children.map((x: DockLayout.ITabAreaConfig | DockLayout.ISplitAreaConfig) => PerspectiveDockPanel.mapWidgets(widgetFunc, x));
        } else if (layout.widgets) {
            layout.widgets = layout.widgets.map((x: PerspectiveWidget | PerspectiveWidgetOptions) => widgetFunc(x));
        }
        return layout;
    }

    onAfterAttach(): void {
        this.spacing = parseInt(window.getComputedStyle(this.node).padding) || 0;
    }
}
