/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {SplitPanel, DockLayout, Widget, DockPanel, Panel} from "@phosphor/widgets";
import {PerspectiveDockPanel, ContextMenuArgs} from "../dockpanel/dockpanel";
import {Menu} from "@phosphor/widgets";
import {createCommands} from "../dockpanel/contextmenu";
import {CommandRegistry} from "@phosphor/commands";

import {HTMLPerspectiveViewerElement, Filters} from "@finos/perspective-viewer";
import {PerspectiveWidget} from "../widget";
import {toArray} from "@phosphor/algorithm";
import uniqBy from "lodash/uniqBy";
import {DiscreteSplitPanel} from "../dockpanel/discrete";

export interface PerspectiveWorkspaceOptions {
    node?: HTMLElement;
    side?: "left" | "right";
}

export class PerspectiveWorkspace extends DiscreteSplitPanel {
    private dockpanel: PerspectiveDockPanel;
    private boxPanel: Panel;
    private masterpanel: SplitPanel;
    private commands: CommandRegistry;
    private side: string;

    private single_document_prev_layout: DockPanel.ILayoutConfig;

    constructor(options: PerspectiveWorkspaceOptions = {}) {
        super({orientation: "horizontal"});
        this.addClass("p-PerspectiveWorkspace");
        this.dockpanel = new PerspectiveDockPanel("main", {enableContextMenu: false});
        this.boxPanel = new Panel();
        this.boxPanel.layout.fitPolicy = "set-no-constraint";
        this.boxPanel.addClass("p-PerspectiveScrollPanel");
        this.boxPanel.addWidget(this.dockpanel);
        this.masterpanel = new DiscreteSplitPanel({orientation: "vertical"});
        this.masterpanel.addClass("p-Master");
        this.addWidget(this.boxPanel);
        this.commands = this.createCommands();
        this.dockpanel.onContextMenu.connect(this.showContextMenu.bind(this));
        this.side = options.side || "left";
        if (options.node) {
            Widget.attach(this, options.node);
        }
    }

    addViewer(widget: PerspectiveWidget, options: DockLayout.IAddOptions): void {
        this.dockpanel.addWidget(widget, options);
    }

    private createContextMenu(widget: any): Menu {
        const contextMenu = new Menu({commands: this.commands});

        contextMenu.addItem({command: "workspace:toggle-single-document", args: {widget}});
        contextMenu.addItem({command: "perspective:duplicate", args: {widget}});
        contextMenu.addItem({command: "workspace:master", args: {widget}});

        contextMenu.addItem({type: "separator"});

        contextMenu.addItem({command: "perspective:export", args: {widget}});
        contextMenu.addItem({command: "perspective:copy", args: {widget}});
        contextMenu.addItem({command: "perspective:reset", args: {widget}});
        return contextMenu;
    }

    private showContextMenu(sender: PerspectiveDockPanel, args: ContextMenuArgs): void {
        const {widget, event} = args;
        const menu = this.createContextMenu(widget);
        menu.open(event.clientX, event.clientY);
        event.preventDefault();
        event.stopPropagation();
    }

    private filterWidget(candidates: Set<string>, filters: Filters): void {
        toArray(this.dockpanel.widgets()).forEach(async (widget: PerspectiveWidget): Promise<void> => {
            const config = widget.save();
            const availableColumns = Object.keys(await (widget.table as any).schema());
            const currentFilters = config.filters || [];
            const columnAvailable = (filter: string[]): boolean => filter[0] && availableColumns.includes(filter[0]);
            const validFilters = filters.filter(columnAvailable);

            validFilters.push(...currentFilters.filter(x => !candidates.has(x[0])));
            const newFilters = uniqBy(validFilters, (item: [string, string, string]) => item[0]);
            widget.restore({filters: newFilters});
        }, this.dockpanel.saveLayout());
    }

    private onPerspectiveClick = (event: CustomEvent): void => {
        const config = (event.target as HTMLPerspectiveViewerElement).save();
        const candidates = new Set([...(config["row-pivots"] || []), ...(config["column-pivots"] || []), ...(config.filters || []).map(x => x[0])]);
        const filters = [...event.detail.config.filters];
        this.filterWidget(candidates, filters);
    };

    private makeMaster(widget: PerspectiveWidget): void {
        widget.close();
        widget.dark = true;

        if (this.masterpanel.widgets.length === 0) {
            this.boxPanel.close();
            if (this.side === "left") {
                this.addWidget(this.masterpanel);
                this.addWidget(this.boxPanel);
                this.setRelativeSizes([1, 3]);
            } else {
                this.addWidget(this.boxPanel);
                this.addWidget(this.masterpanel);
                this.setRelativeSizes([3, 1]);
            }
        }

        this.masterpanel.addWidget(widget);
        widget.isHidden && widget.show();

        widget.selectable = true;
        widget.viewer.restyleElement();
        widget.viewer.addEventListener("perspective-click", this.onPerspectiveClick);
    }

    private makeDetail(widget: PerspectiveWidget): void {
        widget.close();
        widget.dark = false;

        this.dockpanel.addWidget(widget, {mode: "split-right"});

        if (this.masterpanel.widgets.length === 0) {
            this.boxPanel.close();
            this.masterpanel.close();
            this.addWidget(this.boxPanel);
        }
        widget.selectable = false;
        widget.viewer.restyleElement();
        widget.viewer.removeEventListener("perspective-click", this.onPerspectiveClick);
    }

    private toggleMasterDetail(widget: PerspectiveWidget): void {
        if (widget.parent === this.dockpanel) {
            if (this.dockpanel.mode === "single-document") {
                this.toggleSingleDocument(widget);
            }
            this.makeMaster(widget);
        } else {
            this.makeDetail(widget);
        }
    }

    private toggleSingleDocument(widget: PerspectiveWidget): void {
        if (this.dockpanel.mode !== "single-document") {
            this.single_document_prev_layout = this.dockpanel.saveLayout();
            this.dockpanel.mode = "single-document";
            this.dockpanel.activateWidget(widget);
            widget.notifyResize();
        } else {
            this.dockpanel.mode = "multiple-document";
            this.dockpanel.restoreLayout(this.single_document_prev_layout);
        }
    }

    public async duplicate(widget: PerspectiveWidget): Promise<void> {
        if (this.dockpanel.mode === "single-document") {
            this.toggleSingleDocument(widget);
        }
        const newWidget = new PerspectiveWidget(widget.name);
        newWidget.title.closable = true;
        await newWidget.restore(widget.save());
        this.dockpanel.addWidget(newWidget, {mode: "split-right", ref: widget});
        newWidget.load(widget.table);
    }

    private createCommands(): CommandRegistry {
        const commands = createCommands(this.dockpanel) as CommandRegistry;
        commands.addCommand("perspective:duplicate", {
            execute: ({widget}) => this.duplicate(widget as any),
            // isVisible: args => (args as any).widget.parent === this.dockpanel,
            iconClass: "p-MenuItem-duplicate",
            label: "Duplicate",
            mnemonic: 0
        });

        commands.addCommand("workspace:master", {
            execute: args => this.toggleMasterDetail((args as any).widget),
            iconClass: args => ((args as any).widget.parent === this.dockpanel ? "p-MenuItem-master" : "p-MenuItem-detail"),
            label: args => ((args as any).widget.parent === this.dockpanel ? "Master" : "Detail"),
            mnemonic: 0
        });

        commands.addCommand("workspace:toggle-single-document", {
            execute: args => this.toggleSingleDocument((args as any).widget),
            isVisible: args => (args as any).widget.parent === this.dockpanel,
            iconClass: () => {
                if (this.dockpanel.mode !== "single-document") {
                    return "p-MenuItem-maximize";
                } else {
                    return "p-MenuItem-minimize";
                }
            },
            label: () => (this.dockpanel.mode === "single-document" ? "Minimize" : "Maximize"),
            mnemonic: 0
        });

        return commands;
    }
}
