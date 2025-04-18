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

import * as psp from "@finos/perspective-react";
import {
    PerspectiveProvider,
    PerspectiveViewer,
} from "@finos/perspective-react";
import perspective, { Table } from "@finos/perspective";
import perspective_viewer from "@finos/perspective-viewer";

// Import perspective viewer plugins to register them on the web component.
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";

// Refer to bootstrapping link above
import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm";
import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm";

await Promise.all([
    perspective.init_server(fetch(SERVER_WASM)),
    perspective_viewer.init_client(fetch(CLIENT_WASM)),
]);

// Now WASM has booted and we can construct a web worker to host our tables.
const worker = await perspective.worker();

const Root: React.FC = () => {
    return (
        <PerspectiveProvider>
            <App />
        </PerspectiveProvider>
    );
};

const App: React.FC = () => {
    const actions = psp.useActions();
    const [selectedTable, setSelectedTable] =
        React.useState<string>("my_table");
    // DON'T MOVE THIS WITHOUT UPDATING {docs/md/how_to/javascript/react.md}
    // This is just for testing and shouldn't be visible in our docs.

    React.useEffect(() => {
        (window as any).__PSP_REACT_TEST_HARNESS__ = {
            worker,
            actions,
            setSelectedTable,
        };
    }, []);

    // DON'T MOVE THIS WITHOUT UPDATING {docs/md/how_to/javascript/react.md}

    React.useEffect(() => {
        actions.addTable({
            table: "my_table",
            promise: worker.table({ x: [1, 2, 3] }),
        });
        return () => {
            actions.removeTable({ table: "my_table" });
        };
    }, []);

    return <PerspectiveViewer selectedTable={selectedTable} />;
};

createRoot(document.getElementById("root")!).render(<Root />);
