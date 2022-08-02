/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export function cell_style_boolean(plugin, td, metadata) {
    const [hex] =
        metadata.user === true
            ? this._pos_fg_color
            : metadata.user === false
            ? this._neg_fg_color
            : ["", 0, 0, 0, ""];

    td.style.backgroundColor = "";
    td.style.color = hex;
}
