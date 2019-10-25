import {SplitPanel, DockLayout, Widget} from "@phosphor/widgets";
import {PerspectiveDockPanel, ContextMenuArgs} from "./dockpanel";
import {PerspectiveWidget} from "./widget";
import {mapWidgets} from "./utils";
import {uniqBy} from "lodash";
import {Menu} from "@phosphor/widgets";
import {createCommands} from "./contextmenu";
import {CommandRegistry} from "@phosphor/commands";
import PerspectiveViewer from "@finos/perspective-viewer";

export interface PerspectiveWorkspaceOptions {
    node?: HTMLElement;
}

export class PerspectiveWorkspace extends SplitPanel {
    private dockpanel: PerspectiveDockPanel;
    private masterpanel: SplitPanel;
    private commands: CommandRegistry;

    constructor(options: PerspectiveWorkspaceOptions = {}) {
        super({orientation: "horizontal"});
        this.dockpanel = new PerspectiveDockPanel("main", {enableContextMenu: false});
        this.masterpanel = new SplitPanel({orientation: "vertical"});
        this.masterpanel.addClass("p-Master");
        this.addWidget(this.dockpanel);
        this.commands = this.createCommands();
        this.dockpanel.onContextMenu.connect(this.showContextMenu.bind(this));
        options.node && Widget.attach(this, options.node);
    }

    addViewer(widget: PerspectiveWidget, options: DockLayout.IAddOptions): void {
        this.dockpanel.addWidget(widget, options);
    }

    private createContextMenu(widget: any): Menu {
        const contextMenu = new Menu({commands: this.commands});

        if (widget.parent === this.dockpanel) {
            contextMenu.addItem({command: "perspective:duplicate", args: {widget}});
        }
        contextMenu.addItem({command: "workspace:master", args: {widget}});

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

    private filterWidget(candidates: Set<string>, filters: string[][]): void {
        mapWidgets(async (widget: PerspectiveWidget): Promise<void> => {
            const config = widget.save();
            const availableColumns = Object.keys(await (widget.table as any).schema());
            const currentFilters = config.filters || [];
            const columnAvailable = (filter: string[]): boolean => filter[0] && availableColumns.includes(filter[0]);
            const validFilters = filters.filter(columnAvailable);

            validFilters.push(...currentFilters.filter(x => !candidates.has(x[0])));
            const newFilters = uniqBy(validFilters, (item: string[]) => item[0]);
            widget.restore({filters: newFilters});
        }, this.dockpanel.saveLayout());
    }

    private onPerspectiveClick = (event: CustomEvent): void => {
        const config = (event.target as PerspectiveViewer).save();
        const candidates = new Set([...(config["row-pivots"] || []), ...(config["column-pivots"] || []), ...(config.filters || []).map(x => x[0])]);
        const filters = [...event.detail.config.filters];
        this.filterWidget(candidates, filters);
    };

    private makeMaster(widget: PerspectiveWidget): void {
        widget.close();
        widget.dark = true;

        if (this.masterpanel.widgets.length === 0) {
            this.dockpanel.close();
            this.addWidget(this.masterpanel);
            this.addWidget(this.dockpanel);
            this.setRelativeSizes([1, 3]);
        }

        this.masterpanel.addWidget(widget);
        widget.viewer.restyleElement();

        widget.viewer.addEventListener("perspective-click", this.onPerspectiveClick);
    }

    private makeDetail(widget: PerspectiveWidget): void {
        widget.close();
        widget.dark = false;

        this.dockpanel.addWidget(widget, {mode: "split-right"});

        if (this.masterpanel.widgets.length === 0) {
            this.dockpanel.close();
            this.masterpanel.close();
            this.addWidget(this.dockpanel);
        }

        widget.viewer.restyleElement();
        widget.viewer.removeEventListener("perspective-click", this.onPerspectiveClick);
    }

    private toggleMasterDetail(widget: PerspectiveWidget): void {
        if (widget.parent === this.dockpanel) {
            this.makeMaster(widget);
        } else {
            this.makeDetail(widget);
        }
    }

    private createCommands(): CommandRegistry {
        const commands = createCommands(this.dockpanel) as CommandRegistry;
        commands.addCommand("workspace:master", {
            execute: args => this.toggleMasterDetail((args as any).widget),
            iconClass: args => ((args as any).widget.parent === this.dockpanel ? "p-MenuItem-master" : "p-MenuItem-detail"),
            label: args => ((args as any).widget.parent === this.dockpanel ? "Master" : "Detail"),
            mnemonic: 0
        });
        return commands;
    }
}
