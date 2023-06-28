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

var SECURITIES = [
    "AAPL.N",
    "MSFT.N",
    "AMZN.N",
    "GOOGL.N",
    "FB.N",
    "TSLA.N",
    "BABA.N",
    "TSM.N",
    "V.N",
    "NVDA.N",
    "JPM.N",
    "JNJ.N",
    "WMT.N",
    "UNH.N",
    "MA.N",
    "BAC.N",
    "DIS.N",
    "ASML.N",
    "ADBE.N",
    "CMCSA.N",
    "NKE.N",
    "XOM.N",
    "TM.N",
    "KO.N",
    "ORCL.N",
    "NFLX.N",
];

var CLIENTS = [
    "Homer",
    "Marge",
    "Bart",
    "Lisa",
    "Maggie",
    "Barney",
    "Ned",
    "Moe",
];
var id = 0;

function randn_bm() {
    var u = 0,
        v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function random_row() {
    id = id % 1000;
    return {
        name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
        client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)],
        lastUpdate: new Date(),
        chg: randn_bm() * 10,
        bid: randn_bm() * 5 + 95,
        ask: randn_bm() * 5 + 105,
        vol: randn_bm() * 5 + 105,
        id: id++,
    };
}
