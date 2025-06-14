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

// # [Perspective bootstrapping](https://perspective.finos.org/guide/how_to/javascript/importing.html)

// Here we're initializing the WASM interpreter that powers the perspective API
// and viewer, as covered in the [user guide section on bundling](https://perspective.finos.org/guide/how_to/javascript/importing.html).
// This example is written assuming that the bundler is configured
// to treat these files as a "file" and returns a path as the default export.
// Use ./build.js as an example. The type stubs are in ./globals.d.ts

import perspective from "@finos/perspective";
import perspective_viewer from "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm";
import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm";

await Promise.all([
    perspective.init_server(fetch(SERVER_WASM)),
    perspective_viewer.init_client(fetch(CLIENT_WASM)),
]);

// # Data Source

// Data source creates a static Web Worker instance of Perspective engine, and a
// table creation function which both downloads data and loads it into the
// engine.

import type * as psp from "@finos/perspective";
import type * as pspViewer from "@finos/perspective-viewer";

import SUPERSTORE_ARROW from "superstore-arrow/superstore.lz4.arrow";

const WORKER = await perspective.worker();

async function createNewSuperstoreTable(): Promise<psp.Table> {
    console.warn("Creating new table!");
    const req = fetch(SUPERSTORE_ARROW);
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    return await WORKER.table(buffer);
}

const CONFIG: pspViewer.ViewerConfigUpdate = {
    group_by: ["State"],
};

// # React application

// The React application itself

import * as React from "react";
import { createRoot } from "react-dom/client";
import { PerspectiveViewer } from "@finos/perspective-react";

import "@finos/perspective-viewer/dist/css/themes.css";
import "./index.css";

interface ToolbarState {
    mounted: boolean;
    table?: Promise<psp.Table>;
    config: pspViewer.ViewerConfigUpdate;
}

const App: React.FC = () => {
    const [state, setState] = React.useState<ToolbarState>(() => ({
        mounted: true,
        table: createNewSuperstoreTable(),
        config: { ...CONFIG },
    }));

    React.useEffect(() => {
        return () => {
            state.table?.then((table) => table?.delete({ lazy: true }));
        };
    }, []);

    const onClickOverwrite = () => {
        state.table?.then((table) => table?.delete({ lazy: true }));
        const table = createNewSuperstoreTable();
        setState({ ...state, table });
    };

    const onClickDelete = () => {
        state.table?.then((table) => table?.delete({ lazy: true }));
        setState({ ...state, table: undefined });
    };

    const onClickToggleMount = () =>
        setState((old) => ({ ...old, mounted: !state.mounted }));

    const onConfigUpdate = (config: pspViewer.ViewerConfigUpdate) => {
        console.log("Config Update Event", config);
        setState({ ...state, config });
    };

    const onClick = (detail: pspViewer.PerspectiveClickEventDetail) => {
        console.log("Click Event,", detail);
    };

    const onSelect = (detail: pspViewer.PerspectiveSelectEventDetail) => {
        console.log("Select Event", detail);
    };

    return (
        <div className="container">
            <div className="toolbar">
                <button onClick={onClickToggleMount}>Toggle Mount</button>
                <button onClick={onClickOverwrite}>Overwrite Superstore</button>
                <button onClick={onClickDelete}>Delete Table</button>
            </div>
            {state.mounted && (
                <>
                    <PerspectiveViewer table={state.table} />
                    <PerspectiveViewer
                        className="my-perspective-viewer"
                        table={state.table}
                        config={state.config}
                        onClick={onClick}
                        onSelect={onSelect}
                        onConfigUpdate={onConfigUpdate}
                    />
                </>
            )}
        </div>
    );
};

createRoot(document.getElementById("root")!).render(<App />);
