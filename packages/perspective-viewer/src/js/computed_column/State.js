/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export default class State {
    constructor() {
        return {
            errors: {
                input_column: undefined,
                save: undefined,
            },
            column_name: undefined,
            computation: undefined,
            input_columns: [],
            name_edited: false,
        }
    }
}