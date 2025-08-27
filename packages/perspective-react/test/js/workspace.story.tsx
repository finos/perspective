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
import "@finos/perspective-workspace";

import {
    HTMLPerspectiveWorkspaceElement,
    PerspectiveViewerWidget,
    PerspectiveWorkspaceConfig,
    ViewerConfigUpdateExt,
} from "@finos/perspective-workspace";

import * as React from "react";

import { PerspectiveWorkspace } from "@finos/perspective-react";

import perspective from "@finos/perspective";
import perspective_viewer from "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-workspace";
import * as Workspace from "@finos/perspective-workspace";

import * as psp from "@finos/perspective";

import "@finos/perspective-workspace/dist/css/pro.css";
import "./index.css";

// @ts-ignore
import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm?url";

// @ts-ignore
import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm?url";

await Promise.all([
    perspective.init_server(fetch(SERVER_WASM)),
    perspective_viewer.init_client(fetch(CLIENT_WASM)),
]);

const CLIENT = await perspective.worker();

interface WorkspaceState {
    mounted: boolean;
    config: PerspectiveWorkspaceConfig<string>;
    tables: Record<string, Promise<psp.Table>>;
    /// This object is kept for the 'swap tables' button.
    /// It is a backup set of tables that correspond in keys to `tables`
    /// but with different data.
    swapTables: Record<string, Promise<psp.Table>>;
    /// if false use `tables` and true use `swapTables` in the workspace
    swap: boolean;
}

export const WorkspaceApp: React.FC = () => {
    const [state, setState] = React.useState<WorkspaceState>({
        mounted: true,
        tables: {},
        swapTables: {},
        config: {
            sizes: [],
            viewers: {},
            detail: undefined,
        },
        swap: false,
    });

    const onClickAddViewer = React.useCallback(async () => {
        const name = window.crypto.randomUUID();
        const data = `a,b,c\n${Math.random()},${Math.random()},${Math.random()}`;
        const swapData = `a,b,c\n${Math.random()},${Math.random()},${Math.random()}\n${Math.random()},${Math.random()},${Math.random()}`;
        // dont assign internal names to the tables they are not used by the workspace
        const t = CLIENT.table(data);
        const swap = CLIENT.table(swapData);
        const config = Workspace.addViewer(state.config, {
            table: name,
            title: name,
        });
        const tables = { ...state.tables, [name]: t };
        const swapTables = { ...state.swapTables, [name]: swap };
        setState({
            ...state,
            tables,
            config,
            swapTables,
        });
    }, [state]);

    const onLayoutUpdate: (detail: {
        layout: PerspectiveWorkspaceConfig<string>;
        tables: Record<string, psp.Table | Promise<psp.Table>>;
    }) => void = React.useCallback(
        ({ layout, tables }) => {
            const newTables = Object.fromEntries(
                Object.entries(tables).map(([k, v]) => [k, Promise.resolve(v)])
            );
            setState({
                ...state,
                config: layout,
                tables: state.swap ? state.tables : newTables,
                swapTables: state.swap ? newTables : state.swapTables,
            });
        },
        [state]
    );

    const onClickToggleMount = () =>
        setState((old) => ({ ...old, mounted: !state.mounted }));

    // swaps the tables out but uses the same name of them.
    // this keeps the layout the same, but the data within each viewer changes
    const swapTables = React.useCallback(() => {
        setState({
            ...state,
            swap: !state.swap,
        });
    }, [state]);

    return (
        <div className="workspace-container">
            <div className="workspace-toolbar">
                <button className="toggle-mount" onClick={onClickToggleMount}>
                    Toggle Mount
                </button>
                <button className="add-viewer" onClick={onClickAddViewer}>
                    Add Viewer
                </button>
                <button className="swap" onClick={swapTables}>
                    Swap underlying tables
                </button>
            </div>
            {state.mounted && (
                <PerspectiveWorkspace
                    tables={state.swap ? state.swapTables : state.tables}
                    config={state.config}
                    onLayoutUpdate={onLayoutUpdate}
                />
            )}
        </div>
    );
};
