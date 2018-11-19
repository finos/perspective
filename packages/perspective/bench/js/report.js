/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "!!style-loader!css-loader!less-loader!../less/benchmark.less";

import CodeMirror from 'codemirror';
import '!!style-loader!css-loader!codemirror/lib/codemirror.css';
import '!!style-loader!css-loader!codemirror/theme/eclipse.css';
import 'codemirror/mode/javascript/javascript.js';

import Chart from "chart.js";

String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return hash;
    for (let i = 0; i < this.length; i++) {
        let char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return "" + hash;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function print(message, append) {
    if (append === undefined) {append = true;}
    if ((typeof message) === "string") {
        console.log(message);
        var desc = document.createElement("div");
        desc.className = "content"
        desc.innerHTML = message;
        message = desc;
    }
    if (!append) {
        document.body.removeChild(document.body.children[document.body.children.length - 1]);
    }
    document.body.appendChild(message);
}

function code(f) {
    var desc = document.createElement("textarea");
    desc.innerHTML = f;
    document.body.appendChild(desc);
    var editor = CodeMirror.fromTextArea(desc, {
        theme: 'eclipse',
        mode: 'javascript',
        lineNumbers: true,
        viewportMargin: Infinity,
        scrollbarStyle: "null"
    });
}

function draw(canvas, bins, bins2) {

    var myLineChart = new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                label: "Current",
                data: bins.map(function(x) { return {x: x[0], y: x[1]} }),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 2,
             //   fill: 'origin'
            },{
                label: "Previous",
                data: (bins2 || []).map(function(x) { return {x: x[0], y: x[1]} }),
                backgroundColor: 'rgba(99, 255, 132, 0.2)',
                borderColor: 'rgba(99,255,132,1)',
                borderWidth: 2,
              //  fill: 'origin'
            }]
        },
        options:  {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0,
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
}

window.addEventListener('load', function () {
    print("Performance Report");
    print("");
    print(window.__RESULTS__.platform + " " + window.__RESULTS__.release);
    print(window.__RESULTS__.model);
    print("");
    for (let r in window.__RESULTS__.data) {
        let result = window.__RESULTS__.data[r];
        let old = window.__OLD__.data[r] || {bins: []};
        old.avg = old.avg || Infinity;
        old.std = old.std || Infinity;
        print(`Scenario ${parseInt(r) + 1}`);
        code(result.code);
        print(`  avg: ${result.avg.toFixed(2)} (${old.avg.toFixed(2)}) ${result.avg_diff}`);
        print(`  std: ${result.std.toFixed(2)} (${old.std.toFixed(2)}) ${result.std_diff}`);
        var canvas = document.createElement('canvas');
        var div = document.createElement('div');
        canvas.setAttribute('width', 400);
        canvas.setAttribute('height', 400);
        div.appendChild(canvas);

        div.className = "histogram";
        draw(canvas, result.bins, old.bins);
        document.body.appendChild(div);
      }
      
})


