/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {rebindAll} from "d3fc";

export default (adaptee) => {
    const withoutTicks = (arg) => {
        return adaptee(arg);
    };

    rebindAll(withoutTicks, adaptee);

    withoutTicks.ticks = function () {
        return [];
    };

    return withoutTicks;
};
