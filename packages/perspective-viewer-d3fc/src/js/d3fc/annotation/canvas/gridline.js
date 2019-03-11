import {line as lineShape} from "d3-shape";
import ticks from "../ticks";
import {prefix, rebindAll, rebind} from "d3fc";

export default () => {
    let xDecorate = () => {};
    let yDecorate = () => {};

    const xTicks = ticks();
    const yTicks = ticks();

    const lineData = lineShape();

    const instance = () => {
        const context = lineData.context();
        const xScale = xTicks.scale();
        const yScale = yTicks.scale();

        xScale.ticks().forEach(xTick => {
            context.save();
            context.beginPath();
            context.strokeStyle = "#bbb";
            context.fillStyle = "transparent";

            yDecorate(context);
            lineData.context(context)(yScale.domain().map(d => [xScale(xTick), yScale(d)]));

            context.fill();
            context.stroke();
            context.closePath();
            context.restore();
        });

        yScale.ticks().forEach(yTick => {
            context.save();
            context.beginPath();
            context.strokeStyle = "#bbb";
            context.fillStyle = "transparent";

            xDecorate(context);
            lineData.context(context)(xScale.domain().map(d => [xScale(d), yScale(yTick)]));

            context.fill();
            context.stroke();
            context.closePath();
            context.restore();
        });
    };

    instance.yDecorate = (...args) => {
        if (!args.length) {
            return yDecorate;
        }
        yDecorate = args[0];
        return instance;
    };

    instance.xDecorate = (...args) => {
        if (!args.length) {
            return xDecorate;
        }
        xDecorate = args[0];
        return instance;
    };

    rebindAll(instance, xTicks, prefix("x"));
    rebindAll(instance, yTicks, prefix("y"));
    rebind(instance, lineData, "context");

    return instance;
};
