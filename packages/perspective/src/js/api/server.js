/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {override_config} from "../config";

function error_to_json(error) {
    const obj = {};
    if (typeof error !== "string") {
        Object.getOwnPropertyNames(error).forEach(key => {
            obj[key] = error[key];
        }, error);
    } else {
        obj["message"] = error;
    }
    return obj;
}

/**
 * The base class for Perspective's async API. It initializes and keeps track of
 * tables, views, and processes messages from the user into the Perspective
 * engine.
 *
 * Child classes must implement the `post()` interface, which defines how the
 * server sends messages to the client. The implementation of `Server` for
 * Web Workers can be found in `perspective.js`, and an implementation for
 * Node.JS can be found in `perspective.node.js`.
 */
export class Server {
    constructor(perspective) {
        this.perspective = perspective;
        this._tables = {};
        this._views = {};
        this._callback_cache = new Map();
    }

    /**
     * `Server` must be extended and the `post` method implemented before the
     * server can successfully be initialized.
     */
    init(msg) {
        if (msg.config) {
            override_config(msg.config);
        }
        this.post(msg);
    }

    /**
     * Send a message from the Perspective server to the Perspective client -
     * this method must be implemented before the server can be used.
     *
     * @param {Object} msg a message to be sent to the client.
     */
    post(msg) {
        throw new Error(`Posting ${msg} failed - post() not implemented!`);
    }

    /**
     * Given a message, execute its instructions. This method is the dispatcher
     * for all Perspective actions, including table/view creation, deletion, and
     * all method calls to/from the table and view.
     *
     * @param {*} msg an Object containing `cmd` (a String instruction) and
     * associated data for that instruction
     * @param {*} client_id
     */
    process(msg, client_id) {
        switch (msg.cmd) {
            case "init_profile_thread":
                this.perspective.initialize_profile_thread();
                break;
            case "init":
                this.init(msg);
                break;
            case "table":
                if (typeof msg.args[0] === "undefined") {
                    // Cache messages for when a table is created but not fully
                    // initialized, i.e. in the case when a table is created
                    // from a view, as the view needs to be serialized to an
                    // arrow before the table will be ready.
                    this._tables[msg.name] = [];
                } else {
                    try {
                        const msgs = this._tables[msg.name];
                        const table = this.perspective.table(msg.args[0], msg.options);

                        // When using the Node server, the `table()` constructor
                        // returns a Promise, but in the Web Worker version,
                        // table() synchronously returns an instance of a Table.
                        if (table && table.then) {
                            table
                                .then(table => {
                                    this._tables[msg.name] = table;

                                    // Process cached messages for this table.
                                    if (msgs) {
                                        for (const msg of msgs) {
                                            this.process(msg);
                                        }
                                    }

                                    // Resolve the promise to return a Table.
                                    this.post({
                                        id: msg.id,
                                        data: msg.name
                                    });
                                })
                                .catch(error => this.process_error(msg, error));
                        } else {
                            this._tables[msg.name] = table;

                            // Process cached messages for this table.
                            if (msgs) {
                                for (const msg of msgs) {
                                    this.process(msg);
                                }
                            }

                            // Resolve the promise to return a Table.
                            this.post({
                                id: msg.id,
                                data: msg.name
                            });
                        }
                    } catch (error) {
                        this.process_error(msg, error);
                        return;
                    }
                }
                break;
            case "table_generate":
                let g;
                eval("g = " + msg.args);
                g(function(tbl) {
                    this._tables[msg.name] = tbl;
                    this.post({
                        id: msg.id,
                        data: "created!"
                    });
                });
                break;
            case "table_execute":
                let f;
                eval("f = " + msg.f);
                f(this._tables[msg.name]);
                break;
            case "table_method":
            case "view_method":
                this.process_method_call(msg);
                break;
            case "view":
                const tableMsgQueue = this._tables[msg.table_name];

                if (tableMsgQueue && Array.isArray(tableMsgQueue)) {
                    // If the table is not initialized, defer this message for
                    // until after the table is initialized, and create a new
                    // message queue for the uninitialized view.
                    tableMsgQueue.push(msg);
                    this._views[msg.view_name] = [];
                } else {
                    // Create a new view and resolve the Promise on the client
                    // with the name of the view, which the client will use to
                    // construct a new view proxy.
                    try {
                        const msgs = this._views[msg.view_name];

                        // When using the Node server, the `view()` constructor
                        // returns a Promise, but in the Web Worker version,
                        // view() synchronously returns an instance of a View.
                        const view = this._tables[msg.table_name].view(msg.config);

                        if (view && view.then) {
                            view.then(view => {
                                this._views[msg.view_name] = view;
                                this._views[msg.view_name].client_id = client_id;

                                // Process cached messages for the view.
                                if (msgs) {
                                    for (const msg of msgs) {
                                        this.process(msg);
                                    }
                                }

                                this.post({
                                    id: msg.id,
                                    data: msg.view_name
                                });
                            }).catch(error => this.process_error(msg, error));
                        } else {
                            this._views[msg.view_name] = view;
                            this._views[msg.view_name].client_id = client_id;

                            // Process cached messages for the view.
                            if (msgs) {
                                for (const msg of msgs) {
                                    this.process(msg);
                                }
                            }

                            this.post({
                                id: msg.id,
                                data: msg.view_name
                            });
                        }
                    } catch (error) {
                        this.process_error(msg, error);
                        return;
                    }
                }
                break;
        }
    }

    /**
     * Execute a subscription to a Perspective event, such as `on_update` or
     * `on_delete`.
     */
    process_subscribe(msg, obj) {
        try {
            let callback;
            if (msg.method.slice(0, 2) === "on") {
                callback = ev => {
                    let result = {
                        id: msg.id,
                        data: ev
                    };
                    try {
                        // post transferable data for arrow
                        if (msg.args && msg.args[0]) {
                            if (msg.method === "on_update" && msg.args[0]["mode"] === "row") {
                                // actual arrow is in the `delta`
                                this.post(result, [ev.delta]);
                                return;
                            }
                        }

                        this.post(result);
                    } catch (e) {
                        console.error(`Removing failed callback to \`${msg.method}()\` (presumably due to failed connection)`);
                        const remove_method = msg.method.substring(3);
                        obj[`remove_${remove_method}`](callback);
                    }
                };
                if (msg.callback_id) {
                    this._callback_cache.set(msg.callback_id, callback);
                }
            } else if (msg.callback_id) {
                callback = this._callback_cache.get(msg.callback_id);
                this._callback_cache.delete(msg.callback_id);
            }
            if (callback) {
                obj[msg.method](callback, ...msg.args);
            } else {
                console.error(`Callback not found for remote call "${JSON.stringify(msg)}"`);
            }
        } catch (error) {
            this.process_error(msg, error);
            return;
        }
    }

    /**
     * Given a message that calls a table or view method, call the method and
     * return the result to the client, or return an error message to the
     * client.
     *
     * @param {Object} msg
     */
    process_method_call(msg) {
        let obj, result;
        const name = msg.view_name || msg.name;
        msg.cmd === "table_method" ? (obj = this._tables[name]) : (obj = this._views[name]);

        if (!obj && msg.cmd === "view_method") {
            // cannot have a host without a table, but can have a host without a
            // view
            this.process_error(msg, {message: "View is not initialized"});
            return;
        }

        if (obj && obj.push) {
            obj.push(msg);
            return;
        }

        try {
            if (msg.subscribe) {
                this.process_subscribe(msg, obj);
                return;
            } else {
                result = obj[msg.method].apply(obj, msg.args);
                if (result instanceof Promise) {
                    result.then(result => this.process_method_call_response(msg, result)).catch(error => this.process_error(msg, error));
                } else {
                    this.process_method_call_response(msg, result);
                }
            }
        } catch (error) {
            this.process_error(msg, error);
            return;
        }
    }

    /**
     * Send the response from a method call back to the client, using
     * transferables if the response is an Arrow binary.
     * @param {Object} msg
     * @param {*} result
     */
    process_method_call_response(msg, result) {
        if (msg.method === "delete") {
            delete this._views[msg.name];
        }
        if (msg.method === "to_arrow") {
            this.post(
                {
                    id: msg.id,
                    data: result
                },
                [result]
            );
        } else {
            this.post({
                id: msg.id,
                data: result
            });
        }
    }

    /**
     * Send an error to the client.
     */
    process_error(msg, error) {
        this.post({
            id: msg.id,
            error: error_to_json(error)
        });
    }

    /**
     * Garbage collect un-needed views.
     */
    clear_views(client_id) {
        for (let key of Object.keys(this._views)) {
            if (this._views[key].client_id === client_id) {
                try {
                    this._views[key].delete();
                } catch (e) {
                    console.error(e);
                }
                delete this._views[key];
            }
        }
        console.debug(`GC ${Object.keys(this._views).length} views in memory`);
    }
}
