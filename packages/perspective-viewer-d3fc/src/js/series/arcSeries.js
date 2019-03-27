import {arc as d3Arc} from "d3";

export const arc = radius =>
    d3Arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

export const arcVisible = d => d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
