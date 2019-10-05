/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import { isEqual } from "underscore";
import { DOMWidgetView } from "@jupyter-widgets/base";
import { PerspectiveWidget } from '@finos/perspective-phosphor';
import { PerspectiveJupyterWidget } from "./widget";
import { PerspectiveJupyterClient, PerspectiveJupyterMessage } from "./client";

/**
 * `PerspectiveView` defines the plugin's DOM and how the plugin interacts with the DOM.
 */
export
class PerspectiveView extends DOMWidgetView {
    pWidget: PerspectiveWidget;
    client: PerspectiveJupyterClient;

    _createElement(tagName: string) {
        this.pWidget = new PerspectiveJupyterWidget(undefined,
            {
             plugin: this.model.get('plugin'),
             columns: this.model.get('columns'),
             row_pivots: this.model.get('row_pivots'),
             column_pivots: this.model.get('column_pivots'),
             aggregates: this.model.get('aggregates'),
             sort: this.model.get('sort'),
             filters: this.model.get('filters'),
             plugin_config: this.model.get('plugin_config'),
             computed_columns: [],
             dark: this.model.get('dark'),
             bindto: this.el,
             view: this,
        });

        this.client = new PerspectiveJupyterClient(this);

        return this.pWidget.node;
    }

    _setElement(el: HTMLElement) {
        if (this.el || el !== this.pWidget.node) {
            // Do not allow the view to be reassigned to a different element.
            throw new Error('Cannot reset the DOM element.');
        }
        this.el = this.pWidget.node;
     }


    /**
     * When state changes on the viewer DOM, apply it to the widget state.
     *
     * @param mutations 
     */
    _synchronize_state(mutations: any) {
        for (let mutation of mutations) {
            const name = mutation.attributeName.replace(/-/g, "_");
            let new_value = this.pWidget.viewer.getAttribute(mutation.attributeName);
            let current_value = this.model.get(name);

            if (typeof(new_value) === "undefined") {
                continue;
            }

            if (new_value && typeof(new_value) === "string" && name !== "plugin") {
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
     * Attach event handlers, and watch the DOM for state changes in order to reflect them back to Python.
     */
    render() {
        super.render();

        this.model.on('msg:custom', this._handle_message, this);
        this.model.on('change:plugin', this.plugin_changed, this);
        this.model.on('change:columns', this.columns_changed, this);
        this.model.on('change:row_pivots', this.row_pivots_changed, this);
        this.model.on('change:column_pivots', this.column_pivots_changed, this);
        this.model.on('change:aggregates', this.aggregates_changed, this);
        this.model.on('change:sort', this.sort_changed, this);
        this.model.on('change:filters', this.filters_changed, this);
        this.model.on('change:plugin_config', this.plugin_config_changed, this);
        this.model.on('change:dark', this.dark_changed, this);

        // Watch the viewer DOM so that widget state is always synchronized with DOM attributes.
        const observer = new MutationObserver(this._synchronize_state.bind(this));
        observer.observe(this.pWidget.viewer, {
             attributes: true,
             attributeFilter: ["plugin", "columns", "row-pivots", "column-pivots", "aggregates", "sort", "filters", "computed_column"],
             subtree: false
        });

        /**
         * Request a table from the manager. If a table has been loaded, proxy it and kick off subsequent operations.
         * 
         * If a table hasn't been loaded, the viewer won't get a response back and simply waits until it receives a table name.
         */
        this.client.send({
            id: -2,
            cmd: "table"
        })
    }

    /**
     * Handle messages from the Python Perspective instance.
     * 
     * Messages should conform to the `PerspectiveJupyterMessage` interface.
     * 
     * @param msg {PerspectiveJupyterMessage}
     */
    _handle_message(msg: PerspectiveJupyterMessage) {
        if (msg.type === "table") {
            const new_table = this.client.open_table(msg.data);
            this.pWidget.load(new_table);

            // Only call `init` after the viewer has a table.
            this.client.send({
                id: -1,
                cmd: "init"
            });
        } else {
            // Conform message to format expected by the perspective client
            delete msg.type; 
            msg.data = JSON.parse(msg.data); 
            this.client._handle(msg);
        }
    }

    /**
     * When traitlets are updated in python, update the corresponding value on the front-end viewer.
     */
    plugin_changed(){
        this.pWidget.plugin = this.model.get('plugin');
    }

    columns_changed(){
        this.pWidget.columns = this.model.get('columns');
    }

    row_pivots_changed(){
        this.pWidget.row_pivots = this.model.get('row_pivots');
    }

    column_pivots_changed(){
        this.pWidget.column_pivots = this.model.get('column_pivots');
    }

    aggregates_changed(){
        this.pWidget.aggregates = this.model.get('aggregates');
    }

    sort_changed(){
        this.pWidget.sort = this.model.get('sort');
    }

    filters_changed(){
        this.pWidget.filters = this.model.get('filters');
    }

    plugin_config_changed(){
        this.pWidget.plugin_config = this.model.get('plugin_config');
    }

    dark_changed(){
        this.pWidget.dark = this.model.get('dark');
    }
}