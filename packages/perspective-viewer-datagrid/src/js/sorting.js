/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export async function configureSortable(table, viewer) {
    table.addEventListener("regular-table-psp-sort", event => {
        this._preserve_focus_state = true;
        viewer.restore({sort: event.detail.sort});
    });
}
