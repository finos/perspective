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

import { seriesColorRange } from "../seriesRange";
import { seriesColorsFromDistinct } from "../seriesColors";
import { Settings } from "../../types";
import { TreeData } from "../../data/treeData";

export function treeColor(
    settings: Settings,
    data: d3.HierarchyNode<TreeData>[],
) {
    if (
        settings.realValues.length < 1 ||
        settings.realValues[1] === null ||
        settings.realValues[1] === undefined
    )
        return;
    const color_column = settings.realValues[1];
    const colors = data
        .filter((x) => x.height > 0)
        .map((x) => getColors(x))
        .reduce((a, b) => a.concat(b));
    if (
        settings.mainValues.find((x) => x.name === color_column)?.type ===
        "string"
    ) {
        return seriesColorsFromDistinct(settings, colors);
    } else {
        let min = Math.min(...colors);
        let max = Math.max(...colors);
        return seriesColorRange(settings, null, null, [min, max]);
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
