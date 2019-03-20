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

export default series => {
    let orient = "both";
    let mode = "svg";
    let xScale = null;
    let yScale = null;
    let context = null;

    const _withGridLines = function(...args) {
        let seriesMulti;
        let annotationGridline;
        let mainGrid;
        let crossGrid;
        switch (mode) {
            case "svg": {
                seriesMulti = fc.seriesSvgMulti();
                annotationGridline = fc.annotationSvgGridline();
                mainGrid = mainGridSvg;
                crossGrid = crossGridSvg;
                break;
            }
            case "canvas": {
                seriesMulti = fc.seriesCanvasMulti().context(context);
                annotationGridline = annotationCanvasGridline();
                mainGrid = mainGridCanvas;
                crossGrid = crossGridCanvas;
                break;
            }
            default: {
                throw new Error(`Unknown mode: ${mode}`);
            }
        }

        const multi = seriesMulti.xScale(xScale).yScale(yScale);

        const xStyle = orient === "vertical" ? crossGrid : mainGrid;
        const yStyle = orient === "horizontal" ? crossGrid : mainGrid;

        const gridlines = annotationGridline.xDecorate(xStyle).yDecorate(yStyle);

        return multi.series([gridlines, series])(...args);
    };

    _withGridLines.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    _withGridLines.mode = (...args) => {
        if (!args.length) {
            return mode;
        }
        mode = args[0];
        return _withGridLines;
    };

    _withGridLines.xScale = (...args) => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        return _withGridLines;
    };

    _withGridLines.yScale = (...args) => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        return _withGridLines;
    };

    _withGridLines.context = (...args) => {
        if (!args.length) {
            return context;
        }
        context = args[0];
        return _withGridLines;
    };

    return _withGridLines;
};
