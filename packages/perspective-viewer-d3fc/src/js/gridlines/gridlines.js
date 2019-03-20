/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import annotationCanvasGridline from "../d3fc/annotation/canvas/gridline";

const mainGridSvg = x => x.style("opacity", "0.3").style("stroke-width", "1.0");
const mainGridCanvas = c => {
    c.globalAlpha = 0.3;
    c.lineWidth = 1.0;
};

const crossGridSvg = x => x.style("display", "none");
const crossGridCanvas = c => {
    c.globalAlpha = 0;
};

const withGridLines = (seriesMulti, annotationGridline, mainGrid, crossGrid) => series => {
    let orient = "both";

    const multi = seriesMulti();

    const _withGridLines = function(...args) {
        const xStyle = orient === "vertical" ? crossGrid : mainGrid;
        const yStyle = orient === "horizontal" ? crossGrid : mainGrid;

        const gridlines = annotationGridline()
            .xDecorate(xStyle)
            .yDecorate(yStyle);

        return multi.series([gridlines, series])(...args);
    };

    fc.rebindAll(_withGridLines, multi);

    _withGridLines.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    return _withGridLines;
};

export const withSvgGridLines = withGridLines(fc.seriesSvgMulti, fc.annotationSvgGridline, mainGridSvg, crossGridSvg);

export const withCanvasGridLines = withGridLines(fc.seriesCanvasMulti, annotationCanvasGridline, mainGridCanvas, crossGridCanvas);
