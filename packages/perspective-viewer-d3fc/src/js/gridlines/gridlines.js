/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as fc from "d3fc";
import seriesCanvasMulti from "../d3fc/series/canvas/multi";
import annotationCanvasGridline from "../d3fc/annotation/canvas/gridline";

const mainGrid = x => x.style("opacity", "0.3").style("stroke-width", "1.0");
const mainGridCanvas = c => {
    c.globalAlpha = 0.3;
    c.lineWidth = 1.0;
};

const crossGrid = x => x.style("display", "none");
const crossGridCanvas = c => {
    c.globalAlpha = 0;
};

export const withGridLines = series => {
    let orient = "both";

    const svgMulti = fc.seriesSvgMulti();

    const _withGridLines = function(...args) {
        const xStyle = orient === "vertical" ? crossGrid : mainGrid;
        const yStyle = orient === "horizontal" ? crossGrid : mainGrid;

        const gridlines = fc
            .annotationSvgGridline()
            .xDecorate(xStyle)
            .yDecorate(yStyle);

        return svgMulti.series([gridlines, series])(...args);
    };

    fc.rebindAll(_withGridLines, svgMulti);

    _withGridLines.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    return _withGridLines;
};

export const withCanvasGridLines = series => {
    let orient = "both";

    const canvasMulti = seriesCanvasMulti();

    const _withGridLines = function(...args) {
        const xStyle = orient === "vertical" ? crossGridCanvas : mainGridCanvas;
        const yStyle = orient === "horizontal" ? crossGridCanvas : mainGridCanvas;

        const gridlines = annotationCanvasGridline()
            .xDecorate(xStyle)
            .yDecorate(yStyle);

        return canvasMulti.series([gridlines, series])(...args);
    };

    fc.rebindAll(_withGridLines, canvasMulti);

    _withGridLines.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    return _withGridLines;
};
