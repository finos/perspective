/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {CommandRegistry} from "@lumino/commands/src";
import {MODE} from "./workspace";

import perspective from "@finos/perspective";

const worker = perspective.shared_worker();

export const createCommands = (workspace, indicator) => {
    const commands = new CommandRegistry();

    commands.addCommand("workspace:export", {
        execute: async (args) => {
            const menu = document.createElement("perspective-export-menu");
            workspace.apply_indicator_theme();
            menu.unsafe_set_model(await args.widget.viewer.unsafe_get_model());
            menu.open(indicator);
            args.init_overlay();
            menu.addEventListener("blur", () => {
                args.contextMenu.aboutToClose.emit({});
            });
        },
        isEnabled: (args) => {
            if (args.contextMenu.node.isConnected) {
                indicator.style.top = args.contextMenu.node.offsetTop;
                indicator.style.left = args.contextMenu.node.offsetLeft;
            }

            return true;
        },
        iconClass: "menu-export",
        label: "Export",
        mnemonic: 0,
    });

    commands.addCommand("workspace:copy", {
        execute: async (args) => {
            const menu = document.createElement("perspective-copy-menu");
            workspace.apply_indicator_theme();
            menu.unsafe_set_model(await args.widget.viewer.unsafe_get_model());
            menu.open(indicator);
            args.init_overlay();
            menu.addEventListener("blur", () => {
                args.contextMenu.aboutToClose.emit({});
            });
        },
        iconClass: "menu-copy",
        label: "Copy",
        mnemonic: 0,
    });

    commands.addCommand("workspace:new", {
        execute: (args) => {
            const widget = workspace._createWidgetAndNode({
                config: {table: args.table},
            });

            workspace.dockpanel.addWidget(widget, {
                mode: "split-right",
                ref: args.widget,
            });
        },
        iconClass: "menu-new-tables",
        label: (args) => args.table,
    });

    commands.addCommand("workspace:newview", {
        execute: async (args) => {
            const config = await args.target_widget.save();
            const widget = workspace._createWidgetAndNode({
                config,
            });

            workspace.dockpanel.addWidget(widget, {
                mode: "split-right",
                ref: args.widget,
            });
        },
        iconClass: "menu-new-tables",
        isVisible: (args) => args.target_widget.title.label !== "",
        label: (args) => args.target_widget.title.label,
    });

    commands.addCommand("workspace:reset", {
        execute: (args) => args.widget.viewer.reset(),
        iconClass: "menu-reset",
        label: "Reset",
        mnemonic: 0,
    });

    commands.addCommand("workspace:duplicate", {
        execute: ({widget}) => workspace.duplicate(widget),
        iconClass: "menu-duplicate",
        isVisible: (args) =>
            args.widget.parent === workspace.dockpanel ? true : false,
        label: "Duplicate",
        mnemonic: 0,
    });

    commands.addCommand("workspace:master", {
        execute: (args) => workspace.toggleMasterDetail(args.widget),
        isVisible: () => workspace.mode === MODE.GLOBAL_FILTERS,
        iconClass: (args) =>
            args.widget.parent === workspace.dockpanel
                ? "menu-master"
                : "menu-detail",
        label: (args) =>
            args.widget.parent === workspace.dockpanel
                ? "Create Global Filter"
                : "Remove Global Filter",
        mnemonic: 0,
    });

    commands.addCommand("workspace:flatten", {
        execute: async (args) => {
            const view = await args.widget.viewer.getView();
            const arrow = await view.to_arrow({
                separator: ", ",
                leaves_only: true,
            });

            const table = await worker.table(arrow);
            const {group_by} = await args.widget.viewer.save();
            const columns = await table.columns();
            const new_group_by = columns.slice(0, group_by.length);
            const new_config = {
                table: "a",
                group_by: new_group_by,
                split_by: [],
                filter: [],
                sort: [],
                columns: columns.slice(group_by.length),
            };

            workspace.addTable("a", Promise.resolve(table));

            if (workspace.dockpanel.mode === "single-document") {
                workspace.toggleSingleDocument(widget);
            }
            // const config = await widget.save();
            new_config.name = new_config.name
                ? `${new_config.name} (flat)`
                : "";

            const duplicate = workspace._createWidgetAndNode({
                config: new_config,
            });
            // if (config.linked) {
            //     workspace._linkWidget(duplicate);
            // }

            // if (widget.master) {
            //     const index = workspace.masterPanel.widgets.indexOf(widget) + 1;
            //     workspace.masterPanel.insertWidget(index, duplicate);
            // } else {
            workspace.dockpanel.addWidget(duplicate, {
                mode: "split-right",
                ref: args.widget,
            });
            // }

            await duplicate.task;

            // args.widget.viewer.load(table);
            // args.widget.viewer.restore(new_config);
        },
        iconClass: "menu-reset",
        label: "Flatten",
        mnemonic: 0,
    });

    commands.addCommand("workspace:link", {
        execute: (args) => workspace.toggleLink(args.widget),
        isVisible: () => workspace.mode === MODE.LINKED,
        iconClass: (args) =>
            workspace.isLinked(args.widget) ? "menu-unlink" : "menu-link",
        label: (args) => (workspace.isLinked(args.widget) ? "Unlink" : "Link"),
        mnemonic: 0,
    });

    commands.addCommand("workspace:maximize", {
        execute: (args) => workspace.toggleSingleDocument(args.widget),
        isVisible: (args) =>
            args.widget.parent === workspace.dockpanel &&
            workspace.dockpanel.mode !== "single-document",
        iconClass: "menu-maximize",
        label: () => "Maximize",
        mnemonic: 0,
    });

    commands.addCommand("workspace:minimize", {
        execute: (args) => workspace.toggleSingleDocument(args.widget),
        isVisible: (args) =>
            args.widget.parent === workspace.dockpanel &&
            workspace.dockpanel.mode === "single-document",
        iconClass: "menu-minimize",
        label: () => "Minimize",
        mnemonic: 0,
    });

    commands.addCommand("workspace:close", {
        execute: (args) => {
            args.widget.close();
        },
        iconClass: "menu-close",
        label: () => "Close",
        mnemonic: 0,
    });

    return commands;
};
