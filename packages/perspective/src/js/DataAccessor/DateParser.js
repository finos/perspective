/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import moment from "moment";

export const DATE_PARSE_CANDIDATES = [moment.ISO_8601, moment.RFC_2822, "YYYY-MM-DD\\DHH:mm:ss.SSSS", "MM-DD-YYYY", "MM/DD/YYYY", "M/D/YYYY", "M/D/YY", "DD MMM YYYY", "HH:mm:ss.SSS"];

/**
 *
 *
 * @export
 * @param {string} x
 * @returns
 */
export function is_valid_date(x) {
    return moment(x, DATE_PARSE_CANDIDATES, true).isValid();
}

/**
 *
 *
 * @export
 * @class DateParser
 */
export class DateParser {
    constructor() {
        this.date_types = [];
        this.date_candidates = DATE_PARSE_CANDIDATES.slice();
        this.date_exclusions = [];
    }

    parse(input) {
        if (this.date_exclusions.indexOf(input) > -1) {
            return null;
        } else {
            let val = input;
            if (typeof val === "string") {
                val = moment(input, this.date_types, true);
                if (!val.isValid() || this.date_types.length === 0) {
                    for (let candidate of this.date_candidates) {
                        val = moment(input, candidate, true);
                        if (val.isValid()) {
                            this.date_types.push(candidate);
                            this.date_candidates.splice(this.date_candidates.indexOf(candidate), 1);
                            return val.toDate();
                        }
                    }
                    this.date_exclusions.push(input);
                    return null;
                }
                return val.toDate();
            }
            return val;
        }
    }
}
