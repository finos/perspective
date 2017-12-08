/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import papaparse from "papaparse";
import moment from "moment";

// IE fix - chrono::steady_clock depends on performance.now() which does not exist in IE workers
if (global.performance === undefined) {
    global.performance || {now: Date.now};
}

if (typeof self !== "undefined" && self.performance === undefined) {
    self.performance = {now: Date.now};
}

let __MODULE__;


/******************************************************************************
 *
 * Private
 *
 */

/**
 * Infer the t_dtype of a value.
 *
 * Params
 * ------
 *
 * Returns
 * -------
 * A t_dtype.
 */
function infer_type(x) {
    let t = __MODULE__.t_dtype.DTYPE_FLOAT64;
    if (x === null) {
        t = null;
    } else if (typeof x === "number" && x % 1 === 0 && x < 10000 && x !== 0) {
        t = __MODULE__.t_dtype.DTYPE_INT32;
    } else if (typeof x === "number") {
        t = __MODULE__.t_dtype.DTYPE_FLOAT64;
    } else if (typeof x === "boolean") {
        t = __MODULE__.t_dtype.DTYPE_BOOL;
    } else if (x instanceof Date) {
        t = __MODULE__.t_dtype.DTYPE_TIME;
    } else if (!isNaN(Number(x)) && x !== '') {
        t = __MODULE__.t_dtype.DTYPE_FLOAT64;
    } else if (typeof x === "string" && moment(x, DATE_PARSE_CANDIDATES, true).isValid()) {
        t = __MODULE__.t_dtype.DTYPE_TIME;
    } else if (typeof x === "string") {
        let lower = x.toLowerCase();
        if (lower === 'true' || lower === 'false') {
            t = __MODULE__.t_dtype.DTYPE_BOOL;
        } else {
            t = __MODULE__.t_dtype.DTYPE_STR;
        }
    }
    return t;
}

const DATE_PARSE_CANDIDATES = [
    moment.ISO_8601, 
    moment.RFC_2822, 
    'YYYY-MM-DD\\DHH:mm:ss.SSSS', 
    'MM-DD-YYYY', 
    'MM/DD/YYYY', 
    'M/D/YYYY', 
    'DD MMM YYYY'
];

/**
 * Do any necessary data transforms on columns. Currently it does the following
 *  transforms
 *  1. Date objects are converted into float millis since epoch
 *
 *  Params
 *  -------
 *  type: type of column
 *  data: array of columnar data
 *
 *  Returns
 *  -------
 *  transformed array of columnar data
 */
 function transform_data(type, data) {
      if(type != __MODULE__.t_dtype.DTYPE_TIME) {
         return data;
      }
      let rv = [];
      for (let x = 0; x < data.length; x ++) {
         let tmp = +data[x];
         rv.push(tmp);
      }
      return rv;
 }

/**
 * Converts any supported input type into a canonical representation for
 * interfacing with perspective.
 *
 * Params
 * ------
 * data : <supported data types>
 *     See docs
 *
 * Returns
 * -------
 * An object with 3 properties:
 *    names - the column names.
 *    types - the column t_dtypes.
 *    cdata - an array of columnar data.
 */
function parse_data(data, names, types) {
    let preloaded = types ? true : false;
    names = names || [];
    if (types === undefined) {
        types = []
    } else {
        let _types = [];
        for (let t = 0; t < types.size(); t++) {
            _types.push(types.get(t));
        }
        types = _types;
    }
    let cdata = [];

    if (Array.isArray(data)) {

        // Row oriented
        if (data.length === 0) {
            throw "Not yet implemented: instantiate empty grid without column type";
        }
        let inferredType, i;
        let col;
        let MAX_CHECK = 50;
        for (let ix = 0; ix < MAX_CHECK && ix < data.length; ix ++) {
            if (names.length > 0) {
                let next = Object.keys(data[ix]);
                if (names.length !== next.length) {
                    if (MAX_CHECK === 50) console.warn("Array data has inconsistent rows");
                    if (next.length > names.length) {
                        console.warn("Extending from " + names.length + " to " + next.length);
                        names = next;
                        MAX_CHECK *= 2;
                    }
                }
            } else {
                names = Object.keys(data[ix]);
            }
        }
        for (let n in names) {
            let name = names[n];
            let i = 0, inferredType = undefined;
            if (!preloaded) {
                while(!inferredType && i < 100 && i < data.length) {
                    if (data[i].hasOwnProperty(name)) {
                        inferredType = infer_type(data[i][name]);
                    }
                    i++;
                }
                inferredType = inferredType || __MODULE__.t_dtype.DTYPE_STR;
                types.push(inferredType);
            } else {
                inferredType = types[parseInt(n)];
            }
            if (inferredType === undefined) {
                console.warn(`Could not infer type for column ${name}`)
                inferredType = __MODULE__.t_dtype.DTYPE_STR;
            }
            col = [];
            const date_types = [];
            const date_candidates = DATE_PARSE_CANDIDATES.slice();
            const date_exclusions = [];
            for (let x = 0; x < data.length; x ++) {
                if (!(name in data[x]) || data[x][name] === undefined) continue;
                if (inferredType.value === __MODULE__.t_dtype.DTYPE_FLOAT64.value || inferredType.value === __MODULE__.t_dtype.DTYPE_INT32.value) {
                    col.push(Number(data[x][name]));
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_BOOL.value) {
                    let cell = data[x][name];
                    if ((typeof cell) === "string") {
                        if (cell.toLowerCase() === 'true') {
                            col.push(true);
                        } else {
                            col.push(false);
                        }
                    } else {
                        col.push(cell);
                    }
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_TIME.value) {
                    if (date_exclusions.indexOf(data[x][name]) > -1) {
                        col.push(-1);
                    } else {
                        let val = data[x][name];
                        if (typeof val === "string") {                                 
                            val = moment(data[x][name], date_types, true);
                            if (!val.isValid() || date_types.length === 0) {
                                let found = false;
                                for (let candidate of date_candidates) {
                                    val = moment(data[x][name], candidate, true);
                                    if (val.isValid()) {
                                        date_types.push(candidate);
                                        date_candidates.splice(date_candidates.indexOf(candidate), 1);
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    date_exclusions.push(data[x][name]);
                                    col.push(-1);
                                    continue;
                                }
                            }
                        }
                        col.push(+val);
                    }
                } else {
                    col.push(data[x][name] === null ? (types[types.length - 1].value === 19 ? "" : 0) : "" + data[x][name]); // TODO this is not right - might not be a string.  Need a data cleaner
                }
            }
            cdata.push(col);
        }

    } else if (Array.isArray(data[Object.keys(data)[0]])) {

        // Column oriented
        for (let name in data) {
            names.push(name);
            types.push(infer_type(data[name][0]));
            let transformed = transform_data(types[types.length - 1], data[name]);
            cdata.push(transformed);
        }

    } else if (typeof data[Object.keys(data)[0]] === "string" || typeof data[Object.keys(data)[0]] === "function") {

        //if (this.initialized) {
          //  throw "Cannot update already initialized table with schema.";
       // }

        // Empty type dict
        for (let name in data) {
            names.push(name);
            if (data[name] === "integer") {
                types.push(__MODULE__.t_dtype.DTYPE_INT32);
            } else if (data[name] === "float") {
                types.push(__MODULE__.t_dtype.DTYPE_FLOAT64);
            } else if (data[name] === "string") {
                types.push(__MODULE__.t_dtype.DTYPE_STR);
            } else if (data[name] === "boolean") {
                types.push(__MODULE__.t_dtype.DTYPE_BOOL);
            } else if (data[name] === "date") {
                types.push(__MODULE__.t_dtype.DTYPE_TIME);
            }
            cdata.push([]);
        }

    } else {
        throw "Unknown data type";
    }

    return {
        names: names,
        types: types,
        cdata: cdata
    };
}

/******************************************************************************
 *
 * View
 *
 */

/**
 * A user-facing constructor wrapping a perspective context, representing a
 * view (configuration or pivot, filter, sort, etc) on the underlying data.
 *
 * Params
 * ------
 *
 */
 function view(pool, ctx, gnode, config, id, name, callbacks) {
    this.ctx = ctx;
    this.gnode = gnode;
    this.config = config || {};
    this.pool = pool;
    this.callbacks = callbacks;
    this.id = id;
    this.name = name
 }

 view.prototype.delete = async function() {
    this.pool.unregister_context(this.id, this.name);
    this.ctx.delete();
    let i = 0, j = 0;
    while (i < this.callbacks.length) {
        let val = this.callbacks[i];
        if (val.view !== this) this.callbacks[j++] = val;
        i++;
    }
    this.callbacks.length = j;
 }

/**
 * How many pivoted sides does this view have?
 *
 * Returns
 * -------
 * 0, 1 or 2, depending on the context.
 */
 view.prototype.sides = function() {
    let name;
    if (this.ctx.constructor.name) {
        name = this.ctx.constructor.name;
    } else {
        name = this.ctx.constructor.toString().match(/function ([^\(]+)/)[1];
    }
    switch (name) {
        case 't_ctx1':
            return 1;
        case 't_ctx2':
            return 2;
        default:
            return 0;
    }
}

view.prototype._column_names = function() {
    let col_names = [];
    let aggs = this.ctx.get_column_names();
    for (let key = 0; key < this.ctx.unity_get_column_count(); key++) {
    	let col_name;
        if (this.sides() === 0) {
            col_name = aggs.get(key);
        } else {
            let col_path = this.ctx.unity_get_column_path(key + 1);
            col_name = [];
            for (let cnix = 0; cnix < col_path.size(); cnix++) {
                col_name.push(__MODULE__.scalar_to_val(col_path, cnix));
            }
            col_name = col_name.reverse();
            col_name.push(aggs.get(key % aggs.size()).name());
            col_name = col_name.join(",");
            col_path.delete();
        }
        col_names.push(col_name);
    }
    aggs.delete();
    return col_names;
}

/**
 * Returns the schema of this view.
 *
 * Returns
 * -------
 * schema of the view.
 */
view.prototype.schema = async function() {
    // get type mapping
    let schema = this.gnode.get_tblschema();
    let _types = schema.types();
    let names = schema.columns();
    let types = {};
    for (let i = 0; i < names.size(); i ++) {
        types[names.get(i)] = _types.get(i).value
    }
    let new_schema = {};
    let col_names = this._column_names();
    for (let key = 0; key < this.ctx.unity_get_column_count(); key++) {
        let col_name = col_names[key].split(',');
        col_name = col_name[col_name.length - 1];
        if (types[col_name] === 2) {
            new_schema[col_name] = "integer";
        } else if (types[col_name] === 19) {
            new_schema[col_name] = "string";
        } else if (types[col_name] === 9) {
            new_schema[col_name] = "float";
        } else if (types[col_name] === 11) {
            new_schema[col_name] = "boolean";
        } else if (types[col_name] === 12) {
            new_schema[col_name] = "date";
        }
        if (this.sides() > 0) {
            for (let agg in this.config.aggregate) {
                agg = this.config.aggregate[agg];
                if (agg.column === col_name) {
                    if (["distinct count", "distinctcount", "distinct", "count"].indexOf(agg.op) > -1) {
                        new_schema[col_name] = "integer";
                    }

                }
            }
        }
    }
    return new_schema;
}

/**
 * Serializes this view to JSON data in a standard format.
 *
 * Params
 * ------
 *
 * Returns
 * -------
 * A Javascript object representation of this view.
 */
view.prototype.to_json = async function(options) {

    options = options || {};
    let viewport = this.config.viewport ? this.config.viewport : {};
    let start_row = options.start_row || (viewport.top ? viewport.top : 0);
    let end_row = options.end_row || (viewport.height ? start_row + viewport.height : this.ctx.get_row_count());
    let start_col = options.start_col || (viewport.left ? viewport.left : 0);
    let end_col = options.end_col || (viewport.width ? start_row + viewport.width : this.ctx.unity_get_column_count() + (this.sides() === 0 ? 0 : 1));
    let slice = this.ctx.get_data(start_row, end_row, start_col, end_col);
    let data;

    if (options.format && options.format === "table") {
        data = {};
    } else {
        data = [];
    }

    let col_names = [[]].concat(this._column_names());
    let row, prev_row;
    let depth = [];
    let ridx = -1;
    for (let idx = 0; idx < slice.size(); idx++) {
        let cidx = idx % (end_col - start_col);
        if (cidx === 0) {
            if (row) {
                data.push(row);
            }
            row = {};
            ridx ++;
        }
        if (this.sides() === 0) {
            let col_name = col_names[start_col + cidx + 1];
            row[col_name] = __MODULE__.scalar_to_val(slice, idx);
        } else {
            if (cidx === 0) {
                let col_name = "__ROW_PATH__";
                let new_depth = this.ctx.unity_get_row_depth(ridx);
                let row_name = __MODULE__.scalar_to_val(slice, idx);
                if (new_depth === 0) {
                    row[col_name] = [];
                } else if (new_depth > depth.length + 1) {
                    depth.push(prev_row);
                    row[col_name] = depth.concat([row_name]);
                } else if (new_depth <= depth.length) {
                    let poptimes = (depth.length - new_depth);
                    for (let i = 0; i <= poptimes; i++) {
                        depth.pop();
                    }
                    row[col_name] = depth.concat([row_name]);
                } else {
                    row[col_name] = depth.concat([row_name]);
                }
                prev_row = row_name;
            } else {
                let col_name = col_names[start_col + cidx];
                row[col_name] = __MODULE__.scalar_to_val(slice, idx);
            }
        }
    }
    slice.delete();
    if (row) data.push(row);
    return data;
}

/**
 * Serializes this view to JSON data in a standard format.
 *
 * Returns
 * -------
 * A Javascript object representation of this view.
 */
view.prototype.num_rows = async function() {
    return this.ctx.get_row_count();
}

/**
 * Serializes this view to JSON data in a standard format.
 *
 * Returns
 * -------
 * A Javascript object representation of this view.
 */
view.prototype.num_columns = async function() {
    return this.ctx.unity_get_column_count();
}

/**
 * Serializes this view to CSV.
 *
 * Returns
 * -------
 * A CSV representation of this view.
 */
view.prototype.to_csv = async function() {
    throw "Not yet implemented";
}

view.prototype.update_config = async function(config) {
    throw "Not yet implemented";
}

view.prototype.on_update = function(callback) {
    this.callbacks.push({
        view: this,
        callback: () => {
            if (this.ctx.get_step_delta) {
                let delta = this.ctx.get_step_delta(0, 2147483647);
                if (delta.cells.size() === 0) {
                    this.to_json().then(callback);
                } else {
                    let rows = {};
                    for (let x = 0; x < delta.cells.size(); x ++) {
                        rows[delta.cells.get(x).row] = true;
                    }
                    rows = Object.keys(rows);
                    let data = [];
                    Promise.all(rows.map(row => this.to_json({
                        start_row: Number.parseInt(row),
                        end_row: Number.parseInt(row) + 1
                    }))).then(results => callback([].concat.apply([], results)));
                }
            } else {
                callback();
            }
        }
    });
}

/******************************************************************************
 *
 * Table
 *
 */

/**
 * A data structure representing the accumulated data.
 *
 * Params
 * ------
 * id - the t_gnode id as returned by the t_pool
 * gnode -
 * pool -
 * index - The column name to treat as the index.
 *
 * Returns
 * -------
 * A `table` instance.
 */
function table(id, gnode, pool, index, tindex) {
    this.gnode = gnode;
    this.pool = pool;
    this.id = id;
    this.name = Math.random() + "";
    this.initialized = false;
    this.index = index;
    this.tindex = tindex;
    this.pool.set_update_delegate(this);
    this.callbacks = [];
}

table.prototype._update_callback = function() {
    for (let e in this.callbacks) {
        this.callbacks[e].callback();
    }
 }

table.prototype.delete = function() {
    this.pool.unregister_gnode(this.gnode);
    this.pool.delete();
    this.gnode.delete();
}

/**
 * Returns the # of rows in this table.
 *
 * Returns
 * -------
 * # of rows in teh table.
 */
table.prototype.size = function(handler) {
    let s = this.gnode.get_table().size();
    if (handler) {
        handler(s)
    } else {
        return s;
    }
}

/**
 * Returns the schema of this table.
 *
 * Returns
 * -------
 * schema of the table.
 */
table.prototype.schema = function(handler) {
    let schema = this.gnode.get_tblschema();
    let columns = schema.columns();
    let types = schema.types();
    let new_schema = {};
    for (let key = 0; key < columns.size(); key++) {
        if (types.get(key).value === 2) {
            new_schema[columns.get(key)] = "integer";
        } else if (types.get(key).value === 19) {
            new_schema[columns.get(key)] = "string";
        } else if (types.get(key).value === 9) {
            new_schema[columns.get(key)] = "float";
        } else if (types.get(key).value === 11) {
            new_schema[columns.get(key)] = "boolean";
        } else if (types.get(key).value === 12) {
            new_schema[columns.get(key)] = "date";
        }
    }
    if (handler) {
        handler(new_schema)
    } else {
        return new_schema;
    }
}

/**
 * Returns the # of rows in this table.
 *
 * Returns
 * -------
 * # of rows in the table.
 */
table.prototype.view = function(config) {
    config = config || {};

    let _string_to_filter_op = {
        "&": __MODULE__.t_filter_op.FILTER_OP_AND,
        "|": __MODULE__.t_filter_op.FILTER_OP_OR,
        "<": __MODULE__.t_filter_op.FILTER_OP_LT,
        ">": __MODULE__.t_filter_op.FILTER_OP_GT,
        "==": __MODULE__.t_filter_op.FILTER_OP_EQ,
        "contains": __MODULE__.t_filter_op.FILTER_OP_CONTAINS,
        "<=": __MODULE__.t_filter_op.FILTER_OP_LTEQ,
        ">=": __MODULE__.t_filter_op.FILTER_OP_GTEQ,
        "!=": __MODULE__.t_filter_op.FILTER_OP_NE,
        "begins with": __MODULE__.t_filter_op.FILTER_OP_BEGINS_WITH,
        "ends with": __MODULE__.t_filter_op.FILTER_OP_ENDS_WITH,
        "or": __MODULE__.t_filter_op.FILTER_OP_OR,
        "in": __MODULE__.t_filter_op.FILTER_OP_IN,
        "and": __MODULE__.t_filter_op.FILTER_OP_AND,
        "is nan": __MODULE__.t_filter_op.FILTER_OP_IS_NAN,
        "is not nan": __MODULE__.t_filter_op.FILTER_OP_IS_NOT_NAN
        //"is valid": __MODULE__.t_filter_op.FILTER_OP_IS_VALID,
        //"is not valid": __MODULE__.t_filter_op.FILTER_OP_IS_NOT_VALID
    }

    let _string_to_aggtype = {
        "distinct count": __MODULE__.t_aggtype.AGGTYPE_DISTINCT_COUNT,
        "distinctcount": __MODULE__.t_aggtype.AGGTYPE_DISTINCT_COUNT,
        "distinct": __MODULE__.t_aggtype.AGGTYPE_DISTINCT_COUNT,
        "sum": __MODULE__.t_aggtype.AGGTYPE_SUM,
        "mul": __MODULE__.t_aggtype.AGGTYPE_MUL,
        "avg": __MODULE__.t_aggtype.AGGTYPE_MEAN,
        "mean": __MODULE__.t_aggtype.AGGTYPE_MEAN,
        "count": __MODULE__.t_aggtype.AGGTYPE_COUNT,
        "weighted mean": __MODULE__.t_aggtype.AGGTYPE_WEIGHTED_MEAN,
        "unique": __MODULE__.t_aggtype.AGGTYPE_UNIQUE,
        "any": __MODULE__.t_aggtype.AGGTYPE_ANY,
        "median": __MODULE__.t_aggtype.AGGTYPE_MEDIAN,
        "join": __MODULE__.t_aggtype.AGGTYPE_JOIN,
        "div": __MODULE__.t_aggtype.AGGTYPE_SCALED_DIV,
        "add": __MODULE__.t_aggtype.AGGTYPE_SCALED_ADD,
        "dominant": __MODULE__.t_aggtype.AGGTYPE_DOMINANT,
        "first": __MODULE__.t_aggtype.AGGTYPE_FIRST,
        "last": __MODULE__.t_aggtype.AGGTYPE_LAST,
        //"PY_AGG": __MODULE__.t_aggtype.AGGTYPE_PY_AGG,
        "and": __MODULE__.t_aggtype.AGGTYPE_AND,
        "or": __MODULE__.t_aggtype.AGGTYPE_OR,
        "last": __MODULE__.t_aggtype.AGGTYPE_LAST_VALUE,
        "high": __MODULE__.t_aggtype.AGGTYPE_HIGH_WATER_MARK,
        "low": __MODULE__.t_aggtype.AGGTYPE_LOW_WATER_MARK,
        //"UDF_COMBINER": __MODULE__.t_aggtype.AGGTYPE_UDF_COMBINER,
        //"UDF_REDUCER": __MODULE__.t_aggtype.AGGTYPE_UDF_REDUCER,
        "sum abs": __MODULE__.t_aggtype.AGGTYPE_SUM_ABS,
        "sum not null": __MODULE__.t_aggtype.AGGTYPE_SUM_NOT_NULL,
        "mean by count": __MODULE__.t_aggtype.AGGTYPE_MEAN_BY_COUNT,
        "identity": __MODULE__.t_aggtype.AGGTYPE_IDENTITY,
        "distinct leaf": __MODULE__.t_aggtype.AGGTYPE_DISTINCT_LEAF,
        "pct sum parent": __MODULE__.t_aggtype.AGGTYPE_PCT_SUM_PARENT,
        "pct sum grand total": __MODULE__.t_aggtype.AGGTYPE_PCT_SUM_GRAND_TOTAL
    }

    let name = Math.random() + "";

    // Filters
    let filters = [];
    let filter_op = __MODULE__.t_filter_op.FILTER_OP_AND;

    if (config.filter) {
        filters = config.filter.map(function(filter) {
            return [filter[0], _string_to_filter_op[filter[1]], filter[2]];
        });
        if (config.filter_op) {
            filter_op = _string_to_filter_op[config.filter_op];
        }
    }

    // Sort
    let sort = [];
    if (config.sort) {
        sort = config.sort.map(function(x) {
            return [config.aggregate.map(function(agg) { return agg.column }).indexOf(x), 1];
        });
    }

    // Row Pivots
    let aggregates = [];
    if (typeof config.aggregate === "string") {
        let agg_op = _string_to_aggtype[config.aggregate];
        let schema = this.gnode.get_tblschema();
        let t_aggs = schema.columns();
        for (let aidx = 0; aidx < t_aggs.size(); aidx++) {
            aggregates.push([t_aggs.get(aidx), agg_op, t_aggs.get(aidx)]);
        }
        schema.delete();
        t_aggs.delete();
    } else if (typeof config.aggregate === 'object') {
        for (let aidx = 0; aidx < config.aggregate.length; aidx++) {
            let agg = config.aggregate[aidx];
            let agg_op = _string_to_aggtype[agg.op];
            aggregates.push([agg.column, agg_op]);
        }
    } else {
        let agg_op = __MODULE__.t_aggtype.AGGTYPE_DISTINCT_COUNT;
        let schema = this.gnode.get_tblschema()
        let t_aggs = schema.columns();
        for (let aidx = 0; aidx < t_aggs.size(); aidx++){
            aggregates.push([
                t_aggs.get(aidx),
                agg_op,
                t_aggs.get(aidx)
            ]);
        }
        schema.delete();
        t_aggs.delete();
    }

    let context;
    if ((config.row_pivot && config.row_pivot.length > 0) || (config.column_pivot && config.column_pivot.length > 0)) {
        if (config.column_pivot && config.column_pivot.length > 0) {
            config.row_pivot = config.row_pivot || [];
            context = __MODULE__.make_context_two(
                this.gnode,
                config.row_pivot,
                config.column_pivot,
                filter_op,
                filters,
                aggregates,
                sort
            );
            this.pool.register_context(this.id, name, __MODULE__.t_ctx_type.TWO_SIDED_CONTEXT, context.$$.ptr);

            if (config.row_pivot_depth !== undefined) {
                context.expand_to_depth(__MODULE__.t_header.HEADER_ROW, config.row_pivot_depth - 1);
            } else {
                context.expand_to_depth(__MODULE__.t_header.HEADER_ROW, config.row_pivot.length);
            }

            if (config.column_pivot_depth !== undefined) {
                context.expand_to_depth(__MODULE__.t_header.HEADER_COLUMN, config.column_pivot_depth - 1);
            } else {
                context.expand_to_depth(__MODULE__.t_header.HEADER_COLUMN, config.column_pivot.length);
            }
        } else {
            context = __MODULE__.make_context_one(
                this.gnode,
                config.row_pivot,
                filter_op,
                filters,
                aggregates,
                sort
            );
            this.pool.register_context(this.id, name, __MODULE__.t_ctx_type.ONE_SIDED_CONTEXT, context.$$.ptr);

            if (config.row_pivot_depth !== undefined) {
                context.expand_to_depth(config.row_pivot_depth - 1);
            } else {
                context.expand_to_depth(config.row_pivot.length);
            }
        }
    } else {
        context = __MODULE__.make_context_zero(this.gnode, filter_op, filters, aggregates.map(function(x) { return x[0]; }), sort);
        this.pool.register_context(this.id, name, __MODULE__.t_ctx_type.ZERO_SIDED_CONTEXT, context.$$.ptr);
    }
    return new view(this.pool, context, this.gnode, config, this.id, name, this.callbacks);
}

/**
 * Updates a `table`.
 *
 * Params
 * ------
 * data : [{col: val, ..}, ..]
 *     Updates a table from the list of rows data.
 * data : {col: [ val, ..], ..}
 *     Updates a table from the columnar data.  Uses fill_vector on ArrayBuffers.
 * data : String
 *     Updates a table from CSV data.
 * options : {name: val, .. }
 *     See: `table.options`
 */
table.prototype.update = function(data) {
    let {names, types, cdata} = parse_data(data, this.columns(), this.gnode.get_tblschema().types());
    this.initialized = true;
    let tbl = __MODULE__.make_table(data.length || 0, names, types, cdata, this.size(), this.index, this.tindex);
    __MODULE__.fill(this.id, tbl, this.gnode, this.pool);
    tbl.delete();
}

table.prototype.columns = function(handler) {
    let cols = this.gnode.get_tblschema().columns();
    let names = []
    for (let cidx = 0; cidx < cols.size(); cidx++) {
        names.push(cols.get(cidx));
    }
    if (handler) {
        handler(names);
    } else {
        return names;
    }
}

table.prototype.execute = function (f) {
    f(this);
}

/******************************************************************************
 *
 * Worker API
 *
 */

if (typeof self !== "undefined" && self.addEventListener) {
    let _tables = {};
    let _views = {};

    self.addEventListener('message', function(e) {
        let msg = e.data;
        switch (msg.cmd) {
            case 'init':
                if (typeof WebAssembly === 'undefined') {
                    console.log("Loading asm.js");
                    __MODULE__ = __MODULE__({
                        wasmJSMethod: "asmjs",
                        memoryInitializerPrefixURL: msg.path + 'asmjs/',
                   //     asmjsCodeFile: msg.data || msg.path + 'asmjs/psp.asm.js'
                    });
               } else {
                    console.log('Loading wasm');
                    if (msg.data) {
                        module = {};
                        module.wasmBinary = msg.data;
                        module.wasmJSMethod = 'native-wasm';
                        __MODULE__ = __MODULE__(module);
                    } else {
                        let wasmXHR = new XMLHttpRequest();
                        wasmXHR.open('GET', msg.path + 'wasm_async/psp.wasm', true);
                        wasmXHR.responseType = 'arraybuffer';
                        wasmXHR.onload = function() {
                            module = {};
                            module.wasmBinary = wasmXHR.response;
                            module.wasmJSMethod = 'native-wasm';
                            __MODULE__ = __MODULE__(module);
                        };
                        wasmXHR.send(null);
                    }
                };
                break;
            case 'table':
                _tables[msg.name] = perspective.table(msg.data, msg.options);
                break;
            case 'table_generate':
                let g;
                eval("g = " + msg.args)
                g(function (tbl) {
                    _tables[msg.name] = tbl;
                    self.postMessage({
                        id: msg.id,
                        data: 'created!'
                    });
                });
                break;
            case 'table_execute':
                let f;
                eval("f = " + msg.f);
                f(_tables[msg.name]);
                break;
            case 'view':
                _views[msg.view_name] = _tables[msg.table_name].view(msg.config);
                break;
            case 'table_method': {
                let obj = _tables[msg.name];
                let data = obj[msg.method].apply(obj, msg.args);
                if (data) {
                    self.postMessage({
                        id: msg.id,
                        data: data
                    });
                }
                break;
            }
            case 'view_method': {
                let obj = _views[msg.name];
                if (msg.subscribe) {
                    obj[msg.method](function(e) {
                        self.postMessage({
                            id: msg.id,
                            data: e
                        });
                    });
                } else {
                    obj[msg.method].apply(obj, msg.args).then(result => {
                        self.postMessage({
                            id: msg.id,
                            data: result
                        });
                    });
                }
                break;
            }
        }
    }, false);

};


/******************************************************************************
 *
 * Perspective
 *
 */

const perspective = {

    /**
     * Creates a new `table`.
     *
     * Params
     * ------
     * data : [{col: val, ..}, ..]
     *     Create a populated table from the list of rows data.
     * data : {col: [ val, ..], ..}
     *     Create a populated table from the columnar data.  Uses fill_vector on ArrayBuffers.
     * data : {col: type, ..}
     *     Create an empty table with the supplied schema.
     * data : String
     *     Create a new table from CSV data.
     * options : {name: val, .. }
     *     Valid options are:
     *       * index - column name of the data set to use as the index.
     *
     * Returns
     * -------
     * A `table`.
     */
    table: function(data, options) {
        options = options || {};
        options.index = options.index || "";
        if (typeof data === "string") {
            if (data[0] === ",") {
                data = "_" + data;
            }
            let js = papaparse.parse(data, {dynamicTyping: true, header: true}).data;
            //let js = csv2json(data);
            return perspective.table(js, options);
        }
        let pdata = parse_data(data);
        let tindex;
        if (options.index) {
            tindex = pdata.types[pdata.names.indexOf(options.index)]
        } else {
            tindex = __MODULE__.t_dtype.DTYPE_UINT32;
        }
        let gnode = __MODULE__.make_gnode(pdata.names, pdata.types, tindex);
        let pool = new __MODULE__.t_pool({_update_callback: function() {} } );
        let id = pool.register_gnode(gnode);
        try {
            let tbl = __MODULE__.make_table(data.length || 0, pdata.names, pdata.types, pdata.cdata, 0, options.index, tindex);
            __MODULE__.fill(id, tbl, gnode, pool);
            tbl.delete();
            return new table(id, gnode, pool, options.index, tindex);
        } catch (e) {
            console.error("Failed to create table");
            console.error(pdata);
            return;
        }
    }
}

module.exports = function(Module) {
    __MODULE__ = Module;
    return perspective;
};


