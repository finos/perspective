import {scaleIdentity} from "d3-scale";

export default () => {
    let scale = scaleIdentity();
    let tickArguments = [10];
    let tickValues = null;

    const ticks = () => (tickValues != null ? tickValues : scale.ticks ? scale.ticks(...tickArguments) : scale.domain());

    ticks.scale = (...args) => {
        if (!args.length) {
            return scale;
        }
        scale = args[0];
        return ticks;
    };

    ticks.ticks = (...args) => {
        tickArguments = args;
        return ticks;
    };

    ticks.tickArguments = (...args) => {
        if (!args.length) {
            return tickArguments;
        }
        tickArguments = args[0];
        return ticks;
    };

    ticks.tickValues = (...args) => {
        if (!args.length) {
            return tickValues;
        }
        tickValues = args[0];
        return ticks;
    };

    return ticks;
};
