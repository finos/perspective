import {select} from "d3-selection";
import {line} from "d3-shape";
import {dataJoin as _dataJoin} from "d3fc";

const identity = d => d;

const axis = (orient, scale) => {
    let tickArguments = [10];
    let tickValues = null;
    let decorate = () => {};
    let tickFormat = null;
    let tickSizeOuter = 6;
    let tickSizeInner = 6;
    let tickPadding = 3;
    let centerAlignTicks = false;
    let tickOffset = () => (centerAlignTicks && scale.step ? scale.step() / 2 : 0);

    const svgDomainLine = line();

    const dataJoin = _dataJoin("g", "tick").key(identity);

    const domainPathDataJoin = _dataJoin("path", "domain");

    // returns a function that creates a translation based on
    // the bound data
    const containerTranslate = (scale, trans) => {
        let offset = 0;
        if (scale.bandwidth) {
            offset = scale.bandwidth() / 2;
            if (scale.round()) {
                offset = Math.round(offset);
            }
        }
        return d => trans(scale(d) + offset, 0);
    };

    const translate = (x, y) => (isVertical() ? `translate(${y}, ${x})` : `translate(${x}, ${y})`);

    const pathTranspose = arr => (isVertical() ? arr.map(d => [d[1], d[0]]) : arr);

    const isVertical = () => orient === "left" || orient === "right";

    const tryApply = (fn, args, defaultVal) => (scale[fn] ? scale[fn].apply(scale, args) : defaultVal);

    const axis = selection => {
        if (selection.selection) {
            dataJoin.transition(selection);
            domainPathDataJoin.transition(selection);
        }

        selection.each((data, index, group) => {
            const element = group[index];

            const container = select(element);
            if (!element.__scale__) {
                container
                    .attr("fill", "none")
                    .attr("font-size", 10)
                    .attr("font-family", "sans-serif")
                    .attr("text-anchor", orient === "right" ? "start" : orient === "left" ? "end" : "middle");
            }

            // Stash a snapshot of the new scale, and retrieve the old snapshot.
            const scaleOld = element.__scale__ || scale;
            element.__scale__ = scale.copy();

            const ticksArray = tickValues == null ? tryApply("ticks", tickArguments, scale.domain()) : tickValues;
            const tickFormatter = tickFormat == null ? tryApply("tickFormat", tickArguments, identity) : tickFormat;
            const sign = orient === "bottom" || orient === "right" ? 1 : -1;

            // add the domain line
            const range = scale.range();
            const domainPathData = pathTranspose([[range[0], sign * tickSizeOuter], [range[0], 0], [range[1], 0], [range[1], sign * tickSizeOuter]]);

            const domainLine = domainPathDataJoin(container, [data]);
            domainLine.attr("d", svgDomainLine(domainPathData)).attr("stroke", "#000");

            const g = dataJoin(container, ticksArray);

            // enter
            g.enter()
                .attr("transform", containerTranslate(scaleOld, translate))
                .append("path")
                .attr("stroke", "#000");

            const labelOffset = sign * ((centerAlignTicks ? 0 : tickSizeInner) + tickPadding);
            g.enter()
                .append("text")
                .attr("transform", translate(0, labelOffset))
                .attr("fill", "#000");

            // exit
            g.exit().attr("transform", containerTranslate(scale, translate));

            // update
            g.select("path")
                .attr("visibility", (d, i) => (i === ticksArray.length - 1 && centerAlignTicks ? "hidden" : ""))
                .attr("d", d => {
                    const offset = sign * tickOffset(d);
                    return svgDomainLine(pathTranspose([[offset, 0], [offset, sign * tickSizeInner]]));
                });

            g.select("text")
                .attr("transform", translate(0, labelOffset))
                .attr("dy", () => {
                    let offset = "0em";
                    if (isVertical()) {
                        offset = "0.32em";
                    } else if (orient === "bottom") {
                        offset = "0.71em";
                    }
                    return offset;
                })
                .text(tickFormatter);

            g.attr("transform", containerTranslate(scale, translate));

            decorate(g, data, index);
        });
    };

    axis.tickFormat = (...args) => {
        if (!args.length) {
            return tickFormat;
        }
        tickFormat = args[0];
        return axis;
    };

    axis.tickSize = (...args) => {
        if (!args.length) {
            return tickSizeInner;
        }
        tickSizeInner = tickSizeOuter = Number(args[0]);
        return axis;
    };

    axis.tickSizeInner = (...args) => {
        if (!args.length) {
            return tickSizeInner;
        }
        tickSizeInner = Number(args[0]);
        return axis;
    };

    axis.tickSizeOuter = (...args) => {
        if (!args.length) {
            return tickSizeOuter;
        }
        tickSizeOuter = Number(args[0]);
        return axis;
    };

    axis.tickPadding = (...args) => {
        if (!args.length) {
            return tickPadding;
        }
        tickPadding = args[0];
        return axis;
    };

    axis.centerAlignTicks = (...args) => {
        if (!args.length) {
            return centerAlignTicks;
        }
        centerAlignTicks = args[0];
        return axis;
    };

    axis.tickOffset = (...args) => {
        if (!args.length) {
            return tickOffset;
        }
        tickOffset = args[0];
        return axis;
    };

    axis.decorate = (...args) => {
        if (!args.length) {
            return decorate;
        }
        decorate = args[0];
        return axis;
    };

    axis.scale = (...args) => {
        if (!args.length) {
            return scale;
        }
        scale = args[0];
        return axis;
    };

    axis.ticks = (...args) => {
        tickArguments = [...args];
        return axis;
    };

    axis.tickArguments = (...args) => {
        if (!args.length) {
            return tickArguments.slice();
        }
        tickArguments = args[0] == null ? [] : [...args[0]];
        return axis;
    };

    axis.tickValues = (...args) => {
        if (!args.length) {
            return tickValues.slice();
        }
        tickValues = args[0] == null ? [] : [...args[0]];
        return axis;
    };

    return axis;
};

export const axisTop = scale => axis("top", scale);

export const axisBottom = scale => axis("bottom", scale);

export const axisLeft = scale => axis("left", scale);

export const axisRight = scale => axis("right", scale);
