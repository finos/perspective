/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as d3 from "d3";
import {isElementOverflowing} from "../utils/utils";

export function drawBorderBoxOnHover(element) {
    const node = element.node();
    node.onmouseover = drawBorderBox;
    node.onmouseout = hideBorderBox;

    function drawBorderBox() {
        element.style("box-shadow", "2px 2px 6px #000");
    }
    function hideBorderBox() {
        element.style("box-shadow", "0px 0px 0px #000");
    }
}

export function postProcessLegend(legendDiv) {
    const legendCells = legendDiv.select("g.legendCells");
    shiftElementLeft(legendDiv, legendCells);
    cropCellContents(legendDiv, legendCells);
}

function shiftElementLeft(legendDiv, legendCells) {
    const legendDivRect = legendDiv.node().getBoundingClientRect();
    const legendCellsRect = legendCells.node().getBoundingClientRect();

    if (isElementOverflowing(legendDivRect, legendCellsRect)) {
        const leftAdjust = legendCellsRect.right - legendDivRect.right;
        legendDiv.style("width", `${legendDivRect.right - legendDivRect.left + leftAdjust}px`);
    }
}

function cropCellContents(legendDiv, legendCells) {
    const legendDivRect = legendDiv.node().getBoundingClientRect();

    if (!isElementOverflowing(legendDivRect, legendCells.node().getBoundingClientRect())) {
        return;
    }

    const overflowingCells = legendCells
        .selectAll(".label")
        .nodes()
        .filter(cell => isElementOverflowing(legendDivRect, cell.getBoundingClientRect()));

    const svg = legendDiv.select(".legend");

    overflowingCells.forEach(cell => {
        const cutoffCharIndex = getCutoffCharacterIndex(cell, svg, legendDivRect);
        const d3Cell = d3.select(cell);
        d3Cell.text(d3Cell.text().substring(0, cutoffCharIndex - 3) + "...");
    });
}

function getCutoffCharacterIndex(cell, svg, legendDivRect) {
    const cellRect = cell.getBoundingClientRect();
    const cutoffCoord = svg.node().createSVGPoint();
    cutoffCoord.x = legendDivRect.right - cellRect.left;
    cutoffCoord.y = 0;
    return cell.getCharNumAtPosition(cutoffCoord);
}
