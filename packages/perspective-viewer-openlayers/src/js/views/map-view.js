/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {getMapData, getDataExtents} from "../data/data";
import {baseMap} from "./base-map";
import {categoryColorMap} from "../style/categoryColors";
import {linearColorScale} from "../style/linearColors";
import {showLegend, hideLegend} from "../legend/legend";
import {categoryShapeMap} from "../style/categoryShapes";
import {lightenRgb} from "../style/computed";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import {Feature} from "ol";
import {fromLonLat} from "ol/proj";
import {Point} from "ol/geom";

const MIN_SIZE = 1;
const MAX_SIZE = 10;
const DEFAULT_SIZE = 2;

function mapView(container, config) {
    const data = getMapData(config);
    const extents = getDataExtents(data);
    const map = baseMap(container);

    const useLinearColors = extents.length > 2;
    const colorScale = useLinearColors
        ? linearColorScale(container, extents[2])
        : null;
    const colorMap = useLinearColors
        ? (d) => colorScale(d.cols[2])
        : categoryColorMap(container, data);
    const sizeMap = sizeMapFromExtents(extents);
    const shapeMap = categoryShapeMap(container, data);

    const vectorSource = new VectorSource({
        features: data.map((point) =>
            featureFromPoint(point, colorMap, sizeMap, shapeMap)
        ),
        wrapX: false,
    });
    baseMap.initialiseView(container, vectorSource);

    const vectorLayer = new VectorLayer({
        source: vectorSource,
        updateWhileInteracting: true,
        renderMode: "image",
    });
    map.map.addLayer(vectorLayer);

    // Update the tooltip component
    map.tooltip
        .config(config)
        .vectorSource(vectorSource)
        .regions(false)
        .onHighlight(onHighlight)
        .data(data);

    if (useLinearColors) {
        showLegend(container, colorScale, extents[2]);
    } else {
        hideLegend(container);
    }
}

mapView.resize = (container) => {
    baseMap.resize(container);
};

mapView.restyle = (container) => {
    baseMap.restyle(container);
};

function featureFromPoint(point, colorMap, sizeMap, shapeMap) {
    const feature = new Feature(new Point(fromLonLat(point.cols)));
    const fillAndStroke = colorMap(point);
    if (fillAndStroke) {
        feature.setProperties({
            category: point.category,
            scale: sizeMap(point) / 4,
            style: {
                fill: fillAndStroke.fill,
                stroke: fillAndStroke.stroke,
            },
            data: point,
        });

        // Use custom shapes
        feature.setStyle(shapeMap(point));
    }
    return feature;
}

function onHighlight(feature, highlighted) {
    const featureProperties = feature.getProperties();
    const oldStyle = featureProperties.oldStyle || featureProperties.style;

    const style = highlighted
        ? {
              stroke: lightenRgb(oldStyle.stroke, 0.25),
              fill: lightenRgb(oldStyle.stroke, 0.5),
          }
        : oldStyle;

    feature.setProperties({
        oldStyle,
        style,
    });
}

function sizeMapFromExtents(extents) {
    if (extents.length > 3) {
        // We have the size value
        const range = extents[3].max - extents[3].min;
        return (point) =>
            ((point.cols[3] - extents[3].min) / range) * (MAX_SIZE - MIN_SIZE) +
            MIN_SIZE;
    }
    return () => DEFAULT_SIZE;
}

mapView.plugin = {
    type: "perspective-viewer-map-points",
    name: "Map Points",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2,
        names: ["Longitude", "Latitude", "Color", "Size", "Tooltip"],
    },
};
export default mapView;
