// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import {
    symbol,
    symbolCross,
    symbolDiamond,
    symbolSquare,
    symbolStar,
    symbolTriangle,
    symbolWye,
} from "d3";

import { Polygon, Circle } from "ol/geom";
import { toContext } from "ol/render";
import { Style, Fill, Stroke } from "ol/style";

const shapes = [
    null,
    symbolCross,
    symbolDiamond,
    symbolSquare,
    symbolStar,
    symbolTriangle,
    symbolWye,
];
let shapePoints = null;

const defaultValueFn = (d) => d.category;
export const categoryShapeMap = (container, data, valueFn = defaultValueFn) => {
    const categoryMap = categoryPointsMap(data, valueFn);
    const style = new Style({ renderer: createRenderer(categoryMap) });
    return () => style;
};

function categoryPointsMap(data, valueFn) {
    loadShapes();
    const categories = {};
    let catIndex = 0;
    data.forEach((point) => {
        const category = valueFn(point);
        if (!categories[category]) {
            categories[category] = shapePoints[catIndex];

            catIndex++;
            if (catIndex >= shapePoints.length) catIndex = 0;
        }
    });
    return categories;
}

function createRenderer(categoryMap) {
    return (location, { context, feature }) => {
        const { category, style, scale } = feature.getProperties();
        const points = categoryMap[category];

        var render = toContext(context, { pixelRatio: 1 });

        const fillStyle = new Fill({ color: style.fill });
        const strokeStyle = new Stroke({ color: style.stroke });
        render.setFillStrokeStyle(fillStyle, strokeStyle);

        if (points.length) {
            const sizedPoints = points.map((p) => [
                p[0] * scale + location[0],
                p[1] * scale + location[1],
            ]);
            render.drawPolygon(new Polygon([sizedPoints]));
        } else {
            render.drawCircle(new Circle(location, scale * 8));
        }
    };
}

function loadShapes() {
    if (!shapePoints) {
        shapePoints = shapes.map(shapeToPoints);
    }
}

function shapeToPoints(d3Shape) {
    if (d3Shape) {
        const shapeSymbol = symbol().type(d3Shape);
        const shapePath = shapeSymbol.size(150)();
        const points = shapePath
            .substring(1, shapePath.length - 1)
            .split("L")
            .map((p) => p.split(",").map((c) => parseFloat(c)));

        if (points.length === 1) {
            // Square
            const l = -points[0][0];
            points.push([l, -l]);
            points.push([l, l]);
            points.push([-l, l]);
        }

        points.push(points[0]);
        return points;
    }
    return [];
}
