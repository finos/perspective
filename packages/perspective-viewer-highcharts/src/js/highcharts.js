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

global.registerPlugin("x_bar", {
    name: "X Bar Chart",
    create: draw("x_bar", true),
    update: draw("x_bar", false),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["column"]
});

global.registerPlugin("y_bar", {
    name: "Y Bar Chart",
    create: draw("y_bar", true),
    update: draw("y_bar", false),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["column"]
});

global.registerPlugin("y_line", {
    name: "Y Line Chart",
    create: draw("y_line", true),
    update: draw("y_line", false),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["line"]
});

global.registerPlugin("y_scatter", {
    name: "Y Scatter Chart",
    create: draw("y_scatter", true),
    update: draw("y_scatter", false),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["scatter"]
});

global.registerPlugin("y_area", {
    name: "Y Area Chart",
    create: draw("y_area", true),
    update: draw("y_area", false),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["area"]
});

global.registerPlugin("xy_line", {
    name: "X/Y Line Chart",
    create: draw("line", true),
    update: draw("line", false),
    resize: resize,
    initial: {
        type: "number",
        count: 2,
        names: ["X Axis", "Y Axis"]
    },
    selectMode: "toggle",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["scatter"]
});

global.registerPlugin("xy_scatter", {
    name: "X/Y Scatter Chart",
    create: draw("scatter", true),
    update: draw("scatter", false),
    resize: resize,
    initial: {
        type: "number",
        count: 2,
        names: ["X Axis", "Y Axis", "Color", "Size"]
    },
    selectMode: "toggle",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["scatter"]
});

global.registerPlugin("treemap", {
    name: "Treemap",
    create: draw("treemap", true),
    update: draw("treemap", false),
    resize: resize,
    initial: {
        type: "number",
        count: 2,
        names: ["Size", "Color"]
    },
    selectMode: "toggle",
    delete: function() {},
    max_size: MAXIMUM_RENDER_SIZE["treemap"]
});

global.registerPlugin("sunburst", {
    name: "Sunburst",
    create: draw("sunburst", true),
    update: draw("sunburst", false),
    resize: resize,
    initial: {
        type: "number",
        count: 2,
        names: ["Size", "Color"]
    },
    selectMode: "toggle",
    delete: function() {},
    max_size: MAXIMUM_RENDER_SIZE["sunburst"]
});

global.registerPlugin("heatmap", {
    name: "Heatmap",
    create: draw("heatmap", true),
    update: draw("heatmap", false),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart,
    max_size: MAXIMUM_RENDER_SIZE["heatmap"]
});
