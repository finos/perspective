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
import * as perspective from "@finos/perspective";

import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import { ViewerConfigUpdate } from "@finos/perspective-viewer";
import {
    PerspectiveViewer,
    usePspActions,
    PerspectiveProvider,
    usePsp,
} from "@finos/perspective-react";

import "./index.css";

const worker = await perspective.worker();

async function getTable(): Promise<perspective.Table> {
    const req = fetch("./superstore.lz4.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    return await worker.table(buffer as any);
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

// TODO: Add viewers in a loop keyed by a unique id that virtually scrolls.

const App: React.FC = () => {
    const actions = usePspActions();
    const [state, setState] = React.useState<ToolbarState>({
        mounted: true,
        selectedTable: "superstore",
    });

    React.useEffect(() => {
        actions.addTable({ table: "superstore", promise: getTable() });
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

const Toolbar: React.FC<{
    state: ToolbarState;
    setState: React.Dispatch<React.SetStateAction<ToolbarState>>;
}> = ({ state, setState }) => {
    const actions = usePspActions();
    const psp = usePsp();

    const selectOptions = Object.keys(psp.tables).map((table) => (
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
                                promise: getTable(),
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
                        promise: getTable(),
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
