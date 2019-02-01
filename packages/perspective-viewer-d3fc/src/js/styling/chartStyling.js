/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {CrossAxisMap} from "./crossAxisMap";

export const LABEL_TICK_PADDING = 2;
export const STANDARD_TICK_LENGTH = 9; // 9 // TODO: make this 16 - that is right but hard to analyse for now as it exceeds my working area.
export const HORIZONTAL_STANDARD_TICK_LENGTH = -STANDARD_TICK_LENGTH * 2;
export const HORIZONTAL_LABEL_TICK_PADDING = -LABEL_TICK_PADDING;

// STYLE CHART
export function styleChart(chart, horizontal, labels, dataset) {
    let [crossDecorate, mainDecorate, crossLabel, mainLabel] = horizontal
        ? [chart.yDecorate, chart.xDecorate, chart.yLabel, chart.xLabel]
        : [chart.xDecorate, chart.yDecorate, chart.xLabel, chart.yLabel];

    function translate(perpendicularToAxis, parallelToAxis) {
        return horizontal ? `translate(${parallelToAxis}, ${perpendicularToAxis})` : `translate(${perpendicularToAxis}, ${parallelToAxis})`;
    }

    mainLabel(labels.mainLabel.join(", "));
    //crossLabel(labels.crossLabel); // not enabled.

    let textDistanceFromXAxis = STANDARD_TICK_LENGTH + LABEL_TICK_PADDING; // TODO: make this standard vertical tick length, or make it somehow calculated.
    let textDistanceFromYAxis = HORIZONTAL_STANDARD_TICK_LENGTH + HORIZONTAL_LABEL_TICK_PADDING; // -18; //TODO: need to make this reactive to text length.
    let distanceFromAxis = horizontal ? textDistanceFromYAxis : textDistanceFromXAxis;

    crossDecorate(selection => {
        console.log("selection: ", selection);
        console.log("labels: ", labels);

        let crossAxisMap = new CrossAxisMap(labels.crossLabel, dataset);

        let groups = selection._groups[0];
        let parent = selection._parents[0];

        let parentViewBoxVals = parent.attributes.viewBox.value.split(" ");
        let viewBoxDimensionMappings = {x: 0, y: 1, width: 2, height: 3};

        let totalSpace = horizontal ? parentViewBoxVals[viewBoxDimensionMappings.height] : parentViewBoxVals[viewBoxDimensionMappings.width];
        let tickSpacing = totalSpace / groups.length;
        let standardTickLength = STANDARD_TICK_LENGTH;

        selection.attr("transform", "translate(0, 0)"); //correctly align ticks on the crossAxis
        mutateCrossAxisLine(parent, crossAxisMap.levelCount, horizontal);
        mutateCrossAxisText(selection, tickSpacing, distanceFromAxis, translate);
        mutateCrossAxisTicks(selection, tickSpacing, translate, standardTickLength, crossAxisMap, horizontal);

        hidecrossAxisTextInAbsenceOfLabels(selection, labels);
        addCrossAxisLabelsForNestedGroupBys(crossAxisMap, groups, horizontal);
    });

    mainDecorate(selection => {
        hideMainAxisLine(selection);
        hideMainAxisTicks(selection);
    });

    return;
}

function mutateCrossAxisLine(parent, levelCount, horizontal) {
    let axisLine = parent.firstChild;
    axisLine.setAttribute("stroke", "rgb(187, 187, 187)"); // turn the axis grey

    // Make the final (or bookend) tick the correct length
    let bookendTickLength = horizontal ? (levelCount + 1) * HORIZONTAL_STANDARD_TICK_LENGTH : (levelCount + 1) * STANDARD_TICK_LENGTH;
    let dimensions = axisLine.attributes.d.value;
    let mutatedDimensions = dimensions.substring(0, dimensions.lastIndexOf(",") + 1) + bookendTickLength;

    // Remove the first tick of the axis line which is overlaid by a formally declared tick anyway
    mutatedDimensions = removeSuperfluousFirstTick(mutatedDimensions, horizontal);

    axisLine.setAttribute("d", mutatedDimensions);
}

function removeSuperfluousFirstTick(dimensions, horizontal) {
    if (horizontal) {
        return dimensions;
    }

    // Remove the 2nd element of the svg
    return dimensions
        .split(",")
        .reduce((accumulator, subSec, index) => accumulator + (index !== 1 ? `,${subSec}` : ""), "")
        .substring(1);
}

function mutateCrossAxisText(selection, tickSpacing, distanceFromAxis, translate) {
    selection
        .select("text")
        .attr("transform", (_, i) => translate(i * tickSpacing + tickSpacing / 2, distanceFromAxis))
        .text(content => returnOnlyMostSubdividedGroup(content));
}

function mutateCrossAxisTicks(selection, tickSpacing, translate, standardTickLength, crossAxisMap, horizontal) {
    function mutateTickDimensionsAccordingToOrientation(i) {
        // eslint-disable-next-line prettier/prettier
        return horizontal 
            ? `M0,0L-${tickLength(standardTickLength, i, crossAxisMap)},0`
            : `M0,0L0,${tickLength(standardTickLength, i, crossAxisMap)}`;
    }

    selection
        .select("path") // select the tick marks
        .attr("stroke", "rgb(187, 187, 187)")
        .attr("d", (x, i) => mutateTickDimensionsAccordingToOrientation(i))
        .attr("transform", (x, i) => translate(i * tickSpacing, 0));
}

function hideMainAxisTicks(selection) {
    selection
        .select("path") // select the tick marks
        .attr("display", "none");
}

function hideMainAxisLine(selection) {
    let parent = selection._parents[0];
    parent.firstChild.setAttribute("display", "none"); // hide the axis // TODO: this is too fragile.
}

function hidecrossAxisTextInAbsenceOfLabels(selection, labels) {
    if (labels.crossLabel.length === 0) {
        selection.select("text").attr("display", "none");
    }
}

function addCrossAxisLabelsForNestedGroupBys(crossAxisMap, groups, horizontal) {
    let groupByLabelsToAppend = crossAxisMap.calculateLabelPositions(groups, horizontal);
    groupByLabelsToAppend.forEach(labelTick => labelTick.tick.appendChild(labelTick.label));
}

function tickLength(oneStandardTickLength, tickIndex, tickLengthMap) {
    const multiplier = oneStandardTickLength;

    // ticks are shorter in the case where we're not dubdividing by groups.
    if (tickLengthMap.length <= 1) {
        return multiplier / 3;
    }

    let depth = 1;
    tickLengthMap.map.forEach(level => {
        if (level.nodeWithTick(tickIndex).ticks[0] === tickIndex) {
            depth++;
        }
    });

    return depth * multiplier;
}

function returnOnlyMostSubdividedGroup(content) {
    if (!Array.isArray(content)) {
        return content;
    }
    let lastElement = content[content.length - 1];
    return lastElement;
}
