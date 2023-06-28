// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

/**
 * Restore a saved column width override token.
 *
 * @param {*} token An object previously returned by a call to
 * `_save_column_size_overrides()`
 * @param {*} [cache=false] A flag indicating whether this value should
 * be cached so a future `resetAutoSize()` call does not clear it.
 * @returns
 */
export function restore_column_size_overrides(old_sizes, cache = false) {
    if (!this._initialized) {
        return;
    }

    if (cache) {
        this._cached_column_sizes = old_sizes;
    }

    const overrides = {};
    const { group_by, columns } = this.model._config;
    const tree_header_offset = group_by?.length > 0 ? group_by.length + 1 : 0;

    for (const key of Object.keys(old_sizes)) {
        if (key === "__ROW_PATH__") {
            overrides[tree_header_offset - 1] = old_sizes[key];
        } else {
            const index = this.model._column_paths.indexOf(key);
            overrides[index + tree_header_offset] = old_sizes[key];
        }
    }

    this.regular_table._column_sizes.override = overrides;
}

/**
 * Extract the current user-overriden column widths from
 * `regular-table`.  This functiond depends on the internal
 * implementation of `regular-table` and may break!
 *
 * @returns An Object-as-dictionary keyed by column_path string, and
 * valued by the column's user-overridden pixel width.
 */
export function save_column_size_overrides() {
    if (!this._initialized) {
        return [];
    }

    if (this._cached_column_sizes) {
        const x = this._cached_column_sizes;
        this._cached_column_sizes = undefined;
        return x;
    }

    const overrides = this.regular_table._column_sizes.override;
    const { group_by, columns } = this.model._config;
    const tree_header_offset = group_by?.length > 0 ? group_by.length + 1 : 0;

    const old_sizes = {};
    for (const key of Object.keys(overrides)) {
        if (overrides[key] !== undefined) {
            const index = key - tree_header_offset;
            if (index > -1) {
                old_sizes[this.model._column_paths[index]] = overrides[key];
            } else if (index === -1) {
                old_sizes["__ROW_PATH__"] = overrides[key];
            }
        }
    }

    return old_sizes;
}
