/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/******************************************************************************
 *
 * Y
 */

import {COLORS_10, COLORS_20} from "./externals.js";

function row_to_series(series, sname, gname) {
    let s;
    for (var sidx = 0; sidx < series.length; sidx++) {
        let is_group = typeof gname === "undefined" || series[sidx].stack === gname;
        if (series[sidx].name == sname && is_group) {
            s = series[sidx];
            break;
        }
    }
    if (sidx == series.length) {
        s = {
            name: sname,
            connectNulls: true,
            data: []
        };
        if (gname) {
            s.stack = gname;
        }
        series.push(s);
    }
    return s;
}

class TreeAxisIterator {

    constructor(depth, json) {
        this.depth = depth;
        this.json = json;
        this.top = {name: "", depth: 0, categories: []};
    }

    add_label(path) {
        let label = {
            name: path[path.length - 1],
            depth: path.length,
            categories: []
        }

        // Find the correct parent
        var parent = this.top;
        for (var lidx = 0; lidx < path.length - 1; lidx++) {
            for (var cidx = 0; cidx < parent.categories.length; cidx++) {
                if (parent.categories[cidx].name === path[lidx]) {
                    parent = parent.categories[cidx];
                    break;
                }
            }
        }
        parent.categories.push(label);
        return label;
    }

    *[Symbol.iterator]() {
        let label = this.top;
        for (let row of this.json) {
            let path = row.__ROW_PATH__ || [''];
            if (path.length > 0 && path.length < this.depth) {
                label = this.add_label(path);
            } else if (path.length >= this.depth) {
                label.categories.push(path[path.length - 1]);     
                yield row;
            }
        }
    }
}

class ColumnsIterator {

    constructor(rows, hidden) {
        this.rows = rows
        this.hidden = hidden
    }

    *[Symbol.iterator]() {
        let series = [];
        for (let row of this.rows) {
            if (this.columns === undefined) {
                this.columns = Object.keys(row).filter(prop => {
                    let cname = prop.split(',');
                    cname = cname[cname.length - 1];
                    return prop !== "__ROW_PATH__" && this.hidden.indexOf(cname) === -1;
                });
                this.is_stacked = this.columns.map(value =>
                    value.substr(value.lastIndexOf(',') + 1, value.length)
                ).filter((value, index, self) =>
                    self.indexOf(value) === index
                ).length > 1;
            }
            yield row;
        }
    }
}

export function make_y_data(js, pivots, hidden) {
    let rows = new TreeAxisIterator(pivots.length, js);
    let rows2 = new ColumnsIterator(rows, hidden);
    var series = [];

    for (let row of rows2) {
        for (let prop of rows2.columns) {
            let sname = prop.split(',');
            let gname = sname[sname.length - 1];
            if (rows2.is_stacked) {
                sname = sname.join(", ") || gname;
            } else {
                sname = sname.slice(0, sname.length - 1).join(", ") || " ";
            }
            let s = row_to_series(series, sname, gname);
            let val = row[prop];
            val = (val === undefined || val === "" ? null : val)
            s.data.push(val);
        }
    }
    return [series, rows.top];
}

/******************************************************************************
 *
 * XY
 */

function make_tick(row, columns, is_string, colorRange) {
    var tick = {};
    tick.x = row[columns[0]];
    tick.x = (tick.x === undefined || tick.x === "" || isNaN(tick.x)  ? null : tick.x);
    tick.y = 0;
    if (columns.length > 1) {
        tick.y = row[columns[1]];
        tick.y = (tick.y === undefined || tick.y === "" || isNaN(tick.y) ? null : tick.y);
    }

    // Color by
    if (columns.length > 2) {
        let color = row[columns[2]];
        if (typeof color === "string") {
            if (!(color in is_string)) {
                is_string[color] = COLORS_20[Object.keys(is_string).length];
            }
            tick.marker = {
                lineColor: is_string[color],
                fillColor: is_string[color]
            };
        } else {
            if (!isNaN(color)) {
                colorRange[0] = Math.min(colorRange[0], color);
                colorRange[1] = Math.max(colorRange[1], color);
            }
            tick.colorValue = color;
        }
    }
    // size by
    if (columns.length > 3) {
        tick.z = isNaN(row[columns[3]]) ? 1 : row[columns[3]];
    }
    if ('__ROW_PATH__' in row) {
        tick.name = row['__ROW_PATH__'].join(", ");
    }
    return tick;
}

export function make_xy_data(js, pivots, col_pivots, hidden) {
    let rows = new TreeAxisIterator(pivots.length, js);
    let rows2 = new ColumnsIterator(rows, hidden);
    let series = [];
    let colorRange = [Infinity, -Infinity];
    let is_string = {};

    for (let row of rows2) {
        if (col_pivots.length === 0) {
            let sname = ' ';
            let s = row_to_series(series, sname);            
            s.data.push(make_tick(row, rows2.columns, is_string, colorRange));
        } else {
            let prev, group = [], s;
            for (let prop of rows2.columns) {
                let sname = prop.split(',');
                let gname = sname[sname.length - 1];
                sname = sname.slice(0, sname.length - 1).join(",") || " ";
                if (prev === undefined) prev = sname;
                s = row_to_series(series, prev);
                if (prev === sname) {
                    group.push(prop);
                } else {
                    prev = sname;
                    s.data.push(make_tick(row, group, is_string, colorRange));
                    group = [prop];
                }
            }
            s.data.push(make_tick(row, group, is_string, colorRange));
        }
    }   
    return [series, rows.top, colorRange];   
}

/******************************************************************************
 *
 * XYZ
 */

function make_tree_axis(series) {
    let ylabels = series.map(s => s.name.split(','));
    let ytop = {name: null, depth: 0, categories: []};
    let maxdepth = ylabels[0].length;

    for (let i = 0; i < ylabels.length; ++i) {
        let ylabel = ylabels[i];
        let parent = ytop;

        for (let depth = 0; depth < ylabel.length; ++depth) {
            let label = ylabel[depth]
            if (depth === maxdepth - 1) {
                parent.categories.push(label);
            } else {
                let l = parent.categories.length;
                if (l > 0 && parent.categories[l - 1].name == label) {
                    parent = parent.categories[l - 1];
                } else {
                    let cat = {name: label, depth: depth + 1, categories: []};
                    parent.categories.push(cat);
                    parent = cat;
                }
            }
        }
    }
    return ytop;
}

export function make_xyz_data(js, pivots, hidden) {
    let [series, top] = make_y_data(js, pivots, hidden);
    let colorRange = [Infinity, -Infinity];
    let ytop = make_tree_axis(series);
    let data = [];
    for (let i = 0; i < series[0].data.length; ++i) {
        for (let j = 0; j < series.length; ++j) {
            let val = series[j].data[i];
            data.push([i, j, val]);
            colorRange[0] = Math.min(colorRange[0], val);
            colorRange[1] = Math.max(colorRange[1], val);
        }
    }
    if (colorRange[0] * colorRange[1] < 0) {
        let cmax = Math.max(Math.abs(colorRange[0]), Math.abs(colorRange[1]));
        colorRange = [-cmax, cmax];
    }
    series = data;
    return [series, top, ytop, colorRange];
}

/******************************************************************************
 *
 * Tree
 */

function recolor(aggregates, series) {
    let color, colorAxis, colorRange;
    if (aggregates.length >= 2) {
        color = aggregates[1]['column'];
        let colorvals = series[1]['data'];
        colorRange = [Infinity, -Infinity];
        for (let i = 0; i < colorvals.length; ++i) {
            colorRange[0] = Math.min(colorRange[0], colorvals[i]);
            colorRange[1] = Math.max(colorRange[1], colorvals[i]);
        }
        if (colorRange[0] * colorRange[1] < 0) {
            let cmax = Math.max(Math.abs(colorRange[0]), Math.abs(colorRange[1]));
            colorRange = [-cmax, cmax];
        }
    }
    return [color, colorRange];
}

function repivot(aggregates, js, row_pivots, color) {
    let data = [];
    let size = aggregates[0]['column'];

    for (let row of js.slice(1)) {
        let rp = row['__ROW_PATH__'];
        let id = rp.join("_");
        let name = rp.slice(-1)[0];
        let parent = rp.slice(0, -1).join("_");
        let value  = row[size];
        let colorValue = row[color];

        data.push({
            id: id, name: name, value: value, colorValue: colorValue, parent: parent}
        );
    }
    let levels = [];
    for (let i = 0; i < row_pivots.length; i++) {
        levels.push({
            level: i + 1,
            borderWidth: (row_pivots.length - i) * 2,
            dataLabels: {
                enabled: true,
                allowOverlap: true,
                style: {
                    opacity: [1, 0.3][i] || 0,
                    fontSize: `${[14, 10][i] || 0}px`,
                    textOutline: null
                }
            },
        });
    }
    return [{
        layoutAlgorithm: 'squarified',
        allowDrillToNode: true,
        alternateStartingDirection: true,
        data: data,
        levels: levels
    }];    
}

export function make_tree_data(js, row_pivots, hidden, aggregates) {
    let [series, top] = make_y_data(js, row_pivots, hidden);
    let [color, colorRange] = recolor(aggregates, series);
    return [repivot(aggregates, js, row_pivots, color), top, colorRange];
}

