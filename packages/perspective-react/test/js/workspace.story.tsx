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
    PerspectiveWorkspaceConfig,
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

import "@finos/perspective-viewer/dist/css/themes.css";
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

const client = await perspective.worker();

interface WorkspaceState {
    mounted: boolean;
    tables: Record<string, Promise<psp.Table>>;
    layout: PerspectiveWorkspaceConfig;
}

interface WorkspaceAppProps {
    layout: PerspectiveWorkspaceConfig;
    tables: Record<string, Promise<psp.Table>>;
    onSpecial?: () => void;
}

const WorkspaceApp: React.FC<WorkspaceAppProps> = (props) => {
    const [state, setState] = React.useState<WorkspaceState>({
        mounted: true,
        tables: props.tables,
        layout: props.layout,
    });

    const onClickAddViewer = async () => {
        const name = window.crypto.randomUUID();
        const data = `a,b,c\n${Math.random()},${Math.random()},${Math.random()}`;
        const t = client.table(data, { name });
        const nextId = Workspace.genId(state.layout);
        const layout = Workspace.addViewer(
            state.layout,
            {
                table: name,
                title: name,
            },
            nextId
        );
        const tables = { ...state.tables, [name]: t };
        setState({
            ...state,
            layout,
            tables,
        });
    };

    const onClickToggleMount = () =>
        setState((old) => ({ ...old, mounted: !state.mounted }));

    const onLayoutUpdate = ({
        layout,
        tables: ts,
    }: {
        layout: PerspectiveWorkspaceConfig;
        tables: Record<string, psp.Table | Promise<psp.Table>>;
    }) => {
        // From `Table | Promise<Table>` to `Promise<Table>`
        const tables = Object.fromEntries(
            Object.entries(ts).map(([k, v]) => [k, Promise.resolve(v)])
        );
        setState({ ...state, tables, layout });
    };

    React.useEffect(() => {
        setState((s) => ({
            ...s,
            layout: props.layout,
            tables: props.tables,
        }));
    }, [props.layout, props.tables]);

    return (
        <div className="workspace-container">
            <div className="workspace-toolbar">
                <button className="toggle-mount" onClick={onClickToggleMount}>
                    Toggle Mount
                </button>
                <button className="add-viewer" onClick={onClickAddViewer}>
                    Add Viewer
                </button>
                {props.onSpecial && (
                    <button className="special" onClick={props.onSpecial}>
                        Special Third Button
                    </button>
                )}
            </div>
            {state.mounted && (
                <PerspectiveWorkspace
                    tables={state.tables}
                    layout={state.layout}
                    onLayoutUpdate={onLayoutUpdate}
                />
            )}
        </div>
    );
};

/// Renders the app with a default empty workspace
export const EmptyWorkspace: React.FC = () => {
    return (
        <WorkspaceApp
            tables={{}}
            layout={{ sizes: [1], viewers: {}, detail: { main: null } }}
        />
    );
};

export const SingleView: React.FC<{ name: string }> = ({ name }) => {
    const table = client.table("a,b,c\n1,2,3");
    const tables = {
        [name]: table,
    };
    const layout: PerspectiveWorkspaceConfig = {
        sizes: [1],
        detail: {
            main: {
                type: "tab-area",
                currentIndex: 0,
                widgets: [name],
            },
        },
        viewers: {
            [name]: {
                table: name,
                columns: ["a", "b", "c"],
                title: name,
            },
        },
    };
    return <WorkspaceApp tables={tables} layout={layout} />;
};

// this tests that swapping tables in the react component causes the new table to be loaded
export const SwapTables = () => {
    const layout: PerspectiveWorkspaceConfig = {
        sizes: [1],
        detail: {
            main: {
                type: "tab-area",
                currentIndex: 0,
                widgets: ["a"],
            },
        },
        viewers: {
            a: {
                table: "a",
                title: "a",
                columns: ["a", "b", "c"],
            },
        },
    };

    const [which, setWhich] = React.useState(true);
    // the internal table name does not affect the workspace table name.
    const first = { a: client.table("a,b,c\n1,2,3", { name: "first" }) };
    const second = {
        a: client.table("a,b,c\n4,5,6\n7,8,9", { name: "second" }),
    };

    const onSpecial = () => {
        setWhich(!which);
    };

    return (
        <WorkspaceApp
            tables={which ? first : second}
            layout={layout}
            onSpecial={onSpecial}
        />
    );
};
