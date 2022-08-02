/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export async function deselect_all_listener(
    regularTable,
    _viewer,
    selected_rows_map
) {
    selected_rows_map.delete(regularTable);
    for (const td of regularTable.querySelectorAll("td,th")) {
        td.classList.toggle("psp-row-selected", false);
        td.classList.toggle("psp-row-subselected", false);
    }
}
