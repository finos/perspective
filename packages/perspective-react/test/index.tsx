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

import * as React from "react";
import { createRoot } from "react-dom/client";

import perspective, { Table } from "@finos/perspective";
import perspective_viewer from "@finos/perspective-viewer";

// Import perspective viewer plugins to register them on the web component.
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import { ViewerConfigUpdate } from "@finos/perspective-viewer";
import {
    PerspectiveViewer,
    PerspectiveProvider,
} from "@finos/perspective-react";
import * as psp from "@finos/perspective-react";

import "@finos/perspective-viewer/dist/css/themes.css";
import "./index.css";

/**
 * Here we're initializing the WASM interpreter that powers the perspective API and viewer.
 * This example is written assuming that the bundler is configured to treat these files as a "file"
 * and returns a path as the default export. Use ./build.js as an example. The type stubs are in ./globals.d.ts
 */
import SUPERSTORE_ARROW from "superstore-arrow/superstore.lz4.arrow";
import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm";
import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm";

await Promise.all([
    perspective.init_server(fetch(SERVER_WASM)),
    perspective_viewer.init_client(fetch(CLIENT_WASM)),
]);

// Now WASM has booted and we can construct a web worker to host our tables.
const worker = await perspective.worker();

async function createTable(): Promise<Table> {
    const req = fetch(SUPERSTORE_ARROW);
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    return await worker.table(buffer);
}

const config: ViewerConfigUpdate = {
    group_by: ["State"],
};

const Root: React.FC = () => {
    return (
        <PerspectiveProvider>
            <App />
        </PerspectiveProvider>
    );
};

const App: React.FC = () => {
    const actions = psp.useActions();
    const [state, setState] = React.useState<ToolbarState>({
        mounted: true,
        selectedTable: "superstore",
    });

    React.useEffect(() => {
        actions.addTable({ table: "superstore", promise: createTable() });
        return () => {
            actions.removeTable({ table: "superstore" });
        };
    }, []);

    return (
        <div className="container">
            <Toolbar state={state} setState={setState} />
            <div className="workspace">
                <div className="viewer-container">
                    {state.mounted && (
                        <PerspectiveViewer
                            selectedTable={state.selectedTable}
                            config={{
                                plugin: "datagrid",
                                ...config,
                            }}
                        />
                    )}
                </div>
                <div className="viewer-container">
                    {state.mounted && (
                        <PerspectiveViewer
                            selectedTable={state.selectedTable}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

interface ToolbarState {
    mounted: boolean;
    selectedTable: string;
}

const table = createTable();

const Toolbar: React.FC<{
    state: ToolbarState;
    setState: React.Dispatch<React.SetStateAction<ToolbarState>>;
}> = ({ state, setState }) => {
    const actions = psp.useActions();
    const tables = psp.useTables();

    const selectOptions = Object.keys(tables).map((table) => (
        <option key={table} value={table}>
            {table}
        </option>
    ));

    return (
        <div className="toolbar">
            <div>
                <button
                    id="toggle"
                    onClick={() =>
                        setState((old) => ({ ...old, mounted: !state.mounted }))
                    }
                >
                    Toggle Mount
                </button>
            </div>
            <button
                onContextMenu={(e) => {
                    e.preventDefault();
                    (async () => {
                        for (let i = 0; i < 100; i++) {
                            actions.addTable({
                                table: "superstore",
                                promise: table,
                            });
                            // Yield event loop to prevent react from
                            // batching updates.
                            // await Promise.resolve();

                            await new Promise((resolve) =>
                                setTimeout(resolve, 5)
                            );
                        }
                    })();
                }}
                onClick={() => {
                    actions.addTable({
                        table: "superstore",
                        promise: createTable(),
                    });
                }}
            >
                Overwrite Superstore
            </button>
            <button
                onClick={() => {
                    actions.removeTable({ table: state.selectedTable });
                }}
            >
                Remove Table
            </button>
            <select
                onChange={(e) => {
                    setState((old) => ({
                        ...old,
                        selectedTable: e.target.value,
                    }));
                }}
            >
                {selectOptions}
            </select>
        </div>
    );
};

createRoot(document.getElementById("root")!).render(<Root />);
