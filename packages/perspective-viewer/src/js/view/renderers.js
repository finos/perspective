/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

export const renderers = (function() {
    let RENDERERS = {};
    return {
        getInstance: function() {
            return RENDERERS;
        },
        /**
         * Register a plugin with the <perspective-viewer> component.
         *
         * @param {string} name The logical unique name of the plugin.  This will be
         * used to set the component's `view` attribute.
         * @param {object} plugin An object with this plugin's prototype.  Valid keys are:
         *     name : The display name for this plugin.
         *     create (required) : The creation function - may return a `Promise`.
         *     delete : The deletion function.
         *     mode : The selection mode - may be "toggle" or "select".
         */
        registerPlugin: function(name, plugin) {
            RENDERERS[name] = plugin;
        },
        getPlugin(name) {
            return RENDERERS[name];
        }
    };
})();
