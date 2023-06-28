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

import { getMapData } from "../data/data";
import { baseMap } from "./base-map";
import { linearColorScale } from "../style/linearColors";
import { showLegend, hideLegend } from "../legend/legend";
import { lightenRgb } from "../style/computed";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import { KML } from "ol/format";

// /const ol = require("ol");
// const {Vector: VectorLayer} = ol.layer;
// const {Vector: VectorSource} = ol.source;
// const {KML} = ol.format;
import { Style, Fill, Stroke } from "ol/style";

const regionSources = {};
window.registerMapRegions = ({
    name,
    url,
    key,
    format = new KML({ extractStyles: false }),
}) => {
    const source = new VectorSource({ url, format, wrapX: false });
    const nameFn = typeof key == "string" ? (props) => props[key] : key;
    regionSources[name] = { source, nameFn };
};

function regionView(container, config) {
    const data = getMapData(config);
    const extents = getDataExtents(data);
    const map = baseMap(container);

    const regionSource =
        config.group_by.length && regionSources[config.group_by[0]];

    if (regionSource) {
        const vectorSource = regionSource.source;
        const colorScale = linearColorScale(container, extents[0]);
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            updateWhileInteracting: true,
            style: createStyleFunction(regionSource, data, colorScale),
        });
        map.map.addLayer(vectorLayer);

        vectorSource.on("change", () => {
            baseMap.initializeView(container, vectorSource);
        });

        // Update the tooltip component
        map.tooltip
            .config(config)
            .vectorSource(vectorSource)
            .regions(true)
            .onHighlight(onHighlight)
            .data(data);

        showLegend(container, colorScale, extents[0]);
    } else {
        hideLegend(container);
    }
}

function createStyleFunction(regionSource, data, colorScale) {
    return (feature) => {
        const properties = feature.getProperties();
        const regionName = regionSource.nameFn(properties);
        const dataPoint = data.find((d) => d.group == regionName);
        if (dataPoint) {
            const style = colorScale(dataPoint.cols[0]);
            feature.setProperties({ data: dataPoint, style });

            const drawStyle = properties.highlightStyle || style;
            return new Style({
                fill: new Fill({ color: drawStyle.fill }),
                stroke: new Stroke({ color: drawStyle.stroke }),
            });
        } else {
            // Mark it with a name so we can identify it in a tooltip
            feature.setProperties({ data: { group: regionName } });
            return new Style({
                stroke: new Stroke({ color: "rgba(200, 150, 150, 0.2)" }),
            });
        }
    };
}

function onHighlight(feature, highlighted) {
    const featureProperties = feature.getProperties();

    const oldStyle = featureProperties.style;
    if (!oldStyle) return;

    const style = highlighted
        ? {
              stroke: lightenRgb(oldStyle.stroke, 0.25),
              fill: lightenRgb(oldStyle.fill, 0.25),
          }
        : null;

    feature.setProperties({ highlightStyle: style });
}

regionView.resize = (container) => {
    baseMap.resize(container);
};

regionView.restyle = (container) => {
    baseMap.restyle(container);
};

regionView.plugin = {
    type: "perspective-viewer-map-regions",
    name: "Map Regions",
    max_size: 25000,
    initial: {
        type: "number",
        count: 1,
        names: ["Color", "Tooltip"],
    },
};
export default regionView;
