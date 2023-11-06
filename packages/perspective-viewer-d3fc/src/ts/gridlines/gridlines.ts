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

import * as fc from "d3fc";
import { GetSetReturn } from "../types";

const mainGridSvg = (settings) => (x) =>
    x
        .style("stroke-width", "1.0")
        .style(
            "stroke",
            settings ? settings.colorStyles.grid.gridLineColor : "#bbb"
        );

const mainGridCanvas = (settings) => (c) => {
    c.strokeStyle = settings ? settings.colorStyles.grid.gridLineColor : "#bbb";
    c.lineWidth = 1;
};

const crossGridSvg = (x) => x.style("display", "none");
const crossGridCanvas = (settings) => (c) => {
    c.lineWidth = 1;
    c.strokeStyle = settings ? settings.colorStyles.grid.gridLineColor : "#bbb";
};

export interface WithGridLines {
    (...args): any;
    orient: <T extends string | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, string, WithGridLines>;
    canvas: <T extends boolean | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, boolean, WithGridLines>;
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

    const _withGridLines: any = function (...args) {
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

    _withGridLines.orient = (...args) => {
        if (!args.length) {
            return orient;
        }
        orient = args[0];
        return _withGridLines;
    };

    _withGridLines.canvas = <T extends boolean | undefined = undefined>(
        ...args: T[]
    ): GetSetReturn<T, boolean, WithGridLines> => {
        if (!args.length) {
            return canvas as GetSetReturn<T, boolean, WithGridLines>;
        }
        canvas = args[0];
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
