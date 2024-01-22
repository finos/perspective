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

const URI_CACHE = {};
const CODE_CACHE = {};

/// Style mana cost
function mana_cost_to_svg_uri(sym_array, value) {
    if (value in CODE_CACHE) {
        return CODE_CACHE[value];
    }

    function replaceRange(s, start, end, substitute) {
        return s.substring(0, start) + substitute + s.substring(end);
    }

    function get_url(sym_array, symbol) {
        return sym_array.find((x) => x.symbol === symbol)?.svg_uri || symbol;
    }

    let value2 = value;
    for (let i = 0; i < value2.length; i++) {
        if (value2[i] === "{") {
            let j = 1;
            let cost_code = "{";

            while (value2[i + j] !== "}" && i + j < value2.length) {
                cost_code += value2[i + j];
                j += 1;
            }

            const icon =
                URI_CACHE[cost_code] || get_url(sym_array, cost_code + "}");
            URI_CACHE[cost_code] = icon;
            const rep = `<img part="manacoin" src="${icon}"></img>`;
            value2 = replaceRange(value2, i, i + cost_code.length + 1, rep);
            i += rep.length - cost_code.length;
        }
    }

    CODE_CACHE[value] = value2;
    return value2;
}

/// Style color indicators
function color_identity_to_html(value) {
    let colors = value.split(",");
    let out = "";
    for (const color of colors) {
        if (color === "B") {
            out += `<span part="mcolor" style="background-color:#333">B</span>`;
        } else if (color === "U") {
            out += `<span part="mcolor" style="background-color:#1f78b4">U</span>`;
        } else if (color === "G") {
            out += `<span part="mcolor" style="background-color:#33a02c">G</span>`;
        } else if (color === "W") {
            out += `<span part="mcolor" style="background-color:white;color:#999">W</span>`;
        } else if (color === "R") {
            out += `<span part="mcolor" style="background-color:#e31a1c">R</span>`;
        }
    }

    if (out.length > 0) {
        return out;
    } else {
        return "-";
    }
}

export function manaStyleListener(sym_array, viewer) {
    for (const td of this.querySelectorAll("td")) {
        const meta = this.getMeta(td);
        const hasSettings = viewer.hasAttribute("settings");
        let offset = hasSettings ? 2 : 1;

        const col_name = meta.column_header[meta.column_header.length - offset];
        if (col_name === "manaCost" || col_name === "text") {
            td.innerHTML = mana_cost_to_svg_uri(sym_array, meta.value);
        } else if (col_name.includes("color")) {
            td.innerHTML = color_identity_to_html(meta.value);
        }

        td.classList.toggle("alt", meta.y % 2);
    }
}
