import {select, scaleIdentity} from "d3";
import {chartSvgCartesian, rebindAll, exclude, prefix} from "d3fc";
import store from "../store";
import {axisBottom, axisLeft} from "../../axis/axis";

export default (xScale = scaleIdentity(), yScale = scaleIdentity()) => {
    const cartesianBase = chartSvgCartesian(xScale, yScale);
    let xAxisHeight = null;
    let yAxisWidth = null;
    let xAxisStore = store("tickFormat", "ticks", "tickArguments", "tickSize", "tickSizeInner", "tickSizeOuter", "tickValues", "tickPadding", "centerAlignTicks");
    let yAxisStore = store("tickFormat", "ticks", "tickArguments", "tickSize", "tickSizeInner", "tickSizeOuter", "tickValues", "tickPadding", "centerAlignTicks");

    let xAxis = scale => axisBottom(scale);
    let yAxis = scale => axisLeft(scale);

    const cartesian = selection => {
        cartesianBase(selection);

        selection
            .selectAll("d3fc-svg.x-axis")
            .style("height", Number.isInteger(xAxisHeight) ? `${xAxisHeight}px` : xAxisHeight)
            .on("draw", (d, i, nodes) => {
                const xAxisComponent = xAxis(xScale).decorate(cartesianBase.xDecorate());
                select(nodes[i])
                    .select("svg")
                    .call(xAxisStore(xAxisComponent));
            });

        selection
            .selectAll("d3fc-svg.y-axis")
            .style("width", Number.isInteger(yAxisWidth) ? `${yAxisWidth}px` : yAxisWidth)
            .on("draw", (d, i, nodes) => {
                const yAxisComponent = yAxis(yScale).decorate(cartesianBase.yDecorate());
                select(nodes[i])
                    .select("svg")
                    .call(yAxisStore(yAxisComponent));
            });
    };

    rebindAll(cartesian, cartesianBase);

    cartesian.xAxisHeight = (...args) => {
        if (!args.length) {
            return xAxisHeight;
        }
        xAxisHeight = args[0];
        return cartesian;
    };
    cartesian.yAxisWidth = (...args) => {
        if (!args.length) {
            return yAxisWidth;
        }
        yAxisWidth = args[0];
        return cartesian;
    };

    cartesian.xAxis = (...args) => {
        if (!args.length) {
            return xAxis;
        }
        xAxis = args[0];
        return cartesian;
    };
    cartesian.yAxis = (...args) => {
        if (!args.length) {
            return yAxis;
        }
        yAxis = args[0];
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
