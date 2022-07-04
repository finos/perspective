/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// import {bindTemplate} from "@finos/perspective-viewer/cjs/js/utils";
// import style from "../../less/plugin.less";
// import {name} from "../../../package.json";

// const template = `<template id="${name}"><div id="container"></div></template>`;

// @bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
// class TemplateElement extends HTMLElement {
//     constructor() {
//         super();

//         // Serialised user settings for this plugin
//         this._settings = {};
//         this._view = null;
//     }

//     connectedCallback() {
//         this._container = this.shadowRoot.querySelector("#container");
//     }

//     render(view, config) {
//         this._view = view;
//         view(this._container, config, this._settings);
//     }

//     resize() {
//         // Called by perspective-viewer when the container is resized
//         if (this._view && this._view.resize) {
//             this._view.resize(this._container);
//         }
//     }

//     getSettings() {
//         // Called when saving user settings
//         return this._settings;
//     }

//     setSettings(settings) {
//         // Called when restoring user settings
//         this._settings = settings || {};
//     }
// }
