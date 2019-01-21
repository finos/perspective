/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {draw, PRIVATE} from "./draw.js";

function resize() {
    if (this[PRIVATE]) {
        this[PRIVATE].chart.resize();
    }
}

function delete_chart() {
    if (this[PRIVATE]) {
        this[PRIVATE].chart.delete();
    }
}

const MAXIMUM_RENDER_SIZE = {
    line: 25000,
    area: 25000,
    scatter: 100000,
    bubble: 25000,
    column: 25000,
    treemap: 2500,
    sunburst: 1000,
    heatmap: 20000
};

global.registerPlugin("d3_x_bar", {
    name: "[d3fc] X Bar Chart",
    create: draw("x_bar"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["column"]
});

global.registerPlugin("d3_y_bar", {
    name: "[d3fc] Y Bar Chart",
    create: draw("y_bar"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["column"]
});
