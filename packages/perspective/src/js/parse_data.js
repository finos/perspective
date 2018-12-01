/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DateParser, DATE_PARSE_CANDIDATES} from "./date_parser.js";
import moment from "moment";

export class DataParser {
    constructor() {
        this.data_formats = {
            row: 1,
            column: 2,
            schema: 3
        };
    }

    extract_typevec(typevec) {
        let types = [];
        for (let i = 0; i < typevec.size() - 1; i++) {
            types.push(typevec.get(i));
        }
        return types;
    }

    is_format(data) {
        if (Array.isArray(data)) {
            return this.data_formats.row;
        } else if (Array.isArray(data[Object.keys(data)[0]])) {
            return this.data_formats.column;
        } else if (typeof data[Object.keys(data)[0]] === "string" || typeof data[Object.keys(data)[0]] === "function") {
            return this.data_formats.schema;
        } else {
            throw "Unknown data type!";
        }
    }

    column_names(data, format) {
        let column_names = [];
        if (format === this.data_formats.row) {
            let max_check = 50;
            column_names = Object.keys(data[0]);
            for (let ix = 0; ix < Math.min(max_check, data.length); ix++) {
                let next = Object.keys(data[ix]);
                if (column_names.length !== next.length) {
                    if (next.length > column_names.length) {
                        if (max_check === 50) console.warn("Array data has inconsistent rows");
                        console.warn("Extending from " + column_names.length + " to " + next.length);
                        column_names = next;
                        max_check *= 2;
                    }
                }
            }
        } else if (format === this.data_formats.column) {
            column_names = Object.keys(data);
        } else if (format === this.data_formats.schema) {
            for (let name in data) {
                column_names.push(name);
            }
        }

        return column_names;
    }

    data_types(__MODULE__, data, format, column_names) {
        let types = [];

        if (!column_names) {
            throw "Cannot determine data types without column names!";
        }

        if (format === this.data_formats.schema) {
            for (let name in data) {
                const dtypes = __MODULE__.t_dtype;
                let type = undefined;
                switch (data[name]) {
                    case "integer":
                        type = dtypes.DTYPE_INT32;
                        break;
                    case "float":
                        type = dtypes.DTYPE_FLOAT64;
                        break;
                    case "string":
                        type = dtypes.DTYPE_STR;
                        break;
                    case "boolean":
                        type = dtypes.DTYPE_BOOL;
                        break;
                    case "datetime":
                        type = dtypes.DTYPE_TIME;
                        break;
                    case "date":
                        type = dtypes.DTYPE_DATE;
                        break;
                    default:
                        throw `Unknown type: ${name}`;
                }

                types.push(type);
            }
            return types;
        }

        for (let name of column_names) {
            let type = this.get_data_type(__MODULE__, data, format, name);
            types.push(type);
        }

        return types;
    }

    get_data_type(__MODULE__, data, format, name) {
        let i = 0;
        let inferredType = undefined;

        if (format === this.data_formats.row) {
            while (inferredType === undefined && i < 100 && i < data.length) {
                if (data[i].hasOwnProperty(name)) {
                    if (data[i][name] !== null) {
                        inferredType = __MODULE__.infer_type(data[i][name], moment, DATE_PARSE_CANDIDATES);
                    } else {
                        inferredType = null;
                    }
                }
                i++;
            }
        } else if (format === this.data_formats.column) {
            while (inferredType === undefined && i < 100 && i < data[name].length) {
                if (data[name][i] !== null) {
                    inferredType = __MODULE__.infer_type(data[name][i], moment, DATE_PARSE_CANDIDATES);
                } else {
                    inferredType = null;
                }
                i++;
            }
        }

        return inferredType || __MODULE__.t_dtype.DTYPE_STR;
    }

    make_columnar_data(__MODULE__, data, format, column_names, data_types) {
        let cdata = [];
        let row_count = 0;

        if (format === this.data_formats.row) {
            if (data.length === 0) {
                throw "Not yet implemented: instantiate empty grid without column type";
            }

            for (let name of column_names) {
                let type = data_types[column_names.indexOf(name)];
                let col = [];
                const date_parser = new DateParser();

                for (let d of data) {
                    if (typeof clean_data(d[name]) === "undefined") {
                        col.push(undefined);
                        continue;
                    }

                    let val = clean_data(d[name]);
                    if (val === null) {
                        col.push(val);
                        continue;
                    }

                    switch (type.value) {
                        case __MODULE__.t_dtype.DTYPE_FLOAT64.value:
                        case __MODULE__.t_dtype.DTYPE_INT32.value: {
                            col.push(Number(val));
                            if (val > 2147483647 || val < -2147483648) {
                                // Avoid overflow errors
                                data_types[column_names.indexOf(name)] = __MODULE__.t_dtype.DTYPE_FLOAT64;
                            }
                            break;
                        }
                        case __MODULE__.t_dtype.DTYPE_BOOL.value: {
                            if (typeof val === "string") {
                                val.toLowerCase() === "true" ? col.push(true) : col.push(false);
                            } else {
                                col.push(!!val);
                            }
                            break;
                        }
                        case __MODULE__.t_dtype.DTYPE_TIME.value:
                        case __MODULE__.t_dtype.DTYPE_DATE.value: {
                            col.push(date_parser.parse(val));
                            break;
                        }
                        default: {
                            col.push(val === null ? null : "" + val); // TODO this is not right - might not be a string.  Need a data cleaner
                        }
                    }
                }

                cdata.push(col);
                row_count = col.length;
            }
        } else if (format === this.data_formats.column) {
            row_count = data[Object.keys(data)[0]].length;
            for (let name of column_names) {
                // Extract the data or fill with undefined if column doesn't exist (nothing in column changed)
                let transformed;
                if (data.hasOwnProperty(name)) {
                    transformed = data[name].map(clean_data);
                } else {
                    transformed = new Array(row_count);
                }
                cdata.push(transformed);
            }
        } else if (format === this.data_formats.schema) {
            // eslint-disable-next-line no-unused-vars
            for (let name in data) {
                cdata.push([]);
            }
        }

        return [cdata, row_count];
    }

    /**
     * Converts supported inputs into canonical data for
     * interfacing with perspective.
     *
     * @private
     * @param {object} __MODULE__: the Module object generated by Emscripten
     * @param {object} data
     *
     * @returns An object with 5 properties:
     *    cdata - an array of columnar data.
     *    names - the column names.
     *    types - the column t_dtypes.
     *    row_count - the number of rows per column.
     *    is_arrow - an internal flag marking arrow-formatted data
     */
    parse(__MODULE__, data) {
        const format = this.is_format(data);
        let names = this.column_names(data, format);
        let types = this.data_types(__MODULE__, data, format, names);
        let [cdata, row_count] = this.make_columnar_data(__MODULE__, data, format, names, types);
        return {cdata, names, types, row_count, is_arrow: false};
    }

    /**
     * Convert data with given names and types for
     * interfacing with perspective.
     *
     * @private
     * @param {object} __MODULE__: the Module object generated by Emscripten
     * @param {object} data
     * @param {object} data
     * @param {object} data
     *
     * @returns An object with 5 properties:
     *    cdata - an array of columnar data.
     *    names - the column names.
     *    types - the column t_dtypes.
     *    row_count - the number of rows per column.
     *    is_arrow - an internal flag marking arrow-formatted data
     */
    update(__MODULE__, data, names, data_types) {
        let types = this.extract_typevec(data_types);
        const format = this.is_format(data);
        let [cdata, row_count] = this.make_columnar_data(__MODULE__, data, format, names, types);
        return {cdata, names, types, row_count, is_arrow: false};
    }
}

/**
 * Coerce string null into value null.
 * @private
 * @param {*} value
 */
export function clean_data(value) {
    if (value === null || value === "null") {
        return null;
    } else if (value === undefined || value === "undefined") {
        return undefined;
    } else {
        return value;
    }
}
