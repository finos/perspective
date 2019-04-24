/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as defaults from "./defaults.js";
import {DataAccessor} from "./DataAccessor/DataAccessor.js";
import {DateParser} from "./DataAccessor/DateParser.js";
import {extract_map, extract_vector} from "./emscripten.js";
import {bindall, get_column_type} from "./utils.js";

import {Precision} from "@apache-arrow/es5-esm/enum";
import {Table} from "@apache-arrow/es5-esm/table";
import {Visitor} from "@apache-arrow/es5-esm/visitor";
import {Data} from "@apache-arrow/es5-esm/data";
import {Vector} from "@apache-arrow/es5-esm/vector";

import {Utf8, Uint32, Float64, Int32, Bool, TimestampSecond, Dictionary} from "@apache-arrow/es5-esm/type";

import formatters from "./view_formatters";
import papaparse from "papaparse";

// IE fix - chrono::steady_clock depends on performance.now() which does not exist in IE workers
if (global.performance === undefined) {
    global.performance = {now: Date.now};
}

if (typeof self !== "undefined" && self.performance === undefined) {
    self.performance = {now: Date.now};
}

/**
 * The main API module for Perspective.
 * @module perspective
 */
export default function(Module) {
    let __MODULE__ = Module;
    let accessor = new DataAccessor();

    /******************************************************************************
     *
     * Private
     *
     */

    /**
     * Determines a table's limit index.
     * @private
     * @param {int} limit_index
     * @param {int} new_length
     * @param {int} options_limit
     */
    function calc_limit_index(limit_index, new_length, options_limit) {
        limit_index += new_length;
        if (options_limit) {
            limit_index = limit_index % options_limit;
        }
        return limit_index;
    }

    /**
     * Common logic for creating and registering a gnode/t_table.
     *
     * @param {*} pdata
     * @param {*} pool
     * @param {*} gnode
     * @param {*} computed
     * @param {*} index
     * @param {*} limit
     * @param {*} limit_index
     * @param {*} is_delete
     * @private
     * @returns {Table}
     */
    function make_table(accessor, pool, gnode, computed, index, limit, limit_index, is_update, is_delete, is_arrow) {
        if (is_arrow) {
            for (let chunk of accessor) {
                gnode = __MODULE__.make_table(pool, gnode, chunk, computed, limit_index, limit || 4294967295, index, is_update, is_delete, is_arrow);
                limit_index = calc_limit_index(limit_index, chunk.cdata[0].length, limit);
            }
        } else {
            gnode = __MODULE__.make_table(pool, gnode, accessor, computed, limit_index, limit || 4294967295, index, is_update, is_delete, is_arrow);
            limit_index = calc_limit_index(limit_index, accessor.row_count, limit);
        }

        return [gnode, limit_index];
    }

    /**
     * Converts arrow data into a canonical representation for
     * interfacing with perspective.
     *
     * @private
     * @param {object} data Array buffer
     * @returns An array containing chunked data objects with five properties:
     * row_count: the number of rows in the chunk
     * is_arrow: internal flag for marking arrow data
     * names: column names for the arrow data
     * types: type mapping for each column
     * cdata: the actual data we load
     */
    function load_arrow_buffer(data) {
        // TODO Need to validate that the names/types passed in match those in the buffer
        let arrow = Table.from([new Uint8Array(data)]);
        let loader = arrow.schema.fields.reduce((loader, field, colIdx) => {
            return loader.loadColumn(field, arrow.getColumnAt(colIdx));
        }, new ArrowColumnLoader());
        let nchunks = loader.cdata[0].chunks.length;
        let chunks = [];
        for (let x = 0; x < nchunks; x++) {
            chunks.push({
                row_count: loader.cdata[0].chunks[x].length,
                is_arrow: true,
                names: loader.names,
                types: loader.types,
                cdata: loader.cdata.map(y => y.chunks[x])
            });
        }
        console.log(chunks);
        return chunks;
    }

    /**
     *
     * @private
     */
    class ArrowColumnLoader extends Visitor {
        constructor(cdata, names, types) {
            super();
            this.cdata = cdata || [];
            this.names = names || [];
            this.types = types || [];
        }
        loadColumn(field /*: Arrow.type.Field*/, column /*: Arrow.Vector*/) {
            if (this.visit(field.type)) {
                this.cdata.push(column);
                this.names.push(field.name);
            }
            return this;
        }
        // visitNull(type/*: Arrow.type.Null*/) {}
        visitBool(/* type: Arrow.type.Bool */) {
            this.types.push(__MODULE__.t_dtype.DTYPE_BOOL);
            return true;
        }
        visitInt(type /* : Arrow.type.Int */) {
            const bitWidth = type.bitWidth;
            if (bitWidth === 64) {
                this.types.push(__MODULE__.t_dtype.DTYPE_INT64);
            } else if (bitWidth === 32) {
                this.types.push(__MODULE__.t_dtype.DTYPE_INT32);
            } else if (bitWidth === 16) {
                this.types.push(__MODULE__.t_dtype.DTYPE_INT16);
            } else if (bitWidth === 8) {
                this.types.push(__MODULE__.t_dtype.DTYPE_INT8);
            }
            return true;
        }
        visitFloat(type /* : Arrow.type.Float */) {
            const precision = type.precision;
            if (precision === Precision.DOUBLE) {
                this.types.push(__MODULE__.t_dtype.DTYPE_FLOAT64);
            } else if (precision === Precision.SINGLE) {
                this.types.push(__MODULE__.t_dtype.DTYPE_FLOAT32);
            }
            // todo?
            // else if (type.precision === Arrow.enum_.Precision.HALF) {
            //     this.types.push(__MODULE__.t_dtype.DTYPE_FLOAT16);
            // }
            return true;
        }
        visitUtf8(/* type: Arrow.type.Utf8 */) {
            this.types.push(__MODULE__.t_dtype.DTYPE_STR);
            return true;
        }
        visitBinary(/* type: Arrow.type.Binary */) {
            this.types.push(__MODULE__.t_dtype.DTYPE_STR);
            return true;
        }
        // visitFixedSizeBinary(type/*: Arrow.type.FixedSizeBinary*/) {}
        // visitDate(type/*: Arrow.type.Date_*/) {}
        visitTimestamp(/* type: Arrow.type.Timestamp */) {
            this.types.push(__MODULE__.t_dtype.DTYPE_TIME);
            return true;
        }
        // visitTime(type/*: Arrow.type.Time*/) {}
        // visitDecimal(type/*: Arrow.type.Decimal*/) {}
        // visitList(type/*: Arrow.type.List*/) {}
        // visitStruct(type/*: Arrow.type.Struct*/) {}
        // visitUnion(type/*: Arrow.type.Union<any>*/) {}
        visitDictionary(type /*: Arrow.type.Dictionary */) {
            return this.visit(type.dictionary);
        }
        // visitInterval(type/*: Arrow.type.Interval*/) {}
        // visitFixedSizeList(type/*: Arrow.type.FixedSizeList*/) {}
        // visitMap(type/*: Arrow.type.Map_*/) {}
    }

    /******************************************************************************
     *
     * View
     *
     */

    /**
     * A View object represents a specific transform (configuration or pivot,
     * filter, sort, etc) configuration on an underlying {@link module:perspective~table}. A View
     * receives all updates from the {@link module:perspective~table} from which it is derived, and
     * can be serialized to JSON or trigger a callback when it is updated.  View
     * objects are immutable, and will remain in memory and actively process
     * updates until its {@link module:perspective~view#delete} method is called.
     *
     * <strong>Note</strong> This constructor is not public - Views are created
     * by invoking the {@link module:perspective~table#view} method.
     *
     * @example
     * // Returns a new View, pivoted in the row space by the "name" column.
     * table.view({row_pivots: ["name"]});
     *
     * @class
     * @hideconstructor
     */
    function view(pool, sides, gnode, config, name, callbacks, table) {
        this._View = undefined;
        this.date_parser = new DateParser();
        this.config = config || {};

        if (sides === 0) {
            this._View = __MODULE__.make_view_zero(pool, gnode, name, defaults.COLUMN_SEPARATOR_STRING, this.config, this.date_parser);
        } else if (sides === 1) {
            this._View = __MODULE__.make_view_one(pool, gnode, name, defaults.COLUMN_SEPARATOR_STRING, this.config, this.date_parser);
        } else if (sides === 2) {
            this._View = __MODULE__.make_view_two(pool, gnode, name, defaults.COLUMN_SEPARATOR_STRING, this.config, this.date_parser);
        }

        this.ctx = this._View.get_context();
        this.column_only = this._View.is_column_only();
        this.callbacks = callbacks;
        this.name = name;
        this.table = table;
        bindall(this);
    }

    /**
     * A copy of the config object passed to the {@link table#view} method
     * which created this {@link module:perspective~view}.
     *
     * @returns {object} Shared the same key/values properties as {@link module:perspective~view}
     */
    view.prototype.get_config = async function() {
        return JSON.parse(JSON.stringify(this.config));
    };

    /**
     * Delete this {@link module:perspective~view} and clean up all resources associated with it.
     * View objects do not stop consuming resources or processing updates when
     * they are garbage collected - you must call this method to reclaim these.
     */
    view.prototype.delete = async function() {
        this._View.delete();
        this.ctx.delete();

        this.table.views.splice(this.table.views.indexOf(this), 1);
        this.table = undefined;
        let i = 0,
            j = 0;
        while (i < this.callbacks.length) {
            let val = this.callbacks[i];
            if (val.view !== this) this.callbacks[j++] = val;
            i++;
        }
        this.callbacks.length = j;
        if (this._delete_callback) {
            this._delete_callback();
        }
    };

    /**
     * How many pivoted sides does this view have?
     *
     * @private
     *
     * @returns {number} sides The number of sides of this `View`.
     */
    view.prototype.sides = function() {
        return this._View.sides();
    };

    view.prototype._num_hidden = function() {
        // Count hidden columns.
        let hidden = 0;
        for (const sort of this.config.sort) {
            if (this.config.columns.indexOf(sort[0]) === -1) {
                hidden++;
            }
        }
        return hidden;
    };

    function col_path_vector_to_string(vector) {
        let extracted = [];
        for (let i = 0; i < vector.size(); i++) {
            extracted.push(__MODULE__.scalar_vec_to_string(vector, i));
        }
        vector.delete();
        return extracted;
    }

    const extract_vector_scalar = function(vector) {
        // handles deletion already - do not call delete() on the input vector again
        let extracted = [];
        for (let i = 0; i < vector.size(); i++) {
            let item = vector.get(i);
            extracted.push(col_path_vector_to_string(item));
        }
        vector.delete();
        return extracted;
    };

    /**
     * The schema of this {@link module:perspective~view}. A schema is an Object, the keys of which
     * are the columns of this {@link module:perspective~view}, and the values are their string type names.
     * If this {@link module:perspective~view} is aggregated, theses will be the aggregated types;
     * otherwise these types will be the same as the columns in the underlying
     * {@link module:perspective~table}
     *
     * @async
     *
     * @returns {Promise<Object>} A Promise of this {@link module:perspective~view}'s schema.
     */
    view.prototype.schema = async function() {
        return extract_map(this._View.schema());
    };

    view.prototype._column_names = function(skip = false, depth = 0) {
        return extract_vector_scalar(this._View.column_names(skip, depth)).map(x => x.join(defaults.COLUMN_SEPARATOR_STRING));
    };

    const to_format = async function(options, formatter) {
        options = options || {};
        const max_cols = this._View.num_columns() + (this.sides() === 0 ? 0 : 1);
        const max_rows = this._View.num_rows();
        const hidden = this._num_hidden();

        const viewport = this.config.viewport ? this.config.viewport : {};
        const start_row = options.start_row || (viewport.top ? viewport.top : 0);
        const end_row = options.end_row || (viewport.height ? start_row + viewport.height : max_rows);
        const start_col = options.start_col || (viewport.left ? viewport.left : 0);
        const end_col = Math.min(max_cols, (options.end_col || (viewport.width ? start_col + viewport.width : max_cols)) * (hidden + 1));

        const num_sides = this.sides();
        const nidx = ["zero", "one", "two"][num_sides];

        const slice = __MODULE__[`get_data_slice_${nidx}`](this._View, start_row, end_row, start_col, end_col);
        const ns = slice.get_column_names();
        const col_names = extract_vector_scalar(ns).map(x => x.join(defaults.COLUMN_SEPARATOR_STRING));

        let data = formatter.initDataValue();
        for (let ridx = start_row; ridx < end_row; ridx++) {
            let row = formatter.initRowValue();
            for (let cidx = start_col; cidx < end_col; cidx++) {
                const col_name = col_names[cidx];
                if ((cidx - (num_sides > 0 ? 1 : 0)) % (this.config.columns.length + hidden) >= this.config.columns.length) {
                    // Hidden columns are always at the end, so don't emit these.
                    continue;
                } else if (cidx === start_col && num_sides !== 0) {
                    if (!this.column_only) {
                        const row_path = slice.get_row_path(ridx);
                        formatter.initColumnValue(data, row, "__ROW_PATH__");
                        for (let i = 0; i < row_path.size(); i++) {
                            const value = __MODULE__.scalar_vec_to_val(row_path, i);
                            formatter.addColumnValue(data, row, "__ROW_PATH__", value);
                        }
                        row_path.delete();
                    }
                } else {
                    const value = __MODULE__[`get_from_data_slice_${nidx}`](slice, ridx, cidx);
                    formatter.setColumnValue(data, row, col_name, value);
                }
            }
            formatter.addRow(data, row);
        }

        slice.delete();

        return formatter.formatData(data, options.config);
    };

    /**
     * Serializes this view to JSON data in a column-oriented format.
     *
     * @async
     *
     * @param {Object} [options] An optional configuration object.
     * @param {number} options.start_row The starting row index from which
     * to serialize.
     * @param {number} options.end_row The ending row index from which
     * to serialize.
     * @param {number} options.start_col The starting column index from which
     * to serialize.
     * @param {number} options.end_col The ending column index from which
     * to serialize.
     *
     * @returns {Promise<Array>} A Promise resolving to An array of Objects
     * representing the rows of this {@link module:perspective~view}.  If this {@link module:perspective~view} had a
     * "row_pivots" config parameter supplied when constructed, each row Object
     * will have a "__ROW_PATH__" key, whose value specifies this row's
     * aggregated path.  If this {@link module:perspective~view} had a "column_pivots" config
     * parameter supplied, the keys of this object will be comma-prepended with
     * their comma-separated column paths.
     */
    view.prototype.to_columns = async function(options) {
        return to_format.call(this, options, formatters.jsonTableFormatter);
    };

    /**
     * Serializes this view to JSON data in a row-oriented format.
     *
     * @async
     *
     * @param {Object} [options] An optional configuration object.
     * @param {number} options.start_row The starting row index from which
     * to serialize.
     * @param {number} options.end_row The ending row index from which
     * to serialize.
     * @param {number} options.start_col The starting column index from which
     * to serialize.
     * @param {number} options.end_col The ending column index from which
     * to serialize.
     *
     * @returns {Promise<Array>} A Promise resolving to An array of Objects
     * representing the rows of this {@link module:perspective~view}.  If this {@link module:perspective~view} had a
     * "row_pivots" config parameter supplied when constructed, each row Object
     * will have a "__ROW_PATH__" key, whose value specifies this row's
     * aggregated path.  If this {@link module:perspective~view} had a "column_pivots" config
     * parameter supplied, the keys of this object will be comma-prepended with
     * their comma-separated column paths.
     */
    view.prototype.to_json = async function(options) {
        return to_format.call(this, options, formatters.jsonFormatter);
    };

    /**
     * Serializes this view to CSV data in a standard format.
     *
     * @async
     *
     * @param {Object} [options] An optional configuration object.
     * @param {number} options.start_row The starting row index from which
     * to serialize.
     * @param {number} options.end_row The ending row index from which
     * to serialize.
     * @param {number} options.start_col The starting column index from which
     * to serialize.
     * @param {number} options.end_col The ending column index from which
     * to serialize.
     * @param {Object} options.config A config object for the Papaparse {@link https://www.papaparse.com/docs#json-to-csv}
     * config object.
     *
     * @returns {Promise<string>} A Promise resolving to a string in CSV format
     * representing the rows of this {@link module:perspective~view}.  If this {@link module:perspective~view} had a
     * "row_pivots" config parameter supplied when constructed, each row
     * will have prepended those values specified by this row's
     * aggregated path.  If this {@link module:perspective~view} had a "column_pivots" config
     * parameter supplied, the keys of this object will be comma-prepended with
     * their comma-separated column paths.
     */
    view.prototype.to_csv = async function(options) {
        return to_format.call(this, options, formatters.csvFormatter);
    };

    /**
     * Serializes a view column into a TypedArray.
     *
     * @async
     *
     * @param {string} column_name The name of the column to serialize.
     *
     * @returns {Promise<TypedArray>} A promise resolving to a TypedArray
     * representing the data of the column as retrieved from the {@link module:perspective~view} - all
     * pivots, aggregates, sorts, and filters have been applied onto the values
     * inside the TypedArray. The TypedArray will be constructed based on data type -
     * integers will resolve to Int8Array, Int16Array, or Int32Array. Floats resolve to
     * Float32Array or Float64Array. If the column cannot be found, or is not of an
     * integer/float type, the Promise returns undefined.
     */
    view.prototype.col_to_js_typed_array = async function(col_name, options = {}) {
        const names = await this._column_names();
        const num_rows = await this.num_rows();
        const column_pivot_only = this.config.row_pivots[0] === "psp_okey" || this.column_only === true;

        let idx = names.indexOf(col_name);

        const start_row = options.start_row || 0;
        const end_row = (options.end_row || num_rows) + (column_pivot_only ? 1 : 0);

        // type-checking is handled in c++ to accomodate column-pivoted views
        if (idx === -1) {
            return undefined;
        }

        if (this.sides() === 0) {
            return __MODULE__.col_to_js_typed_array_zero(this._View, idx, false, start_row, end_row);
        } else if (this.sides() === 1) {
            // columns start at 1 for > 0-sided views
            return __MODULE__.col_to_js_typed_array_one(this._View, idx + 1, false, start_row, end_row);
        } else {
            return __MODULE__.col_to_js_typed_array_two(this._View, idx + 1, column_pivot_only, start_row, end_row);
        }
    };

    /**
     * Serializes a view to arrow.
     *
     * @async
     *
     * @param {Object} [options] An optional configuration object.
     * @param {number} options.start_row The starting row index from which
     * to serialize.
     * @param {number} options.end_row The ending row index from which
     * to serialize.
     * @param {number} options.start_col The starting column index from which
     * to serialize.
     * @param {number} options.end_col The ending column index from which
     * to serialize.
     *
     * @returns {Promise<TypedArray>} A Table in the Apache Arrow format containing
     * data from the view.
     */
    view.prototype.to_arrow = async function(options = {}) {
        const names = await this._column_names();
        const schema = await this.schema();

        const vectors = [];

        const start_col = options.start_col || 0;
        const end_col = options.end_col || names.length;

        for (let i = start_col; i < end_col; i++) {
            const name = names[i];
            const col_path = name.split(defaults.COLUMN_SEPARATOR_STRING);
            const type = schema[col_path[col_path.length - 1]];
            if (type === "float") {
                const [vals, nullCount, nullArray] = await this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Float(new Float64(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "integer") {
                const [vals, nullCount, nullArray] = await this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Int(new Int32(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "boolean") {
                const [vals, nullCount, nullArray] = await this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Bool(new Bool(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "date" || type === "datetime") {
                const [vals, nullCount, nullArray] = await this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Timestamp(new TimestampSecond(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "string") {
                const [vals, offsets, indices, nullCount, nullArray] = await this.col_to_js_typed_array(name, options);
                const utf8Vector = Vector.new(Data.Utf8(new Utf8(), 0, offsets.length - 1, 0, null, offsets, vals));
                const type = new Dictionary(utf8Vector.type, new Uint32(), null, null, utf8Vector);
                vectors.push(Vector.new(Data.Dictionary(type, 0, indices.length, nullCount, nullArray, indices)));
            } else {
                throw new Error(`Type ${type} not supported`);
            }
        }

        return Table.fromVectors(vectors, names.slice(start_col, end_col)).serialize("binary", false).buffer;
    };

    /**
     * The number of aggregated rows in this {@link module:perspective~view}.  This is affected by
     * the "row_pivots" configuration parameter supplied to this {@link module:perspective~view}'s
     * contructor.
     *
     * @async
     *
     * @returns {Promise<number>} The number of aggregated rows.
     */
    view.prototype.num_rows = async function() {
        return this._View.num_rows();
    };

    /**
     * The number of aggregated columns in this {@link view}.  This is affected by
     * the "column_pivots" configuration parameter supplied to this {@link view}'s
     * contructor.
     *
     * @async
     *
     * @returns {Promise<number>} The number of aggregated columns.
     */
    view.prototype.num_columns = async function() {
        const ncols = this._View.num_columns();
        const nhidden = this._num_hidden();
        return ncols - (ncols / (this.config.columns.length + nhidden)) * nhidden;
    };

    /**
     * Whether this row at index `idx` is in an expanded or collapsed state.
     *
     * @async
     *
     * @returns {Promise<bool>} Whether this row is expanded.
     */
    view.prototype.get_row_expanded = async function(idx) {
        return this._View.get_row_expanded(idx);
    };

    /**
     * Expands the row at index `idx`.
     *
     * @async
     *
     * @returns {Promise<void>}
     */
    view.prototype.expand = async function(idx) {
        return this._View.expand(idx, this.config.row_pivots.length);
    };

    /**
     * Collapses the row at index `idx`.
     *
     * @async
     *
     * @returns {Promise<void>}
     */
    view.prototype.collapse = async function(idx) {
        return this._View.collapse(idx);
    };

    /**
     * Set expansion `depth` of the pivot tree.
     *
     */
    view.prototype.set_depth = async function(depth) {
        return this._View.set_depth(depth, this.config.row_pivots.length);
    };

    /**
     * Returns the data of all changed rows in JSON format, or for 1+ sided contexts
     * the entire dataset of the view.
     * @private
     */
    view.prototype._get_step_delta = async function() {
        let delta = this._View.get_step_delta(0, 2147483647);
        let data;
        if (delta.cells.size() === 0) {
            // FIXME This is currently not implemented for 1+ sided contexts.
            data = await this.to_json();
        } else {
            let rows = {};
            for (let x = 0; x < delta.cells.size(); x++) {
                rows[delta.cells.get(x).row] = true;
            }
            rows = Object.keys(rows);
            const results = await Promise.all(
                rows.map(row =>
                    this.to_json({
                        start_row: Number.parseInt(row),
                        end_row: Number.parseInt(row) + 1
                    })
                )
            );
            data = [].concat.apply([], results);
        }
        delta.cells.delete();
        return data;
    };

    /**
     * Returns an array of row indices indicating which rows have been changed
     * in an update.
     * @private
     */
    view.prototype._get_row_delta = async function() {
        let d = this._View.get_row_delta(0, 2147483647);
        return extract_vector(d.rows);
    };

    /**
     * Register a callback with this {@link module:perspective~view}.  Whenever the {@link module:perspective~view}'s
     * underlying table emits an update, this callback will be invoked with the
     * aggregated row deltas.
     *
     * @param {function} callback A callback function invoked on update.  The
     * parameter to this callback is dependent on the `mode` parameter:
     *     - "none" (default): The callback is invoked without an argument.
     *     - "rows": The callback is invoked with the changed rows.
     */
    view.prototype.on_update = function(callback, {mode = "none"} = {}) {
        if (["none", "rows", "pkey"].indexOf(mode) === -1) {
            throw new Error(`Invalid update mode "${mode}" - valid modes are "none", "rows" and "pkey".`);
        }
        if (mode === "rows" || mode === "pkey") {
            // Enable deltas only if needed by callback
            if (!this._View._get_deltas_enabled()) {
                this._View._set_deltas_enabled(true);
            }
        }
        this.callbacks.push({
            view: this,
            callback: async () => {
                switch (mode) {
                    case "rows":
                        {
                            callback(await this._get_step_delta());
                        }
                        break;
                    case "pkey":
                        {
                            callback(await this._get_row_delta());
                        }
                        break;
                    default: {
                        callback();
                    }
                }
            }
        });
    };

    view.prototype.remove_update = function(callback) {
        this.callbacks = this.callbacks.filter(x => x.callback !== callback);
    };

    /**
     * Register a callback with this {@link module:perspective~view}.  Whenever the {@link module:perspective~view}
     * is deleted, this callback will be invoked.
     *
     * @param {function} callback A callback function invoked on update.  The
     *     parameter to this callback shares a structure with the return type of
     *     {@link module:perspective~view#to_json}.
     */
    view.prototype.on_delete = function(callback) {
        this._delete_callback = callback;
    };

    view.prototype.remove_delete = function() {
        this._delete_callback = undefined;
    };

    /******************************************************************************
     *
     * Table
     *
     */

    /**
     * A Table object is the basic data container in Perspective.  Tables are
     * typed - they have an immutable set of column names, and a known type for
     * each.
     *
     * <strong>Note</strong> This constructor is not public - Tables are created
     * by invoking the {@link module:perspective~table} factory method, either on the perspective
     * module object, or an a {@link module:perspective~worker} instance.
     *
     * @class
     * @hideconstructor
     */
    function table(gnode, pool, index, computed, limit, limit_index) {
        this.gnode = gnode;
        this.pool = pool;
        this.name = Math.random() + "";
        this.initialized = false;
        this.index = index;
        this.pool.set_update_delegate(this);
        this.computed = computed || [];
        this.callbacks = [];
        this.views = [];
        this.limit = limit;
        this.limit_index = limit_index;
        bindall(this);
    }

    table.prototype._update_callback = function() {
        for (let e in this.callbacks) {
            this.callbacks[e].callback();
        }
    };

    /**
     * Remove all rows in this {@link module:perspective~table} while preserving the schema and
     * construction options.
     */
    table.prototype.clear = function() {
        this.gnode.reset();
    };

    /**
     * Replace all rows in this {@link module:perspective~table} the input data.
     */
    table.prototype.replace = function(data) {
        this.gnode.reset();
        this.update(data);
    };

    /**
     * Delete this {@link module:perspective~table} and clean up all resources associated with it.
     * Table objects do not stop consuming resources or processing updates when
     * they are garbage collected - you must call this method to reclaim these.
     */
    table.prototype.delete = function() {
        if (this.views.length > 0) {
            throw "Table still has contexts - refusing to delete.";
        }
        this.pool.unregister_gnode(this.gnode.get_id());
        this.gnode.delete();
        this.pool.delete();
        if (this._delete_callback) {
            this._delete_callback();
        }
    };

    /**
     * Register a callback with this {@link module:perspective~table}.  Whenever the {@link module:perspective~view}
     * is deleted, this callback will be invoked.
     *
     * @param {function} callback A callback function invoked on update.  The
     *     parameter to this callback shares a structure with the return type of
     *     {@link module:perspective~table#to_json}.
     */
    table.prototype.on_delete = function(callback) {
        this._delete_callback = callback;
    };

    /**
     * The number of accumulated rows in this {@link module:perspective~table}.  This is affected by
     * the "index" configuration parameter supplied to this {@link module:perspective~view}'s
     * contructor - as rows will be overwritten when they share an idnex column.
     *
     * @async
     *
     * @returns {Promise<number>} The number of accumulated rows.
     */
    table.prototype.size = async function() {
        return this.gnode.get_table().size();
    };

    table.prototype._schema = function(computed) {
        let schema = this.gnode.get_tblschema();
        let columns = schema.columns();
        let types = schema.types();
        let new_schema = {};
        const computed_schema = this.computed_schema();
        for (let key = 0; key < columns.size(); key++) {
            const name = columns.get(key);
            if (name === "psp_okey" && (typeof computed_schema[name] === "undefined" || computed)) {
                continue;
            }
            new_schema[name] = get_column_type(types.get(key).value);
        }
        schema.delete();
        columns.delete();
        types.delete();
        return new_schema;
    };

    /**
     * The schema of this {@link module:perspective~table}.  A schema is an Object whose keys are the
     * columns of this {@link module:perspective~table}, and whose values are their string type names.
     *
     * @async
     * @param {boolean} computed Should computed columns be included?
     * (default false)
     * @returns {Promise<Object>} A Promise of this {@link module:perspective~table}'s schema.
     */
    table.prototype.schema = async function(computed = false) {
        return this._schema(computed);
    };

    table.prototype._computed_schema = function() {
        if (this.computed.length < 0) return {};

        const computed_schema = {};

        for (let i = 0; i < this.computed.length; i++) {
            const column_name = this.computed[i].column;
            const column_type = this.computed[i].type;

            const column = {};

            column.type = column_type;
            column.input_columns = this.computed[i].inputs;
            column.input_type = this.computed[i].input_type;
            column.computation = this.computed[i].computation;

            computed_schema[column_name] = column;
        }

        return computed_schema;
    };

    /**
     * The computed schema of this {@link module:perspective~table}. Returns a schema of only computed
     * columns added by the user, the keys of which are computed columns and the values an
     * Object containing the associated column_name, column_type, and computation.
     *
     * @async
     *
     * @returns {Promise<Object>} A Promise of this {@link module:perspective~table}'s computed schema.
     */
    table.prototype.computed_schema = async function() {
        return this._computed_schema();
    };

    table.prototype._is_date_filter = function(schema) {
        return key => schema[key] === "datetime" || schema[key] === "date";
    };

    table.prototype._is_valid_filter = function(filter) {
        const schema = this._schema();
        const isDateFilter = this._is_date_filter(schema);
        const value = isDateFilter(filter[0]) ? new DateParser().parse(filter[2]) : filter[2];
        return typeof value !== "undefined" && value !== null;
    };

    /**
     * Determines whether a given filter is valid.
     *
     * @param {Array<string>} [filter] A filter configuration array to test
     *
     * @returns {boolean} Whether the filter is valid
     */
    table.prototype.is_valid_filter = function(filter) {
        return this._is_valid_filter(filter);
    };

    /**
     * Create a new {@link module:perspective~view} from this table with a specified
     * configuration.
     *
     * @param {Object} [config] The configuration object for this {@link module:perspective~view}.
     * @param {Array<string>} [config.row_pivots] An array of column names
     * to use as {@link https://en.wikipedia.org/wiki/Pivot_table#Row_labels Row Pivots}.
     * @param {Array<string>} [config.column_pivots] An array of column names
     * to use as {@link https://en.wikipedia.org/wiki/Pivot_table#Column_labels Column Pivots}.
     * @param {Array<Object>} [config.columns] An array of column names for the
     * output columns.  If none are provided, all columns are output.
     * @param {Object} [config.aggregates] An object, the keys of which are column
     * names, and their respective values are the aggregates calculations to use
     * when this view has `row_pivots`.  A column provided to `config.columns`
     * without an aggregate in this object, will use the default aggregate
     * calculation for its type.
     * @param {Array<Array<string>>} [config.filter] An Array of Filter configurations to
     * apply.  A filter configuration is an array of 3 elements:  A column name,
     * a supported filter comparison string (e.g. '===', '>'), and a value to compare.
     * @param {Array<string>} [config.sort] An Array of Sort configurations to apply.
     * A sort configuration is an array of 2 elements: A column name, and a sort direction,
     * which are: "none", "asc", "desc", "col asc", "col desc", "asc abs", "desc abs", "col asc abs", "col desc abs".
     *
     * @example
     * var view = table.view({
     *      row_pivots: ['region'],
     *      columns: ["region"],
     *      aggregates: {"region": "dominant"},
     *      filter: [['client', 'contains', 'fred']],
     *      sort: [['value', 'asc']]
     * });
     *
     * @returns {view} A new {@link module:perspective~view} object for the supplied configuration,
     * bound to this table
     */
    table.prototype.view = function(_config = {}) {
        let config = {};
        for (const key of Object.keys(_config)) {
            if (defaults.CONFIG_ALIASES[key]) {
                if (!config[defaults.CONFIG_ALIASES[key]]) {
                    console.warn(`Deprecated: "${key}" config parameter, please use "${defaults.CONFIG_ALIASES[key]}" instead`);
                    config[defaults.CONFIG_ALIASES[key]] = _config[key];
                } else {
                    throw new Error(`Duplicate configuration parameter "${key}"`);
                }
            } else if (key === "aggregate") {
                console.warn(`Deprecated: "aggregate" config parameter has been replaced by "aggregates" and "columns"`);
                // backwards compatibility: deconstruct `aggregate` into `aggregates` and `columns`
                config["aggregates"] = {};
                config["columns"] = [];
                for (const agg of _config["aggregate"]) {
                    config["aggregates"][agg["column"]] = agg["op"];
                    config["columns"].push(agg["column"]);
                }
            } else if (defaults.CONFIG_VALID_KEYS.indexOf(key) > -1) {
                config[key] = _config[key];
            } else {
                throw new Error(`Unrecognized config parameter "${key}"`);
            }
        }

        config.row_pivots = config.row_pivots || [];
        config.column_pivots = config.column_pivots || [];
        config.aggregates = config.aggregates || {};
        config.filter = config.filter || [];
        config.sort = config.sort || [];

        if (config.columns === undefined) {
            // If columns are not provided, use all columns
            config.columns = this._columns(true);
        }

        let name = Math.random() + "";
        let sides;

        if (config.row_pivots.length > 0 || config.column_pivots.length > 0) {
            if (config.column_pivots && config.column_pivots.length > 0) {
                sides = 2;
            } else {
                sides = 1;
            }
        } else {
            sides = 0;
        }

        let v = new view(this.pool, sides, this.gnode, config, name, this.callbacks, this);
        this.views.push(v);
        return v;
    };

    /**
     * Updates the rows of a {@link module:perspective~table}. Updated rows are pushed down to any
     * derived {@link module:perspective~view} objects.
     *
     * @param {Object<string, Array>|Array<Object>|string} data The input data
     * for this table.  The supported input types mirror the constructor options, minus
     * the ability to pass a schema (Object<string, string>) as this table has
     * already been constructed, thus its types are set in stone.
     *
     * @see {@link module:perspective~table}
     */
    table.prototype.update = function(data) {
        let pdata;
        let cols = this._columns();
        let schema = this.gnode.get_tblschema();
        let types = schema.types();
        let is_arrow = false;

        pdata = accessor;

        if (data instanceof ArrayBuffer) {
            if (this.size() === 0) {
                throw new Error("Overriding Arrow Schema is not supported.");
            }
            pdata = load_arrow_buffer(data, cols, types);
            is_arrow = true;
        } else if (typeof data === "string") {
            if (data[0] === ",") {
                data = "_" + data;
            }
            accessor.init(__MODULE__, papaparse.parse(data.trim(), {header: true}).data);
            accessor.names = cols;
            accessor.types = accessor.extract_typevec(types).slice(0, cols.length);
        } else {
            accessor.init(__MODULE__, data);
            accessor.names = cols;
            accessor.types = accessor.extract_typevec(types).slice(0, cols.length);
        }

        if (accessor.row_count === 0) {
            console.warn("table.update called with no data - ignoring");
            return;
        }

        try {
            [, this.limit_index] = make_table(pdata, this.pool, this.gnode, this.computed, this.index || "", this.limit, this.limit_index, true, false, is_arrow);
            this.initialized = true;
        } catch (e) {
            console.error(`Update failed: ${e}`);
        } finally {
            schema.delete();
            types.delete();
        }
    };

    /**
     * Removes the rows of a {@link module:perspective~table}. Removed rows are pushed down to any
     * derived {@link module:perspective~view} objects.
     *
     * @param {Array<Object>} data An array of primary keys to remove.
     *
     * @see {@link module:perspective~table}
     */
    table.prototype.remove = function(data) {
        let pdata;
        let cols = this._columns();
        let schema = this.gnode.get_tblschema();
        let types = schema.types();
        let is_arrow = false;

        data = data.map(idx => ({[this.index]: idx}));

        if (data instanceof ArrayBuffer) {
            pdata = load_arrow_buffer(data, [this.index], types);
            is_arrow = true;
        } else {
            accessor.init(__MODULE__, data);
            accessor.names = [this.index];
            accessor.types = [accessor.extract_typevec(types)[cols.indexOf(this.index)]];
            pdata = accessor;
        }

        try {
            [, this.limit_index] = make_table(pdata, this.pool, this.gnode, undefined, this.index || "", this.limit, this.limit_index, false, true, is_arrow);
            this.initialized = true;
        } catch (e) {
            console.error(`Remove failed`, e);
        } finally {
            schema.delete();
            types.delete();
        }
    };

    /**
     * Create a new table with the addition of new computed columns (defined as javascript functions)
     *
     * @param {Computation} computed A computation specification object
     */
    table.prototype.add_computed = function(computed) {
        let pool, gnode;

        try {
            pool = new __MODULE__.t_pool();
            gnode = __MODULE__.clone_gnode_table(pool, this.gnode, computed);
            if (this.computed.length > 0) {
                computed = this.computed.concat(computed);
            }
            return new table(gnode, pool, this.index, computed, this.limit, this.limit_index);
        } catch (e) {
            if (pool) {
                pool.delete();
            }
            if (gnode) {
                gnode.delete();
            }
            throw e;
        }
    };

    table.prototype._columns = function(computed = false) {
        let schema = this.gnode.get_tblschema();
        let computed_schema = this._computed_schema();
        let cols = schema.columns();
        let names = [];
        for (let cidx = 0; cidx < cols.size(); cidx++) {
            let name = cols.get(cidx);
            if (name !== "psp_okey" && (typeof computed_schema[name] === "undefined" || computed)) {
                names.push(name);
            }
        }
        schema.delete();
        cols.delete();
        return names;
    };

    /**
     * The column names of this table.
     *
     * @async
     * @param {boolean} computed Should computed columns be included?
     * (default false)
     * @returns {Array<string>} An array of column names for this table.
     */
    table.prototype.columns = async function(computed = false) {
        return this._columns(computed);
    };

    table.prototype._column_metadata = function() {
        let schema = this.gnode.get_tblschema();
        let computed_schema = this._computed_schema();
        let cols = schema.columns();
        let types = schema.types();

        let metadata = [];
        for (let cidx = 0; cidx < cols.size(); cidx++) {
            let name = cols.get(cidx);
            let meta = {};

            if (name === "psp_okey") {
                continue;
            }

            meta.name = name;
            meta.type = get_column_type(types.get(cidx).value);

            let computed_col = computed_schema[name];

            if (computed_col !== undefined) {
                meta.computed = {
                    input_columns: computed_col.input_columns,
                    input_type: computed_col.input_type,
                    computation: computed_col.computation
                };
            } else {
                meta.computed = undefined;
            }

            metadata.push(meta);
        }

        types.delete();
        cols.delete();
        schema.delete();

        return metadata;
    };

    /**
     * Column metadata for this table.
     *
     * If the column is computed, the `computed` property is an Object containing:
     *  - Array `input_columns`
     *  - String `input_type`
     *  - Object `computation`.
     *
     *  Otherwise, `computed` is `undefined`.
     *
     * @async
     *
     * @returns {Array<object>} An array of Objects containing metadata for each column.
     */
    table.prototype.column_metadata = function() {
        return this._column_metadata();
    };

    table.prototype.execute = function(f) {
        f(this);
    };

    /******************************************************************************
     *
     * Worker API
     *
     */

    function error_to_json(error) {
        const obj = {};
        if (typeof error !== "string") {
            Object.getOwnPropertyNames(error).forEach(key => {
                obj[key] = error[key];
            }, error);
        } else {
            obj["message"] = error;
        }
        return obj;
    }

    class Host {
        constructor() {
            this._tables = {};
            this._views = {};
        }

        init(msg) {
            this.post(msg);
        }

        post() {
            throw new Error("post() not implemented!");
        }

        clear_views(client_id) {
            for (let key of Object.keys(this._views)) {
                if (this._views[key].client_id === client_id) {
                    try {
                        this._views[key].delete();
                    } catch (e) {
                        console.error(e);
                    }
                    delete this._views[key];
                }
            }
            console.debug(`GC ${Object.keys(this._views).length} views in memory`);
        }

        process(msg, client_id) {
            switch (msg.cmd) {
                case "init":
                    this.init(msg);
                    break;
                case "table":
                    this._tables[msg.name] = perspective.table(msg.args[0], msg.options);
                    break;
                case "add_computed":
                    let table = this._tables[msg.original];
                    let computed = msg.computed;
                    // rehydrate computed column functions
                    for (let i = 0; i < computed.length; ++i) {
                        let column = computed[i];
                        eval("column.func = " + column.func);
                    }
                    this._tables[msg.name] = table.add_computed(computed);
                    break;
                case "table_generate":
                    let g;
                    eval("g = " + msg.args);
                    g(function(tbl) {
                        this._tables[msg.name] = tbl;
                        this.post({
                            id: msg.id,
                            data: "created!"
                        });
                    });
                    break;
                case "table_execute":
                    let f;
                    eval("f = " + msg.f);
                    f(this._tables[msg.name]);
                    break;
                case "view":
                    this._views[msg.view_name] = this._tables[msg.table_name].view(msg.config);
                    this._views[msg.view_name].client_id = client_id;
                    break;
                case "table_method": {
                    let obj = this._tables[msg.name];
                    let result;

                    try {
                        if (msg.subscribe) {
                            obj[msg.method](e => {
                                this.post({
                                    id: msg.id,
                                    data: e
                                });
                            });
                        } else {
                            result = obj[msg.method].apply(obj, msg.args);
                            if (result && result.then) {
                                result
                                    .then(data => {
                                        if (data) {
                                            this.post({
                                                id: msg.id,
                                                data: data
                                            });
                                        }
                                    })
                                    .catch(error => {
                                        this.post({
                                            id: msg.id,
                                            error: error_to_json(error)
                                        });
                                    });
                            } else {
                                this.post({
                                    id: msg.id,
                                    data: result
                                });
                            }
                        }
                    } catch (e) {
                        this.post({
                            id: msg.id,
                            error: error_to_json(e)
                        });
                        return;
                    }

                    break;
                }
                case "view_method": {
                    let obj = this._views[msg.name];
                    if (!obj) {
                        this.post({
                            id: msg.id,
                            error: {message: "View is not initialized"}
                        });
                        return;
                    }
                    if (msg.subscribe) {
                        try {
                            obj[msg.method](e => {
                                this.post({
                                    id: msg.id,
                                    data: e
                                });
                            });
                        } catch (error) {
                            this.post({
                                id: msg.id,
                                error: error_to_json(error)
                            });
                        }
                    } else {
                        obj[msg.method]
                            .apply(obj, msg.args)
                            .then(result => {
                                if (msg.method === "delete") {
                                    delete this._views[msg.name];
                                }
                                if (msg.method === "to_arrow") {
                                    this.post(
                                        {
                                            id: msg.id,
                                            data: result
                                        },
                                        [result]
                                    );
                                } else {
                                    this.post({
                                        id: msg.id,
                                        data: result
                                    });
                                }
                            })
                            .catch(error => {
                                this.post({
                                    id: msg.id,
                                    error: error_to_json(error)
                                });
                            });
                    }
                    break;
                }
            }
        }
    }

    class WorkerHost extends Host {
        constructor() {
            super();
            self.addEventListener("message", e => this.process(e.data), false);
        }

        post(msg, transfer) {
            self.postMessage(msg, transfer);
        }

        init({buffer}) {
            if (typeof WebAssembly === "undefined") {
                console.log("Loading asm.js");
            } else {
                console.log("Loading wasm");
                __MODULE__ = __MODULE__({
                    wasmBinary: buffer,
                    wasmJSMethod: "native-wasm"
                });
            }
        }
    }

    if (typeof self !== "undefined" && self.addEventListener) {
        new WorkerHost();
    }

    /******************************************************************************
     *
     * Perspective
     *
     */

    const perspective = {
        __module__: __MODULE__,

        Host: Host,

        worker: function() {},

        /**
         * A factory method for constructing {@link module:perspective~table}s.
         *
         * @example
         * // Creating a table directly from node
         * var table = perspective.table([{x: 1}, {x: 2}]);
         *
         * @example
         * // Creating a table from a Web Worker (instantiated via the worker() method).
         * var table = worker.table([{x: 1}, {x: 2}]);
         *
         * @param {Object<string, Array>|Object<string, string>|Array<Object>|string} data The input data
         *     for this table.  When supplied an Object with string values, an empty
         *     table is returned using this Object as a schema.  When an Object with
         *     Array values is supplied, a table is returned using this object's
         *     key/value pairs as name/columns respectively.  When an Array is supplied,
         *     a table is constructed using this Array's objects as rows.  When
         *     a string is supplied, the parameter as parsed as a CSV.
         * @param {Object} [options] An optional options dictionary.
         * @param {string} options.index The name of the column in the resulting
         *     table to treat as an index.  When updating this table, rows sharing an
         *     index of a new row will be overwritten. `index` is mutually exclusive
         *     to `limit`
         * @param {integer} options.limit The maximum number of rows that can be
         *     added to this table.  When exceeded, old rows will be overwritten in
         *     the order they were inserted.  `limit` is mutually exclusive to
         *     `index`.
         *
         * @returns {table} A new {@link module:perspective~table} object.
         */
        table: function(data, options) {
            options = options || {};
            options.index = options.index || "";

            let data_accessor;
            let is_arrow = false;

            if (data instanceof ArrayBuffer || (Buffer && data instanceof Buffer)) {
                data_accessor = load_arrow_buffer(data);
                is_arrow = true;
            } else {
                if (typeof data === "string") {
                    if (data[0] === ",") {
                        data = "_" + data;
                    }
                    data = papaparse.parse(data.trim(), {dynamicTyping: true, header: true}).data;
                }

                accessor.clean();
                accessor.init(__MODULE__, data);
                data_accessor = accessor;
            }

            if (options.index && options.limit) {
                throw `Cannot specify both index '${options.index}' and limit '${options.limit}'.`;
            }

            let gnode,
                pool,
                limit_index = 0;

            try {
                pool = new __MODULE__.t_pool();

                [gnode, limit_index] = make_table(data_accessor, pool, undefined, undefined, options.index, options.limit, limit_index, false, false, is_arrow);

                return new table(gnode, pool, options.index, undefined, options.limit, limit_index);
            } catch (e) {
                if (pool) {
                    pool.delete();
                }
                if (gnode) {
                    gnode.delete();
                }
                console.error(`Table initialization failed: ${e}`);
                throw e;
            }
        }
    };

    for (let prop of Object.keys(defaults)) {
        perspective[prop] = defaults[prop];
    }

    return perspective;
}
