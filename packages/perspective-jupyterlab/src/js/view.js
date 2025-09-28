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

import { DOMWidgetView } from "@jupyter-widgets/base";
import { PerspectiveJupyterWidget } from "./widget";

import perspective from "@finos/perspective";

function isEqual(a, b) {
    if (a === b) return true;
    if (typeof a != "object" || typeof b != "object" || a == null || b == null)
        return false;

    let keysA = Object.keys(a),
        keysB = Object.keys(b);

    if (keysA.length != keysB.length) return false;
    for (let key of keysA) {
        if (!keysB.includes(key)) return false;
        if (typeof a[key] === "function" || typeof b[key] === "function") {
            if (a[key].toString() != b[key].toString()) return false;
        } else {
            if (!isEqual(a[key], b[key])) return false;
        }
    }

    return true;
}

async function get_psp_wasm_module() {
    let elem = customElements.get("perspective-viewer");
    if (!elem) {
        await customElements.whenDefined("perspective-viewer");
        elem = customElements.get("perspective-viewer");
    }

    return elem.__wasm_module__;
}

/**
 * `PerspectiveView` defines the plugin's DOM and how the plugin interacts with
 * the DOM.
 */
export class PerspectiveView extends DOMWidgetView {
    #psp_client_id = `${Math.random()}`;

    _createElement() {
        const bindingMode = this.model.get("binding_mode");
        this.luminoWidget = new PerspectiveJupyterWidget(
            undefined,
            this,
            bindingMode,
        );

        // set up perspective_client
        get_psp_wasm_module().then(async (wasm_module) => {
            this.send({
                type: "connect",
                client_id: this.psp_client_id,
            });

            const { Client } = wasm_module;
            // Responses are fed to the client in the widget's msg:custom handler
            this.perspective_client = new Client(
                async (binary_msg) => {
                    const buffer = binary_msg.slice().buffer;
                    this.send(
                        { type: "binary_msg", client_id: this.psp_client_id },
                        [buffer],
                    );
                },
                () => {
                    this.send({
                        type: "hangup",
                        client_id: this.psp_client_id,
                    });
                },
            );

            const tableName = this.model.get("table_name");
            if (!tableName) throw new Error("table_name not set in model");
            const table = this.perspective_client
                .open_table(tableName)
                .then(async (table) => {
                    if (bindingMode === "client-server") {
                        // TODO make this a global lazy singleton
                        const client = await perspective.worker();
                        const remote_view = await table.view();
                        const local_table = await client.table(remote_view);
                        return local_table;
                    } else if (bindingMode === "server") {
                        return table;
                    } else {
                        throw new Error(`unknown binding mode: ${bindingMode}`);
                    }
                });

            this.luminoWidget.load(table);
            this._restore_from_model();
        });
        this._synchronize_state_dbg = (event) => {
            console.log("perspective-config-update event", event);
            this._synchronize_state();
        };
        this._synchronize_state = this._synchronize_state.bind(this);

        // add event handler to synchronize traitlet values
        this.luminoWidget.viewer.addEventListener(
            "perspective-config-update",
            this._synchronize_state_dbg,
        );

        // bind toggle_editable to this
        this._toggle_editable = this._toggle_editable.bind(this);

        // return the node against witch pWidget is bound
        return this.luminoWidget.node;
    }

    _setElement(el) {
        if (this.el || el !== this.luminoWidget.node) {
            // Do not allow the view to be reassigned to a different element.
            throw new Error("Cannot reset the DOM element.");
        }
        this.el = this.luminoWidget.node;
    }

    /**
     * When state changes on the viewer DOM, apply it to the widget state.
     *
     * @param mutations
     */

    async _synchronize_state(event) {
        if (!this.luminoWidget._load_complete) {
            return;
        }

        const config = await this.luminoWidget.viewer.save();

        for (const name of Object.keys(config)) {
            let new_value = config[name];

            const current_value = this.model.get(name);
            if (typeof new_value === "undefined") {
                continue;
            }

            if (
                new_value &&
                typeof new_value === "string" &&
                name !== "plugin" &&
                name !== "theme" &&
                name !== "title" &&
                name !== "version"
            ) {
                new_value = JSON.parse(new_value);
            }

            if (new_value === null && name === "plugin_config") {
                new_value = {};
            }

            if (!isEqual(new_value, current_value)) {
                this.model.set(name, new_value);
            }
        }

        // propagate changes back to Python
        this.touch();
    }

    get psp_client_id() {
        return this.#psp_client_id;
    }

    /**
     * Attach event handlers to the model for state changes in order to
     * reflect them back to the DOM.
     */

    render() {
        super.render();
        this.model.on("msg:custom", this._handle_message, this);
        this.model.on("change:plugin", this.plugin_changed, this);
        this.model.on("change:columns", this.columns_changed, this);
        this.model.on("change:group_by", this.group_by_changed, this);
        this.model.on("change:split_by", this.split_by_changed, this);
        this.model.on("change:aggregates", this.aggregates_changed, this);
        this.model.on("change:sort", this.sort_changed, this);
        this.model.on("change:filter", this.filter_changed, this);
        this.model.on("change:expressions", this.expressions_changed, this);
        this.model.on("change:plugin_config", this.plugin_config_changed, this);
        this.model.on("change:theme", this.theme_changed, this);
        this.model.on("change:settings", this.settings_changed, this);
        this.model.on("change:title", this.title_changed, this);
        this.model.on("change:table_name", this.table_name_changed, this);
    }

    /**
     * Handle messages from the Python PerspectiveViewer instance.
     */
    _handle_message(msg, buffers) {
        if (msg.type === "binary_msg" && msg.client_id === this.psp_client_id) {
            const [dataview] = buffers;
            this.perspective_client.handle_response(dataview.buffer);
        }
    }

    get client_worker() {
        if (!this._client_worker) {
            this._client_worker = perspective.worker();
        }
        return this._client_worker;
    }

    async _restore_from_model() {
        await this.luminoWidget.restore({
            plugin: this.model.get("plugin"),
            columns: this.model.get("columns"),
            group_by: this.model.get("group_by"),
            split_by: this.model.get("split_by"),
            aggregates: this.model.get("aggregates"),
            sort: this.model.get("sort"),
            filter: this.model.get("filter"),
            expressions: this.model.get("expressions"),
            plugin_config: this.model.get("plugin_config"),
            theme: this.model.get("theme"),
            settings: this.model.get("settings"),
            title: this.model.get("title"),
            version: this.model.get("version"),
        });
    }

    // XXX(tom): haven't looked at this, needs testing.  used in client-server mode
    async _toggle_editable() {
        // Need to await the table and get the instance
        // separately as load() only takes a promise
        // to a table and not the instance itself.
        const table = await this.luminoWidget.getTable();

        // Setup ports in advance
        if (!this._client_edit_port) {
            this._client_edit_port = await this.luminoWidget.getEditPort();
        }

        // if (!this._kernel_edit_port) {
        //     this._kernel_edit_port = await this._kernel_table.make_port();
        // }

        const { plugin_config } = await this.luminoWidget.viewer.save();
        if (plugin_config?.editable) {
            // TODO only evaluated during initial load.
            // Toggling from python after initial load won't
            // cause edits to propagate

            // Allow edits from the client Perspective to
            // feed back to the kernel.

            // When the client updates, if the update
            // comes through the edit port then forward
            // it to the server.
            this._client_view_update_callback = (updated) => {
                if (updated.port_id === this._client_edit_port) {
                    this._kernel_table.update(updated.delta, {
                        port_id: this._kernel_edit_port,
                    });
                }
            };

            // If the server updates, and the edit is
            // not coming from the server edit port,
            // then synchronize state with the client.
            this._kernel_view_update_callback = (updated) => {
                if (updated.port_id !== this._kernel_edit_port) {
                    table.update(updated.delta); // any port, we dont care
                }
            };
        } else {
            // ignore
            this._client_view_update_callback = () => {};

            // Load the table and mirror updates from the
            // kernel.
            this._kernel_view_update_callback = (updated) =>
                table.update(updated.delta);
        }

        if (this._client_view) {
            // NOTE: if `plugin_config_changed` called before
            // `_handle_load_message`, this will be undefined
            // Ignore, as `_handle_load_message` is sure to
            // follow.
            this._client_view.on_update(
                (updated) => this._client_view_update_callback(updated),
                { mode: "row" },
            );
        }

        // this._kernel_view.on_update(
        //     (updated) => this._kernel_view_update_callback(updated),
        //     { mode: "row" }
        // );
    }

    /**
     * When the View is removed after the widget terminates, clean up the
     * client viewer and Web Worker.
     */

    remove() {
        // Delete the <perspective-viewer> but do not terminate the shared
        // worker as it is shared across other widgets.
        this.perspective_client.terminate(); // invokes the close callback we wired up in constructor
        this.luminoWidget.delete();
        this.luminoWidget.viewer.removeEventListener(
            "perspective-config-update",
            this._synchronize_state_dbg,
        );
    }

    /**
     * When traitlets are updated in python, update the corresponding value on
     * the front-end viewer. `client` and `server` are not included, as they
     * are not properties in `<perspective-viewer>`.
     */

    plugin_changed() {
        this.luminoWidget.restore({
            plugin: this.model.get("plugin"),
        });
    }

    columns_changed() {
        this.luminoWidget.restore({
            columns: this.model.get("columns"),
        });
    }

    group_by_changed() {
        this.luminoWidget.restore({
            group_by: this.model.get("group_by"),
        });
    }

    split_by_changed() {
        this.luminoWidget.restore({
            split_by: this.model.get("split_by"),
        });
    }

    aggregates_changed() {
        this.luminoWidget.restore({
            aggregates: this.model.get("aggregates"),
        });
    }

    sort_changed() {
        this.luminoWidget.restore({
            sort: this.model.get("sort"),
        });
    }

    filter_changed() {
        this.luminoWidget.restore({
            filter: this.model.get("filter"),
        });
    }

    expressions_changed() {
        this.luminoWidget.restore({
            expressions: this.model.get("expressions"),
        });
    }

    plugin_config_changed() {
        this.luminoWidget.restore({
            plugin_config: this.model.get("plugin_config"),
        });
        this._toggle_editable();
    }

    theme_changed() {
        this.luminoWidget.restore({
            theme: this.model.get("theme"),
        });
    }

    settings_changed() {
        this.luminoWidget.restore({
            settings: this.model.get("settings"),
        });
    }

    title_changed() {
        this.luminoWidget.restore({
            title: this.model.get("title"),
        });
    }

    version_changed() {
        this.luminoWidget.restore({
            version: this.model.get("version"),
        });
    }

    table_name_changed() {
        // nop
        // XXX(tom): we may want to re-load the viewer in this instance
    }
}
