/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// const selected_position_map = new WeakMap();

export const focus_style_listener = (table, _viewer, selected_position_map) => {
    const tds = table.querySelectorAll("td");
    const selected_position = selected_position_map.get(table);
    if (selected_position) {
        for (const td of tds) {
            const meta = table.getMeta(td);
            if (
                meta.x === selected_position.x &&
                meta.y === selected_position.y
            ) {
                if (document.activeElement !== td) {
                    td.focus({preventScroll: true});
                }
                return true;
            }
        }
        if (
            document.activeElement !== document.body &&
            table.contains(document.activeElement)
        ) {
            document.activeElement.blur();
        }
    }
};
