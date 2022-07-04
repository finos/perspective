/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import mapView from "../views/map-view";
import views from "../views/views";
import "./template";

views.forEach((plugin) => {
    customElements.define(
        plugin.plugin.type,
        class extends customElements.get("perspective-viewer-plugin") {
            async draw(view) {
                drawView(plugin).call(this, view);
            }

            async resize() {
                mapView.resize(this);
            }

            get name() {
                return plugin.plugin.name;
            }

            async restyle(view) {
                mapView.restyle(this);
            }

            get select_mode() {
                return "select";
            }

            get min_config_columns() {
                return 2;
            }

            get config_column_names() {
                return plugin.plugin.initial.names;
            }
        }
    );

    customElements.get("perspective-viewer").registerPlugin(plugin.plugin.type);
});

function drawView(viewEntryPoint) {
    return async function (view) {
        const table = this.parentElement
            .getTable()
            .then((table) => table.schema());
        const [tschema, schema, data, config] = await Promise.all([
            table,
            view.schema(),
            view.to_json(),
            view.get_config(),
        ]);

        if (!config.group_by) config.group_by = config.group_by;
        if (!config.split_by) config.split_by = config.split_by;
        if (!config.aggregate) config.aggregate = config.aggregates;

        viewEntryPoint(this, Object.assign({schema, tschema, data}, config));
    };
}

function resizeView() {
    if (this[PRIVATE] && this[PRIVATE].view) {
        this[PRIVATE].view.resize();
    }
}

// function deleteView() {
//     if (this[PRIVATE] && this[PRIVATE].view) {
//         this[PRIVATE].view.remove();
//     }
// }

// function save() {
//     if (this[PRIVATE] && this[PRIVATE].chart) {
//         const perspective_d3fc_element = this[PRIVATE].chart;
//         return perspective_d3fc_element.getSettings();
//     }
// }

// function restore(settings) {
//     const perspective_d3fc_element = getOrCreatePlugin.call(this);
//     perspective_d3fc_element.setSettings(settings);
// }

// function getOrCreatePlugin() {
//     this[PRIVATE] = this[PRIVATE] || {};
//     if (!this[PRIVATE].view) {
//         this[PRIVATE].view = document.createElement(name);
//     }

//     return this[PRIVATE].view;
// }

// function getElement(div) {
//     const perspective_d3fc_element = getOrCreatePlugin.call(this);

//     if (!document.body.contains(perspective_d3fc_element)) {
//         div.innerHTML = "";
//         div.appendChild(perspective_d3fc_element);
//     }

//     return perspective_d3fc_element;
// }
