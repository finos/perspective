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

class TickClean {

    constructor(type) {
        this.dict = {};
        this.names = [];
        this.type = type;
    }

    clean(val) {
        if (this.type === "string") {
            if (!(val in this.dict)) {
                this.dict[val] = Object.keys(this.dict).length;
                if (val === null) {
                    this.names.push('-');
                } else {
                    this.names.push(val);
                }
            }
            return this.dict[val];
        } else if (val === undefined || val === "" || isNaN(val)) {
            return null;
        }
        return val;
    }
}

class MakeTick {
    
    constructor(schema, columns) {
        this.schema = schema;
        this.xaxis_clean = new TickClean(schema[columns[0]]);
        this.yaxis_clean = new TickClean(schema[columns[1]]);
        this.color_clean = new TickClean(schema[columns[2]]);;
    }

    make(row, columns, colorRange) {
        let tick = {};
        tick.x = row[columns[0]];
        if (tick.x === null && row[columns[1]] === null) {
            return;
        }
        tick.x = this.xaxis_clean.clean(tick.x);
        tick.y = 0;
        if (columns.length > 1) {
            tick.y = row[columns[1]];
            tick.y = this.yaxis_clean.clean(tick.y);
        }

        // Color by
        if (columns.length > 2) {
            let color = row[columns[2]];
            if (this.schema[columns[2]] === "string") {
                let color_index = this.color_clean.clean(color);
                tick.marker = {
                    lineColor: color_index,
                    fillColor: color_index
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
}

export function make_xy_data(js, schema, columns, pivots, col_pivots, hidden) {
    let rows = new TreeAxisIterator(pivots.length, js);
    let rows2 = new ColumnsIterator(rows, hidden);
    let series = [];
    let colorRange = [Infinity, -Infinity];
    let make_tick = new MakeTick(schema, columns);
    if (col_pivots.length === 0) {
        let sname = ' ';
        let s = row_to_series(series, sname);            
        for (let row of rows2) {
            let tick = make_tick.make(row, columns, colorRange);
            if (tick) {
                s.data.push(tick);
            }
        }
    } else {
        let prev, group = [], s;
        let cols = Object.keys(js[0]).filter(prop => {
            let cname = prop.split(',');
            cname = cname[cname.length - 1];
            return prop !== "__ROW_PATH__" && hidden.indexOf(cname) === -1;
        });
        for (let prop of cols) {
            let column_levels = prop.split(',');
            let group_name = column_levels.slice(0, column_levels.length - 1).join(",") || " ";
            if (prev === undefined) {
                prev = group_name;
            }
            s = row_to_series(series, prev);
            if (prev === group_name) {
                group.push(prop);
            } else {
                for (let row of rows2) {
                    let tick = make_tick.make(row, group, colorRange);
                    if (tick) {
                        s.data.push(tick);
                    }
                        }
                prev = group_name;
                group = [prop];
            }
        }
        for (let row of rows2) {
            let tick = make_tick.make(row, group, colorRange);
            if (tick) {
                s.data.push(tick);
            }
        }
    }   
    return [series, {categories: make_tick.xaxis_clean.names}, colorRange, {categories: make_tick.yaxis_clean.names}];   
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

function make_color(aggregates, all, leaf_only) {
    let colorRange;
    if (aggregates.length >= 2) {
        colorRange = [Infinity, -Infinity];
        for (let series of all) {
            let colorvals = series['data'];
            for (let i = 1; i < colorvals.length; ++i) {
                if ((leaf_only && colorvals[i].leaf) || !leaf_only) {
                    colorRange[0] = Math.min(colorRange[0], colorvals[i].colorValue);
                    colorRange[1] = Math.max(colorRange[1], colorvals[i].colorValue);
                }
            }
            if (colorRange[0] * colorRange[1] < 0) {
                let cmax = Math.max(Math.abs(colorRange[0]), Math.abs(colorRange[1]));
                colorRange = [-cmax, cmax];
            }
        }
    }
    return colorRange;
}

class TreeIterator extends TreeAxisIterator {

    *[Symbol.iterator]() {
        let label = this.top;
        for (let row of this.json) {
            let path = row.__ROW_PATH__ || [''];
            if (path.length > 0 && path.length < this.depth) {
                label = this.add_label(path);
            } else if (path.length >= this.depth) {
                label.categories.push(path[path.length - 1]);     
            }
            yield row;
        }
    }
}

function make_levels(row_pivots) {
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
    return levels;
}

function make_configs(series, levels) {
    let configs = [];
    for (let data of series) {
        let title = data.name.split(',');
        configs.push({
            layoutAlgorithm: 'squarified',
            allowDrillToNode: true,
            alternateStartingDirection: true,
            data: data.data.slice(1),
            levels: levels,
            title: title,
            stack: data.stack,
        });  
    }
    return configs;
}

export function make_tree_data(js, row_pivots, hidden, aggregates, leaf_only) {
    let rows = new TreeIterator(row_pivots.length, js);
    let rows2 = new ColumnsIterator(rows, hidden);
    let series = [];

    for (let row of rows2) {
        let rp = row['__ROW_PATH__'];
        let id = rp.join(", ");
        let name = rp.slice(-1)[0];
        let parent = rp.slice(0, -1).join(", ");
        
        for (let idx = 0; idx < rows2.columns.length; idx++) {
            let prop = rows2.columns[idx];
            let sname = prop.split(',');
            let gname = sname[sname.length - 1];
            sname = sname.slice(0, sname.length - 1).join(", ") || " ";
            if (idx % aggregates.length === 0) {
                let s = row_to_series(series, sname, gname);    
                s.data.push({
                    id: id, 
                    name: name, 
                    value: row[prop], 
                    colorValue: aggregates.length > 1 ? row[rows2.columns[idx + 1]] : undefined, 
                    parent: parent, 
                    leaf: row.__ROW_PATH__.length === row_pivots.length
                });
            }
        }
    }

    let levels = make_levels(row_pivots);
    let configs = make_configs(series, levels);
    let colorRange = make_color(aggregates, series, leaf_only, row_pivots);
    return [configs, rows.top, colorRange];
}

