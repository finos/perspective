import {dataJoin} from "@d3fc/d3fc-data-join";
import {select} from "d3";
import {rebindAll, exclude} from "@d3fc/d3fc-rebind";
import groupedBase from "../groupedBase";

export default series => {
    const base = groupedBase(series);

    const join = dataJoin("g", "grouped");

    const grouped = selection => {
        if (selection.selection) {
            join.transition(selection);
        }

        selection.each((data, index, group) => {
            const g = join(select(group[index]), data);

            g.enter().append("g");

            g.select("g").each((_, index, group) => {
                const container = select(group[index]);

                // create a composite scale that applies the required offset
                const isVertical = series.orient() !== "horizontal";
                const compositeScale = (d, i) => {
                    const offset = base.offsetScaleForDatum(data, d, i);
                    const baseScale = isVertical ? base.xScale() : base.yScale();
                    return baseScale(d) + offset(index) + offset.bandwidth() / 2;
                };

                if (isVertical) {
                    series.xScale(compositeScale);
                    series.yScale(base.yScale());
                } else {
                    series.yScale(compositeScale);
                    series.xScale(base.xScale());
                }

                // if the sub-series has a bandwidth, set this from the offset scale
                if (series.bandwidth) {
                    series.bandwidth((d, i) => base.offsetScaleForDatum(data, d, i).bandwidth());
                }

                // adapt the decorate function to give each series the correct index
                series.decorate((s, d) => base.decorate()(s, d, index));

                container.call(series);
            });
        });
    };

    rebindAll(grouped, series, exclude("decorate", "xScale", "yScale"));
    rebindAll(grouped, base, exclude("offsetScaleForDatum"));

    return grouped;
};
