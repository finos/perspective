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
import template from "../../html/d3fc-chart.html";

import {bindTemplate} from "@jpmorganchase/perspective-viewer/src/js/utils";

@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class D3FCChartElement extends HTMLElement {

  connectedCallback() {
        this._container = this.shadowRoot.querySelector(".chart");
    }

    render(chart, settings) {
      this.remove();

      if (settings.data) {
        chart(d3.select(this._container), settings);
      }
    }

    resize() {
      const d3fcGroup = this._container.querySelector("d3fc-group");
      d3fcGroup.requestRedraw();
    }

    remove() {
      this._container.innerHTML = "";
    }

    delete() {
        this.remove();
    }
}
