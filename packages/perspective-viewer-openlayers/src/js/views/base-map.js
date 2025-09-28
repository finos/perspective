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

import { computedStyle } from "../style/computed";
import { createTooltip } from "../tooltip/tooltip";

// const ol = require("ol");
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";

const DEFAULT_TILE_URL =
    '"http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"';

const PRIVATE = Symbol("map-view-data");

export function baseMap(container) {
    // Setup the initial base map
    return getOrCreateMap(container);
}

baseMap.resize = (container) => {
    if (container[PRIVATE]) {
        container[PRIVATE].map.updateSize();
    }
};

baseMap.restyle = (container) => {
    if (container[PRIVATE]) {
        setTileUrl(container);
    }
};

baseMap.restore = (container, token) => {
    if (container[PRIVATE]) {
        container[PRIVATE].next_zoom_state = token;
    }
};

baseMap.save = (container) => {
    if (container[PRIVATE]) {
        const view = container[PRIVATE].map.getView();
        return {
            center: view.getCenter(),
            zoom: view.getZoom(),
        };
    }
    return {};
};

baseMap.initializeView = (container, extent) => {
    initializeView(container, extent);
};

function getOrCreateMap(container) {
    if (!container[PRIVATE]) {
        // console.log
        const tileLayer = new TileLayer();
        const map = new Map({
            target: container,
            layers: [tileLayer],
            view: new View({ center: [0, 0], zoom: 1 }),
        });

        const tooltip = createTooltip(container, map);
        container[PRIVATE] = {
            map,
            tileLayer,
            tooltip,
            invalid_extents: true,
        };
    }
    removeVectorLayer(container);
    setTileUrl(container);
    return container[PRIVATE];
}

function initializeView(container, vectorSource) {
    const map = container[PRIVATE].map;
    const extents = vectorSource.getExtent();
    if (container[PRIVATE]?.next_zoom_state) {
        map.getView().setZoom(container[PRIVATE].next_zoom_state.zoom);
        map.getView().setCenter(container[PRIVATE].next_zoom_state.center);
        container[PRIVATE].next_zoom_state = undefined;
    } else if (
        map.getView().getCenter().some(isNaN) ||
        (!!container[PRIVATE] && container[PRIVATE].invalid_extents)
    ) {
        const map = container[PRIVATE].map;
        map.getView().fit(extents, { size: map.getSize() });
    }

    container[PRIVATE].invalid_extents = extents.some(isNaN);
}

function removeVectorLayer(container) {
    const { map } = container[PRIVATE];
    const layers = map.getLayers().getArray();
    for (var n = layers.length - 1; n > 0; n--) {
        map.removeLayer(layers[n]);
    }
}

function setTileUrl(container) {
    const tileUrl = computedStyle(container)(
        "--map-tile-url",
        DEFAULT_TILE_URL,
    );
    const url = tileUrl.trim().substring(1, tileUrl.length - 1);

    if (container[PRIVATE].tileUrl != url) {
        container[PRIVATE].tileLayer.setSource(new OSM({ wrapX: false, url }));
        container[PRIVATE].tileUrl = url;
    }
}
