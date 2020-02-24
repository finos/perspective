/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {CommandRegistry} from "@phosphor/commands";

export const createCommands = workspace => {
    const commands = new CommandRegistry();

    commands.addCommand("workspace:export", {
        execute: args => args.widget.viewer.download(),
        iconClass: "menu-export",
        label: "Export CSV",
        mnemonic: 0
    });

    commands.addCommand("workspace:copy", {
        execute: args => args.widget.viewer.copy(),
        iconClass: "menu-copy",
        label: "Copy To Clipboard",
        mnemonic: 0
    });

    commands.addCommand("workspace:reset", {
        execute: args => args.widget.viewer.reset(),
        iconClass: "menu-reset",
        label: "Reset",
        mnemonic: 0
    });

    commands.addCommand("workspace:duplicate", {
        execute: ({widget}) => workspace.duplicate(widget),
        iconClass: "menu-duplicate",
        isVisible: args => (args.widget.parent === workspace.dockpanel ? true : false),
        label: "Duplicate",
        mnemonic: 0
    });

    commands.addCommand("workspace:master", {
        execute: args => workspace.toggleMasterDetail(args.widget),
        iconClass: args => (args.widget.parent === workspace.dockpanel ? "menu-master" : "menu-detail"),
        label: args => (args.widget.parent === workspace.dockpanel ? "Create Global Filter" : "Remove Global Filter"),
        mnemonic: 0
    });

    commands.addCommand("workspace:maximize", {
        execute: args => workspace.toggleSingleDocument(args.widget),
        isVisible: args => args.widget.parent === workspace.dockpanel && workspace.dockpanel.mode !== "single-document",
        iconClass: "menu-maximize",
        label: () => "Maximize",
        mnemonic: 0
    });

    commands.addCommand("workspace:minimize", {
        execute: args => workspace.toggleSingleDocument(args.widget),
        isVisible: args => args.widget.parent === workspace.dockpanel && workspace.dockpanel.mode === "single-document",
        iconClass: "menu-minimize",
        label: () => "Minimize",
        mnemonic: 0
    });
    return commands;
};
