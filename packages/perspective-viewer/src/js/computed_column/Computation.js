/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export default class Computation {
    constructor(name, input_type, return_type, func, num_params = 1) {
        this.name = name;
        this.input_type = input_type;
        this.return_type = return_type;
        this.func = func.toString();
        this.num_params = num_params;
    }
}
