/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {find, toArray} from "@phosphor/algorithm";
import {Panel} from "@phosphor/widgets";
import {PerspectiveDockPanel} from "./dockpanel";
import {Menu} from "@phosphor/widgets";
import {MenuRenderer} from "./menu";
import {createCommands} from "./commands";

import {PerspectiveViewerWidget} from "./widget";
import uniqBy from "lodash/uniqBy";
import debounce from "lodash/debounce";
import cloneDeep from "lodash/cloneDeep";
import {DiscreteSplitPanel} from "./discrete";

const DEFAULT_WORKSPACE_SIZE = [1, 3];

export const SIDE = {
    LEFT: "left",
    RIGHT: "right"
};

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

        this.listeners = new WeakMap();
        this.tables = new Map();
        this.commands = createCommands(this);
        this.menuRenderer = new MenuRenderer(this.element);

        this.customCommands = [];
    }

    /*********************************************************************
     * Workspace public api
     */
    addTable(name, table) {
        this.tables.set(name, table);
        this.getAllWidgets().forEach(widget => {
            if (widget.tableName === name) {
                widget.loadTable(table);
            }
        });
    }

    getTable(name) {
        return this.tables.get(name);
    }

    removeTable(name) {
        const isUsed = this.getAllWidgets().some(widget => widget.tableName === name);
        if (isUsed) {
            console.error(`Cannot remove table: '${name}' because it's still bound to widget(s)`);
        } else {
            const result = this.tables.delete(name);
            if (!result) {
                console.warn(`Table: '${name}' does not exist`);
            }
        }
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
        const config = {
            sizes: [...this.relativeSizes()],
            detail: PerspectiveDockPanel.mapWidgets(widget => widget.save(), this.dockpanel.saveLayout())
        };
        if (this.masterPanel.isAttached) {
            const master = {
                widgets: this.masterPanel.widgets.map(widget => widget.save()),
                sizes: [...this.masterPanel.relativeSizes()]
            };
            config.master = master;
        }
        return config;
    }

    restore(value) {
        this.clearLayout();

        const layout = cloneDeep(value);
        if (layout.master && layout.master.widgets.length > 0) {
            this.setupMasterPanel(layout.sizes || DEFAULT_WORKSPACE_SIZE);
        } else {
            this.addWidget(this.detailPanel);
        }

        if (layout.master) {
            layout.master.widgets.forEach(widgetConfig => {
                const widget = this._createWidget({master: true, ...widgetConfig});
                widget.viewer.addEventListener("perspective-select", this.onPerspectiveSelect);
                widget.viewer.addEventListener("perspective-click", this.onPerspectiveSelect);
                this.masterPanel.addWidget(widget);
            });
            layout.master.sizes && this.masterPanel.setRelativeSizes(layout.master.sizes);
        }

        if (layout.detail) {
            const detailLayout = PerspectiveDockPanel.mapWidgets(widgetConfig => {
                const widget = this._createWidget({master: false, ...widgetConfig});
                return widget;
            }, layout.detail);
            this.dockpanel.restoreLayout(detailLayout);
        }
    }

    /*********************************************************************
     * Workspace-level contextmenu actions
     */
    duplicate(widget) {
        if (this.dockpanel.mode === "single-document") {
            this.toggleSingleDocument(widget);
        }
        const config = widget.save();
        const title = config.title ? `${config.title} (duplicate)` : "";
        const duplicate = this._createWidget({...config, title});
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

    /*********************************************************************
     * Master -> Detail filters
     */
    filterWidget(candidates, filters) {
        toArray(this.dockpanel.widgets()).forEach(async widget => {
            const config = widget.save();
            const availableColumns = Object.keys(await widget.table.schema());
            const currentFilters = config.filters || [];
            const columnAvailable = filter => filter[0] && availableColumns.includes(filter[0]);
            const validFilters = filters.filter(columnAvailable);

            validFilters.push(...currentFilters.filter(x => !candidates.has(x[0])));
            const newFilters = uniqBy(validFilters, item => item[0]);
            widget.restore({filters: newFilters});
        }, this.dockpanel.saveLayout());
    }

    onPerspectiveSelect = event => {
        const config = event.target.save();
        // perspective-select is already handled for hypergrid
        if (event.type === "perspective-click" && config.plugin === "hypergrid") {
            return;
        }
        const candidates = new Set([...(config["row-pivots"] || []), ...(config["column-pivots"] || []), ...(config.filters || []).map(x => x[0])]);
        const filters = [...event.detail.config.filters];
        this.filterWidget(candidates, filters);
    };

    /*********************************************************************
     * Master/Detail methods
     */

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

        widget.selectable = true;
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
        widget.selectable = false;
        widget.viewer.restyleElement();
        widget.viewer.removeEventListener("perspective-click", this.onPerspectiveSelect);
        widget.viewer.removeEventListener("perspective-select", this.onPerspectiveSelect);
    }

    /*********************************************************************
     * Context menu methods.
     */

    createContextMenu(widget) {
        const contextMenu = new Menu({commands: this.commands, renderer: this.menuRenderer});

        contextMenu.addItem({command: "workspace:maximize", args: {widget}});
        contextMenu.addItem({command: "workspace:minimize", args: {widget}});
        contextMenu.addItem({command: "workspace:duplicate", args: {widget}});
        contextMenu.addItem({command: "workspace:master", args: {widget}});

        contextMenu.addItem({type: "separator"});

        contextMenu.addItem({command: "workspace:export", args: {widget}});
        contextMenu.addItem({command: "workspace:copy", args: {widget}});
        contextMenu.addItem({command: "workspace:reset", args: {widget}});

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

    _addContextMenuItem(item) {
        this.customCommands.push(item.id);
        this.commands.addCommand(item.id, {
            execute: args => item.execute({widget: args.widget}),
            label: item.label,
            isVisible: args => item.isVisible({widget: args.widget}),
            mnemonic: 0
        });
    }

    /*********************************************************************
     * layout helper methods .
     */

    clearLayout() {
        this.getAllWidgets().forEach(widget => widget.close());
        this.widgets.forEach(widget => widget.close());
        this.detailPanel.close();

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

    /*********************************************************************
     * Widget helper methods
     */

    addViewer(config) {
        const widget = this._createWidget(config);
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

    _createWidget(config) {
        const widget = new PerspectiveViewerWidget();
        this.element.dispatchEvent(
            new CustomEvent("workspace-new-view", {
                detail: {
                    config,
                    widget
                }
            })
        );
        widget.title.closable = true;
        this.element.appendChild(widget.viewer);
        this._addWidgetEventListeners(widget);
        widget.loadTable(this.getTable(config.table));
        widget.restore(config);
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
        const updated = () => this.workspaceUpdated();

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

    /*********************************************************************
     * Workspace updated event
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
