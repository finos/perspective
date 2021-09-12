/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {get_column_type} from "../utils.js";
import {get_type_config} from "../config/index.js";

export class DataAccessor {
    constructor() {
        this.data_formats = {
            row: 0,
            column: 1,
            schema: 2,
        };
        this.format = undefined;
        this.data = undefined;
        this.names = undefined;
        this.types = undefined;
        this.row_count = undefined;
    }

    is_format(data) {
        if (Array.isArray(data)) {
            return this.data_formats.row;
        } else if (Array.isArray(data[Object.keys(data)[0]])) {
            return this.data_formats.column;
        } else if (
            typeof data[Object.keys(data)[0]] === "string" ||
            typeof data[Object.keys(data)[0]] === "function"
        ) {
            return this.data_formats.schema;
        } else {
            throw `Could not determine data format for ${JSON.stringify(
                data
            )}, with JS typeof ${typeof data}`;
        }
    }

    count_rows(data) {
        if (this.format === this.data_formats.row) {
            return data.length;
        } else if (this.format === this.data_formats.column) {
            return data[Object.keys(data)[0]].length;
        } else {
            return 0;
        }
    }

    get_format() {
        return this.format;
    }

    get(column_name, row_index) {
        let value = undefined;

        if (this.format === this.data_formats.row) {
            let d = this.data[row_index];
            if (d.hasOwnProperty(column_name)) {
                value = d[column_name];
            }
        } else if (this.format === this.data_formats.column) {
            if (this.data.hasOwnProperty(column_name)) {
                value = this.data[column_name][row_index];
            }
        } else if (this.format === this.data_formats.schema) {
            value = undefined;
        } else {
            throw `Could not get() from dataset - ${this.data} is poorly formatted.`;
        }

        return value;
    }

    marshal(column_index, row_index, type) {
        const column_name = this.names[column_index];
        let val = clean_data(this.get(column_name, row_index));

        if (val === null) {
            return null;
        }

        if (typeof val === "undefined") {
            return undefined;
        }

        switch (get_column_type(type.value)) {
            case "float":
            case "integer": {
                val = Number(val);
                break;
            }
            case "boolean": {
                if (typeof val === "string") {
                    val.toLowerCase() === "true" ? (val = true) : (val = false);
                } else {
                    val = !!val;
                }
                break;
            }
            case "datetime":
            case "date": {
                break;
            }
            default: {
                val += ""; // TODO this is not right - might not be a string.  Need a data cleaner
            }
        }

        return val;
    }

    /**
     * Resets the internal state of the accessor, preventing collisions with
     * previously set data.
     *
     * @private
     */
    clean() {
        this.names = undefined;
        this.types = undefined;
    }

    /**
     * Links the accessor to a package of data for processing, calculating its
     * format and size.
     *
     * @private
     * @param {object} data
     *
     * @returns An object with 5 properties:
     *    cdata - an array of columnar data.
     *    names - the column names.
     *    types - the column t_dtypes.
     *    row_count - the number of rows per column.
     *    is_arrow - an internal flag marking arrow-formatted data
     */
    init(data) {
        this.data = data;
        this.format = this.is_format(this.data);
        this.row_count = this.count_rows(this.data);
        const overridden_types = {};
        if (this.format === this.data_formats.row) {
            if (data.length > 0) {
                this.names = Object.keys(data[0]);
            } else {
                this.clean.names = [];
            }
        } else if (this.format === this.data_formats.column) {
            this.names = Object.keys(data);
        } else if (this.format === this.data_formats.schema) {
            this.names = Object.keys(data);
            for (const name of this.names) {
                const new_type = get_type_config(data[name]);
                if (new_type.type) {
                    console.debug(
                        `Converting "${data[name]}" to "${new_type.type}"`
                    );
                    overridden_types[name] = data[name];
                    data[name] = new_type.type;
                }
            }
        } else {
            throw `Could not initialize - failed to determine format for ${data}`;
        }
        return overridden_types;
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
