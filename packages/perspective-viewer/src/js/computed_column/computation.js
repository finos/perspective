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
    constructor(name, formatter, input_type, return_type, func, category, num_params = 1) {
        this.category = category;
        this.name = name;
        this[FORMATTER] = formatter;
        this.input_type = input_type;
        this.return_type = return_type;
        this.func = func.toString();
        this.num_params = num_params;
    }
}
