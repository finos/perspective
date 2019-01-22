/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */


import * as fc from "d3fc";
import * as d3 from "d3";

import style from "../less/d3fc.less";
import template from "../html/d3fc.html";

import d3fcChart from "./d3fcChart";

import { make_tree_data, make_y_data, make_xy_data, make_xyz_data, make_xy_column_data } from "./series.js";
import { set_boost, set_category_axis, set_both_axis, default_config, set_tick_size } from "./config.js";
import { bindTemplate } from "@jpmorganchase/perspective-viewer/src/js/utils";
import { detectIE } from "@jpmorganchase/perspective/src/js/utils";
import D3FCChart from "./d3fcChart";

export const PRIVATE = Symbol("D3FC private");

function get_or_create_element(div) {
  let perspective_d3fc_element;
  this[PRIVATE] = this[PRIVATE] || {};
  if (!this[PRIVATE].chart) {
    perspective_d3fc_element = this[PRIVATE].chart = document.createElement("perspective-d3fc");
  } else {
    perspective_d3fc_element = this[PRIVATE].chart;
  }

  if (!document.body.contains(perspective_d3fc_element)) {
    div.innerHTML = "";
    div.appendChild(perspective_d3fc_element);
  }
  return perspective_d3fc_element;
}

async function updateConfig(perspecViewerEl, view, configs, mode, row_pivots, col_pivots, aggregates, hidden, typesAndNames) {
  const cols = await view.to_columns();
  const config = (configs[0] = default_config.call(perspecViewerEl, aggregates, mode));

  console.log(
    "col_pivots", col_pivots, 
    "row_pivots", row_pivots, 
    "aggregates", aggregates, 
    "typesAndNames", typesAndNames, 
    "view", view
  );

  let [series, top] = make_y_data(cols, row_pivots, hidden);
  config.series = series;
  //config.colors = series.length <= 10 ? COLORS_10 : COLORS_20; //todo: ignore for now.
  config.legend.enabled = col_pivots.length > 0 || series.length > 1; //todo: ignore for now.
  config.legend.floating = series.length <= 20; //todo: ignore for now.
  config.plotOptions.series.dataLabels = { //todo: ignore for now.
    allowOverlap: false,
    padding: 10
  };
  config.col_pivots = col_pivots;
  config.row_pivots = row_pivots;
  set_category_axis(config, "xAxis", typesAndNames.xtree_type, top);
  Object.assign(config, {
    yAxis: {
      startOnTick: false,
      endOnTick: false,
      title: {
        text: aggregates.map(x => x.column).join(",  "),
        style: { color: "#666666", fontSize: "14px" }
      },
      labels: { overflow: "justify" }
    }
  });
}

export const draw = mode =>
  async function (el, view, task) {
    // FIXME: super tight coupling to private viewer methods
    const row_pivots = this._get_view_row_pivots();
    const col_pivots = this._get_view_column_pivots();
    const aggregates = this._get_view_aggregates();
    const hidden = this._get_view_hidden(aggregates);

    const [schema, tschema] = await Promise.all([view.schema(), this._table.schema()]);
    let js, element;

    if (task.cancelled) {
      return;
    }

    let configs = [];

    let typesAndNames = {
      xaxis_name: aggregates.length > 0 ? aggregates[0].column : undefined,
      yaxis_name: aggregates.length > 1 ? aggregates[1].column : undefined,
      xtree_name: row_pivots.length > 0 ? row_pivots[row_pivots.length - 1] : undefined,
      ytree_name: col_pivots.length > 0 ? col_pivots[col_pivots.length - 1] : undefined,
      num_aggregates: aggregates.length - hidden.length
    }

    typesAndNames.xaxis_type = schema[typesAndNames.xaxis_name];
    typesAndNames.yaxis_type = schema[typesAndNames.yaxis_name];
    typesAndNames.xtree_type = schema[typesAndNames.xtree_name];
    typesAndNames.ytree_type = schema[typesAndNames.ytree_name];

    try {
      //todo: extract out each different mode to a different .js file.
      if (mode === "x_bar" || mode === "y_bar") {
        await updateConfig(this, view, configs, mode, row_pivots, col_pivots, aggregates, hidden, typesAndNames);
      } else {
        throw "EXCEPTION: chart type not recognised.";
      }
    } finally {
      element = get_or_create_element.call(this, el);
      if (this.hasAttribute("updating")) {
        element.delete();
      }
    }

    element.render(mode, configs, this);
  };

@bindTemplate(template, style) // eslint-disable-next-line no-unused-vars
class D3FCElement extends HTMLElement {
  constructor() {
    super();
    this._charts = [];
  }

  connectedCallback() {
    this._container = this.shadowRoot.querySelector("#container");
  }

  render(mode, configs, callee) {
    this.delete();

    configs.forEach(config => {
      let chartContainer = document.createElement("div");
      chartContainer.className = "chart";
      this._container.appendChild(chartContainer);
      this._charts.push(new D3FCChart(mode, config, chartContainer));
    })

    this._charts.forEach(chart => chart.render())
  }

  resize() {
    if (this._charts && this._charts.length > 0) {
      this._charts.map(x => x.reflow());
    }
  }

  remove() {
    this._charts = [];
    for (let e of Array.prototype.slice.call(this._container.children)) {
      if (e.tagName === "DIV") {
        this._container.removeChild(e);
      }
    }
  }

  delete() {
    //doesn't appear to require that anything be destroyed to prevent memory leaks. Pending further investigation.
    for (let chart of this._charts) {
    }
    this.remove();
  }
}
