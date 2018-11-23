/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DateParser, is_valid_date} from "./date_parser.js";

export class DataParser {
    constructor() {
        this.data_formats = {
            row: 1,
            column: 2,
            arrow: 3
        };
    }

    is_format(data) {
        if (Array.isArray(data)) {
            return this.data_formats.row;
        } else if (Array.isArray(data[Object.keys(data)[0]])) {
            return this.data_formats.column;
        } else if (typeof data[Object.keys(data)[0]] === "string" || typeof data[Object.keys(data)[0]] === "function") {
            // TODO: is this format a schema or an arrow?
            return this.data_formats.arrow;
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
        } else if (format === this.data_formats.arrow) {
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

        if (format === this.data_formats.arrow) {
            for (let name in data) {
                types.push(name_to_psp_type(__MODULE__, data[name]));
            }
        } else {
            for (let name of column_names) {
                let type = this.get_data_type(__MODULE__, data, format, name);
                types.push(type);
            }
        }
        return types;
    }

    get_data_type(__MODULE__, data, format, name) {
        let i = 0;
        let inferredType = null;
        let infer_from;

        while (inferredType === null && i < 100 && i < data.length) {
            if (format === this.data_formats.row) {
                infer_from = data[i][name];
            } else if (format === this.data_formats.column) {
                infer_from = data[name][i];
            }
            inferredType = infer_type(__MODULE__, infer_from);
            i++;
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
                    if (!name in d || clean_data(d[name] == undefined)) {
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
            for (let name of column_names) {
                // Extract the data or fill with undefined if column doesn't exist (nothing in column changed)
                let transformed;
                row_count = data[name[0]].length;
                if (data.hasOwnProperty(name)) {
                    transformed = data[name].map(clean_data);
                } else {
                    transformed = new Array(row_count);
                }
                cdata.push(transformed);
            }
        } else if (format === this.data_formats.arrow) {
            // eslint-disable-next-line no-unused-vars
            for (let name in data) {
                cdata.push([]);
            }
        }

        return [cdata, row_count];
    }

    parse(__MODULE__, data) {
        const format = this.is_format(data);
        let names = this.column_names(data, format);
        let types = this.data_types(__MODULE__, data, format, names);
        let [cdata, row_count] = this.make_columnar_data(__MODULE__, data, format, names, types);
        return {cdata, names, types, row_count, is_arrow: false};
    }
}

/**
 * Infer the t_dtype of a value.
 * @private
 * @returns A t_dtype.
 */
function infer_type(__MODULE__, x) {
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
        if (x.getHours() === 0 && x.getMinutes() === 0 && x.getSeconds() === 0 && x.getMilliseconds() === 0) {
            t = __MODULE__.t_dtype.DTYPE_DATE;
        } else {
            t = __MODULE__.t_dtype.DTYPE_TIME;
        }
    } else if (!isNaN(Number(x)) && x !== "") {
        t = __MODULE__.t_dtype.DTYPE_FLOAT64;
    } else if (typeof x === "string" && is_valid_date(x)) {
        t = __MODULE__.t_dtype.DTYPE_TIME;
    } else if (typeof x === "string") {
        let lower = x.toLowerCase();
        if (lower === "true" || lower === "false") {
            t = __MODULE__.t_dtype.DTYPE_BOOL;
        } else {
            t = __MODULE__.t_dtype.DTYPE_STR;
        }
    }
    return t;
}

// TODO: move this to CPP so we don't have to pass module back and forth
function name_to_psp_type(__MODULE__, name) {
    const dtypes = __MODULE__.t_dtype;
    switch (name) {
        case "integer":
            return dtypes.DTYPE_INT32;
        case "float":
            return dtypes.DTYPE_FLOAT64;
        case "string":
            return dtypes.DTYPE_STR;
        case "boolean":
            return dtypes.DTYPE_BOOL;
        case "datetime":
            return dtypes.DTYPE_TIME;
        case "date":
            return dtypes.DTYPE_DATE;
        default:
            throw `Unknown type: ${name}`;
    }
}

/**
 * Converts any supported input type into a canonical representation for
 * interfacing with perspective.
 *
 * @private
 * @param {object} data See docs
 * @returns An object with 3 properties:
 *    names - the column names.
 *    types - the column t_dtypes.
 *    cdata - an array of columnar data.
 */
export function parse_data(__MODULE__, data, names, types) {
    let preloaded = types ? true : false;
    if (types === undefined) {
        types = [];
    } else {
        let _types = [];
        for (let t = 0; t < types.size() - 1; t++) {
            _types.push(types.get(t));
        }
        types = _types;
    }
    let cdata = [];

    let row_count = 0;

    if (Array.isArray(data)) {
        // Row oriented
        if (data.length === 0) {
            throw "Not yet implemented: instantiate empty grid without column type";
        }
        let max_check = 50;
        if (names === undefined) {
            names = Object.keys(data[0]);
            for (let ix = 0; ix < Math.min(max_check, data.length); ix++) {
                let next = Object.keys(data[ix]);
                if (names.length !== next.length) {
                    if (next.length > names.length) {
                        if (max_check === 50) console.warn("Array data has inconsistent rows");
                        console.warn("Extending from " + names.length + " to " + next.length);
                        names = next;
                        max_check *= 2;
                    }
                }
            }
        }
        for (let n in names) {
            let name = names[n];
            let i = 0,
                inferredType = undefined;
            // type inferrence
            if (!preloaded) {
                while (!inferredType && i < 100 && i < data.length) {
                    if (data[i].hasOwnProperty(name)) {
                        inferredType = infer_type(__MODULE__, data[i][name]);
                    }
                    i++;
                }
                inferredType = inferredType || __MODULE__.t_dtype.DTYPE_STR;
                types.push(inferredType);
            } else {
                inferredType = types[parseInt(n)];
            }
            if (inferredType === undefined) {
                console.warn(`Could not infer type for column ${name}`);
                inferredType = __MODULE__.t_dtype.DTYPE_STR;
            }
            let col = [];
            const parser = new DateParser();

            for (let x = 0; x < data.length; x++) {
                if (!(name in data[x]) || clean_data(data[x][name]) === undefined) {
                    col.push(undefined);
                    continue;
                }

                let val = clean_data(data[x][name]);
                if (inferredType.value === __MODULE__.t_dtype.DTYPE_FLOAT64.value) {
                    if (val !== null) {
                        val = Number(val);
                    }
                    col.push(val);
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_INT32.value) {
                    if (val !== null) val = Number(val);
                    col.push(val);
                    if (val > 2147483647 || val < -2147483648) {
                        types[n] = __MODULE__.t_dtype.DTYPE_FLOAT64;
                    }
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_BOOL.value) {
                    if (val === null) {
                        col.push(null);
                        continue;
                    }

                    if (typeof val === "string") {
                        if (val.toLowerCase() === "true") {
                            col.push(true);
                        } else {
                            col.push(false);
                        }
                    } else {
                        col.push(!!val);
                    }
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_TIME.value || inferredType.value === __MODULE__.t_dtype.DTYPE_DATE.value) {
                    if (val !== null) {
                        col.push(parser.parse(val));
                    } else {
                        col.push(null);
                    }
                } else {
                    // types[types.length - 1].value === 19 ? "" : 0
                    col.push(val === null ? null : "" + val); // TODO this is not right - might not be a string.  Need a data cleaner
                }
            }
            cdata.push(col);
            row_count = col.length;
        }
    } else if (Array.isArray(data[Object.keys(data)[0]])) {
        // Column oriented update. Extending schema not supported here.

        const names_in_update = Object.keys(data);
        row_count = data[names_in_update[0]].length;
        names = names || names_in_update;

        for (let col_num = 0; col_num < names.length; col_num++) {
            const name = names[col_num];

            // Infer column type if necessary
            if (!preloaded) {
                let i = 0;
                let inferredType = null;
                while (inferredType === null && i < 100 && i < data[name].length) {
                    inferredType = infer_type(__MODULE__, data[name][i]);
                    i++;
                }
                inferredType = inferredType || __MODULE__.t_dtype.DTYPE_STR;
                types.push(inferredType);
            }

            // Extract the data or fill with undefined if column doesn't exist (nothing in column changed)
            let transformed; // data transformation
            if (data.hasOwnProperty(name)) {
                transformed = data[name].map(clean_data);
            } else {
                transformed = new Array(row_count);
            }
            cdata.push(transformed);
        }
    } else if (typeof data[Object.keys(data)[0]] === "string" || typeof data[Object.keys(data)[0]] === "function") {
        // Arrow data/'

        //if (this.initialized) {
        //  throw "Cannot update already initialized table with schema.";
        //}
        names = [];

        // Empty type dict
        for (let name in data) {
            names.push(name);
            types.push(name_to_psp_type(__MODULE__, data[name]));
            cdata.push([]);
        }
    } else {
        throw "Unknown data type";
    }

    return {
        row_count: row_count,
        is_arrow: false,
        names: names,
        types: types,
        cdata: cdata
    };
}

/**
 * Coerce string null into value null.
 * @private
 * @param {*} value
 */
export function clean_data(value) {
    if (value === null || value === "null") {
        return null;
    } else {
        return value;
    }
}
