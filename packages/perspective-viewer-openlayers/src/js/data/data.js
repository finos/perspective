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

export function getMapData(config) {
    const points = [];
    // const cols = config.columns.map(x => )
    config.data.forEach((row, i) => {
        // Exclude "total" rows that don't have all values
        const groupCount = row.__ROW_PATH__ ? row.__ROW_PATH__.length : 0;
        if (groupCount < config.group_by.length) {
            return;
        }

        // Get the group from the row path
        const group = row.__ROW_PATH__ ? row.__ROW_PATH__.join("|") : `${i}`;
        const rowPoints = {};

        // Split the rest of the row into a point for each category
        Object.keys(row)
            .filter((key) => key !== "__ROW_PATH__" && row[key] !== null)
            .forEach((key) => {
                const split = key.split("|");
                const category =
                    split.length > 1
                        ? split.slice(0, split.length - 1).join("|")
                        : "__default__";
                rowPoints[category] = rowPoints[category] || { group, row };
                rowPoints[category][split[split.length - 1]] = row[key];
            });

        // Add the points for this row to the data set
        Object.keys(rowPoints).forEach((key) => {
            const rowPoint = rowPoints[key];
            const cols = config.real_columns.map((c) =>
                c ? rowPoint[c] : null,
            );

            points.push({
                cols,
                group: rowPoint.group,
                row: rowPoint.row,
                category: key,
            });
        });
    });

    return points;
}
