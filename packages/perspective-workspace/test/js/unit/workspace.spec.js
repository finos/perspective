/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {PerspectiveWorkspace} from "../../../src/js/workspace/workspace";
import {toArray} from "@lumino/algorithm";

describe("workspace", () => {
    test("restores detail to dockpanel", () => {
        const viewers = {One: {table: "superstore", name: "One"}};
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

        const widgets = toArray(workspace.dockpanel.widgets());

        const expected = {table: "superstore", name: "One", master: false, linked: false};
        expect(widgets.length).toBe(1);
        expect(widgets[0].save()).toStrictEqual(expected);
    });

    test("restores master to masterpanel", () => {
        const viewers = {One: {table: "superstore", name: "One"}};
        const config = {
            viewers,
            master: {
                widgets: ["One"]
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);

        const widgets = workspace.masterPanel.widgets;

        const expected = {table: "superstore", name: "One", master: true, linked: false};
        expect(widgets.length).toBe(1);
        expect(widgets[0].save()).toStrictEqual(expected);
    });

    test("restores master to masterpanel and detail to dockpanel", () => {
        const viewers = {One: {table: "superstore", name: "One"}, Two: {table: "superstore", name: "Two"}};
        const config = {
            viewers,
            master: {
                widgets: ["One"]
            },
            detail: {
                main: {
                    currentIndex: 0,
                    type: "tab-area",
                    widgets: ["Two"]
                }
            }
        };

        const workspace = new PerspectiveWorkspace(document.body);
        workspace.restore(config);

        const masterWidgets = workspace.masterPanel.widgets;
        const detailWidgets = toArray(workspace.dockpanel.widgets());

        const master = {table: "superstore", name: "One", master: true, linked: false};
        const detail = {table: "superstore", name: "Two", master: false, linked: false};

        expect(masterWidgets.length).toBe(1);
        expect(masterWidgets[0].save()).toStrictEqual(master);

        expect(detailWidgets.length).toBe(1);
        expect(detailWidgets[0].save()).toStrictEqual(detail);
    });

    test("validate config sets currentIndex if missing", () => {
        const workspace = new PerspectiveWorkspace(document.body);
        const config = {
            detail: {
                main: {
                    type: "tab-area",
                    widgets: ["Two"]
                }
            }
        };
        const validatedConfig = workspace._validate_config(config);
        expect(validatedConfig.detail.main.currentIndex).toBe(0);
    });

    test("validate config sets sizes if missing", () => {
        const workspace = new PerspectiveWorkspace(document.body);
        const config = {
            detail: {
                main: {
                    type: "split-area",
                    orientation: "horizontal",
                    children: [
                        {
                            type: "tab-area",
                            widgets: ["One"]
                        },
                        {
                            type: "tab-area",
                            widgets: ["Two"]
                        }
                    ]
                }
            }
        };
        const validatedConfig = workspace._validate_config(config);
        expect(validatedConfig.detail.main.sizes).toStrictEqual([0.5, 0.5]);
    });
});
