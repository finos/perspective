/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {PerspectiveWorkspace} from "../../../src/js/workspace/workspace";
import {toArray} from "@phosphor/algorithm";

describe("workspace", () => {
    test("restores detail to dockpanel", () => {
        const widget = {table: "superstore", name: "One"};
        const config = {
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: [widget]
                }
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);

        const widgets = toArray(workspace.dockpanel.widgets());

        const expected = {table: "superstore", name: "One", master: false};
        expect(widgets.length).toBe(1);
        expect(widgets[0].save()).toStrictEqual(expected);
    });

    test("restores master to masterpanel", () => {
        const widget = {table: "superstore", name: "One"};
        const config = {
            master: {
                widgets: [widget]
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);

        const widgets = workspace.masterPanel.widgets;

        const expected = {table: "superstore", name: "One", master: true};
        expect(widgets.length).toBe(1);
        expect(widgets[0].save()).toStrictEqual(expected);
    });

    test("restores master to masterpanel and detail to dockpanel", () => {
        const config = {
            master: {
                widgets: [{table: "superstore", name: "One"}]
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: [{table: "superstore", name: "Two"}]
                }
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);

        const masterWidgets = workspace.masterPanel.widgets;
        const detailWidgets = toArray(workspace.dockpanel.widgets());

        const master = {table: "superstore", name: "One", master: true};
        const detail = {table: "superstore", name: "Two", master: false};

        expect(masterWidgets.length).toBe(1);
        expect(masterWidgets[0].save()).toStrictEqual(master);

        expect(detailWidgets.length).toBe(1);
        expect(detailWidgets[0].save()).toStrictEqual(detail);
    });
});
