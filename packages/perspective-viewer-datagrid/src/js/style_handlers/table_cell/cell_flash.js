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

export function style_cell_flash(
    metadata,
    td,
    [, , , , , pos_s, pos_e],
    [, , , , , neg_s, neg_e],
    is_settings_open,
) {
    const id = this._ids?.[metadata.dy]?.join("|");
    const metadata_path = (
        is_settings_open
            ? metadata.column_header.slice(0, -1)
            : metadata.column_header
    ).join("|");

    if (
        this.last_reverse_columns?.has(metadata_path) &&
        this.last_reverse_ids?.has(id)
    ) {
        const row_idx = this.last_reverse_ids?.get(id);
        const col_idx = this.last_reverse_columns.get(metadata_path);
        if (!this._is_old_viewport) {
            td.style.animation = "";
        } else if (this.last_meta?.[col_idx]?.[row_idx] > metadata.user) {
            td.style.setProperty("--pulse--background-color-start", neg_s);
            td.style.setProperty("--pulse--background-color-end", neg_e);
            if (td.style.animationName === "pulse_neg") {
                td.style.animation = "pulse_neg2 0.5s linear";
            } else {
                td.style.animation = "pulse_neg 0.5s linear";
            }
        } else if (this.last_meta?.[col_idx]?.[row_idx] < metadata.user) {
            td.style.setProperty("--pulse--background-color-start", pos_s);
            td.style.setProperty("--pulse--background-color-end", pos_e);
            if (td.style.animationName === "pulse_pos") {
                td.style.animation = "pulse_pos2 0.5s linear";
            } else {
                td.style.animation = "pulse_pos 0.5s linear";
            }
        } else if (row_idx !== metadata.dy) {
            td.style.animation = "";
        }
    } else {
        td.style.animation = "";
    }
}
