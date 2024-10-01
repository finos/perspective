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

export const LAYOUTS = {
    sparkgrid: {
        version: "3.1.0",
        plugin: "Datagrid",
        plugin_config: {
            columns: {},
            scroll_lock: true,
        },
        columns_config: {
            "chg (-)": {
                number_fg_mode: "bar",
                fg_gradient: 14.34,
            },
            chg: {
                number_bg_mode: "gradient",
                bg_gradient: 29.17,
            },
            "chg (+)": {
                number_fg_mode: "bar",
                fg_gradient: 17.4,
            },
        },
        settings: true,
        title: "Market Monitor",
        group_by: ["name"],
        split_by: ["client"],
        columns: ["chg (-)", "chg", "chg (+)"],
        filter: [],
        sort: [["chg", "desc"]],
        expressions: {
            "chg (+)": 'if("chg">0){"chg"}else{0}',
            "chg (-)": 'if("chg"<0){"chg"}else{0}',
        },
        aggregates: {
            chg: "avg",
            "chg (+)": "avg",
            "chg (-)": "avg",
        },
    },
    datagrid: {
        plugin: "datagrid",
        title: "Blotter",
        columns: ["ask", "bid", "chg"],
        sort: [
            ["name", "desc"],
            ["lastUpdate", "desc"],
        ],
        aggregates: { name: "last", lastUpdate: "last" },
        group_by: ["name", "lastUpdate"],
        split_by: ["client"],
        plugin_config: {},
    },
    "x bar": {
        title: "Px (Δ)",
        columns: ["chg"],
        plugin: "X Bar",
        sort: [["chg", "asc"]],
        group_by: ["name"],
        split_by: ["client"],
    },
    "y line": {
        title: "Time Series (Px)",
        plugin: "Y Line",
        group_by: ["lastUpdate"],
        split_by: [],
        sort: [["lastUpdate", "desc"]],
        split_by: ["client"],
        columns: ["bid"],
        aggregates: { bid: "avg", chg: "avg", name: "last" },
    },
    "xy scatter": {
        title: "Spread Scatter",
        plugin: "X/Y Scatter",
        group_by: ["name"],
        split_by: [],
        columns: ["bid", "ask", "chg", "vol", null, "name"],
        aggregates: { bid: "avg", ask: "avg", vol: "avg", name: "dominant" },
        sort: [],
    },
    treemap: {
        plugin: "Treemap",
        title: "Volume Map",
        group_by: ["name", "client"],
        split_by: [],
        columns: ["vol", "chg"],
        aggregates: { bid: "sum", chg: "sum", name: "last" },
        sort: [
            ["name", "desc"],
            ["chg", "desc"],
        ],
    },
    heatmap: {
        title: "Spread Heatmap",
        columns: ["name"],
        plugin: "Heatmap",
        expressions: {
            'bucket("bid",2)': 'bucket("bid",2)',
            'bucket("ask",2)': `bucket("ask",2)`,
        },
        group_by: [`bucket("bid",2)`],
        split_by: [`bucket("ask",2)`],
        sort: [],
        aggregates: {},
    },
};
