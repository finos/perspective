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

export function createTooltip(container, map) {
    let data = null;
    let config = null;
    let vectorSource = null;
    let regions = false;
    let onHighlight = null;

    let currentPoint = null;
    let currentFeature = null;

    map.on("pointermove", (evt) => {
        if (!evt.dragging) {
            onMove(evt);
        } else {
            onLeave(evt);
        }
    });
    map.on("click", (evt) => onClick(evt));

    container.addEventListener("mouseleave", (evt) => onLeave(evt));

    const tooltipDiv = document.createElement("div");
    tooltipDiv.className = "map-tooltip";
    container.appendChild(tooltipDiv);

    const _tooltip = {};
    _tooltip.data = (...args) => {
        if (args.length) {
            data = args[0];
            return _tooltip;
        }
        return data;
    };
    _tooltip.config = (...args) => {
        if (args.length) {
            config = args[0];
            return _tooltip;
        }
        return config;
    };
    _tooltip.vectorSource = (...args) => {
        if (args.length) {
            vectorSource = args[0];
            return _tooltip;
        }
        return vectorSource;
    };
    _tooltip.regions = (...args) => {
        if (args.length) {
            regions = args[0];
            return _tooltip;
        }
        return regions;
    };
    _tooltip.onHighlight = (...args) => {
        if (args.length) {
            onHighlight = args[0];
            return _tooltip;
        }
        return onHighlight;
    };

    const onMove = (evt) => {
        // Find the closest point
        const { coordinate } = evt;
        const hoverFeature = getClosest(coordinate);
        const closest = hoverFeature && hoverFeature.get("data");
        if (closest) {
            const geometry = hoverFeature.getGeometry();
            const extent = geometry.getExtent();

            const position = [
                (extent[0] + extent[2]) / 2,
                (extent[1] + extent[3]) / 2,
            ];
            const screen = map.getPixelFromCoordinate(position);

            if (!regions) {
                const mouse = map.getPixelFromCoordinate(coordinate);
                if (distanceBetween(screen, mouse) > 50) {
                    return onLeave(evt);
                }
            }

            if (currentPoint !== closest) {
                currentPoint = closest;
                highlighFeature(hoverFeature);

                tooltipDiv.innerHTML = composeHtml(currentPoint);
                tooltipDiv.style.left = `${screen[0]}px`;
                tooltipDiv.style.top = `${screen[1]}px`;
                tooltipDiv.className = "map-tooltip show";
            }
        } else {
            return onLeave(evt);
        }
    };

    const getClosest = (coordinate) => {
        if (regions) {
            const hitFeatures =
                vectorSource.getFeaturesAtCoordinate(coordinate);
            return hitFeatures.length ? hitFeatures[0] : null;
        }
        return vectorSource.getClosestFeatureToCoordinate(coordinate);
    };

    const highlighFeature = (feature) => {
        restoreFeature();
        currentFeature = feature;

        if (currentFeature && onHighlight) {
            onHighlight(currentFeature, true);

            // if (regions) {
            // } else {
            //     const imageStyle = featureStyle && featureStyle.getImage();
            //     if (featureStyle && imageStyle) {
            //         const color = imageStyle.getStroke().getColor();

            //         const newStyle = new CircleStyle({
            //             stroke: new Stroke({color: lightenRgb(color, 0.25)}),
            //             fill: new Fill({color: lightenRgb(color, 0.5)}),
            //             radius: imageStyle.getRadius()
            //         });

            //         currentFeature.setStyle(new Style({image: newStyle, zIndex: 10}));
            //     } else {
            //         const color = featureProperties.stroke;
            //         currentFeature.setProperties({
            //             stroke: lightenRgb(color, 0.25),
            //             fill: lightenRgb(color, 0.5)
            //         });
            //     }
            // }
        }
    };

    const restoreFeature = () => {
        if (currentFeature && onHighlight) {
            onHighlight(currentFeature, false);

            // currentFeature.setProperties(featureProperties);
            // currentFeature.setStyle(featureStyle);
        }
        currentFeature = null;
    };

    const onLeave = () => {
        tooltipDiv.className = "map-tooltip";
        currentPoint = null;
        restoreFeature();
    };

    const onClick = () => {
        if (currentPoint) {
            const column_names = config.columns;
            const groupFilters = getFilter(
                getListFromJoin(currentPoint.group, config.group_by),
            );
            const categoryFilters = getFilter(
                getListFromJoin(currentPoint.category, config.split_by),
            );
            const filters = config.filter
                .concat(groupFilters)
                .concat(categoryFilters);

            container.dispatchEvent(
                new CustomEvent("perspective-click", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        column_names,
                        config: { filters },
                        row: currentPoint.row,
                    },
                }),
            );
        }
    };

    const composeHtml = (point) => {
        const group = composeGroup(point.group);
        const aggregates = composeAggregates(point.cols, regions ? 0 : 2);
        const category = composeCategory(point.category);
        const location = regions ? "" : composeLocation(point.cols);

        return `${group}${aggregates}${category}${location}`;
    };

    const composeAggregates = (cols, fromIndex) => {
        if (!cols) return "";
        const list = config.real_columns.slice(fromIndex).map((c, i) =>
            c === null
                ? null
                : {
                      name: c,
                      value: cols[i + fromIndex].toLocaleString(),
                  },
        );
        return composeList(list);
    };

    const composeGroup = (group) => {
        const groupList = getListFromJoin(group, config.group_by);
        if (groupList.length === 1) {
            return `<h1 class="title">${group}</h1>`;
        }
        return composeList(groupList);
    };

    const composeCategory = (category) => {
        return composeList(getListFromJoin(category, config.split_by));
    };

    const getListFromJoin = (join, pivot) => {
        if (join && pivot.length) {
            const values = join.split("|");
            return values.map((value, i) => ({ name: pivot[i], value }));
        }
        return [];
    };

    const getFilter = (list) => {
        return list.map((item) => [item.name, "==", item.value]);
    };

    const composeList = (items) => {
        if (items.length) {
            const itemList = items.map((item) =>
                item === null
                    ? ``
                    : `<li><span class="label">${sanitize(
                          item.name,
                      )}</span></span>${sanitize(item.value)}</span></li>`,
            );
            return `<ul>${itemList.join("")}</ul>`;
        }
        return "";
    };

    const composeLocation = (cols) => {
        return `<span class="location">(${cols[0]}, ${cols[1]})</span>`;
    };

    const sanitize = (text) => {
        tooltipDiv.innerText = text;
        return tooltipDiv.innerHTML;
    };

    const distanceBetween = (c1, c2) => {
        return Math.sqrt(
            Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2),
        );
    };

    return _tooltip;
}
