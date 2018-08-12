/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {TYPE_AGGREGATES, AGGREGATE_DEFAULTS, TYPE_FILTERS, FILTER_DEFAULTS, SORT_ORDERS} from "./defaults.js";

import * as api from "./api.js";

/******************************************************************************
 *
 * Utilities
 *
 */

class WebSocketWorker extends api.worker {

    constructor(url) {
        super();
        this._ws = new WebSocket(url);
        this._ws.onopen = () => {
            this.send({id: -1, cmd: 'init'});
        };
        this._ws.onmessage = (msg) => {
            this._handle({data: JSON.parse(msg.data)});
        }
    }

    send(msg) {
        this._ws.send(JSON.stringify(msg));
    }

    terminate() {
        this._ws.close();  
    }
}

export default {
    worker: function (url) {
        return new WebSocketWorker(url);
    },

    TYPE_AGGREGATES: TYPE_AGGREGATES,

    TYPE_FILTERS: TYPE_FILTERS,

    AGGREGATE_DEFAULTS: AGGREGATE_DEFAULTS,

    FILTER_DEFAULTS: FILTER_DEFAULTS,

    SORT_ORDERS: SORT_ORDERS
};
