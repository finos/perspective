/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {seriesCanvasCandlestick} from "d3fc";
import ohlcCandle from "./ohlcCandle";

const candlestick = ohlcCandle(seriesCanvasCandlestick);
candlestick.plugin = {
    type: "d3_candlestick",
    name: "Candlestick Chart",
    max_size: 25000,
    initial: {
        type: "number",
        count: 4,
        names: ["Open", "Close", "High", "Low"]
    }
};

export default candlestick;
