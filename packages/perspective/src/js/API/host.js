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
            case "table_method":
            case "view_method":
                this.process_method_call(msg);
                break;
            case "view":
                // create a new view and track it with `client_id`
                this._views[msg.view_name] = this._tables[msg.table_name].view(msg.config);
                this._views[msg.view_name].client_id = client_id;
                break;
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
     * Execute a subscription to a Perspective event.
     */
    process_subscribe(msg, obj) {
        try {
            obj[msg.method](ev => {
                this.post({
                    id: msg.id,
                    data: ev
                });
            });
        } catch (error) {
            this.process_error(msg, error);
            return;
        }
    }

    /**
     * Given a call to a table or view method, process it.
     *
     * @param {Object} msg
     */
    process_method_call(msg) {
        let obj, result;
        msg.cmd === "table_method" ? (obj = this._tables[msg.name]) : (obj = this._views[msg.name]);

        if (!obj && msg.cmd === "view_method") {
            // cannot have a host without a table, but can have a host without a view
            this.process_error(msg, {message: "View is not initialized"});
            return;
        }

        try {
            if (msg.subscribe) {
                this.process_subscribe(msg, obj);
                return;
            } else {
                result = obj[msg.method].apply(obj, msg.args);
                if (result && result.then) {
                    result
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
                        .catch(error => this.process_error(msg, error));
                } else if (msg.cmd === "table_method") {
                    // Only send table methods without promise framework
                    this.post({
                        id: msg.id,
                        data: result
                    });
                }
            }
        } catch (error) {
            this.process_error(msg, error);
            return;
        }
    }
}
