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

import { isElementOverflowing } from "../../utils/utils";

export function cropCellContents(legendDiv) {
    const legendCells = legendDiv.select("g.legendCells");
    const legendDivRect = legendDiv.node().getBoundingClientRect();

    if (
        !isElementOverflowing(
            legendDivRect,
            legendCells.node().getBoundingClientRect(),
        )
    ) {
        return;
    }

    const svg = legendDiv.select(".legend");

    legendCells.selectAll(".label").text((d, i, nodes) => {
        const cell = nodes[i];
        if (isElementOverflowing(legendDivRect, cell.getBoundingClientRect())) {
            const cutoffCharIndex = getCutoffCharacterIndex(
                cell,
                svg,
                legendDivRect,
            );
            return `${d.substring(0, cutoffCharIndex - 3)}...`;
        } else {
            return d;
        }
    });
}

function getCutoffCharacterIndex(cell, svg, legendDivRect) {
    const cellRect = cell.getBoundingClientRect();
    const cutoffCoord = svg.node().createSVGPoint();
    // Sometimes the svg point can _just_ miss a character, so we fuzz it.
    const fuzzyFactor = 3;
    cutoffCoord.x = legendDivRect.right - cellRect.left - fuzzyFactor;
    cutoffCoord.y = 0;
    return cell.getCharNumAtPosition(cutoffCoord);
}
