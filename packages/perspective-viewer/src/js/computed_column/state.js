/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {values} from "underscore";

export default class State {
    constructor() {
        this.edit = false;
        this.column_name = undefined;
        this.computation = undefined;
        this.input_columns = [];
        this.swap_target = false;
        this.name_edited = false;
    }

    is_valid() {
        const vals = values(this);
        return !vals.includes(null) && !vals.includes(undefined) && !vals.includes("") && this.input_columns.length === this.computation.num_params;
    }
}
