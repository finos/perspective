/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const FORMATTER = Symbol("formatter");

export class Computation {
    constructor(computed_function_name, formatter, input_type, return_type, category, num_params = 1) {
        this.category = category;
        this.computed_function_name = computed_function_name;
        this[FORMATTER] = formatter;
        this.input_type = input_type;
        this.return_type = return_type;
        this.num_params = num_params;
    }
}
