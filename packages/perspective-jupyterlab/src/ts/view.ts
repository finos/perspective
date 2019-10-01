/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
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
     * 
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

        this.client.send({
            id: -1,
            cmd: "init"
        });
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
            // TODO: load before render does not work
            const new_table = this.client.open_table(msg.data);
            this.pWidget.load(new_table); 
        } else {
            // conform message to format expected by the perspective client
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