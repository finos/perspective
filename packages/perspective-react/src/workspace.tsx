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

import type * as psp from "@finos/perspective";
import type * as pspWorkspace from "@finos/perspective-workspace";
import {
    PerspectiveWorkspaceConfig,
    ViewerConfigUpdateExt,
} from "@finos/perspective-workspace";

import * as utils from "./utils";

import * as React from "react";
import { Mutex } from "async-mutex";
import { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";

export interface PerspectiveWorkspaceProps
    extends React.HTMLAttributes<HTMLElement> {
    tables: Record<string, Promise<psp.Table>>;
    config: PerspectiveWorkspaceConfig<string>;
    onLayoutUpdate?: (detail: {
        layout: PerspectiveWorkspaceConfig<string>;
        tables: Record<string, psp.Table | Promise<psp.Table>>;
    }) => void;
    onNewView?: (detail: {
        config: ViewerConfigUpdateExt;
        widget: pspWorkspace.PerspectiveViewerWidget;
    }) => void;
    onToggleGlobalFilter?: (detail: {
        widget: pspWorkspace.PerspectiveViewerWidget;
        isGlobalFilter: boolean;
    }) => void;
}

export const PerspectiveWorkspace = React.forwardRef<
    pspWorkspace.HTMLPerspectiveWorkspaceElement | undefined,
    PerspectiveWorkspaceProps
>(
    (
        {
            tables,
            config,
            onLayoutUpdate = () => {},
            onNewView = () => {},
            onToggleGlobalFilter = () => {},
            id,
            className,
            style,
        },
        ref
    ) => {
        const [workspace, setWorkspace] =
            React.useState<pspWorkspace.HTMLPerspectiveWorkspaceElement>();

        React.useImperativeHandle(ref, () => workspace, [workspace]);

        const tablesMutex = React.useRef(new Mutex());

        React.useEffect(() => {
            if (!workspace) return;
            workspace.restore(config);
        }, [workspace, config]);

        // TODO: I dont want to run this only when `config` changes
        //       because this triggering effect involves minor slow things like
        //       iterating through a list... If tables has not changed this work will be idempotent.
        //       so maybe its a bit of wasted compute??? TODO: How slow is it actually??
        React.useEffect(() => {
            if (!workspace) return;
            tablesMutex.current.runExclusive(() => {
                console.log("DDD Replacing Tables");
                replaceTablesAlgorithm(
                    workspace.tables,
                    tables,
                    workspace,
                    config
                );
            });
        }, [workspace, tables, config]);

        utils.usePspListener(workspace, "workspace-new-view", onNewView);

        // TODO: does replacing `tables` when this is fired mess up performance
        //       by over-running replaceTables which may be expensive?
        //       Is it expensive in the usual case of no changes to tables?
        utils.usePspListener(
            workspace,
            "workspace-layout-update",
            onLayoutUpdate
        );
        utils.usePspListener(
            workspace,
            "workspace-toggle-global-filter",
            onToggleGlobalFilter
        );

        return (
            <perspective-workspace
                ref={(r) => setWorkspace(r ?? undefined)}
                id={id}
                className={className}
                style={style}
            ></perspective-workspace>
        );
    }
);

// export const PerspectiveWorkspace = React.memo(PerspectiveWorkspaceImpl);

/// swaps all tables in the workspace with the ones passed in.
/// Any viewers that are using tables not in the new tables will be ejected (`viewer>eject()`).
async function replaceTablesAlgorithm(
    prev: Map<string, Promise<psp.Table> | psp.Table>,
    next: Record<string, Promise<psp.Table>>,
    workspace: pspWorkspace.HTMLPerspectiveWorkspaceElement,
    config: PerspectiveWorkspaceConfig<string>
) {
    const viewers = Array.from(
        workspace.children
    ) as HTMLPerspectiveViewerElement[];
    const tableViewerMap: Record<string, HTMLPerspectiveViewerElement[]> =
        viewers.reduce((acc, v) => {
            const t = config.viewers[v.slot]?.table;
            if (t === undefined) {
                return acc;
            } else {
                return {
                    ...acc,
                    [t]: [...(acc[t] ?? []), v],
                };
            }
        }, {} as Record<string, HTMLPerspectiveViewerElement[]>);

    function* tasking(
        prev: Map<string, Promise<psp.Table> | psp.Table>,
        next: Record<string, Promise<psp.Table>>
    ): Generator<
        ["replace" | "add" | "remove", string, Promise<psp.Table>],
        void,
        unknown
    > {
        const names = new Set([...Object.keys(next), ...Object.keys(prev)]);
        for (const name of names) {
            if (Object.is(prev.get(name), next[name])) {
                // We dont need to modify anything in the tables set
                // the key is there and uses the same table.
                // yield ["maintain", name, next[name]];
            } else if (next[name] === undefined) {
                // eject all viewers using `name` that is no longer mapped
                const p = prev.get(name);
                if (p === undefined) {
                    throw new Error("Unreachable.");
                }
                yield ["remove", name, Promise.resolve(p)];
                // TODO: Remove them from the tables
            } else if (prev.get(name) === undefined) {
                // new to the table-set
                // TODO: Do we need to do any extra loading or anything??
                yield ["add", name, next[name]];
            } else {
                // the table for `name` was remapped.
                // eject and then reload viewers using [n]
                // TODO: Do I need to eject??
                yield ["replace", name, next[name]];
            }
        }
    }

    const tasks = tasking(prev, next).map(([task, name, table]) => {
        const viewers = tableViewerMap[name];
        return (async () => {
            if (task === "add") {
                workspace.addTable(name, table);
            } else if (task === "remove") {
                viewers.map((v) => {
                    return v.eject();
                });
            } else if (task === "replace") {
                workspace.replaceTable(name, table);
            }
        })();
    });
    await Promise.all(tasks);
}
