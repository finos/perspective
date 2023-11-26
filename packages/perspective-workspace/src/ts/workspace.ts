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

import { Table } from "@finos/perspective";
import {
    HTMLCopyDropDownMenuElement,
    HTMLExportDropDownMenuElement,
    PerspectiveViewerConfig,
} from "@finos/perspective-viewer";

import { find } from "@lumino/algorithm";
import { CommandRegistry } from "@lumino/commands";
import { DockLayout, DockPanel, Menu, TabBar, Widget } from "@lumino/widgets";

import { debounce } from "lodash";

import { PerspectiveViewer } from "./viewer";
import { MenuRenderer } from "./menu";
import { createCommands } from "./commands";

export type ViewerAddOptions = {
    /**
     * Where to place the viewer in the layout, possibly relative to the `ref`.
     */
    mode?: DockLayout.InsertMode;
    /**
     * The ID of the Perspective Viewer to use as a positioning reference.
     */
    ref?: string;
};

export type TabAreaConfig = {
    type: "tab-area";
    widgets: string[];
    currentIndex: number;
};
export type SplitAreaConfig = {
    type: "split-area";
    orientation: "horizontal" | "vertical";
    children: AreaConfig[];
    sizes: number[];
};

export type AreaConfig = TabAreaConfig | SplitAreaConfig;

export type DetailConfig = {
    main: AreaConfig;
};

export type WorkspaceLayoutConfig = {
    detail: DetailConfig | null;
    viewers: { [name: string]: PerspectiveViewerConfig };
};

// TODO: tab-handles dont seem to be created???

export class Workspace {
    /**
     * The tables registered for use in this workspace.
     */
    private _tables: Map<string, Table>;
    /**
     * References to the viewers managed by this workspace.
     */
    private _viewers: Map<string, PerspectiveViewer>;

    // TODO: merge this with viewers?
    private _destructors: Map<string, () => void>;

    /**
     * The DockPanel that is used
     */
    private _panel: DockPanel;

    private _indicator: HTMLElement;
    private _commands: CommandRegistry;

    /**
     * A cached layout of the DockPanel.
     * TODO: should this be the WorkspaceLayout instead?
     *       Which is needed more?
     */
    private _layout: DockLayout.ILayoutConfig;

    /**
     * A strictly monotonically increasing counter for keeping track of viewers.
     * Each time a viewer is created by this workspace this counter increases.
     */
    private _counter: number = 0;

    // There is at most one context menu in existence, same with the initOverlay function.
    private _currentContextMenu: Menu | null = null;
    private _currentInitOverlay: (() => void) | null = null;

    private onLayoutModified = debounce(this._onLayoutModified, 100);

    /**
     * If a panel is given it will be used to add widgets to. Otherwise one will be constructed
     * by this manager, and it can be attached to the DOM by using Widget.attach
     * @param panel the panel to manipulate and add/remove widgets to.
     */
    constructor(panel?: DockPanel) {
        this._panel = panel ?? new DockPanel();
        // TODO: I think that the context menus may be off due to this.
        //       Perhaps it should be a child of the DockPanel and not the body?
        //       Or at least somehow chained to it?
        this._indicator = document.createElement("perspective-indicator");
        document.body.appendChild(this._indicator);
        this._layout = this._panel.saveLayout();
        this._commands = createCommands(this);
        this._tables = new Map();
        this._viewers = new Map();
        this._destructors = new Map();

        this.panel.layoutModified.connect(this.onLayoutModified, this);
    }

    /**
     * Register a table for use in this workspace.
     * @param name The name of the table being registered
     * @param table The table being registered
     */
    public addTable(name: string, table: Table) {
        // TODO: should we check if this is already set?
        this._tables.set(name, table);
    }

    /**
     * Add a viewer to the workspace.
     * @param viewConfig The Perspective options to use to instantiate this viewer within the workspace.
     * @param layoutConfig The DockLayout options for where to place the viewer within the DockPanel.
     *          Will default to Lumino's default options.
     * @returns The ID of the viewer Added.
     */
    public async addViewer(
        viewConfig: PerspectiveViewerConfig,
        layoutConfig?: ViewerAddOptions
    ): Promise<string> {
        let viewer = await this.makeViewer(viewConfig);
        this.placeViewer(viewer, layoutConfig);
        return viewer.id;
    }

    /**
     * Duplicate a viewer that is already in the workspace.
     * @param viewerId The viewer to duplicate
     * @param layoutConfig Where to duplicate the viewer to
     */
    public async duplicateViewer(
        viewerId: string,
        layoutConfig?: ViewerAddOptions
    ): Promise<string> {
        const source = this.getViewer(viewerId);
        let sourceConfig = await source.save();
        sourceConfig.title = source.title.label;
        sourceConfig.table = source.tableName;

        let viewer = await this.makeViewer(sourceConfig);
        this.placeViewer(viewer, layoutConfig);
        return viewer.id;
    }

    /**
     * Save the layout of the workspace into a serializable object.
     * @returns a Layout configuration that describes the Perspective
     *          Viewer widgets within the DockPanel managed by this object.
     *          If there are non-PerspectiveViewer widgets inside the workspace
     *          when this method is called, the result is undefined behavior.
     */
    public async save(): Promise<WorkspaceLayoutConfig> {
        // ensure layout is fresh...
        // TODO: we probably need to ditch caching the layout.
        this._layout = this.panel.saveLayout();
        const detail = Private.mapLayout((w) => w.id, this._layout);
        const widgets = Private.getWidgets(this._layout);
        const viewers = {};
        for (const widget of widgets) {
            // TODO: allow non PerspectiveViewer to be saved() somehow...
            //       Needed for better Jupyter compatibility.
            const w = widget as PerspectiveViewer;
            const id = w.id;
            viewers[id] = await w.save();
            viewers[id].table = w.tableName;
            viewers[id].title = w.title.label;
            viewers[id].settings = false;
        }
        return { detail, viewers };
    }

    /**
     * Set the layout of this workspace's panel to the given configurations specification.
     * @param config The layout to restore to
     */
    public async restore(config: WorkspaceLayoutConfig) {
        const viewers = structuredClone(config.viewers);
        // TODO: this is important to not do wrong...
        let widgets = this.panel.widgets();
        for (const old of widgets) {
            if (old instanceof PerspectiveViewer) {
                // TODO does this need to be awaited??
                // TODO: if a tab was already closed, this will cause an exception.
                //       cause Viewers can only be delete()d once.
                await old.close();
            }
            if (old instanceof Widget) {
                old.dispose();
            }
        }
        const layout = await Private.mapToDockLayout(async (id) => {
            if (!viewers[id]) {
                throw new Error(`Viewer "${id}" not defined.`);
            }
            let viewerConfig = viewers[id];
            return this.makeViewer(viewerConfig);
        }, config);
        this.panel.restoreLayout(layout);
    }

    /**
     * Open the export context menu.
     * @param string The ID of the viewer that will be exported.
     */
    public openExportViewer(viewerId: string) {
        const menu: HTMLExportDropDownMenuElement = document.createElement(
            "perspective-export-menu"
        );
        if (!this._viewers.has(viewerId)) {
            throw new Error(`Viewer with ID "${viewerId}" not found.`);
        }
        let viewer = this._viewers.get(viewerId)!;
        // workspace.apply_indicator_theme();
        menu.unsafeSetModel(viewer.viewer.unsafeGetModel());
        menu.open(this._indicator);
        if (this._currentInitOverlay) {
            this._currentInitOverlay();
            menu.addEventListener("blur", () => {
                if (this._currentContextMenu) {
                    this._currentContextMenu.close();
                }
                this._currentInitOverlay = null;
                this._currentContextMenu = null;
            });
        }
    }

    /**
     * Open the copy context menu.
     * @param string The ID of the viewer that will be copied.
     */
    public openCopyViewer(viewerId: string) {
        const menu: HTMLCopyDropDownMenuElement = document.createElement(
            "perspective-copy-menu"
        );
        if (!this._viewers.has(viewerId)) {
            throw new Error(`Viewer with ID "${viewerId}" not found.`);
        }
        let viewer = this._viewers.get(viewerId)!;
        // workspace.apply_indicator_theme();
        menu.unsafeSetModel(viewer.viewer.unsafeGetModel());
        menu.open(this._indicator);
        if (this._currentInitOverlay) {
            this._currentInitOverlay();
            menu.addEventListener("blur", () => {
                if (this._currentContextMenu) {
                    this._currentContextMenu.close();
                }
                this._currentInitOverlay = null;
                this._currentContextMenu = null;
            });
        }
    }

    /**
     * TODO: This feels like it can be public, but I am not sure.
     * @param id The ID of the viewer to get
     * @throws if the viewer is not in the workspace.
     */
    public getViewer(id: string): PerspectiveViewer {
        if (!this._viewers.has(id)) {
            throw new Error(`Viewer with ID "${id}" not found.`);
        }
        return this._viewers.get(id)!;
    }

    /**
     * Clean up usage of the given viewer within this workspace.
     * NOTE: This should only be called by a PerspectiveViewer when it is closing.
     * if the viewer referenced by `id` is not closed, this will throw.
     * @param id The ID of the viewer that has been closed already.
     * @throws if the viewer is not in the workspace or if it is not already closed.
     */
    public onViewerClosed(id: string) {
        const viewer = this.getViewer(id);
        if (!viewer.closed) {
            throw new Error("Viewer is not closed.");
        }
        this._viewers.delete(id);
        let d = this._destructors.get(id);
        if (d) {
            d();
            this._destructors.delete(id);
        }
    }

    /**
     * The tables registered to this workspace.
     */
    public get tables(): Map<string, Table> {
        return this._tables;
    }

    /**
     * The panel controlled by this workspace.
     */
    public get panel(): DockPanel {
        return this._panel;
    }

    /********** Private API *********/
    /**
     * Create a PerspectiveViewer and write it into the workspace state.
     * @param config The configuration that instantiates the perspective-viewer element.
     */
    private async makeViewer(
        config: PerspectiveViewerConfig
    ): Promise<PerspectiveViewer> {
        if (!config.table) {
            throw new Error("Table not provided in viewer configuration.");
        }
        if (!this.tables.has(config.table)) {
            throw new Error(`Table "${config.table}" not registered.`);
        }

        let table = this.tables.get(config.table)!;
        let id = `psp_viewer_${this._counter++}`;
        let viewer = new PerspectiveViewer(config, id, this);
        await viewer.load(table);
        await viewer.restore(config);
        let destructor = this.attachEventListeners(viewer);
        this._viewers.set(id, viewer);
        this._destructors.set(id, destructor);
        return viewer;
    }

    /**
     * Place the viewer in the panel.
     * @param viewer The viewer to place in the Panel
     * @param layout Where to place it in the Panel
     */
    private placeViewer(viewer: PerspectiveViewer, layout?: ViewerAddOptions) {
        const ref = layout?.ref ? this.getViewer(layout.ref) : null;
        this.panel.addWidget(viewer, { mode: layout?.mode, ref });
    }

    // TODO: is it worth it to try and move this into PerspectiveViewer?
    //       it feels like that should be the reciever, but its much
    //       easier code-wise to put it here.
    //       Maybe construct functions here and pass them to viewer to attach?
    //       That just seems pedantic.
    private attachEventListeners(viewer: PerspectiveViewer): () => void {
        const settings = (event) => {
            // TODO!
            console.log("TODO");
            // if (!event.detail && manager.panel.mode === "single-document") {
            //     manager._unmaximize();
            // }
        };

        const contextMenu = (event) => this.showContextMenu(viewer, event);
        const updated = async (event) => {
            this.onLayoutModified();
            const config = await event.target?.save();
            if (!!config) {
                viewer.title.label = config.title;
            }
        };
        const onModified = () => this.onLayoutModified();

        viewer.viewer.addEventListener("contextmenu", contextMenu);
        viewer.viewer.addEventListener("perspective-toggle-settings", settings);
        viewer.viewer.addEventListener("perspective-config-update", updated);
        viewer.viewer.addEventListener("perspective-plugin-update", onModified);
        viewer.title.changed.connect(updated);
        return () => {
            console.log("Destructin'");
            viewer.viewer.removeEventListener("contextmenu", contextMenu);
            viewer.viewer.removeEventListener(
                "perspective-toggle-settings",
                settings
            );
            viewer.viewer.removeEventListener(
                "perspective-config-update",
                updated
            );
            viewer.viewer.removeEventListener(
                "perspective-plugin-update",
                onModified
            );
            viewer.title.changed.disconnect(updated);
        };
    }

    /**
     * Open the workspace context menu at the location of the event.
     * @param widget The viewer that was clicked onto.
     * @param event The pointer event that triggered the context menu opening.
     */
    private showContextMenu(widget: PerspectiveViewer, event: PointerEvent) {
        if (!event.shiftKey) {
            const tabbar = find(
                this.panel.tabBars(),
                (bar: TabBar<Widget>) => bar.currentTitle?.owner === widget
            );
            const [menu, init] = this.createContextMenu(widget, tabbar);
            this._currentInitOverlay = init;
            this._currentContextMenu = menu;
            init();

            menu.open(event.clientX, event.clientY);
            const box = menu.node.getBoundingClientRect();
            this._indicator.style.top = box.top + "px";
            this._indicator.style.left = box.left + "px";
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private createContextMenu(
        widget: PerspectiveViewer,
        tabbar: TabBar<Widget> | undefined
    ): [Menu, () => void] {
        const renderer = new MenuRenderer();
        const commands = this._commands;

        const contextMenu: Menu = new Menu({
            commands,
            renderer,
        });

        // TODO: we should be able to create a context menu when !widget.
        //       cases include right-clicking on tab bar, right-clicking on empty workspace.
        contextMenu.addItem({
            type: "submenu",
            command: "workspace:newmenu",
            submenu: (() => {
                const submenu = new Menu({ commands, renderer });
                for (const table of this.tables.keys()) {
                    submenu.addItem({
                        command: "workspace:new",
                        args: { table, ref: widget.id },
                    });
                }

                const widgets = Private.getWidgets(this._layout);

                if (widgets.length > 0) {
                    submenu.addItem({ type: "separator" });
                }

                let seen = new Set();
                for (const target_widget of widgets) {
                    if (!seen.has(target_widget.title.label)) {
                        if (target_widget instanceof PerspectiveViewer) {
                            submenu.addItem({
                                command: "workspace:newview",
                                args: {
                                    ref: widget.id,
                                    tocopy: target_widget.id,
                                    name: target_widget.title.label,
                                },
                            });
                        }

                        seen.add(target_widget.title.label);
                    }
                }

                submenu.title.label = "New Table";

                return submenu;
            })(),
        });

        const initOverlay = () => {
            widget?.addClass("context-focus");
            widget?.viewer?.classList.add("context-focus");
            tabbar?.addClass("context-focus");
            this.panel.addClass("context-menu");
        };

        if (widget) {
            if (widget.parent === this.panel) {
                contextMenu.addItem({ type: "separator" });
            }

            contextMenu.addItem({
                command: "workspace:duplicate",
                args: { viewer: widget.id },
            });

            contextMenu.addItem({ type: "separator" });

            contextMenu.addItem({
                command: "workspace:reset",
                args: { viewer: widget.id },
            });
            contextMenu.addItem({
                command: "workspace:export",
                args: { viewer: widget.id },
            });
            contextMenu.addItem({
                command: "workspace:copy",
                args: { viewer: widget.id },
            });

            contextMenu.addItem({ type: "separator" });

            contextMenu.addItem({
                command: "workspace:close",
                args: { viewer: widget.id },
            });
            contextMenu.addItem({
                command: "workspace:help",
            });
        }

        contextMenu.aboutToClose.connect(() => {
            // this.element.classList.remove("context-menu");
            // this.removeClass("context-menu");
            widget?.removeClass("context-focus");
            widget?.viewer?.classList.remove("context-focus");
            tabbar?.removeClass("context-focus");
            this.panel.removeClass("context-menu");
        });

        return [contextMenu, initOverlay];
    }

    private _onLayoutModified() {
        if (this.panel.mode !== "single-document") {
            this._layout = this.panel.saveLayout();
            if (this._layout) {
                const tables = {};
                this.tables.forEach((value, key) => {
                    tables[key] = value;
                });
                this.panel.node.dispatchEvent(
                    new CustomEvent("workspace-layout-update", {
                        detail: { tables, layout: this._layout },
                    })
                );
            }
        }
    }
}

namespace Private {
    /// Create a Lumino DockPanel layout configuration from a
    /// PerspectiveWorkspace layout configuration and a mapping function.
    export async function mapToDockLayout(
        f: (l: string) => Promise<Widget>,
        layout: WorkspaceLayoutConfig
    ): Promise<DockLayout.ILayoutConfig> {
        async function mapArea(
            layout: AreaConfig
        ): Promise<DockLayout.AreaConfig> {
            switch (layout.type) {
                case "split-area":
                    return {
                        type: "split-area",
                        orientation: layout.orientation,
                        sizes: layout.sizes,
                        children: await Promise.all(
                            layout.children.map(mapArea)
                        ),
                    };
                case "tab-area":
                    return {
                        type: "tab-area",
                        currentIndex: layout.currentIndex,
                        widgets: await Promise.all(layout.widgets.map(f)),
                    };
            }
        }
        return {
            main: layout.detail ? await mapArea(layout.detail.main) : null,
        };
    }

    /// Maps the leaves of a DockPanel's Layout tree to strings,
    /// using a depth-first search strategy.
    /// The given Layout should only contain PerspectiveViewer widgets,
    /// otherwise the behavior of this function is undefined.
    /// TODO: how to play nice with non-PerspectiveViewer widgets in layout?
    export function mapLayout(
        f: (w: PerspectiveViewer) => string,
        layout: DockLayout.ILayoutConfig
    ): DetailConfig | null {
        function mapArea(layout: DockLayout.AreaConfig): AreaConfig {
            switch (layout.type) {
                case "split-area":
                    return {
                        type: "split-area",
                        children: layout.children.map(mapArea),
                        orientation: layout.orientation,
                        sizes: layout.sizes,
                    };
                case "tab-area":
                    return {
                        type: "tab-area",
                        currentIndex: layout.currentIndex,
                        widgets: layout.widgets.map((widget) =>
                            f(widget as PerspectiveViewer)
                        ),
                    };
            }
        }
        return layout.main ? { main: mapArea(layout.main) } : null;
    }

    /**
     * @param layout The layout to extract the widgets from.
     * @returns All of the user widgets within the panel
     */
    export function getWidgets(layout: DockLayout.ILayoutConfig): Widget[] {
        function mapArea(layout: DockLayout.AreaConfig): Widget[] {
            switch (layout.type) {
                case "split-area":
                    return layout.children.flatMap(mapArea);
                case "tab-area":
                    return layout.widgets;
            }
        }
        return layout.main ? mapArea(layout.main) : [];
    }
}
