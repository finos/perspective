import {interpolate} from "d3";
import {drawArc, arcVisible} from "../series/arcSeries";
import {labelVisible, labelTransform} from "../axis/sunburstLabel";

export const clickHandler = (data, g, parent, parentTitle, path, label, radius) => p => {
    if (p.parent) {
        parent.datum(p.parent);
        parent.style("cursor", "pointer");
        parentTitle.html(`&#8682; ${p.parent.data.name}`);
    } else {
        parent.datum(data);
        parent.style("cursor", "default");
        parentTitle.html("");
    }
    data.each(
        d =>
            (d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            })
    );

    const t = g.transition().duration(750);
    path.transition(t)
        .tween("data", d => {
            const i = interpolate(d.current, d.target);
            return t => (d.current = i(t));
        })
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => (arcVisible(d.target) ? 0.8 : 0))
        .attrTween("d", d => () => drawArc(radius)(d.current));

    label
        .filter(function(d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        })
        .transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current, radius));
};
