/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {html, render} from "lit-html";

const RENDERERS = {};

export const renderers = new (class {
    /**
     * Register a plugin with the <perspective-viewer> component.
     *
     * @param {string} name The logical unique name of the plugin.  This will be
     * used to set the component's `view` attribute.
     * @param {object} plugin An object with this plugin's prototype.
     *     Valid keys are:
     * @param {string} plugin.name The display name for this plugin.
     * @param {string} plugin.create (required) The creation function - may
     *     return a `Promise`.
     * @param {string} plugin.delete The deletion function.
     * @param {string} plugin.mode The selection mode - may be "toggle" or
     *     "select".
     */
    registerPlugin(name, plugin) {
        if (RENDERERS[name]) {
            throw new Error(`A perspective-viewer plugin "${name}" has already been registered`);
        }
        for (const id in RENDERERS) {
            const old_plugin = RENDERERS[id];
            if (old_plugin && old_plugin.name === plugin.name) {
                console.warn(`Conflicting plugin name "${plugin.name}", qualifying with id`);
                old_plugin.name = `${old_plugin.name} [${id}]`;
                plugin.name = `${plugin.name} [${name}]`;
            }
        }
        RENDERERS[name] = plugin;
    }

    getPlugin(name) {
        return RENDERERS[name];
    }

    getInstance() {
        return RENDERERS;
    }
})();

global.registerPlugin = renderers.registerPlugin;

global.getPlugin = renderers.getPlugin;

const template = csv =>
    html`
        <pre style="margin:0;overflow:scroll;position:absolute;width:100%;height:100%">${csv}</pre>
    `;

export function register_debug_plugin() {
    global.registerPlugin("debug", {
        name: "Debug",
        create: async function(div) {
            const csv = await this._view.to_csv({config: {delimiter: "|"}});
            const timer = this._render_time();
            render(template(csv), div);
            timer();
        },
        selectMode: "toggle",
        resize: function() {},
        delete: function() {}
    });
}
