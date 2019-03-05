import {select, scaleIdentity} from "d3";
import {chartSvgCartesian, rebindAll, exclude, prefix} from "d3fc";
import store from "../store";
import {axisBottom, axisLeft} from "../../axis/axis";

export default (xScale = scaleIdentity(), yScale = scaleIdentity()) => {
    const cartesianBase = chartSvgCartesian(xScale, yScale);
    let xAxisSize = null;
    let yAxisSize = null;
    let xAxisStore = store("tickFormat", "ticks", "tickArguments", "tickSize", "tickSizeInner", "tickSizeOuter", "tickValues", "tickPadding", "tickGrouping");
    let yAxisStore = store("tickFormat", "ticks", "tickArguments", "tickSize", "tickSizeInner", "tickSizeOuter", "tickValues", "tickPadding", "tickGrouping");

    const cartesian = selection => {
        cartesianBase(selection);

        selection
            .selectAll("d3fc-svg.x-axis")
            .style("height", Number.isInteger(xAxisSize) ? `${xAxisSize}px` : xAxisSize)
            .on("draw", (d, i, nodes) => {
                const xAxis = axisBottom(xScale).decorate(cartesianBase.xDecorate());
                select(nodes[i])
                    .select("svg")
                    .call(xAxisStore(xAxis));
            });

        selection
            .selectAll("d3fc-svg.y-axis")
            .style("width", Number.isInteger(yAxisSize) ? `${yAxisSize}px` : yAxisSize)
            .on("draw", (d, i, nodes) => {
                const yAxis = axisLeft(yScale).decorate(cartesianBase.yDecorate());
                select(nodes[i])
                    .select("svg")
                    .call(yAxisStore(yAxis));
            });
    };

    rebindAll(cartesian, cartesianBase);

    cartesian.xAxisSize = (...args) => {
        if (!args.length) {
            return xAxisSize;
        }
        xAxisSize = args[0];
        return cartesian;
    };
    cartesian.yAxisSize = (...args) => {
        if (!args.length) {
            return yAxisSize;
        }
        yAxisSize = args[0];
        return cartesian;
    };

    const scaleExclusions = exclude(
        /range\w*/, // the scale range is set via the component layout
        /tickFormat/ // use axis.tickFormat instead (only present on linear scales)
    );
    rebindAll(cartesian, xScale, scaleExclusions, prefix("x"));
    rebindAll(cartesian, yScale, scaleExclusions, prefix("y"));
    rebindAll(cartesian, xAxisStore, prefix("x"));
    rebindAll(cartesian, yAxisStore, prefix("y"));
    return cartesian;
};
