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

        // React.useEffect(() => {
        //     if (!workspace) return;
        // }, [workspace, config]);

        // const lock = React.useRef(new Mutex());

        React.useEffect(() => {
            if (!workspace) return;
            reconcileNewTables(workspace, tables, config).then(() => {
                workspace.restore(config);
            });
            // workspace.restore(config);
            // lock.current.runExclusive(async () => {
            // });
        }, [workspace, tables, config]);

        utils.usePspListener(workspace, "workspace-new-view", onNewView);

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
async function reconcileNewTables(
    workspace: pspWorkspace.HTMLPerspectiveWorkspaceElement,
    next: Record<string, Promise<psp.Table>>,
    config: PerspectiveWorkspaceConfig<string>
) {
    const prev = workspace.tables;
    const allViewers = Array.from(
        workspace.children
    ) as HTMLPerspectiveViewerElement[];
    const tableViewerMap: Record<string, HTMLPerspectiveViewerElement[]> =
        allViewers.reduce((acc, v) => {
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

    /// reconcile the two sets of tables into the final tables set.
    const names = new Set([...Object.keys(next), ...prev.keys()]);
    for (const name of names) {
        const usedViewers = tableViewerMap[name];
        if (Object.is(prev.get(name), next[name])) {
            // We dont need to modify anything in the tables set
            // the key is there and uses the same table.
        } else if (next[name] === undefined) {
            // name is no longer mapped in the new set of tables.
            const p = prev.get(name);
            if (p === undefined) {
                throw new Error("Unreachable.");
            }
            await Promise.all(
                usedViewers.map((v) => {
                    return v.eject();
                })
            );
            workspace.removeTable(name);
        } else if (prev.get(name) === undefined) {
            // A table was added that did not exist in the previous set.
            await workspace.addTable(name, next[name]);
        } else {
            // the table for `name` was remapped.
            // eject and then reload viewers using `name`
            await Promise.all(
                usedViewers.map(async (v) => {
                    await v.eject();
                    await v.load(next[name]);
                })
            );
            await workspace.replaceTable(name, next[name]);
        }
    }

    // await Promise.all(tasks);
}
