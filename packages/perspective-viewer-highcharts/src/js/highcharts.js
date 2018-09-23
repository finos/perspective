/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {draw} from "./draw.js";

function resize() {
    if (this._charts && this._charts.length > 0 && !this._resize_timer) {
        this._charts.map(x => x.reflow());
    }
    if (this._resize_timer) {
        clearTimeout(this._resize_timer);
        this._debounce_resize = true;
    }
    this._resize_timer = setTimeout(() => {
        if (this._charts && this._charts.length > 0 && !document.hidden && this.offsetParent && document.contains(this) && this._debounce_resize) {
            this._charts.map(x => x.reflow());
        }
        this._resize_timer = undefined;
        this._debounce_resize = false;
    }, 50);
}

function delete_chart() {
    if (this._charts && this._charts.length > 0) {
        this._charts.map(x => x.destroy());
        this._charts = [];
    }
}

global.registerPlugin("x_bar", {
    name: "X Bar Chart",
    create: draw("horizontal_bar"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("y_bar", {
    name: "Y Bar Chart",
    create: draw("vertical_bar"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("y_line", {
    name: "Y Line Chart",
    create: draw("y_line"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("y_scatter", {
    name: "Y Scatter Chart",
    create: draw("y_scatter"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("y_area", {
    name: "Y Area Chart",
    create: draw("y_area"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart
});

global.registerPlugin("xy_line", {
    name: "X/Y Line Chart",
    create: draw("line"),
    resize: resize,
    initial: {
        type: "number",
        count: 2
    },
    selectMode: "toggle",
    delete: delete_chart
});

global.registerPlugin("xy_scatter", {
    name: "X/Y Scatter Chart",
    create: draw("scatter"),
    resize: resize,
    initial: {
        type: "number",
        count: 2
    },
    selectMode: "toggle",
    delete: delete_chart
});

global.registerPlugin("treemap", {
    name: "Treemap",
    create: draw("treemap"),
    resize: resize,
    initial: {
        type: "number",
        count: 2
    },
    selectMode: "toggle",
    delete: function() {}
});

global.registerPlugin("sunburst", {
    name: "Sunburst",
    create: draw("sunburst"),
    resize: resize,
    initial: {
        type: "number",
        count: 2
    },
    selectMode: "toggle",
    delete: function() {}
});

global.registerPlugin("heatmap", {
    name: "Heatmap",
    create: draw("heatmap"),
    resize: resize,
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select",
    delete: delete_chart
});
