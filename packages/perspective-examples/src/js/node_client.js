/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const http = require('http');
const queryString = require('query-string');

var SECURITIES = [
    "AAPL.N",
    "AMZN.N",
    "QQQ.N",
    "NVDA.N",
    "TSLA.N",
    "FB.N",
    "MSFT.N",
    "TLT.N",
    "XIV.N",
    "YY.N",
    "CSCO.N",
    "GOOGL.N",
    "PCLN.N"
];

var CLIENTS = [
    "Homer",
    "Marge",
    "Bart",
    "Lisa",
    "Maggie",
    "Moe",
    "Lenny",
    "Carl",
    "Krusty",
]

function newRow() {
    return {
        name: SECURITIES[Math.floor(Math.random() * SECURITIES.length)],
        client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)], 
        lastUpdate: new Date(),
        chg: Math.random() * 20 - 10,
        bid: Math.random() * 10 + 90,
        ask: Math.random() * 10 + 100,
        vol: Math.random() * 10 + 100,                    
        id: Math.floor(Math.random() * 500)
    };
}

function postrow() {
    var url = 'http://localhost:3000/?' + queryString.stringify(newRow());
    console.log(url);
    http.get(url, res => {
        res.on('data', () => {})
        res.on("end", () =>{
            postrow();
        })
    })
}

postrow();