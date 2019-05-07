/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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
 * The base class for Perspective's async API. It initializes and keeps track of tables, views, and processes
 * messages from the user into Perspective.
 *
 * Child classes must implement the `post()` interface, which defines how the worker sends messages.
 */
export class Host {
    constructor(perspective) {
        this.perspective = perspective;
        this._tables = {};
        this._views = {};
    }

    /**
     * Host must be extended and the `post` method implemented before it can be initialized.
     */
    init(msg) {
        this.post(msg);
    }

    post() {
        throw new Error("post() not implemented!");
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

    /**
     * Given a message, execute its instructions. This method is the dispatcher for all Perspective actions,
     * including table/view creation, deletion, and all method calls to/from the table and view.
     *
     * @param {*} msg an Object containing `cmd` (a String instruction) and associated data for that instruction
     * @param {*} client_id
     */
    process(msg, client_id) {
        switch (msg.cmd) {
            case "init":
                this.init(msg);
                break;
            case "table":
                this._tables[msg.name] = this.perspective.table(msg.args[0], msg.options);
                break;
            case "add_computed":
                let table = this._tables[msg.original];
                let computed = msg.computed;
                // rehydrate computed column functions
                for (let i = 0; i < computed.length; ++i) {
                    let column = computed[i];
                    eval("column.func = " + column.func);
                }
                this._tables[msg.name] = table.add_computed(computed);
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
            case "view":
                this._views[msg.view_name] = this._tables[msg.table_name].view(msg.config);
                this._views[msg.view_name].client_id = client_id;
                break;
            case "table_method": {
                let obj = this._tables[msg.name];
                let result;

                try {
                    if (msg.subscribe) {
                        obj[msg.method](e => {
                            this.post({
                                id: msg.id,
                                data: e
                            });
                        });
                    } else {
                        result = obj[msg.method].apply(obj, msg.args);
                        if (result && result.then) {
                            result
                                .then(data => {
                                    if (data) {
                                        this.post({
                                            id: msg.id,
                                            data: data
                                        });
                                    }
                                })
                                .catch(error => {
                                    this.post({
                                        id: msg.id,
                                        error: error_to_json(error)
                                    });
                                });
                        } else {
                            this.post({
                                id: msg.id,
                                data: result
                            });
                        }
                    }
                } catch (e) {
                    this.post({
                        id: msg.id,
                        error: error_to_json(e)
                    });
                    return;
                }

                break;
            }
            case "view_method": {
                let obj = this._views[msg.name];
                if (!obj) {
                    this.post({
                        id: msg.id,
                        error: {message: "View is not initialized"}
                    });
                    return;
                }
                if (msg.subscribe) {
                    try {
                        obj[msg.method](e => {
                            this.post({
                                id: msg.id,
                                data: e
                            });
                        });
                    } catch (error) {
                        this.post({
                            id: msg.id,
                            error: error_to_json(error)
                        });
                    }
                } else {
                    obj[msg.method]
                        .apply(obj, msg.args)
                        .then(result => {
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
                        })
                        .catch(error => {
                            this.post({
                                id: msg.id,
                                error: error_to_json(error)
                            });
                        });
                }
                break;
            }
        }
    }
}
