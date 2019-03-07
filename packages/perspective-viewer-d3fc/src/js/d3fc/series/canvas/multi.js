import {rebindAll} from "d3fc";
import multiBase from "../multiBase";

export default () => {
    let context = null;
    const base = multiBase();

    const multi = data => {
        const mapping = base.mapping();
        const series = base.series();
        const xScale = base.xScale();
        const yScale = base.yScale();

        series.forEach((dataSeries, index) => {
            const seriesData = mapping(data, index, series);
            dataSeries
                .context(context)
                .xScale(xScale)
                .yScale(yScale);

            if (dataSeries.decorate) {
                const adaptedDecorate = dataSeries.decorate();
                dataSeries.decorate((c, d, i) => {
                    base.decorate()(c, data, index);
                    adaptedDecorate(c, d, i);
                });

                dataSeries(seriesData);

                dataSeries.decorate(adaptedDecorate);
            } else {
                dataSeries(seriesData);
            }
        });
    };

    multi.context = (...args) => {
        if (!args.length) {
            return context;
        }
        context = args[0];
        return multi;
    };

    rebindAll(multi, base);

    return multi;
};
