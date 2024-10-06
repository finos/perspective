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

import React, { useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import * as perspective from "@finos/perspective";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import type { PerspectiveViewerConfig, HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";
import "./index.css";

const worker = perspective.worker();

const getTable = async (): Promise<perspective.Table> => {
    const response = await fetch("./superstore.lz4.arrow");
    const buffer = await response.arrayBuffer();
    return worker.table(buffer);
};

const config: PerspectiveViewerConfig = {
    group_by: ["State"],
};

const App: React.FC = () => {
    const viewer = useRef<HTMLPerspectiveViewerElement>(null);

    useEffect(() => {
        const loadTable = async () => {
            if (viewer.current) {
                const table = await getTable();
                await viewer.current.load(table);
                await viewer.current.restore(config);
            }
        };

        loadTable();
    }, []);

    return <perspective-viewer ref={viewer} />;
};

window.addEventListener("load", () => {
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
});
