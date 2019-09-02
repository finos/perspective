/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as defaults from "./config/constants.js";
import {get_type_config} from "./config/index.js";
import {DataAccessor} from "./data_accessor";
import {DateParser} from "./data_accessor/date_parser.js";
import {extract_map, fill_vector} from "./emscripten.js";
import {bindall, get_column_type} from "./utils.js";
import {Server} from "./api/server.js";

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

    let _POOL_DEBOUNCES = {};

    function _set_process(pool, table_id) {
        if (!_POOL_DEBOUNCES[table_id]) {
            _POOL_DEBOUNCES[table_id] = pool;
            setTimeout(() => _clear_process(table_id));
        }
    }

    function _clear_process(table_id) {
        const pool = _POOL_DEBOUNCES[table_id];
        if (pool) {
            pool._process();
            _reset_process(table_id);
        }
    }

    function _reset_process(table_id) {
        delete _POOL_DEBOUNCES[table_id];
    }

    /**
     * Common logic for creating and registering a Table.
     *
     * @param {DataAccessor|Object[]} accessor - the data we provide to the Table
     * @param {Object} _Table - `undefined` if a new table will be created, or an `std::shared_ptr<Table>` if updating
     * @param {Object[]} computed - An array of computed columns to be applied to the table.
     * @param {String} index - A column name to be used as a primary key.
     * @param {Number} limit - an upper bound on the number of rows in the table. If set, new rows that exceed the limit start overwriting old ones from row 0.
     * @param {t_op} op - either `OP_INSERT` or `OP_DELETE`
     * @param {boolean} is_update - true if we are updating an already-created table
     * @param {boolean} is_arrow - true if the dataset is in the Arrow format
     *
     * @private
     * @returns {Table} An `std::shared_ptr<Table>` to a `Table` inside C++.
     */
    function make_table(accessor, _Table, computed, index, limit, op, is_update, is_arrow) {
        if (is_arrow) {
            for (let chunk of accessor) {
                _Table = __MODULE__.make_table(_Table, chunk, computed, limit || 4294967295, index, op, is_update, is_arrow);
            }
        } else {
            _Table = __MODULE__.make_table(_Table, accessor, computed, limit || 4294967295, index, op, is_update, is_arrow);
        }

        const pool = _Table.get_pool();
        const table_id = _Table.get_id();

        if (is_update || op == __MODULE__.t_op.OP_DELETE) {
            _set_process(pool, table_id);
        } else {
            pool._process();
        }

        return _Table;
    }

    /**
     * Converts arrow data into a canonical representation for
     * interfacing with perspective.
     *
     * @private
     * @param {object} data Array buffer
     * @returns {Array<Object>} An array containing chunked data objects with five properties:
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
    function view(table, sides, config, view_config, name, callbacks, overridden_types) {
        this._View = undefined;
        this.date_parser = new DateParser();
        this.config = config || {};
        this.view_config = view_config || new view_config();

        if (sides === 0) {
            this._View = __MODULE__.make_view_zero(table._Table, name, defaults.COLUMN_SEPARATOR_STRING, this.view_config, this.date_parser);
        } else if (sides === 1) {
            this._View = __MODULE__.make_view_one(table._Table, name, defaults.COLUMN_SEPARATOR_STRING, this.view_config, this.date_parser);
        } else if (sides === 2) {
            this._View = __MODULE__.make_view_two(table._Table, name, defaults.COLUMN_SEPARATOR_STRING, this.view_config, this.date_parser);
        }

        this.table = table;
        this.ctx = this._View.get_context();
        this.column_only = this._View.is_column_only();
        this.callbacks = callbacks;
        this.name = name;
        this.overridden_types = overridden_types;
        bindall(this);
    }

    /**
     * A copy of the config object passed to the {@link table#view} method
     * which created this {@link module:perspective~view}.
     *
     * @returns {Promise<object>} Shared the same key/values properties as {@link module:perspective~view}
     */
    view.prototype.get_config = function() {
        return JSON.parse(JSON.stringify(this.config));
    };

    /**
     * Delete this {@link module:perspective~view} and clean up all resources associated with it.
     * View objects do not stop consuming resources or processing updates when
     * they are garbage collected - you must call this method to reclaim these.
     *
     * @async
     */
    view.prototype.delete = function() {
        _reset_process(this.table.get_id());
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
    view.prototype.schema = function(override = true) {
        const schema = extract_map(this._View.schema());
        if (override) {
            for (const key of Object.keys(schema)) {
                let colname = key.split(defaults.COLUMN_SEPARATOR_STRING);
                colname = colname[colname.length - 1];
                if (this.overridden_types[colname] && get_type_config(this.overridden_types[colname]).type === schema[key]) {
                    schema[key] = this.overridden_types[colname];
                }
            }
        }
        return schema;
    };

    view.prototype._column_names = function(skip = false, depth = 0) {
        return extract_vector_scalar(this._View.column_names(skip, depth)).map(x => x.join(defaults.COLUMN_SEPARATOR_STRING));
    };

    view.prototype.get_data_slice = function(start_row, end_row, start_col, end_col) {
        const num_sides = this.sides();
        const nidx = ["zero", "one", "two"][num_sides];
        return __MODULE__[`get_data_slice_${nidx}`](this._View, start_row, end_row, start_col, end_col);
    };

    /**
     * Generic base function from which `to_json`, `to_columns` etc. derives.
     *
     * @private
     */
    const to_format = function(options, formatter) {
        _clear_process(this.table.get_id());
        options = options || {};
        const max_cols = this._View.num_columns() + (this.sides() === 0 ? 0 : 1);
        const max_rows = this._View.num_rows();
        const hidden = this._num_hidden();

        const viewport = this.config.viewport ? this.config.viewport : {};
        const start_row = options.start_row || (viewport.top ? viewport.top : 0);
        const end_row = Math.min(max_rows, options.end_row || (viewport.height ? start_row + viewport.height : max_rows));
        const start_col = options.start_col || (viewport.left ? viewport.left : 0);
        const end_col = Math.min(max_cols, (options.end_col || (viewport.width ? start_col + viewport.width : max_cols)) * (hidden + 1));

        const get_pkeys = !!options.index;
        const leaves_only = !!options.leaves_only;
        const num_sides = this.sides();
        const has_row_path = num_sides !== 0 && !this.column_only;
        const nidx = ["zero", "one", "two"][num_sides];

        const slice = this.get_data_slice(start_row, end_row, start_col, end_col);
        const ns = slice.get_column_names();
        const col_names = extract_vector_scalar(ns).map(x => x.join(defaults.COLUMN_SEPARATOR_STRING));

        let data = formatter.initDataValue();

        for (let ridx = start_row; ridx < end_row; ridx++) {
            let row_path = has_row_path ? slice.get_row_path(ridx) : undefined;
            if (has_row_path && leaves_only && row_path.size() < this.config.row_pivots.length) {
                row_path.delete();
                continue;
            }
            let row = formatter.initRowValue();
            for (let cidx = start_col; cidx < end_col; cidx++) {
                const col_name = col_names[cidx];
                if ((cidx - (num_sides > 0 ? 1 : 0)) % (this.config.columns.length + hidden) >= this.config.columns.length) {
                    // Hidden columns are always at the end, so don't emit these.
                    continue;
                } else if (cidx === start_col && num_sides !== 0) {
                    if (!this.column_only) {
                        formatter.initColumnValue(data, row, "__ROW_PATH__");
                        for (let i = 0; i < row_path.size(); i++) {
                            const value = __MODULE__.scalar_vec_to_val(row_path, i);
                            formatter.addColumnValue(data, row, "__ROW_PATH__", value);
                        }
                    }
                } else {
                    const value = __MODULE__[`get_from_data_slice_${nidx}`](slice, ridx, cidx);
                    formatter.setColumnValue(data, row, col_name, value);
                }
            }

            if (get_pkeys) {
                const keys = slice.get_pkeys(ridx, 0);
                formatter.initColumnValue(data, row, "__INDEX__");
                for (let i = 0; i < keys.size(); i++) {
                    // TODO: if __INDEX__ and set index have the same value, don't we need to make sure that it only emits one?
                    const value = __MODULE__.scalar_vec_to_val(keys, i);
                    formatter.addColumnValue(data, row, "__INDEX__", value);
                }
            }

            if (row_path) {
                row_path.delete();
            }
            formatter.addRow(data, row);
        }

        slice.delete();
        return formatter.formatData(data, options.config);
    };

    /**
     * Generic base function for returning serialized data for a single column.
     *
     * @private
     */
    const column_to_format = function(col_name, options, format_function) {
        const num_rows = this.num_rows();
        const start_row = options.start_row || 0;
        const end_row = options.end_row || num_rows;
        const names = this._column_names();
        let idx = names.indexOf(col_name);

        if (idx === -1) {
            return undefined;
        }

        // mutate the column index if necessary: in pivoted views, columns start at 1
        const num_sides = this.sides();
        if (num_sides > 0) {
            idx++;
        }

        // use a specified data slice, if provided
        let slice, data_slice;

        if (!options.data_slice) {
            data_slice = this.get_data_slice(start_row, end_row, idx, idx + 1);
            slice = data_slice.get_slice();
        } else {
            slice = options.data_slice.get_column_slice(idx);
        }

        const dtype = this._View.get_column_dtype(idx);

        const rst = format_function(slice, dtype, idx);
        slice.delete();
        if (data_slice) {
            data_slice.delete();
        }
        return rst;
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
     * @param {boolean} [config.index=false] Should the index from the underlying
     * {@link module:perspective~table} be in the output (as `"__INDEX__"`).
     *
     * @returns {Promise<Array>} A Promise resolving to An array of Objects
     * representing the rows of this {@link module:perspective~view}.  If this {@link module:perspective~view} had a
     * "row_pivots" config parameter supplied when constructed, each row Object
     * will have a "__ROW_PATH__" key, whose value specifies this row's
     * aggregated path.  If this {@link module:perspective~view} had a "column_pivots" config
     * parameter supplied, the keys of this object will be comma-prepended with
     * their comma-separated column paths.
     */
    view.prototype.to_columns = function(options) {
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
    view.prototype.to_json = function(options) {
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
    view.prototype.to_csv = function(options) {
        return to_format.call(this, options, formatters.csvFormatter);
    };

    /**
     * Serializes a view column into a TypedArray.
     *
     * @async
     *
     * @param {string} column_name The name of the column to serialize.
     *
     * @param {Object} options An optional configuration object.
     *
     * @param {*} options.data_slice A data slice object from which to serialize.
     *
     * @param {number} options.start_row The starting row index from which
     * to serialize.
     * @param {number} options.end_row The ending row index from which
     * to serialize.
     *
     * @returns {Promise<TypedArray>} A promise resolving to a TypedArray
     * representing the data of the column as retrieved from the {@link module:perspective~view} - all
     * pivots, aggregates, sorts, and filters have been applied onto the values
     * inside the TypedArray. The TypedArray will be constructed based on data type -
     * integers will resolve to Int8Array, Int16Array, or Int32Array. Floats resolve to
     * Float32Array or Float64Array. If the column cannot be found, or is not of an
     * integer/float type, the Promise returns undefined.
     */
    view.prototype.col_to_js_typed_array = function(col_name, options = {}) {
        const format_function = __MODULE__[`col_to_js_typed_array`];
        return column_to_format.call(this, col_name, options, format_function);
    };

    /**
     * Serializes a view to arrow.
     *
     * @async
     *
     * @param {Object} [options] An optional configuration object.
     *
     * @param {*} options.data_slice A data slice object from which to serialize.
     *
     * @param {number} options.start_row The starting row index from which
     * to serialize.
     * @param {number} options.end_row The ending row index from which
     * to serialize.
     * @param {number} options.start_col The starting column index from which
     * to serialize.
     * @param {number} options.end_col The ending column index from which
     * to serialize.
     *
     * @returns {Promise<ArrayBuffer>} A Table in the Apache Arrow format containing
     * data from the view.
     */
    view.prototype.to_arrow = function(options = {}) {
        const names = this._column_names();
        const schema = this.schema();

        const vectors = [];

        const start_col = options.start_col || 0;
        const end_col = options.end_col || names.length;

        for (let i = start_col; i < end_col; i++) {
            const name = names[i];
            const col_path = name.split(defaults.COLUMN_SEPARATOR_STRING);
            const type = schema[col_path[col_path.length - 1]];
            if (type === "float") {
                const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Float(new Float64(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "integer") {
                const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Int(new Int32(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "boolean") {
                const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Bool(new Bool(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "date" || type === "datetime") {
                const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
                vectors.push(Vector.new(Data.Timestamp(new TimestampSecond(), 0, vals.length, nullCount, nullArray, vals)));
            } else if (type === "string") {
                const [vals, offsets, indices, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
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
    view.prototype.num_rows = function() {
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
    view.prototype.num_columns = function() {
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
    view.prototype.get_row_expanded = function(idx) {
        return this._View.get_row_expanded(idx);
    };

    /**
     * Expands the row at index `idx`.
     *
     * @async
     *
     * @returns {Promise<void>}
     */
    view.prototype.expand = function(idx) {
        return this._View.expand(idx, this.config.row_pivots.length);
    };

    /**
     * Collapses the row at index `idx`.
     *
     * @async
     *
     * @returns {Promise<void>}
     */
    view.prototype.collapse = function(idx) {
        return this._View.collapse(idx);
    };

    /**
     * Set expansion `depth` of the pivot tree.
     *
     */
    view.prototype.set_depth = function(depth) {
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
            data = this.to_json();
        } else {
            let rows = {};
            for (let x = 0; x < delta.cells.size(); x++) {
                rows[delta.cells.get(x).row] = true;
            }
            rows = Object.keys(rows);
            const results = rows.map(row =>
                this.to_json({
                    start_row: Number.parseInt(row),
                    end_row: Number.parseInt(row) + 1
                })
            );
            data = [].concat.apply([], results);
        }
        delta.cells.delete();
        return data;
    };

    /**
     * Returns an Arrow-serialized dataset that contains the data from updated rows.
     *
     * @private
     */
    view.prototype._get_row_delta = async function() {
        let delta_slice = this._View.get_row_delta();
        let arrow = this.to_arrow({data_slice: delta_slice});
        delta_slice.delete();
        return arrow;
    };

    /**
     * Register a callback with this {@link module:perspective~view}.  Whenever the {@link module:perspective~view}'s
     * underlying table emits an update, this callback will be invoked with the
     * aggregated row deltas.
     *
     * @param {function} callback A callback function invoked on update.  The
     * parameter to this callback is dependent on the `mode` parameter:
     *     - "none" (default): The callback is invoked without an argument.
     *     - "cell": The callback is invoked with the new data for each updated cell, serialized to JSON format.
     *     - "row": The callback is invoked with an Arrow of the updated rows.
     */
    view.prototype.on_update = function(callback, {mode = "none"} = {}) {
        _clear_process(this.table.get_id());
        if (["none", "cell", "row"].indexOf(mode) === -1) {
            throw new Error(`Invalid update mode "${mode}" - valid modes are "none", "cell" and "row".`);
        }
        if (mode === "cell" || mode === "row") {
            // Enable deltas only if needed by callback
            if (!this._View._get_deltas_enabled()) {
                this._View._set_deltas_enabled(true);
            }
        }
        this.callbacks.push({
            view: this,
            orig_callback: callback,
            callback: async cache => {
                switch (mode) {
                    case "cell":
                        {
                            if (cache.step_delta === undefined) {
                                cache.step_delta = await this._get_step_delta();
                            }
                            callback(cache.step_delta);
                        }
                        break;
                    case "row":
                        {
                            if (cache.row_delta === undefined) {
                                cache.row_delta = await this._get_row_delta();
                            }
                            callback(cache.row_delta);
                        }
                        break;
                    default: {
                        callback();
                    }
                }
            }
        });
    };

    function filterInPlace(a, condition) {
        let i = 0,
            j = 0;

        while (i < a.length) {
            const val = a[i];
            if (condition(val, i, a)) a[j++] = val;
            i++;
        }

        a.length = j;
        return a;
    }

    view.prototype.remove_update = function(callback) {
        _clear_process(this.table.get_id());
        const total = this.callbacks.length;
        filterInPlace(this.callbacks, x => x.orig_callback !== callback);
        console.assert(total > this.callbacks.length, `"callback" does not match a registered updater`);
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

    /**
     * A view config is a set of options that configures the underlying {@link module:perspective~view}, specifying
     * its pivots, columns to show, aggregates, filters, and sorts.
     *
     * The view config receives an `Object` containing configuration options, and the `view_config` transforms it into a
     * canonical format for interfacing with the core engine.
     *
     * <strong>Note</strong> This constructor is not public - view config objects should be created using standard
     * Javascript `Object`s in the {@link module:perspective~table#view} method, which has an `options` parameter.
     *
     * @param {Object} config the configuration `Object` passed by the user to the {@link module:perspective~table#view} method.
     * @private
     * @class
     * @hideconstructor
     */
    function view_config(config) {
        this.row_pivots = config.row_pivots || [];
        this.column_pivots = config.column_pivots || [];
        this.aggregates = config.aggregates || {};
        this.columns = config.columns;
        this.filter = config.filter || [];
        this.sort = config.sort || [];
        this.filter_op = config.filter_op || "and";
        this.row_pivot_depth = config.row_pivot_depth;
        this.column_pivot_depth = config.column_pivot_depth;
    }

    /**
     * Transform configuration items into `std::vector` objects for interface with C++.
     * `this.aggregates` is not transformed into a C++ map, as the use of `ordered_map` in the engine
     * makes binding more difficult.
     *
     * @private
     */
    view_config.prototype.get_row_pivots = function() {
        let vector = __MODULE__.make_string_vector();
        return fill_vector(vector, this.row_pivots);
    };

    view_config.prototype.get_column_pivots = function() {
        let vector = __MODULE__.make_string_vector();
        return fill_vector(vector, this.column_pivots);
    };

    view_config.prototype.get_columns = function() {
        let vector = __MODULE__.make_string_vector();
        return fill_vector(vector, this.columns);
    };

    view_config.prototype.get_filter = function() {
        let vector = __MODULE__.make_2d_val_vector();
        for (let filter of this.filter) {
            let filter_vector = __MODULE__.make_val_vector();
            let filled = fill_vector(filter_vector, filter);
            vector.push_back(filled);
        }
        return vector;
    };

    view_config.prototype.get_sort = function() {
        let vector = __MODULE__.make_2d_string_vector();
        for (let sort of this.sort) {
            let sort_vector = __MODULE__.make_string_vector();
            let filled = fill_vector(sort_vector, sort);
            vector.push_back(filled);
        }
        return vector;
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
    function table(_Table, index, computed, limit, overridden_types) {
        this._Table = _Table;
        this.gnode_id = this._Table.get_gnode().get_id();
        this.name = Math.random() + "";
        this.initialized = false;
        this.index = index;
        this._Table.get_pool().set_update_delegate(this);
        this.computed = computed || [];
        this.callbacks = [];
        this.views = [];
        this.limit = limit;
        this.overridden_types = overridden_types;
        bindall(this);
    }

    table.prototype.get_id = function() {
        return this._Table.get_id();
    };

    table.prototype.get_pool = function() {
        return this._Table.get_pool();
    };

    table.prototype._update_callback = function() {
        let cache = {};
        for (let e in this.callbacks) {
            this.callbacks[e].callback(cache);
        }
    };

    /**
     * Remove all rows in this {@link module:perspective~table} while preserving the schema and
     * construction options.
     */
    table.prototype.clear = function() {
        _reset_process(this.get_id());
        this._Table.reset_gnode(this.gnode_id);
    };

    /**
     * Replace all rows in this {@link module:perspective~table} the input data.
     */
    table.prototype.replace = function(data) {
        _reset_process(this.get_id());
        this._Table.reset_gnode(this.gnode_id);
        this.update(data);
        _clear_process(this._Table.get_id());
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
        _reset_process(this.get_id());
        this._Table.unregister_gnode(this.gnode_id);
        this._Table.delete();
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
    table.prototype.size = function() {
        return this._Table.size();
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
    table.prototype.schema = function(computed = false, override = true) {
        let schema = this._Table.get_schema();
        let columns = schema.columns();
        let types = schema.types();
        let new_schema = {};
        const computed_schema = this.computed_schema();
        for (let key = 0; key < columns.size(); key++) {
            const name = columns.get(key);
            if (name === "psp_okey" && (typeof computed_schema[name] === "undefined" || computed)) {
                continue;
            }
            if (override && this.overridden_types[name]) {
                new_schema[name] = this.overridden_types[name];
            } else {
                new_schema[name] = get_column_type(types.get(key).value);
            }
        }
        schema.delete();
        columns.delete();
        types.delete();
        return new_schema;
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
    table.prototype.computed_schema = function() {
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

    table.prototype._is_date_filter = function(schema) {
        return key => schema[key] === "datetime" || schema[key] === "date";
    };

    table.prototype._is_valid_filter = function(filter) {
        // isNull and isNotNull filter operators are always valid and apply to all schema types
        if (filter[1] === perspective.FILTER_OPERATORS.isNull || filter[1] === perspective.FILTER_OPERATORS.isNotNull) {
            return true;
        }

        if (filter[2] === null) {
            return false;
        }

        const schema = this.schema();
        const isDateFilter = this._is_date_filter(schema);
        const value = isDateFilter(filter[0]) ? new DateParser().parse(filter[2]) : filter[2];
        return typeof value !== "undefined" && value !== null;
    };

    /**
     * Determines whether a given filter is valid.
     *
     * @param {Array<string>} [filter] A filter configuration array to test
     *
     * @returns {Promise<boolean>} Whether the filter is valid
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
        _clear_process(this.get_id());
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
            config.columns = this.columns(true);
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

        let vc = new view_config(config);
        let v = new view(this, sides, config, vc, name, this.callbacks, this.overridden_types);
        this.views.push(v);
        return v;
    };

    let meter;

    function initialize_profile_thread() {
        if (meter === undefined) {
            let _msgs = 0;
            let start = performance.now();
            setTimeout(function poll() {
                let now = performance.now();
                console.log(`${((1000 * _msgs) / (now - start)).toFixed(2)} msgs/sec`);
                _msgs = 0;
                start = now;
                setTimeout(poll, 5000);
            }, 5000);
            meter = function update(x) {
                _msgs += x;
            };
            console.log("Profiling initialized");
        }
    }

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
        let cols = this.columns();
        let schema = this._Table.get_schema();
        let types = schema.types();
        let is_arrow = false;

        pdata = accessor;

        if (data instanceof ArrayBuffer) {
            pdata = load_arrow_buffer(data, cols, types);
            if (meter) {
                meter(pdata.map(x => x.row_count).reduce((x, y) => x + y));
            }
            is_arrow = true;
        } else if (typeof data === "string") {
            if (data[0] === ",") {
                data = "_" + data;
            }
            accessor.init(papaparse.parse(data.trim(), {header: true}).data);
            accessor.names = cols.concat(accessor.names.filter(x => x === "__INDEX__"));
            accessor.types = accessor.extract_typevec(types).slice(0, accessor.names.length);

            if (meter) {
                meter(accessor.row_count);
            }
        } else {
            accessor.init(data);
            accessor.names = cols.concat(accessor.names.filter(x => x === "__INDEX__"));
            accessor.types = accessor.extract_typevec(types).slice(0, accessor.names.length);

            if (meter) {
                meter(accessor.row_count);
            }
        }

        if (pdata.row_count === 0) {
            console.warn("table.update called with no data - ignoring");
            return;
        }

        // process implicit index column
        const has_index = accessor.names.indexOf("__INDEX__");
        if (has_index != -1) {
            const explicit_index = !!this.index;
            if (explicit_index) {
                // find the type of the index column
                accessor.types.push(accessor.types[accessor.names.indexOf(this.index)]);
            } else {
                // default index is an integer
                accessor.types.push(__MODULE__.t_dtype.DTYPE_INT32);
            }
        }

        try {
            const op = __MODULE__.t_op.OP_INSERT;
            // update the Table in C++, but don't keep the returned Table reference as it is identical
            make_table(pdata, this._Table, this.computed, this.index || "", this.limit, op, true, is_arrow);
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
        let cols = this.columns();
        let schema = this._Table.get_schema();
        let types = schema.types();
        let is_arrow = false;

        data = data.map(idx => ({[this.index]: idx}));

        if (data instanceof ArrayBuffer) {
            pdata = load_arrow_buffer(data, [this.index], types);
            is_arrow = true;
        } else {
            accessor.init(data);
            accessor.names = [this.index];
            accessor.types = [accessor.extract_typevec(types)[cols.indexOf(this.index)]];
            pdata = accessor;
        }

        try {
            const op = __MODULE__.t_op.OP_DELETE;
            // update the Table in C++, but don't keep the returned Table reference as it is identical
            make_table(pdata, this._Table, undefined, this.index || "", this.limit, op, false, is_arrow);
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
        let _Table;

        try {
            _Table = __MODULE__.make_computed_table(this._Table, computed);
            if (this.computed.length > 0) {
                computed = this.computed.concat(computed);
            }
            return new table(_Table, this.index, computed, this.limit, this.overridden_types);
        } catch (e) {
            if (_Table) {
                _Table.delete();
            }
            throw e;
        }
    };

    /**
     * The column names of this table.
     *
     * @async
     * @param {boolean} computed Should computed columns be included?
     * (default false)
     * @returns {Promise<Array<string>>} An array of column names for this table.
     */
    table.prototype.columns = function(computed = false) {
        let schema = this._Table.get_schema();
        let computed_schema = this.computed_schema();
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

    table.prototype.execute = function(f) {
        f(this);
    };

    /******************************************************************************
     *
     * Perspective
     *
     */

    const perspective = {
        __module__: __MODULE__,

        Server,

        worker: function() {
            return this;
        },

        initialize_profile_thread,

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
            let overridden_types = {};

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
                overridden_types = accessor.init(data);
                data_accessor = accessor;
            }

            if (options.index && options.limit) {
                throw `Cannot specify both index '${options.index}' and limit '${options.limit}'.`;
            }

            let _Table;

            try {
                const op = __MODULE__.t_op.OP_INSERT;
                _Table = make_table(data_accessor, undefined, undefined, options.index, options.limit, op, false, is_arrow);
                return new table(_Table, options.index, undefined, options.limit, overridden_types);
            } catch (e) {
                if (_Table) {
                    _Table.delete();
                }
                console.error(`Table initialization failed: ${e}`);
                throw e;
            }
        }
    };

    for (let prop of Object.keys(defaults)) {
        perspective[prop] = defaults[prop];
    }

    /**
     * Hosting Perspective
     *
     * Create a WebWorker API that loads perspective in `init` and extends
     * `post` using the worker's `postMessage` method.
     *
     * If Perspective is running inside a Web Worker, use the WebSorkerServer
     * as default.
     *
     * @extends Server
     * @private
     */
    class WebWorkerServer extends Server {
        /**
         * On initialization, listen for messages posted from the client and send it to `Server.process()`.
         *
         * @param perspective a reference to the Perspective module, allowing the `Server` to access Perspective methods.
         */
        constructor(perspective) {
            super(perspective);
            self.addEventListener("message", e => this.process(e.data), false);
        }

        /**
         * Implements the `Server`'s `post()` method using the Web Worker `postMessage()` API.
         *
         * @param {Object} msg a message to pass to the client
         * @param {*} transfer a transferable object to pass to the client, if needed
         */
        post(msg, transfer) {
            self.postMessage(msg, transfer);
        }

        /**
         * When initialized, replace Perspective's internal `__MODULE` variable with the WASM binary.
         *
         * @param {ArrayBuffer} buffer an ArrayBuffer containing the Perspective WASM code
         */
        init(msg) {
            if (typeof WebAssembly === "undefined") {
                throw new Error("WebAssembly not supported");
            } else {
                console.log("Loading wasm");
                __MODULE__ = __MODULE__({
                    wasmBinary: msg.buffer,
                    wasmJSMethod: "native-wasm"
                }).then(() => super.init(msg));
            }
        }
    }

    /**
     * Use WebSorkerServer as default inside a Web Worker, where `window` is replaced with `self`.
     */
    if (typeof self !== "undefined" && self.addEventListener) {
        new WebWorkerServer(perspective);
    }

    return perspective;
}
