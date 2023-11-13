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

import { CommandRegistry } from "@lumino/commands";
import { Workspace } from "./workspace";

/**
 * Creates a CommandRegistry whose actions are related to the given arguments.
 * @param workspace  The workspace for which to add/modify elements from
 * @param indicator  An element that is used to anchor submenus relative to it.
 * @returns A CommandRegistry for use in Lumino widgets.
 */
export const createCommands = (workspace: Workspace): CommandRegistry => {
    const commands = new CommandRegistry();

    /// Opens a submenu to copy the viewers contents
    /// TODO: this probably should open the viewer in SDM
    ///         and then open up the export menu of that instead
    ///         then we would not need to export the whole modal.
    commands.addCommand("workspace:export", {
        execute: async (args: { viewer: string }) => {
            workspace.openExportViewer(args.viewer);
        },
        // iconClass: "menu-export",
        label: "Export",
        mnemonic: 0,
    });

    /// Opens a submenu to copy the viewers contents
    /// TODO: this probably should open the viewer in SDM
    ///         and then open up the export menu of that instead
    ///         then we would not need to export the whole modal.
    commands.addCommand("workspace:copy", {
        execute: (args: { viewer: string }) => {
            workspace.openCopyViewer(args.viewer);
        },
        // iconClass: "menu-copy",
        label: "Copy",
        mnemonic: 0,
    });

    /// Create a new view from a table in the workspace.
    commands.addCommand("workspace:new", {
        execute: (args: { table: string; ref: string }) => {
            workspace.addViewer(
                { table: args.table, title: args.table },
                { mode: "split-right", ref: args.ref }
            );
        },
        // iconClass: "menu-new-tables",
        // TODO: why this error, its JSON.
        label: (args: { table: string }) => args.table,
    });

    /// Create a new view, duplicating the configuration of another.
    /// TODO: is there a way to only get the
    //          widgets config instead of the Widget object?
    commands.addCommand("workspace:newview", {
        execute: async (args: { tocopy: string; ref: string }) => {
            workspace.duplicateViewer(args.tocopy, {
                mode: "split-right",
                ref: args.ref,
            });
        },
        // iconClass: "menu-new-tables",
        // TODO: are these extra args even seen in the UI???
        // isVisible: (args: { target_widget: PerspectiveViewer }) =>
        //     args.target_widget.title.label !== "",
        label: (args: { name: string }) => args.name,
        // label: (args: { target_widget: PerspectiveViewer }) =>
        //     args.target_widget.title.label || "untitled",
    });

    commands.addCommand("workspace:reset", {
        execute: (args: { viewer: string }) =>
            workspace.resetViewer(args.viewer),
        // iconClass: "menu-reset",
        label: "Reset",
        mnemonic: 0,
    });

    commands.addCommand("workspace:duplicate", {
        execute: (args: { viewer: string }) =>
            workspace.duplicateViewer(args.viewer, {
                mode: "split-right",
                ref: args.viewer,
            }),
        // iconClass: "menu-duplicate",
        // TODO, all these extra args here.
        // isVisible: (args: { widget: PerspectiveViewer }) =>
        //     args.widget.parent === workspace.panel ? true : false,
        label: "Duplicate",
        mnemonic: 0,
    });

    commands.addCommand("workspace:close", {
        execute: (args: { viewer: string }) => {
            workspace.closeViewer(args.viewer);
        },
        // iconClass: "menu-close",
        label: () => "Close",
        mnemonic: 0,
    });

    commands.addCommand("workspace:help", {
        execute: () => {},
        label: "Shift+Click for Browser Menu",
        isEnabled: () => false,
    });

    return commands;
};
