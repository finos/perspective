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

import { axisType } from "../axis/axisType";
import { AXIS_TYPES } from "../axis/axisType";
import { labelFunction } from "../axis/axisLabel";
import { Settings } from "../types";

export function heatmapData(settings: Settings, data) {
    const labelfn = labelFunction(settings);
    const mainType = axisType(settings)
        .excludeType(AXIS_TYPES.linear)
        .settingName("splitValues")();

    const heatmapData = [];

    data.forEach((col, i) => {
        const crossValue = labelfn(col, i);
        Object.keys(col)
            .filter((key) => key !== "__ROW_PATH__")
            .forEach((key) => {
                const mainValue = getMainValues(key);
                heatmapData.push({
                    crossValue: crossValue,
                    mainValue:
                        mainType === AXIS_TYPES.time
                            ? new Date(mainValue)
                            : mainValue,
                    colorValue: col[key],
                    row: col,
                });
            });
    });

    return heatmapData;
}

function getMainValues(key) {
    // Key format is based on "Split By" values plus the value label at the end
    // val1|val2|....|label
    const labels = key.split("|");
    labels.pop();
    return labels.join("|");
}
