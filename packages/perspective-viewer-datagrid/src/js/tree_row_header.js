/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {html} from "./utils";

function _tree_header_classes(name, type, is_leaf) {
    const cls = this._format_class(type)(name);
    const header_classes = ["pd-group-name"];
    if (is_leaf) {
        header_classes.push("pd-group-leaf");
    }

    if (cls) {
        header_classes.push(cls);
    }

    return header_classes.join(" ");
}

function _tree_header_levels(path, is_open, is_leaf) {
    const tree_levels = path.map(() => `<span class="pd-tree-group"></span>`);
    if (!is_leaf) {
        const group_icon = is_open ? "remove" : "add";
        const tree_button = `<span class="pd-row-header-icon">${group_icon}</span>`;
        tree_levels.push(tree_button);
    }

    return tree_levels.join("");
}

export function tree_header(td, path, types, is_leaf, is_open) {
    const type = types[path.length - 1];
    const name = path.length === 0 ? "TOTAL" : path[path.length - 1];
    const header_classes = _tree_header_classes.call(this, name, type, is_leaf);
    const tree_levels = _tree_header_levels(path, is_open, is_leaf);
    const header_text = this._format_text(type)(name);

    td.classList.add("pd-group-header");
    td.innerHTML = html`
        <span class="pd-tree-container">
            ${tree_levels}
            <span class="${header_classes}">${header_text}</span>
        </span>
    `;
}
