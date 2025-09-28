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

import { flattenExtent } from "../../axis/flatten";
import { seriesColorRange } from "../seriesRange";
import { seriesColorsFromDistinct } from "../seriesColors";

export function treeColor(settings, data) {
    if (settings.realValues.length > 1 && settings.realValues[1] !== null) {
        const color_column = settings.realValues[1];
        if (
            settings.mainValues.find((x) => x.name === color_column)?.type ===
            "string"
        ) {
            const colors = data
                .map((d) => d.data)
                .filter((x) => x.height > 0)
                .map((x) => getColors(x))
                .reduce((a, b) => a.concat(b));
            return seriesColorsFromDistinct(settings, colors);
        } else {
            return seriesColorRange(
                settings,
                null,
                null,
                flattenExtent(data.map((d) => d.extents)),
            );
        }
    }
}

// only get the colors from the bottom level (e.g. nodes with no children)
function getColors(nodes, colors = []) {
    nodes.children && nodes.children.length > 0
        ? nodes.children.forEach((child) =>
              colors.concat(getColors(child, colors)),
          )
        : nodes.data.color && colors.push(nodes.data.color);
    return colors;
}
