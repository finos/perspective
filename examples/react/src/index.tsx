/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import {useEffect, useRef} from "react";
import perspective, {Table} from "@finos/perspective";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer-d3fc";
import "./index.css";
import "@finos/perspective-viewer/dist/umd/material.css";
import {HTMLPerspectiveViewerElement, PerspectiveViewerOptions} from "@finos/perspective-viewer";

const worker = perspective.shared_worker();

const getTable = async (): Promise<Table> => {
    const req = fetch("./superstore.arrow");
    const resp = await req;
    const buffer = await resp.arrayBuffer();
    return await worker.table(buffer as any);
};

const config: PerspectiveViewerOptions = {
    "row-pivots": ["State"]
};

const App = (): React.ReactElement => {
    const viewer = useRef<HTMLPerspectiveViewerElement>(null);

    useEffect(() => {
        getTable().then(table => {
            if (viewer.current) {
                viewer.current.load(table);
                viewer.current.restore(config);
            }
        });
    }, []);

    // You can also the use the stringified config values as attributes
    return <perspective-viewer ref={viewer} /*row-pivots='["State"]'*/></perspective-viewer>;
};
window.addEventListener("load", () => {
    ReactDOM.render(<App />, document.getElementById("root"));
});
