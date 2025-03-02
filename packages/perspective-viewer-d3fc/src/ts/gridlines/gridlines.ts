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

import * as fc from "d3fc/index.js";
import { D3Scale, Orientation } from "../types";

const mainGridSvg = (settings) => (x, xTick) =>
    x
        .style("stroke-width", (xTick) => "1.0")
        .style("stroke", (xTick) => axis_color(xTick, settings));

function axis_color(xTick, settings) {
    if (xTick === 0) {
        if (settings) {
            return settings.textStyles.color;
        } else {
            return "#666";
        }
    } else if (settings) {
        return settings.colorStyles.grid.gridLineColor;
    } else {
        return "#bbb";
    }
}

const mainGridCanvas = (settings) => (c, xTick) => {
    c.strokeStyle = axis_color(xTick, settings);
    c.lineWidth = 1;
};

const crossGridSvg = (x, _) => x.style("display", "none");
const crossGridCanvas = (settings) => (c, xTick) => {
    c.lineWidth = 1;
    c.strokeStyle = axis_color(xTick, settings);
};

export interface WithGridLines {
    (...args): any;

    orient(): Orientation;
    orient(nextOrient: Orientation): WithGridLines;

    canvas(): boolean;
    canvas(nextCanvas: boolean): WithGridLines;

    xScale(): D3Scale;
    xScale(xScale: D3Scale): WithGridLines;

    yScale(): D3Scale;
    yScale(yScale: D3Scale): WithGridLines;

    context(): any;
    context(context: any): WithGridLines;
}

export default (series, settings): WithGridLines => {
    let orient = "both";
    let canvas = false;
    let xScale = null;
    let yScale = null;
    let context = null;

    let seriesMulti = fc.seriesSvgMulti();
    let annotationGridline = fc.annotationSvgGridline();
    let mainGrid = mainGridSvg(settings);
    let crossGrid = crossGridSvg;

    const _withGridLines: Partial<WithGridLines> = function (...args) {
        if (canvas) {
            seriesMulti = fc.seriesCanvasMulti().context(context);
            annotationGridline = fc.annotationCanvasGridline();
            mainGrid = mainGridCanvas(settings);
            crossGrid = crossGridCanvas(settings);
        }

        const multi = seriesMulti.xScale(xScale).yScale(yScale);

        const xStyle = orient === "vertical" ? crossGrid : mainGrid;
        const yStyle = orient === "horizontal" ? crossGrid : mainGrid;

        const gridlines = annotationGridline
            .xDecorate(xStyle)
            .yDecorate(yStyle);

        return multi.series([gridlines, series])(...args);
    };

    _withGridLines.orient = (...args: Orientation[]): any => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    _withGridLines.canvas = (...args: boolean[]): any => {
        if (!args.length) {
            return canvas;
        }
        canvas = args[0];
        return _withGridLines;
    };

    _withGridLines.xScale = (...args): any => {
        if (!args.length) {
            return xScale;
        }
        xScale = args[0];
        return _withGridLines;
    };

    _withGridLines.yScale = (...args): any => {
        if (!args.length) {
            return yScale;
        }
        yScale = args[0];
        return _withGridLines;
    };

    _withGridLines.context = (...args): any => {
        if (!args.length) {
            return context;
        }
        context = args[0];
        return _withGridLines;
    };

    return _withGridLines as WithGridLines;
};
