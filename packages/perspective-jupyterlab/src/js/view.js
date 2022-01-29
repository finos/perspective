/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {isEqual} from "underscore";
import {DOMWidgetView} from "@jupyter-widgets/base";
import {PerspectiveJupyterWidget} from "./widget";
import {PerspectiveJupyterClient} from "./client";

// eslint-disable-next-line @typescript-eslint/no-var-requires
import perspective from "@finos/perspective/dist/esm/perspective.js";

/**
 * `PerspectiveView` defines the plugin's DOM and how the plugin interacts with
 * the DOM.
 */
export class PerspectiveView extends DOMWidgetView {
    _createElement() {
        this.pWidget = new PerspectiveJupyterWidget(undefined, {
            plugin: this.model.get("plugin"),
            columns: this.model.get("columns"),
            row_pivots: this.model.get("row_pivots"),
            column_pivots: this.model.get("column_pivots"),
            aggregates: this.model.get("aggregates"),
            sort: this.model.get("sort"),
            filter: this.model.get("filter"),
            expressions: this.model.get("expressions"),
            plugin_config: this.model.get("plugin_config"),
            server: this.model.get("server"),
            client: this.model.get("client"),
            theme: this.model.get("theme"),
            editable: this.model.get("editable"),
            bindto: this.el,
            view: this,
        });

        this.perspective_client = new PerspectiveJupyterClient(this);
        return this.pWidget.node;
    }

    _setElement(el) {
        if (this.el || el !== this.pWidget.node) {
            // Do not allow the view to be reassigned to a different element.
            throw new Error("Cannot reset the DOM element.");
        }
        this.el = this.pWidget.node;
    }

    /**
     * When state changes on the viewer DOM, apply it to the widget state.
     *
     * @param mutations
     */

    _synchronize_state(mutations) {
        for (const mutation of mutations) {
            const name = mutation.attributeName.replace(/-/g, "_");
            let new_value = this.pWidget.viewer.getAttribute(
                mutation.attributeName
            );

            const current_value = this.model.get(name);
            if (typeof new_value === "undefined") {
                continue;
            }

            if (
                new_value &&
                typeof new_value === "string" &&
                name !== "plugin"
            ) {
                new_value = JSON.parse(new_value);
            }

            if (!isEqual(new_value, current_value)) {
                this.model.set(name, new_value);
            }
        }

        // propagate changes back to Python
        this.touch();
    }

    /**
     * Attach event handlers, and watch the DOM for state changes in order to
     * reflect them back to Python.
     */

    render() {
        super.render();
        this.model.on("msg:custom", this._handle_message, this);
        this.model.on("change:plugin", this.plugin_changed, this);
        this.model.on("change:columns", this.columns_changed, this);
        this.model.on("change:row_pivots", this.row_pivots_changed, this);
        this.model.on("change:column_pivots", this.column_pivots_changed, this);
        this.model.on("change:aggregates", this.aggregates_changed, this);
        this.model.on("change:sort", this.sort_changed, this);
        this.model.on("change:filter", this.filter_changed, this);
        this.model.on("change:expressions", this.expressions_changed, this);
        this.model.on("change:plugin_config", this.plugin_config_changed, this);
        this.model.on("change:theme", this.theme_changed, this);
        this.model.on("change:editable", this.editable_changed, this);

        /**
         * Request a table from the manager. If a table has been loaded, proxy
         * it and kick off subsequent operations.
         *
         * If a table hasn't been loaded, the viewer won't get a response back
         * and simply waits until it receives a table name.
         */
        this.perspective_client.send({
            id: -2,
            cmd: "table",
        });
    }

    /**
     * Handle messages from the Python Perspective instance.
     *
     * Messages should conform to the `PerspectiveJupyterMessage` interface.
     *
     * @param msg {PerspectiveJupyterMessage}
     */

    _handle_message(msg, buffers) {
        if (this._pending_binary && buffers.length === 1) {
            // Handle binary messages from the widget, which (unlike the
            // tornado handler), does not send messages in chunks.
            const binary = buffers[0].buffer.slice(0);
            // make sure on_update callbacks are called with a `port_id`
            // AND the transferred binary.
            if (this._pending_port_id !== undefined) {
                // call handle individually to bypass typescript complaints
                // that we override `data` with different types.
                this.perspective_client._handle({
                    id: this._pending_binary,
                    data: {
                        id: this._pending_binary,
                        data: {
                            port_id: this._pending_port_id,
                            delta: binary,
                        },
                    },
                });
            } else {
                this.perspective_client._handle({
                    id: this._pending_binary,
                    data: {
                        id: this._pending_binary,
                        data: binary,
                    },
                });
            }
            this._pending_port_id = undefined;
            this._pending_binary = undefined;
            return;
        }
        if (msg.type === "table") {
            // If in client-only mode (no Table on the python widget),
            // message.data is an object containing "data" and "options".
            this._handle_load_message(msg);
        } else {
            if (msg.data["cmd"] === "delete") {
                // Regardless of client mode, if `delete()` is called we need to
                // clean up the Viewer.
                this.pWidget.delete();
                return;
            }
            if (this.pWidget.client === true) {
                // In client mode, we need to directly call the methods on the
                // viewer
                const command = msg.data["cmd"];
                if (command === "update") {
                    this.pWidget._update(msg.data["data"]);
                } else if (command === "replace") {
                    this.pWidget.replace(msg.data["data"]);
                } else if (command === "clear") {
                    this.pWidget.clear();
                }
            } else {
                // Make a deep copy of each message - widget views share the
                // same comm, so mutations on `msg` affect subsequent message
                // handlers.
                const message = JSON.parse(JSON.stringify(msg));
                delete message.type;
                if (typeof message.data === "string") {
                    message.data = JSON.parse(message.data);
                }
                if (message.data["binary_length"]) {
                    // If the `binary_length` flag is set, the worker expects
                    // the next message to be a transferable object. This sets
                    // the `_pending_binary` flag, which triggers a special
                    // handler for the ArrayBuffer containing binary data.
                    this._pending_binary = message.data.id;
                    // Check whether the message also contains a `port_id`,
                    // indicating that we are in an `on_update` callback and
                    // the pending binary needs to be joined with the port_id
                    // for on_update handlers to work properly.
                    if (
                        message.data.data &&
                        message.data.data.port_id !== undefined
                    ) {
                        this._pending_port_id = message.data.data.port_id;
                    }
                } else {
                    this.perspective_client._handle(message);
                }
            }
        }
    }

    get client_worker() {
        if (!this._client_worker) {
            this._client_worker = perspective.shared_worker();
        }
        return this._client_worker;
    }

    /**
     * Given a message that commands the widget to load a dataset or table,
     * process it.
     *
     * @param {PerspectiveJupyterMessage} msg
     */

    _handle_load_message(msg) {
        const table_options = msg.data["options"] || {};
        if (this.pWidget.client) {
            /**
             * In client mode, retrieve the serialized data and the options
             * passed by the user, and create a new table on the client end.
             */
            const data = msg.data["data"];
            const client_table = this.client_worker.table(data, table_options);
            this.pWidget.load(client_table);
        } else {
            if (this.pWidget.server && msg.data["table_name"]) {
                /**
                 * Get a remote table handle, and load the remote table in
                 * the client for server mode Perspective.
                 */
                const table = this.perspective_client.open_table(
                    msg.data["table_name"]
                );
                this.pWidget.load(table);
            } else if (msg.data["table_name"]) {
                // Get a remote table handle from the Jupyter kernel, and mirror
                // the table on the client, setting up editing if necessary.
                this.perspective_client
                    .open_table(msg.data["table_name"])
                    .then(async (kernel_table) => {
                        const kernel_view = await kernel_table.view();
                        const arrow = await kernel_view.to_arrow();

                        // Create a client side table
                        let client_table = this.client_worker.table(
                            arrow,
                            table_options
                        );

                        // Need to await the table and get the instance
                        // separately as load() only takes a promise
                        // to a table and not the instance itself.
                        const client_table2 = await client_table;

                        if (this.pWidget.editable) {
                            await this.pWidget.load(client_table);

                            // Allow edits from the client Perspective to
                            // feed back to the kernel.
                            const client_edit_port =
                                await this.pWidget.getEditPort();
                            const kernel_edit_port =
                                await kernel_table.make_port();

                            const client_view = await client_table2.view();

                            // When the client updates, if the update
                            // comes through the edit port then forward
                            // it to the server.
                            client_view.on_update(
                                (updated) => {
                                    if (updated.port_id === client_edit_port) {
                                        kernel_table.update(updated.delta, {
                                            port_id: kernel_edit_port,
                                        });
                                    }
                                },
                                {
                                    mode: "row",
                                }
                            );

                            // If the server updates, and the edit is
                            // not coming from the server edit port,
                            // then synchronize state with the client.
                            kernel_view.on_update(
                                (updated) => {
                                    if (updated.port_id !== kernel_edit_port) {
                                        client_table2.update(updated.delta); // any port, we dont care
                                    }
                                },
                                {
                                    mode: "row",
                                }
                            );
                        } else {
                            // Load the table and mirror updates from the
                            // kernel.
                            await this.pWidget.load(client_table);
                            kernel_view.on_update(
                                (updated) =>
                                    client_table2.update(updated.delta),
                                {
                                    mode: "row",
                                }
                            );
                        }
                    });
            } else {
                throw new Error(
                    `PerspectiveWidget cannot load data from kernel message: ${JSON.stringify(
                        msg
                    )}`
                );
            }
            // Only call `init` after the viewer has a table.
            this.perspective_client.send({
                id: -1,
                cmd: "init",
            });
        }
    }

    /**
     * When the View is removed after the widget terminates, clean up the
     * client viewer and Web Worker.
     */

    remove() {
        // Delete the <perspective-viewer> but do not terminate the shared
        // worker as it is shared across other widgets.
        this.pWidget.delete();
    }

    /**
     * When traitlets are updated in python, update the corresponding value on
     * the front-end viewer. `client` and `server` are not included, as they
     * are not properties in `<perspective-viewer>`.
     */

    plugin_changed() {
        this.pWidget.restore({
            plugin: this.model.get("plugin"),
        });
    }

    columns_changed() {
        this.pWidget.restore({
            columns: this.model.get("columns"),
        });
    }

    row_pivots_changed() {
        this.pWidget.restore({
            row_pivots: this.model.get("row_pivots"),
        });
    }

    column_pivots_changed() {
        this.pWidget.restore({
            column_pivots: this.model.get("column_pivots"),
        });
    }

    aggregates_changed() {
        this.pWidget.restore({
            aggregates: this.model.get("aggregates"),
        });
    }

    sort_changed() {
        this.pWidget.restore({
            sort: this.model.get("sort"),
        });
    }

    filter_changed() {
        this.pWidget.restore({
            filter: this.model.get("filter"),
        });
    }

    expressions_changed() {
        this.pWidget.restore({
            expressions: this.model.get("expressions"),
        });
    }

    plugin_config_changed() {
        this.pWidget.plugin_config = this.model.get("plugin_config");
    }

    theme_changed() {
        this.pWidget.restore({
            theme: this.model.get("theme"),
        });
    }

    editable_changed() {
        this.pWidget.editable = this.model.get("editable");
    }
}
