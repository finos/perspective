/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {find, toArray} from "@lumino/algorithm";
import {Panel} from "@lumino/widgets";
import {PerspectiveDockPanel} from "./dockpanel";
import {Menu} from "@lumino/widgets";
import {MenuRenderer} from "./menu";
import {createCommands} from "./commands";

import {PerspectiveViewerWidget} from "./widget";
import uniqBy from "lodash/uniqBy";
import debounce from "lodash/debounce";
import cloneDeep from "lodash/cloneDeep";
import {DiscreteSplitPanel} from "./discrete";

const DEFAULT_WORKSPACE_SIZE = [1, 3];

let ID_COUNTER = 0;

export const SIDE = {
    LEFT: "left",
    RIGHT: "right"
};

export const MODE = {
    GLOBAL_FILTERS: "globalFilters",
    LINKED: "linked"
};

class ObservableMap extends Map {
    set(name, item) {
        this._set_listener?.(name, item);
        super.set(name, item);
    }

    get(name) {
        return super.get(name);
    }

    delete(name) {
        const result = this._delete_listener?.(name);
        if (result) {
            return super.delete(name);
        } else {
            return false;
        }
    }

    addSetListener(listener) {
        this._set_listener = listener;
    }

    addDeleteListener(listener) {
        this._delete_listener = listener;
    }
}

export class PerspectiveWorkspace extends DiscreteSplitPanel {
    constructor(element, options = {}) {
        super({orientation: "horizontal"});

        this.addClass("perspective-workspace");
        this.dockpanel = new PerspectiveDockPanel("main", {enableContextMenu: false});
        this.detailPanel = new Panel();
        this.detailPanel.layout.fitPolicy = "set-no-constraint";
        this.detailPanel.addClass("perspective-scroll-panel");
        this.detailPanel.addWidget(this.dockpanel);
        this.masterPanel = new DiscreteSplitPanel({orientation: "vertical"});
        this.masterPanel.addClass("master-panel");

        this.dockpanel.layoutModified.connect(() => this.workspaceUpdated());
        this.masterPanel.layoutModified.connect(() => this.workspaceUpdated());
        this.layoutModified.connect(() => this.workspaceUpdated());

        this.addWidget(this.detailPanel);

        this.element = element;
        this._side = options.side || SIDE.LEFT;
        this.mode = options.mode || MODE.GLOBAL_FILTERS;
        this._linkedViewers = [];

        this.listeners = new WeakMap();
        this._tables = new ObservableMap();
        this._tables.addSetListener(this._set_listener.bind(this));
        this._tables.addDeleteListener(this._delete_listener.bind(this));
        this.commands = createCommands(this);
        this.menuRenderer = new MenuRenderer(this.element);

        this.customCommands = [];
    }

    /***************************************************************************
     *
     * `<perspective-workspace>` Public API
     *
     */

    addTable(name, table) {
        this.tables.set(name, table);
    }

    getTable(name) {
        return this.tables.get(name);
    }

    removeTable(name) {
        return this.tables.delete(name);
    }

    get tables() {
        return this._tables;
    }

    set side(value) {
        if (SIDE[value.toUpperCase()] === undefined) {
            console.warn("Unknown `side` attribute:", value);
            return;
        }

        if (this._side !== value && this.masterPanel.isAttached) {
            const newSizes = this.relativeSizes()
                .slice()
                .reverse();

            this.detailPanel.close();
            this.masterPanel.close();

            if (value === SIDE.LEFT) {
                this.addWidget(this.masterPanel);
                this.addWidget(this.detailPanel);
            } else {
                this.addWidget(this.detailPanel);
                this.addWidget(this.masterPanel);
            }
            this.setRelativeSizes(newSizes);
        }
        this._side = value;
    }

    get side() {
        return this._side;
    }

    save() {
        const layout = {
            sizes: [...this.relativeSizes()],
            detail: PerspectiveDockPanel.mapWidgets(widget => widget.viewer.getAttribute("slot"), this.dockpanel.saveLayout()),
            mode: this.mode
        };
        if (this.masterPanel.isAttached) {
            const master = {
                widgets: this.masterPanel.widgets.map(widget => widget.viewer.getAttribute("slot")),
                sizes: [...this.masterPanel.relativeSizes()]
            };
            layout.master = master;
        }
        const viewers = {};
        for (const widget of this.masterPanel.widgets) {
            viewers[widget.viewer.getAttribute("slot")] = widget.save();
        }
        PerspectiveDockPanel.mapWidgets(widget => {
            viewers[widget.viewer.getAttribute("slot")] = widget.save();
        }, this.dockpanel.saveLayout());
        return {...layout, viewers};
    }

    restore(value) {
        const {sizes, master, detail, viewers: viewer_configs = [], mode = MODE.GLOBAL_FILTERS} = cloneDeep(value);
        this.mode = mode;

        if (this.mode === MODE.GLOBAL_FILTERS && master && master.widgets.length > 0) {
            this.setupMasterPanel(sizes || DEFAULT_WORKSPACE_SIZE);
        } else {
            this.addWidget(this.detailPanel);
        }

        // Using ES generators as context managers ..
        for (const viewers of this._capture_viewers()) {
            for (const widgets of this._capture_widgets()) {
                const callback = this._restore_callback.bind(this, viewer_configs, viewers, widgets);

                if (detail) {
                    const detailLayout = PerspectiveDockPanel.mapWidgets(callback.bind(this, false), detail);
                    this.dockpanel.restoreLayout(detailLayout);
                }

                if (master) {
                    if (this.mode === MODE.GLOBAL_FILTERS) {
                        master.widgets.forEach(callback.bind(this, true));
                        master.sizes && this.masterPanel.setRelativeSizes(master.sizes);
                    } else {
                        master.widgets.forEach(config => {
                            const widget = callback.bind(this, undefined)(config);
                            this.dockpanel.addWidget(widget);
                        });
                    }
                }
            }
        }
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
        const viewers = Array.from(this.element.children);
        yield viewers;
        const ending_widgets = this.getAllWidgets();
        for (const viewer of viewers) {
            let widget = ending_widgets.find(x => x.viewer === viewer);
            if (!widget && Array.from(this.element.children).indexOf(viewer) > -1) {
                this.element.removeChild(viewer);
                viewer.delete();
            }
        }
    }

    _restore_callback(viewers, starting_viewers, starting_widgets, master, widgetName) {
        let viewer_config;
        if (typeof widgetName === "string") {
            viewer_config = viewers[widgetName];
        } else {
            viewer_config = widgetName;
            widgetName = viewer_config.slot;
        }
        let viewer = !!widgetName && starting_viewers.find(x => x.getAttribute("slot") === widgetName);
        let widget;
        if (viewer) {
            widget = starting_widgets.find(x => x.viewer === viewer);
            if (widget) {
                widget.restore({...viewer_config, master});
            } else {
                widget = this._createWidget({
                    config: {...viewer_config, master},
                    viewer
                });
            }
        } else if (viewer_config) {
            widget = this._createWidgetAndNode({
                config: {...viewer_config, master},
                slot: widgetName
            });
        } else {
            console.error(`Could not find or create <perspective-viewer> for slot "${widgetName}"`);
        }
        if (master || this.mode === MODE.LINKED) {
            widget.viewer.addEventListener("perspective-select", this.onPerspectiveSelect);
            widget.viewer.addEventListener("perspective-click", this.onPerspectiveSelect);
            // TODO remove event listener
            this.masterPanel.addWidget(widget);
        }

        if (widget.linked) {
            this._linkWidget(widget);
        }
        return widget;
    }

    _validate(table) {
        if (!("view" in table) || typeof table?.view !== "function") {
            throw new Error("Only `perspective.Table()` instances can be added to `tables`");
        }
        return table;
    }

    _set_listener(name, table) {
        if (typeof table?.then === "function") {
            table = table.then(this._validate);
        } else {
            this._validate(table);
        }
        this.getAllWidgets().forEach(widget => {
            if (widget.viewer.getAttribute("table") === name) {
                widget.viewer.load(table);
            }
        });
    }

    _delete_listener(name) {
        const isUsed = this.getAllWidgets().some(widget => widget.viewer.getAttribute("table") === name);
        if (isUsed) {
            console.error(`Cannot remove table: '${name}' because it's still bound to widget(s)`);
            return false;
        }
        return true;
    }

    update_widget_for_viewer(viewer) {
        let slot_name = viewer.getAttribute("slot");
        if (!slot_name) {
            slot_name = this._gen_id();
            viewer.setAttribute("slot", slot_name);
        }
        const table_name = viewer.getAttribute("table");
        if (table_name) {
            const slot = this.node.querySelector(`slot[name=${slot_name}]`);
            if (!slot) {
                //const name = viewer.getAttribute("name");
                console.warn(`Undocked ${viewer.outerHTML}, creating default layout`);
                const widget = this._createWidget({
                    name: viewer.getAttribute("name"),
                    table: this.tables.get(viewer.getAttribute("table")),
                    config: {master: false},
                    viewer
                });
                this.dockpanel.addWidget(widget);
                this.dockpanel.activateWidget(widget);
            }
        } else {
            console.warn(`No table set for ${viewer.outerHTML}`);
        }
    }

    remove_unslotted_widgets(viewers) {
        const widgets = this.getAllWidgets();
        for (const widget of widgets) {
            let missing = viewers.indexOf(widget.viewer) === -1;
            if (missing) {
                widget.close();
            }
        }
    }

    /***************************************************************************
     *
     * Workspace-level contextmenu actions
     *
     */

    duplicate(widget) {
        if (this.dockpanel.mode === "single-document") {
            this.toggleSingleDocument(widget);
        }
        const config = widget.save();
        config.name = config.name ? `${config.name} (duplicate)` : "";
        const duplicate = this._createWidgetAndNode({config});
        if (config.linked) {
            this._linkWidget(duplicate);
        }
        if (widget.master) {
            const index = this.masterPanel.widgets.indexOf(widget) + 1;
            this.masterPanel.insertWidget(index, duplicate);
        } else {
            this.dockpanel.addWidget(duplicate, {mode: "split-right", ref: widget});
        }
    }

    toggleMasterDetail(widget) {
        const isGlobalFilter = widget.parent !== this.dockpanel;

        this.element.dispatchEvent(
            new CustomEvent("workspace-toggle-global-filter", {
                detail: {
                    widget,
                    isGlobalFilter: !isGlobalFilter
                }
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

    _maximize(widget) {
        widget.viewer.classList.add("widget-maximize");
        this._minimizedLayout = this.dockpanel.saveLayout();
        this._maximizedWidget = widget;
        this.dockpanel.mode = "single-document";
        this.dockpanel.activateWidget(widget);
        widget.notifyResize();
    }

    _unmaximize() {
        this._maximizedWidget.viewer.classList.remove("widget-maximize");
        this.dockpanel.mode = "multiple-document";
        this.dockpanel.restoreLayout(this._minimizedLayout);
    }

    toggleSingleDocument(widget) {
        if (this.dockpanel.mode !== "single-document") {
            this._maximize(widget);
        } else {
            this._unmaximize();
        }
    }

    async _filterViewer(viewer, filters, candidates) {
        const config = viewer.save();
        const availableColumns = Object.keys(await viewer.table.schema());
        const currentFilters = config.filters || [];
        const columnAvailable = filter => filter[0] && availableColumns.includes(filter[0]);
        const validFilters = filters.filter(columnAvailable);

        validFilters.push(...currentFilters.filter(x => !candidates.has(x[0])));
        const newFilters = uniqBy(validFilters, item => item[0]);
        viewer.restore({filters: newFilters});
    }

    onPerspectiveSelect = event => {
        const config = event.target.save();
        // perspective-select is already handled for hypergrid

        if (event.type === "perspective-click" && config.plugin === "hypergrid") {
            return;
        }
        const candidates = new Set([...(config["row-pivots"] || []), ...(config["column-pivots"] || []), ...(config.filters || []).map(x => x[0])]);
        const filters = [...event.detail.config.filters];

        if (this.mode === MODE.LINKED) {
            this._linkedViewers.forEach(viewer => {
                if (viewer !== event.target) {
                    this._filterViewer(viewer, filters, candidates);
                }
            });
        } else {
            toArray(this.dockpanel.widgets()).forEach(widget => this._filterViewer(widget.viewer, filters, candidates));
        }
    };

    async makeMaster(widget) {
        widget.master = true;

        if (widget.viewer.hasAttribute("settings")) {
            await widget.toggleConfig();
        }

        if (!this.masterPanel.isAttached) {
            this.detailPanel.close();
            this.setupMasterPanel(DEFAULT_WORKSPACE_SIZE);
        }

        this.masterPanel.addWidget(widget);
        widget.isHidden && widget.show();

        widget.viewer.restyleElement();
        widget.viewer.addEventListener("perspective-click", this.onPerspectiveSelect);
        widget.viewer.addEventListener("perspective-select", this.onPerspectiveSelect);
    }

    makeDetail(widget) {
        widget.master = false;

        this.dockpanel.addWidget(widget, {mode: `split-${this._side}`});

        if (this.masterPanel.widgets.length === 0) {
            this.detailPanel.close();
            this.masterPanel.close();
            this.addWidget(this.detailPanel);
        }

        widget.viewer.restyleElement();
        widget.viewer.removeEventListener("perspective-click", this.onPerspectiveSelect);
        widget.viewer.removeEventListener("perspective-select", this.onPerspectiveSelect);
    }

    isLinked(widget) {
        return this._linkedViewers.indexOf(widget.viewer) > -1;
    }

    _linkWidget(widget) {
        widget.title.className += " linked";
        if (this._linkedViewers.indexOf(widget.viewer) === -1) {
            this._linkedViewers.push(widget.viewer);
            // if this is the first linked viewer, make viewers with
            // row-pivots selectable
            if (this._linkedViewers.length === 1) {
                this.getAllWidgets().forEach(widget => {
                    const config = widget.viewer.save();
                    if (config["row-pivots"]) {
                        widget.viewer.restore({selectable: true});
                    }
                });
            }
        }
    }

    toggleLink(widget) {
        widget.linked = !widget.linked;
        if (widget.linked) {
            this._linkWidget(widget);
        } else {
            widget.title.className = widget.title.className.replace(/ linked/g, "");
            this._linkedViewers = this._linkedViewers.filter(viewer => viewer !== widget.viewer);
            if (this._linkedViewers.length === 0) {
                this.getAllWidgets().forEach(widget => widget.viewer.restore({selectable: false}));
            }
        }
    }

    /***************************************************************************
     *
     * Context Menu
     *
     */

    createContextMenu(widget) {
        const contextMenu = new Menu({commands: this.commands, renderer: this.menuRenderer});

        contextMenu.addItem({command: "workspace:maximize", args: {widget}});
        contextMenu.addItem({command: "workspace:minimize", args: {widget}});
        contextMenu.addItem({command: "workspace:duplicate", args: {widget}});
        contextMenu.addItem({command: "workspace:master", args: {widget}});
        contextMenu.addItem({command: "workspace:link", args: {widget}});

        contextMenu.addItem({type: "separator"});

        contextMenu.addItem({command: "workspace:export", args: {widget}});
        contextMenu.addItem({command: "workspace:copy", args: {widget}});
        contextMenu.addItem({command: "workspace:reset", args: {widget}});

        contextMenu.addItem({type: "separator"});

        contextMenu.addItem({command: "workspace:close", args: {widget}});

        if (this.customCommands.length > 0) {
            contextMenu.addItem({type: "separator"});
            this.customCommands.forEach(command => {
                contextMenu.addItem({command, args: {widget}});
            });
        }
        return contextMenu;
    }

    showContextMenu(widget, event) {
        const menu = this.createContextMenu(widget);
        const tabbar = find(this.dockpanel.tabBars(), bar => bar.currentTitle.owner === widget);

        widget.addClass("context-focus");
        widget.viewer.classList.add("context-focus");
        tabbar && tabbar.node.classList.add("context-focus");
        this.element.classList.add("context-menu");
        this.addClass("context-menu");

        if (widget.viewer.classList.contains("workspace-master-widget")) {
            menu.node.classList.add("workspace-master-menu");
        } else {
            menu.node.classList.remove("workspace-master-menu");
        }
        this._menu_opened = true;

        menu.aboutToClose.connect(() => {
            this.element.classList.remove("context-menu");
            this.removeClass("context-menu");
            widget.removeClass("context-focus");
            tabbar?.node?.classList.remove("context-focus");
        });

        menu.open(event.clientX, event.clientY);
        event.preventDefault();
        event.stopPropagation();
    }

    /***************************************************************************
     *
     * Context Menu
     *
     */

    clearLayout() {
        this.getAllWidgets().forEach(widget => widget.close());
        this.widgets.forEach(widget => widget.close());
        this.detailPanel.close();
        this._linkedViewers = [];

        if (this.masterPanel.isAttached) {
            this.masterPanel.close();
        }
    }

    setupMasterPanel(sizes) {
        if (this.side === SIDE.RIGHT) {
            this.addWidget(this.detailPanel);
            this.addWidget(this.masterPanel);
            this.setRelativeSizes(sizes.slice().reverse());
        } else {
            this.addWidget(this.masterPanel);
            this.addWidget(this.detailPanel);
            this.setRelativeSizes(sizes);
        }
    }

    _addContextMenuItem(item) {
        this.customCommands.push(item.id);
        this.commands.addCommand(item.id, {
            execute: args => item.execute({widget: args.widget}),
            label: item.label,
            isVisible: args => item.isVisible({widget: args.widget}),
            mnemonic: 0
        });
    }

    addViewer(config) {
        const widget = this._createWidgetAndNode({config});
        if (this.dockpanel.mode === "single-document") {
            this.toggleSingleDocument();
        }
        if (config.master) {
            if (!this.masterPanel.isAttached) {
                this.setupMasterPanel(DEFAULT_WORKSPACE_SIZE);
            }
            this.masterPanel.addWidget(widget);
        } else {
            if (!this.detailPanel.isAttached) {
                this.addWidget(this.detailPanel);
            }
            this.dockpanel.addWidget(widget, {mode: "split-right"});
        }
        this.update();
    }

    /*********************************************************************
     * Widget helper methods
     */

    _createWidgetAndNode({config, slot: slotname}) {
        const node = this._createNode(slotname);
        const table = config.table;
        const viewer = document.createElement("perspective-viewer");
        viewer.setAttribute("slot", node.querySelector("slot").getAttribute("name"));
        if (table) {
            viewer.setAttribute("table", table);
        }
        return this._createWidget({config, node, viewer});
    }

    _gen_id() {
        let genId = `PERSPECTIVE_GENERATED_ID_${ID_COUNTER++}`;
        if (this.element.querySelector(`[slot=${genId}]`)) {
            genId = this._gen_id();
        }
        return genId;
    }

    _createNode(slotname) {
        let node = this.node.querySelector(`slot[name=${slotname}]`);
        if (!node) {
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
            node = node.parentElement.parentElement;
        }
        return node;
    }

    _createWidget({config, node, viewer}) {
        config.name = config.name || viewer.getAttribute("name");
        if (!node) {
            const slotname = viewer.getAttribute("slot");
            node = this.node.querySelector(`slot[name=${slotname}]`);
            if (!node) {
                node = this._createNode(slotname);
            } else {
                node = node.parentElement.parentElement;
            }
        }
        const table = this.tables.get(viewer.getAttribute("table") || config.table);
        const widget = new PerspectiveViewerWidget({node, viewer});
        const event = new CustomEvent("workspace-new-view", {
            detail: {config, widget}
        });
        this.element.dispatchEvent(event);
        widget.title.closable = true;
        this.element.appendChild(widget.viewer);
        if (table) {
            widget.viewer.load(table);
        }
        widget.restore(config).then(() => {
            this._addWidgetEventListeners(widget);
        });
        return widget;
    }

    _addWidgetEventListeners(widget) {
        if (this.listeners.has(widget)) {
            this.listeners.get(widget)();
        }
        const settings = event => {
            if (event.detail) {
                widget.title.className += " settings_open";
            } else {
                widget.title.className = widget.title.className.replace(/settings_open/g, "");
            }
        };
        const contextMenu = event => this.showContextMenu(widget, event);
        const updated = event => {
            this.workspaceUpdated();
            if (this.mode === MODE.LINKED) {
                const config = event.target?.save();
                if (config) {
                    const selectable = this._linkedViewers.length > 0 && !!config["row-pivots"];
                    if (selectable !== !!config.selectable) {
                        event.target.restore({selectable});
                    }
                }
            }
        };
        widget.node.addEventListener("contextmenu", contextMenu);
        widget.viewer.addEventListener("perspective-toggle-settings", settings);
        widget.viewer.addEventListener("perspective-config-update", updated);
        widget.title.changed.connect(updated);

        this.listeners.set(widget, () => {
            widget.node.removeEventListener("contextmenu", contextMenu);
            widget.viewer.removeEventListener("perspective-toggle-settings", settings);
            widget.viewer.removeEventListener("perspective-config-update", updated);
            widget.title.changed.disconnect(updated);
        });
    }

    getAllWidgets() {
        return [...this.masterPanel.widgets, ...toArray(this.dockpanel.widgets())];
    }

    /***************************************************************************
     *
     * `workspace-layout-update` event
     *
     */

    _fireUpdateEvent() {
        const layout = this.save();
        if (layout) {
            const tables = {};
            this.tables.forEach((value, key) => {
                tables[key] = value;
            });
            this.element.dispatchEvent(new CustomEvent("workspace-layout-update", {detail: {tables, layout}}));
        }
    }

    workspaceUpdated() {
        if (!this._save) {
            this._save = debounce(() => this.dockpanel.mode !== "single-document" && this._fireUpdateEvent(), 500);
        }
        this._save();
    }
}
