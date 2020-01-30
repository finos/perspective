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

        this.addClass("p-PerspectiveWorkspace");
        this.dockpanel = new PerspectiveDockPanel("main", {enableContextMenu: false});
        this.detailPanel = new Panel();
        this.detailPanel.layout.fitPolicy = "set-no-constraint";
        this.detailPanel.addClass("p-PerspectiveScrollPanel");
        this.detailPanel.addWidget(this.dockpanel);
        this.masterPanel = new DiscreteSplitPanel({orientation: "vertical"});
        this.masterPanel.addClass("p-MasterPanel");

        this.addWidget(this.detailPanel);

        this.element = element;
        this._side = options.side || SIDE.LEFT;

        this.listeners = new WeakMap();
        this.tables = new Map();
        this.commands = createCommands(this);
        this.menuRenderer = new MenuRenderer(this.element);
    }

    /*********************************************************************
     * Workspace public api
     */
    addTable(name, table) {
        this.tables.set(name, table);
        this.getAllWidgets().forEach(widget => {
            if (widget.tableName === name) {
                widget.table = table;
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
                const widget = this._createWidget({
                    title: widgetConfig.name,
                    table: this.getTable(widgetConfig.table),
                    config: {master: true, ...widgetConfig}
                });
                widget.viewer.addEventListener("perspective-select", this.onPerspectiveSelect);
                widget.viewer.addEventListener("perspective-click", this.onPerspectiveSelect);
                this.masterPanel.addWidget(widget);
            });
            layout.master.sizes && this.masterPanel.setRelativeSizes(layout.master.sizes);
        }

        if (layout.detail) {
            const detailLayout = PerspectiveDockPanel.mapWidgets(widgetConfig => {
                const widget = this._createWidget({
                    title: widgetConfig.name,
                    table: this.getTable(widgetConfig.table),
                    config: {master: false, ...widgetConfig}
                });
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
        const duplicate = this._createWidget({title: "duplicate", table: widget.table, config: widget.save()});
        if (widget.master) {
            const index = this.masterPanel.widgets.indexOf(widget) + 1;
            this.masterPanel.insertWidget(index, duplicate);
        } else {
            this.dockpanel.addWidget(duplicate, {mode: "split-right", ref: widget});
        }
    }

    toggleMasterDetail(widget) {
        if (widget.parent === this.dockpanel) {
            if (this.dockpanel.mode === "single-document") {
                this.toggleSingleDocument(widget);
            }
            this.makeMaster(widget);
        } else {
            this.makeDetail(widget);
        }
    }

    toggleSingleDocument(widget) {
        if (this.dockpanel.mode !== "single-document") {
            widget.viewer.classList.add("p-Maximize");
            this.single_document_prev_layout = this.dockpanel.saveLayout();
            this.dockpanel.mode = "single-document";
            this.dockpanel.activateWidget(widget);
            widget.notifyResize();
        } else {
            widget.viewer.classList.remove("p-Maximize");
            this.dockpanel.mode = "multiple-document";
            this.dockpanel.restoreLayout(this.single_document_prev_layout);
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

    makeMaster(widget) {
        widget.master = true;

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

        this.dockpanel.addWidget(widget, {mode: "split-right"});

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
        return contextMenu;
    }

    showContextMenu(widget, event) {
        const menu = this.createContextMenu(widget);
        const tabbar = find(this.dockpanel.tabBars(), bar => bar.currentTitle.owner === widget);

        widget.addClass("p-ContextFocus");
        tabbar && tabbar.node.classList.add("p-ContextFocus");
        this.element.classList.add("p-ContextMenu");
        this.addClass("p-ContextMenu");
        if (widget.viewer.classList.contains("p-Master")) {
            menu.node.classList.add("p-Master");
        } else {
            menu.node.classList.remove("p-Master");
        }
        this._menu_opened = true;

        menu.aboutToClose.connect(() => {
            widget.removeClass("p-ContextFocus");
            tabbar && tabbar.node.classList.remove("p-ContextFocus");

            // Delay to absorb opacity "bounce" due to animation technically
            // being reset, when right click is made twice in succession.
            this._menu_opened = false;
            setTimeout(() => {
                if (!this._menu_opened) {
                    this.element.classList.remove("p-ContextMenu");
                    this.removeClass("p-ContextMenu");
                }
            });
        });

        menu.open(event.clientX, event.clientY);
        event.preventDefault();
        event.stopPropagation();
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

    _createWidget({title, table, config}) {
        const widget = new PerspectiveViewerWidget({title, table});
        widget.title.closable = true;
        this.element.appendChild(widget.viewer);
        this._addWidgetEventListeners(widget);
        widget.restore(config);
        return widget;
    }

    _addWidgetEventListeners(widget) {
        if (this.listeners.has(widget)) {
            this.listeners.get(widget)();
        }
        const settings = event => {
            widget.title.className = event.detail && "settings_open";
        };
        const contextMenu = event => this.showContextMenu(widget, event);
        widget.viewer.addEventListener("contextmenu", contextMenu);
        widget.viewer.addEventListener("perspective-toggle-settings", settings);

        this.listeners.set(widget, () => {
            widget.viewer.removeEventListener("contextmenu", contextMenu);
            widget.viewer.removeEventListener("perspective-toggle-settings", settings);
        });
    }

    getAllWidgets() {
        return [...this.masterPanel.widgets, ...toArray(this.dockpanel.widgets())];
    }
}
