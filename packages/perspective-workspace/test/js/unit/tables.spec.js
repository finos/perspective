/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {PerspectiveWorkspace} from "../../../src/js/workspace/workspace";
import perspective from "@finos/perspective";

describe("tables", () => {
    test("setting a table calls load on a subscribed viewer", async () => {
        const table = await perspective.table([{a: 1}]);
        const viewers = {One: {table: "test", name: "One"}};
        const config = {
            viewers,
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"]
                }
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);

        const widget = workspace.getAllWidgets()[0];
        expect(widget.viewer.load).not.toBeCalled();

        workspace.tables.set("test", table);

        expect(widget.viewer.load).toBeCalled();
    });

    test("delete a table without subscribers works", async () => {
        const table = await perspective.table([{a: 1}]);
        const workspace = new PerspectiveWorkspace(document.body);

        workspace.tables.set("test", table);
        expect(workspace.tables.has("test")).toBeTruthy();

        expect(workspace.tables.delete("test")).toBeTruthy();
        expect(workspace.tables.has("test")).toBeFalsy();
    });

    test("delete a table with subscribers fails", async () => {
        const table = await perspective.table([{a: 1}]);
        const viewers = {One: {table: "test", name: "One"}};
        const config = {
            viewers,
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["One"]
                }
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);
        workspace.tables.set("test", table);
        expect(workspace.tables.has("test")).toBeTruthy();

        expect(workspace.tables.delete("test")).toBeFalsy();
        expect(workspace.tables.has("test")).toBeTruthy();
    });
});
