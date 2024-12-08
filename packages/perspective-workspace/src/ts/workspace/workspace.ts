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

import { find, toArray } from "@lumino/algorithm";
import { CommandRegistry } from "@lumino/commands";
import { SplitPanel, Panel, DockPanel } from "@lumino/widgets";
import uniqBy from "lodash/uniqBy";
import { DebouncedFunc, isEqual } from "lodash";
import debounce from "lodash/debounce";
import type {
    HTMLPerspectiveViewerElement,
    ViewerConfigUpdate,
} from "@finos/perspective-viewer";
import type * as psp from "@finos/perspective";
import injectedStyles from "../../../build/css/injected.css";
import { PerspectiveDockPanel } from "./dockpanel";
import { WorkspaceMenu } from "./menu";
import { createCommands } from "./commands";
import { PerspectiveViewerWidget } from "./widget";
import { ObservableMap } from "../utils/observable_map";

const DEFAULT_WORKSPACE_SIZE = [1, 3];

let ID_COUNTER = 0;

export interface PerspectiveLayout<T> {
    children?: PerspectiveLayout<T>[];
    widgets?: T[];
    sizes: number[];
}

export interface ViewerConfigUpdateExt extends ViewerConfigUpdate {
    table: string;
}

export interface PerspectiveWorkspaceConfig<T> {
    sizes: number[];
    master: PerspectiveLayout<T>;
    detail: PerspectiveLayout<T>;
    viewers: Record<string, ViewerConfigUpdateExt>;
}

export class PerspectiveWorkspace extends SplitPanel {
    private dockpanel: PerspectiveDockPanel;
    private detailPanel: Panel;
    private masterPanel: SplitPanel;
    element: HTMLElement;
    menu_elem: HTMLElement;
    private _tables: ObservableMap<string, psp.Table | Promise<psp.Table>>;
    private listeners: WeakMap<PerspectiveViewerWidget, () => void>;
    private indicator: HTMLElement;
    private commands: CommandRegistry;
    private _menu?: WorkspaceMenu;
    private _minimizedLayoutSlots?: DockPanel.ILayoutConfig;
    private _minimizedLayout?: DockPanel.ILayoutConfig;
    private _maximizedWidget?: PerspectiveViewerWidget;
    private _last_updated_state?: PerspectiveWorkspaceConfig<string>;
    // private _context_menu?: Menu & { init_overlay?: () => void };

    constructor(element: HTMLElement) {
        super({ orientation: "horizontal" });
        this.addClass("perspective-workspace");
        this.dockpanel = new PerspectiveDockPanel(this);
        this.detailPanel = new Panel();
        this.detailPanel.layout!.fitPolicy = "set-no-constraint";
        this.detailPanel.addClass("perspective-scroll-panel");
        this.detailPanel.addWidget(this.dockpanel);
        this.masterPanel = new SplitPanel({ orientation: "vertical" });
        this.masterPanel.addClass("master-panel");
        this.dockpanel.layoutModified.connect(() => {
            this.workspaceUpdated();
        });

        this.addWidget(this.detailPanel);
        this.spacing = 6;
        this.element = element;
        this.listeners = new WeakMap();
        this._tables = new ObservableMap();
        this._tables.addSetListener(this._set_listener.bind(this));
        this._tables.addDeleteListener(this._delete_listener.bind(this));
        this.indicator = this.init_indicator();
        this.commands = createCommands(this, this.indicator);
        this.menu_elem = document.createElement("perspective-workspace-menu");
        this.menu_elem.attachShadow({ mode: "open" });
        this.menu_elem.shadowRoot!.innerHTML = `<style>:host{position:absolute;}${injectedStyles}</style>`;

        this.element.shadowRoot!.insertBefore(
            this.menu_elem,
            this.element.shadowRoot!.lastElementChild!
        );

        element.addEventListener("contextmenu", (event) =>
            this.showContextMenu(null, event)
        );
    }

    get_context_menu(): WorkspaceMenu | undefined {
        return this._menu;
    }

    get_dock_panel(): PerspectiveDockPanel {
        return this.dockpanel;
    }

    init_indicator() {
        const indicator = document.createElement("perspective-indicator");
        indicator.style.position = "fixed";
        indicator.style.pointerEvents = "none";
        document.body.appendChild(indicator);
        return indicator;
    }

    apply_indicator_theme() {
        const theme_name = JSON.parse(
            window
                .getComputedStyle(this.element)
                .getPropertyValue("--theme-name")
                .trim()
        );

        this.indicator.setAttribute("theme", theme_name);
    }

    /***************************************************************************
     *
     * `<perspective-workspace>` Public API
     *
     */

    addTable(name: string, table: Promise<psp.Table>) {
        this.tables.set(name, table);
    }

    getTable(name: string): psp.Table | Promise<psp.Table> {
        return this.tables.get(name);
    }

    removeTable(name: string) {
        return this.tables.delete(name);
    }

    replaceTable(name: string, table: Promise<psp.Table>) {
        this.tables.set(name, table);
    }

    get tables() {
        return this._tables;
    }

    async save() {
        const is_settings = this.dockpanel.mode === "single-document";
        let detail = is_settings
            ? this._minimizedLayoutSlots
            : PerspectiveDockPanel.mapWidgets(
                  (widget) =>
                      // this.getWidgetByName(widget)!.viewer.getAttribute("slot")
                      (widget as PerspectiveViewerWidget).viewer.getAttribute(
                          "slot"
                      ),
                  this.dockpanel.saveLayout()
              );

        const layout = {
            sizes: [...this.relativeSizes()],
            detail,
            master: undefined as
                | { widgets: string[]; sizes: number[] }
                | undefined,
        };

        if (this.masterPanel.isAttached) {
            const master = {
                widgets: this.masterPanel.widgets.map(
                    (widget) =>
                        (widget as PerspectiveViewerWidget).viewer.getAttribute(
                            "slot"
                        )!
                ),
                sizes: [...this.masterPanel.relativeSizes()],
            };
            layout.master = master;
        }

        const viewers: Record<string, ViewerConfigUpdate> = {};
        for (const widget of this.masterPanel.widgets) {
            const psp_widget = widget as PerspectiveViewerWidget;
            viewers[psp_widget.viewer.getAttribute("slot")!] =
                await psp_widget.save();
        }

        const widgets = PerspectiveDockPanel.getWidgets(
            is_settings ? this._minimizedLayout! : this.dockpanel.saveLayout()
        );

        await Promise.all(
            widgets.map(async (widget) => {
                const psp_widget = widget as PerspectiveViewerWidget;
                const slot = psp_widget.viewer.getAttribute("slot")!;
                viewers[slot] = await psp_widget.save();
                viewers[slot]!.settings = false;
            })
        );

        return { ...layout, viewers };
    }

    async restore(value: PerspectiveWorkspaceConfig<string>) {
        const {
            sizes,
            master,
            detail,
            viewers: viewer_configs = {},
        } = structuredClone(value);

        if (master && master.widgets!.length > 0) {
            this.setupMasterPanel(sizes || DEFAULT_WORKSPACE_SIZE);
        } else {
            if (this.masterPanel.isAttached) {
                this.detailPanel.removeClass("has-master-panel");
                this.masterPanel.close();
            }

            this.addWidget(this.detailPanel);
        }

        let tasks: Promise<void>[] = [];

        // Using ES generators as context managers ..
        for (const viewers of this._capture_viewers()) {
            for (const widgets of this._capture_widgets()) {
                const callback = this._restore_callback.bind(
                    this,
                    viewer_configs,
                    viewers,
                    widgets
                );

                if (detail) {
                    const detailLayout = PerspectiveDockPanel.mapWidgets(
                        (name: string) => callback.bind(this, false)(name),
                        detail
                    );

                    this.dockpanel.mode = "multiple-document";
                    this.dockpanel.restoreLayout(detailLayout);
                    tasks = tasks.concat(
                        PerspectiveDockPanel.getWidgets(detailLayout).map(
                            (x) => (x as PerspectiveViewerWidget).task!
                        )
                    );
                }

                if (master) {
                    tasks = tasks.concat(
                        master.widgets!.map(
                            (name) => callback.bind(this, true)(name).task!
                        )
                    );

                    master.sizes &&
                        this.masterPanel.setRelativeSizes(master.sizes);
                }
            }
        }

        await Promise.all(tasks);
    }

    *_capture_widgets() {
        const widgets = this.getAllWidgets();
        yield widgets;
        for (const widget of widgets) {
            if (!widget.node.isConnected) {
                widget.close();
            }
        }
    }

    *_capture_viewers() {
        const viewers = Array.from(
            this.element.children
        ) as HTMLPerspectiveViewerElement[];

        yield viewers;
        const ending_widgets = this.getAllWidgets();
        for (const viewer of viewers) {
            let widget = ending_widgets.find((x) => {
                const psp_widget = x as PerspectiveViewerWidget;
                return psp_widget.viewer === viewer;
            });

            if (
                !widget &&
                Array.from(this.element.children).indexOf(viewer) > -1
            ) {
                this.element.removeChild(viewer);
                viewer.delete();
                viewer.free();
            }
        }
    }

    _restore_callback(
        viewers: Record<string, ViewerConfigUpdateExt>,
        starting_viewers: HTMLPerspectiveViewerElement[],
        starting_widgets: PerspectiveViewerWidget[],
        master: boolean,
        widgetName: string
    ) {
        let viewer_config;
        viewer_config = viewers[widgetName];

        let viewer =
            !!widgetName &&
            starting_viewers.find((x) => x.getAttribute("slot") === widgetName);

        let widget;
        if (viewer) {
            widget = starting_widgets.find((x) => x.viewer === viewer);
            if (widget) {
                widget.load(this.tables.get(viewer_config.table));
                widget.restore({ ...viewer_config });
            } else {
                widget = this._createWidget({
                    config: { ...viewer_config },
                    viewer,
                });
            }
        } else if (viewer_config) {
            widget = this._createWidgetAndNode({
                config: { ...viewer_config },
                slot: widgetName,
            });
        } else {
            throw new Error(
                `Could not find or create <perspective-viewer> for slot "${widgetName}"`
            );
        }

        if (master) {
            widget.viewer.classList.add("workspace-master-widget");
            widget.viewer.toggleAttribute("selectable", true);
            widget.viewer.addEventListener(
                "perspective-select",
                this.onPerspectiveSelect.bind(this)
            );

            widget.viewer.addEventListener(
                "perspective-click",
                this.onPerspectiveSelect.bind(this)
            );

            // TODO remove event listener
            this.masterPanel.addWidget(widget);
        }

        return widget;
    }

    _validate(table: any) {
        if (!table || !("view" in table) || typeof table?.view !== "function") {
            throw new Error(
                "Only `perspective.Table()` instances can be added to `tables`"
            );
        }
        return table;
    }

    _set_listener(name: string, table: psp.Table | Promise<psp.Table>) {
        if (table instanceof Promise) {
            table = table.then(this._validate);
        } else {
            this._validate(table);
        }

        this.getAllWidgets().forEach((widget) => {
            const psp_widget = widget as PerspectiveViewerWidget;
            if (psp_widget.viewer.getAttribute("table") === name) {
                psp_widget.load(table);
            }
        });
    }

    _delete_listener(name: string) {
        const isUsed = this.getAllWidgets().some((widget) => {
            const psp_widget = widget as PerspectiveViewerWidget;
            return psp_widget.viewer.getAttribute("table") === name;
        });

        if (isUsed) {
            console.error(
                `Cannot remove table: '${name}' because it's still bound to widget(s)`
            );

            return false;
        }

        return true;
    }

    update_widget_for_viewer(viewer: HTMLPerspectiveViewerElement) {
        let slot_name = viewer.getAttribute("slot");
        if (!slot_name) {
            slot_name = this._gen_id();
            viewer.setAttribute("slot", slot_name);
        }

        const table_name = viewer.getAttribute("table");
        if (table_name) {
            const slot = this.node.querySelector(`slot[name=${slot_name}]`);
            if (!slot) {
                console.warn(
                    `Undocked ${viewer.outerHTML}, creating default layout`
                );

                const widget = this._createWidget({
                    config: {
                        table: viewer.getAttribute("table")!,
                    },
                    viewer,
                });

                this.dockpanel.addWidget(widget);
                this.dockpanel.activateWidget(widget);
            }
        } else {
            console.warn(`No table set for ${viewer.outerHTML}`);
        }
    }

    remove_unslotted_widgets(viewers: HTMLPerspectiveViewerElement[]) {
        const widgets = this.getAllWidgets();
        for (const widget of widgets) {
            const psp_widget = widget as PerspectiveViewerWidget;
            let missing = viewers.indexOf(psp_widget.viewer) === -1;
            if (missing) {
                psp_widget.close();
            }
        }
    }

    update_details_panel(viewers: HTMLPerspectiveViewerElement[]) {
        if (this.masterPanel.widgets.length === 0) {
            this.masterPanel.close();
        }
    }

    /***************************************************************************
     *
     * Workspace-level contextmenu actions
     *
     */

    async duplicate(widget: PerspectiveViewerWidget): Promise<void> {
        if (this.dockpanel.mode === "single-document") {
            const _task = await this._maximizedWidget!.viewer.toggleConfig(
                false
            );

            this._unmaximize();
        }

        const config = await widget.save();
        config.settings = false;
        config.title = config.title ? `${config.title} (*)` : "";
        const duplicate = this._createWidgetAndNode({
            config,
            slot: undefined,
        });

        this.dockpanel.addWidget(duplicate, {
            mode: "split-right",
            ref: widget,
        });

        await duplicate.task;
    }

    toggleMasterDetail(widget: PerspectiveViewerWidget) {
        const isGlobalFilter = widget.parent !== this.dockpanel;
        this.element.dispatchEvent(
            new CustomEvent("workspace-toggle-global-filter", {
                detail: {
                    widget,
                    isGlobalFilter: !isGlobalFilter,
                },
            })
        );

        if (isGlobalFilter) {
            this.makeDetail(widget);
        } else {
            if (this.dockpanel.mode === "single-document") {
                this.toggleSingleDocument(widget);
            }
            this.makeMaster(widget);
        }
    }

    _maximize(widget: PerspectiveViewerWidget) {
        widget.viewer.classList.add("widget-maximize");
        this._minimizedLayout = this.dockpanel.saveLayout();
        this._minimizedLayoutSlots = PerspectiveDockPanel.mapWidgets(
            (widget: PerspectiveViewerWidget) =>
                widget.viewer.getAttribute("slot"),
            this.dockpanel.saveLayout()
        );

        this._maximizedWidget = widget;
        this.dockpanel.mode = "single-document";
        this.dockpanel.activateWidget(widget);
    }

    _unmaximize() {
        this._maximizedWidget!.viewer.classList.remove("widget-maximize");
        this.dockpanel.mode = "multiple-document";
        this.dockpanel.restoreLayout(this._minimizedLayout!);
    }

    toggleSingleDocument(widget: PerspectiveViewerWidget) {
        if (this.dockpanel.mode !== "single-document") {
            this._maximize(widget);
        } else {
            this._unmaximize();
        }
    }

    async _filterViewer(
        viewer: HTMLPerspectiveViewerElement,
        filters: [string, string, string][],
        candidates: Set<string>
    ) {
        const config = await viewer.save();
        const table = await viewer.getTable();
        const availableColumns = Object.keys(await table.schema());
        const currentFilters = config.filter || [];
        const columnAvailable = (filter: [string, string, any]) =>
            filter[0] && availableColumns.includes(filter[0]);

        const validFilters = filters.filter(columnAvailable);
        validFilters.push(
            ...currentFilters.filter(
                (x: [string, ..._: string[]]) => !candidates.has(x[0])
            )
        );

        const newFilters = uniqBy(validFilters, (item) => item[0]);
        await viewer.restore({ filter: newFilters });
    }

    async onPerspectiveSelect(event: CustomEvent) {
        const config = await (
            event.target as HTMLPerspectiveViewerElement
        ).save();
        // perspective-select is already handled for hypergrid

        if (
            event.type === "perspective-click" &&
            (config.plugin === "Datagrid" || config.plugin === null)
        ) {
            return;
        }
        const candidates = new Set([
            ...(config["group_by"] || []),
            ...(config["split_by"] || []),
            ...(config.filter || []).map((x: [string, string, any]) => x[0]),
        ]);

        const filters = [...event.detail.config.filter];
        toArray(this.dockpanel.widgets()).forEach((widget) => {
            this._filterViewer(
                (widget as PerspectiveViewerWidget).viewer,
                filters,
                candidates
            );
        });
    }

    async makeMaster(widget: PerspectiveViewerWidget) {
        if (widget.viewer.hasAttribute("settings")) {
            await widget.toggleConfig();
        }

        widget.viewer.classList.add("workspace-master-widget");
        widget.viewer.toggleAttribute("selectable", true);
        if (!this.masterPanel.isAttached) {
            this.detailPanel.close();
            this.setupMasterPanel(DEFAULT_WORKSPACE_SIZE);
        }

        this.masterPanel.addWidget(widget);
        widget.isHidden && widget.show();
        widget.viewer.restyleElement();
        widget.viewer.addEventListener(
            "perspective-click",
            this.onPerspectiveSelect.bind(this)
        );

        widget.viewer.addEventListener(
            "perspective-select",
            this.onPerspectiveSelect.bind(this)
        );
    }

    makeDetail(widget: PerspectiveViewerWidget) {
        widget.viewer.classList.remove("workspace-master-widget");
        widget.viewer.toggleAttribute("selectable", false);
        this.dockpanel.addWidget(widget, { mode: `split-left` });
        if (this.masterPanel.widgets.length === 0) {
            this.detailPanel.close();
            this.masterPanel.close();
            this.detailPanel.removeClass("has-master-panel");
            this.addWidget(this.detailPanel);
        }

        widget.viewer.restyleElement();
        widget.viewer.removeEventListener(
            "perspective-click",
            this.onPerspectiveSelect.bind(this)
        );

        widget.viewer.removeEventListener(
            "perspective-select",
            this.onPerspectiveSelect.bind(this)
        );
    }

    /***************************************************************************
     *
     * Context Menu
     *
     */

    createContextMenu(widget: PerspectiveViewerWidget | null) {
        this._menu = new WorkspaceMenu(this.menu_elem.shadowRoot!, {
            commands: this.commands,
        });

        const tabbar = find(
            this.dockpanel.tabBars(),
            (bar) => bar.currentTitle?.owner === widget
        );

        this._menu.init_overlay = () => {
            if (widget) {
                widget.addClass("context-focus");
                widget.viewer.classList.add("context-focus");
                tabbar && tabbar.node.classList.add("context-focus");
                this.element.classList.add("context-menu");
                this.addClass("context-menu");
                if (
                    widget.viewer.classList.contains("workspace-master-widget")
                ) {
                    this._menu!.node.classList.add("workspace-master-menu");
                } else {
                    this._menu!.node.classList.remove("workspace-master-menu");
                }
            }
        };

        if (widget?.parent === this.dockpanel || widget === null) {
            this._menu.addItem({
                type: "submenu",
                command: "workspace:newmenu",
                submenu: (() => {
                    const submenu = new WorkspaceMenu(
                        this.menu_elem.shadowRoot!,
                        {
                            commands: this.commands,
                        }
                    );

                    for (const table of this.tables.keys()) {
                        let args;
                        if (widget !== null) {
                            args = { table, widget_name: widget.name };
                        } else {
                            args = { table };
                        }

                        submenu.addItem({
                            command: "workspace:new",
                            args,
                        });
                    }

                    const widgets = PerspectiveDockPanel.getWidgets(
                        this.dockpanel.saveLayout()
                    );

                    if (widgets.length > 0) {
                        submenu.addItem({ type: "separator" });
                    }

                    let seen = new Set();
                    for (const target_widget of widgets) {
                        if (!seen.has(target_widget.title.label)) {
                            let args;
                            if (widget !== null) {
                                args = {
                                    target_widget_name: target_widget.name,
                                    widget_name: widget.name,
                                };
                            } else {
                                args = {
                                    target_widget_name: target_widget.name,
                                };
                            }

                            submenu.addItem({
                                command: "workspace:newview",
                                args,
                            });

                            seen.add(target_widget.title.label);
                        }
                    }

                    submenu.title.label = "New Table";
                    return submenu;
                })(),
            });
        }

        if (widget) {
            if (widget?.parent === this.dockpanel) {
                this._menu.addItem({ type: "separator" });
            }

            this._menu.addItem({
                command: "workspace:duplicate",
                args: { widget_name: widget.name },
            });

            this._menu.addItem({
                command: "workspace:master",
                args: { widget_name: widget.name },
            });

            this._menu.addItem({ type: "separator" });

            this._menu.addItem({
                command: "workspace:settings",
                args: { widget_name: widget.name },
            });

            this._menu.addItem({
                command: "workspace:reset",
                args: { widget_name: widget.name },
            });
            this._menu.addItem({
                command: "workspace:export",
                args: { widget_name: widget.name },
            });
            this._menu.addItem({
                command: "workspace:copy",
                args: { widget_name: widget.name },
            });

            this._menu.addItem({ type: "separator" });

            this._menu.addItem({
                command: "workspace:close",
                args: { widget_name: widget.name },
            });
            this._menu.addItem({
                command: "workspace:help",
            });
        }

        this._menu.aboutToClose.connect(() => {
            if (widget) {
                this.element.classList.remove("context-menu");
                this.removeClass("context-menu");
                widget.removeClass("context-focus");
                tabbar?.node?.classList.remove("context-focus");
            }
        });

        return this._menu;
    }

    showContextMenu(widget: PerspectiveViewerWidget | null, event: MouseEvent) {
        if (!event.shiftKey) {
            const menu = this.createContextMenu(widget);
            menu.init_overlay?.();
            const rect = this.element.getBoundingClientRect();
            menu.open(event.clientX - rect.x, event.clientY - rect.y, {
                host: this.menu_elem.shadowRoot as unknown as HTMLElement,
            });

            event.preventDefault();
            event.stopPropagation();
        }
    }

    /***************************************************************************
     *
     * Context Menu
     *
     */

    clearLayout() {
        this.getAllWidgets().forEach((widget) => widget.close());
        this.widgets.forEach((widget) => widget.close());
        this.detailPanel.close();
        if (this.masterPanel.isAttached) {
            this.detailPanel.removeClass("has-master-panel");
            this.masterPanel.close();
        }
    }

    setupMasterPanel(sizes: number[]) {
        this.detailPanel.addClass("has-master-panel");
        this.addWidget(this.masterPanel);
        this.addWidget(this.detailPanel);
        this.setRelativeSizes(sizes);
    }

    addViewer(config: ViewerConfigUpdateExt, is_global_filter?: boolean) {
        if (this.dockpanel.mode === "single-document") {
            const _task = this._maximizedWidget!.viewer.toggleConfig(false);
            this._unmaximize();
        }

        const widget = this._createWidgetAndNode({ config });
        if (is_global_filter) {
            if (!this.masterPanel.isAttached) {
                this.setupMasterPanel(DEFAULT_WORKSPACE_SIZE);
            }

            this.masterPanel.addWidget(widget);
        } else {
            if (!this.detailPanel.isAttached) {
                this.addWidget(this.detailPanel);
            }
            this.dockpanel.addWidget(widget, { mode: "split-right" });
        }

        this.update();
    }

    /*********************************************************************
     * Widget helper methods
     */

    _createWidgetAndNode({
        config,
        slot: slotname,
    }: {
        config: ViewerConfigUpdateExt;
        slot?: string;
    }) {
        const node = this._createNode(slotname);
        const table = config.table;
        const viewer = document.createElement("perspective-viewer");
        viewer.setAttribute(
            "slot",
            node!.querySelector("slot")!.getAttribute("name")!
        );

        if (table) {
            viewer.setAttribute("table", table);
        }

        return this._createWidget({
            config,
            elem: node as HTMLElement,
            viewer,
        });
    }

    _gen_id() {
        let genId = `PERSPECTIVE_GENERATED_ID_${ID_COUNTER++}`;
        if (this.element.querySelector(`[slot=${genId}]`)) {
            genId = this._gen_id();
        }
        return genId;
    }

    _createNode(slotname?: string): HTMLElement {
        let node = this.node.querySelector(`slot[name=${slotname}]`);
        if (slotname === undefined || !node) {
            const slot = document.createElement("slot");
            slotname = slotname || this._gen_id();
            slot.setAttribute("name", slotname);
            const div = document.createElement("div");
            div.classList.add("viewer-container");
            div.appendChild(slot);
            node = document.createElement("div");
            node.classList.add("workspace-widget");
            node.appendChild(div);
        } else {
            node = node.parentElement!.parentElement;
        }

        return node as HTMLElement;
    }

    _createWidget({
        config,
        elem,
        viewer,
    }: {
        config: ViewerConfigUpdateExt;
        elem?: Element;
        viewer: HTMLPerspectiveViewerElement;
    }) {
        let node: HTMLElement = elem as HTMLElement;
        if (!node) {
            const slotname = viewer.getAttribute("slot") || undefined;
            node = this.node.querySelector(`slot[name=${slotname}]`)!;
            if (!node) {
                node = this._createNode(slotname)!;
            } else {
                node = node.parentElement!.parentElement!;
            }
        }

        const table = this.tables.get(
            viewer.getAttribute("table") || config.table
        );

        const widget = new PerspectiveViewerWidget({ node, viewer });
        widget.task = (async () => {
            if (table) {
                widget.load(table);
            }

            await widget.restore(config);
        })();

        const event = new CustomEvent("workspace-new-view", {
            detail: { config, widget },
        });
        this.element.dispatchEvent(event);
        widget.title.closable = true;
        this.element.appendChild(widget.viewer);
        this._addWidgetEventListeners(widget);
        return widget;
    }

    _addWidgetEventListeners(widget: PerspectiveViewerWidget) {
        if (this.listeners.has(widget)) {
            this.listeners.get(widget)!();
        }

        const settings = (event: CustomEvent) => {
            if (!event.detail && this.dockpanel.mode === "single-document") {
                this._unmaximize();
            }
        };

        const contextMenu = (event: MouseEvent) =>
            this.showContextMenu(widget, event);

        const updated = async (event: CustomEvent) => {
            this.workspaceUpdated();
            widget.title.label = event.detail.title;
            widget._is_pivoted = event.detail.group_by?.length > 0;
        };

        widget.node.addEventListener("contextmenu", contextMenu);
        widget.viewer.addEventListener("perspective-toggle-settings", settings);

        // @ts-ignore
        widget.viewer.addEventListener("perspective-config-update", updated);

        this.listeners.set(widget, () => {
            widget.node.removeEventListener("contextmenu", contextMenu);
            widget.viewer.removeEventListener(
                "perspective-toggle-settings",
                settings
            );

            // @ts-ignore
            widget.viewer.removeEventListener(
                "perspective-config-update",
                updated
            );
        });
    }

    getWidgetByName(name: string): PerspectiveViewerWidget | null {
        return this.getAllWidgets().find((x) => x.name === name) || null;
    }

    getAllWidgets(): PerspectiveViewerWidget[] {
        return [
            ...(this.masterPanel.widgets as PerspectiveViewerWidget[]),
            ...toArray(this.dockpanel.widgets()),
        ] as PerspectiveViewerWidget[];
    }

    /***************************************************************************
     *
     * `workspace-layout-update` event
     *
     */

    async workspaceUpdated() {
        const layout = await this.save();
        if (layout) {
            if (this._last_updated_state) {
                if (isEqual(this._last_updated_state, layout)) {
                    return;
                }
            }

            this._last_updated_state =
                layout as any as PerspectiveWorkspaceConfig<string>;

            const tables: Record<string, psp.Table | Promise<psp.Table>> = {};
            this.tables.forEach((value, key) => {
                tables[key] = value;
            });

            this.element.dispatchEvent(
                new CustomEvent("workspace-layout-update", {
                    detail: { tables, layout },
                })
            );
        }
    }
}
