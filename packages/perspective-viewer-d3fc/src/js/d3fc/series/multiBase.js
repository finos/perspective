import {scaleIdentity} from "d3-scale";
import createBase from "./base";

export default () => {
    let series = [];
    let mapping = d => d;
    let key = (_, i) => i;

    const multi = createBase({
        decorate: () => {},
        xScale: scaleIdentity(),
        yScale: scaleIdentity()
    });

    multi.mapping = (...args) => {
        if (!args.length) {
            return mapping;
        }
        mapping = args[0];
        return multi;
    };
    multi.key = (...args) => {
        if (!args.length) {
            return key;
        }
        key = args[0];
        return multi;
    };
    multi.series = (...args) => {
        if (!args.length) {
            return series;
        }
        series = args[0];
        return multi;
    };

    return multi;
};
