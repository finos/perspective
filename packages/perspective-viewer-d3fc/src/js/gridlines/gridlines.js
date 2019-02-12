import * as fc from "d3fc";

export const mainGrid = x => x.style("opacity", "0.3").style("stroke-width", "1.0");

export const crossGrid = x => x.style("display", "none");

export const gridlinesAnnotation = (xStyle, yStyle) => {
    return fc
        .annotationSvgGridline()
        .xDecorate(xStyle)
        .yDecorate(yStyle);
};

export const withGridLines = (gridlines, originalSeries) => fc.seriesSvgMulti().series([gridlines, originalSeries])