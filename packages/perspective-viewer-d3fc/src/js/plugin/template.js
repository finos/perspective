/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import * as d3 from "d3";

import style from "../../less/chart.less";
import perspectiveStyle from "../../less/perspective-view.less";
import template from "../../html/d3fc-chart.html";
import {areArraysEqualSimple} from "../utils/utils";

import {bindTemplate} from "@jpmorganchase/perspective-viewer/cjs/js/utils";

const styleWithD3FC = `${style}${getD3FCStyles()}`;

@bindTemplate(template, styleWithD3FC) // eslint-disable-next-line no-unused-vars
class D3FCChartElement extends HTMLElement {
    connectedCallback() {
        this._container = this.shadowRoot.querySelector(".chart");
        this._chart = null;
        this._settings = null;

        // Add the additional styles needed for the perspective-viewer host
        var style = document.createElement("style");
        style.setAttribute("scope", "perspective-viewer");
        style.textContent = perspectiveStyle;
        this.shadowRoot.host.getRootNode().appendChild(style);
    }

    render(chart, settings) {
        this.remove();

        this._chart = chart;
        this._settings = this._configureSettings(this._settings, settings);
        this.draw();

        if (window.navigator.userAgent.indexOf("Edge") > -1) {
            // Workaround for MS Edge issue that doesn't draw content in the
            // plot-area until the chart D3 object is redrawn
            setTimeout(() => this.draw());
        }
    }

    draw() {
        if (this._settings.data) {
            this._settings.size = this._container.getBoundingClientRect();
            this._chart(d3.select(this._container).attr("class", `chart ${this._chart.plugin.type}`), this._settings);
        }
    }

    resize() {
        this.draw();
    }

    remove() {
        this._container.innerHTML = "";
    }

    delete() {
        this.remove();
    }

    getContainer() {
        return this._container;
    }

    _configureSettings(oldSettings, newSettings) {
        if (oldSettings) {
            const oldValues = [oldSettings.crossValues, oldSettings.mainValues, oldSettings.splitValues];
            const newValues = [newSettings.crossValues, newSettings.mainValues, newSettings.splitValues];
            if (areArraysEqualSimple(oldValues, newValues)) return {...oldSettings, data: newSettings.data};
        }
        this.remove();
        return newSettings;
    }
}

function getD3FCStyles() {
    const headerStyles = document.querySelector("head").querySelectorAll("style");
    const d3fcStyles = [];
    headerStyles.forEach(s => {
        if (s.innerText.indexOf("d3fc-") !== -1) {
            d3fcStyles.push(s.innerText);
        }
    });
    return d3fcStyles.join("");
}
