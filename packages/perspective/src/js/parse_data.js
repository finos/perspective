/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DateParser, is_valid_date} from "./date_parser.js";

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
    // todo: refactor, treat columnar/row data as the same to marshal values + fix null handling
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
            // data transformation
            for (let x = 0; x < data.length; x++) {
                if (!(name in data[x]) || clean_data(data[x][name]) === undefined) {
                    col.push(undefined);
                    continue;
                }
                if (inferredType.value === __MODULE__.t_dtype.DTYPE_FLOAT64.value) {
                    let val = clean_data(data[x][name]);
                    if (val !== null) {
                        val = Number(val);
                    }
                    col.push(val);
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_INT32.value) {
                    let val = clean_data(data[x][name]);
                    if (val !== null) val = Number(val);
                    col.push(val);
                    if (val > 2147483647 || val < -2147483648) {
                        types[n] = __MODULE__.t_dtype.DTYPE_FLOAT64;
                    }
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_BOOL.value) {
                    let cell = clean_data(data[x][name]);
                    if (cell === null) {
                        col.push(null);
                        continue;
                    }

                    if (typeof cell === "string") {
                        if (cell.toLowerCase() === "true") {
                            col.push(true);
                        } else {
                            col.push(false);
                        }
                    } else {
                        col.push(!!cell);
                    }
                } else if (inferredType.value === __MODULE__.t_dtype.DTYPE_TIME.value || inferredType.value === __MODULE__.t_dtype.DTYPE_DATE.value) {
                    let val = clean_data(data[x][name]);
                    if (val !== null) {
                        col.push(parser.parse(val));
                    } else {
                        col.push(null);
                    }
                } else {
                    let val = clean_data(data[x][name]);
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
        // }
        names = [];

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
            } else if (data[name] === "datetime") {
                types.push(__MODULE__.t_dtype.DTYPE_TIME);
            } else if (data[name] === "date") {
                types.push(__MODULE__.t_dtype.DTYPE_DATE);
            } else {
                throw `Unknown type ${data[name]}`;
            }
            cdata.push([]);
        }
    } else {
        throw "Unknown data type";
    }

    // separate methods to return each property
    return {
        row_count: row_count,
        is_arrow: false,
        names: names,
        types: types,
        cdata: cdata
    };
}
