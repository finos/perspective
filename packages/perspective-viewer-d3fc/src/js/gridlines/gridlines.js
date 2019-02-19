import * as fc from "d3fc";

const mainGrid = x => x.style("opacity", "0.3").style("stroke-width", "1.0");

const crossGrid = x => x.style("display", "none");

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
