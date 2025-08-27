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

import perspective from "@finos/perspective";
import perspective_viewer from "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-workspace";

// @ts-ignore
import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm?url";

// @ts-ignore
import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm?url";

await Promise.all([
    perspective.init_server(fetch(SERVER_WASM)),
    perspective_viewer.init_client(fetch(CLIENT_WASM)),
]);

import * as psp from "@finos/perspective";
import type * as pspViewer from "@finos/perspective-viewer";

// @ts-ignore
import SUPERSTORE_ARROW from "superstore-arrow/superstore.lz4.arrow?url";

import * as React from "react";
import { PerspectiveViewer } from "@finos/perspective-react";

import "@finos/perspective-viewer/dist/css/themes.css";
import "./index.css";

const WORKER = await perspective.worker();

async function createNewSuperstoreTable(): Promise<psp.Table> {
    const req = fetch(SUPERSTORE_ARROW);
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    return await WORKER.table(buffer);
}

const CONFIG: pspViewer.ViewerConfigUpdate = {
    group_by: ["State"],
};

interface ToolbarState {
    mounted: boolean;
    table?: Promise<psp.Table>;
    config: pspViewer.ViewerConfigUpdate;
}

export const App: React.FC = () => {
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
            {state.mounted && (
                <>
                    <PerspectiveViewer table={state.table} />
                    <PerspectiveViewer
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
