/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "../../src/js/perspective.wasm.js";
import "../less/benchmark.css";

import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/mode/javascript/javascript.js';

import Chart from "chart.js";



import {histogram} from "d3-array";

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
    var y = f.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1].replace(/\t/g, '    ');
    var indentation = y.split('\n')[1].match(/^[\s\t]*/)[0].length;
    var z = y.split('\n').map(function(q) { return q.slice(indentation, q.length); }).join('\n')
    desc.innerHTML = z
    document.body.appendChild(desc);
    var editor = CodeMirror.fromTextArea(desc, {
        lineNumbers: true,
        viewportMargin: Infinity
    });
}

    function get_csv(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            console.time(url + " load");
            callback(xhr.responseText);
            console.timeEnd(url + " load");
        }
    }
    xhr.open('GET', url, true);
    xhr.send(null);
}

var __tests__ = [];
var attempt = 1;

function test(iterations, f) {
    __tests__.push([iterations, f]);
}

function draw(canvas, bins, bins2) {

    var myLineChart = new Chart(canvas, {
        type: 'line',
        data: {
            datasets: [{
                label: "Current",
                data: bins.map(function(x) { return {x: x.x0, y: x.length} }),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 2,
             //   fill: 'origin'
            },{
                label: "Previous",
                data: bins2.map(function(x) { return {x: x.x0, y: x.length} }),
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

function run_tests() {
    print("Performance suite initiated.");
    print(__tests__.length + " scenarios found.");
    setTimeout(_run_tests);
}

function _run_tests() {

    if (__tests__.length === 0) {
        print("Performance suite complete.");
        return;
    }

    var f = __tests__[0];
    let iterations = f[0];
    f = f[1];
    __tests__ = __tests__.slice(1);
    print("Running scenario " + attempt + (__tests__.length > 0 ? (" (" + __tests__.length + " remaining).") : ""));
    attempt ++;

    code(f);

    print("");

    var x = 0;
    var results = [];
    var start_all = performance.now();
    var testcase = function() {
        var start = performance.now();
        new Promise(f).then(function () {
            print(x + "/" + iterations, false);
            results.push(performance.now() - start);
            if (x === iterations) {
                print("Completed in " + numberWithCommas((performance.now() - start_all).toFixed(3)) + "ms", false);
                var canvas = document.createElement('canvas');
                var div = document.createElement('div');
                canvas.setAttribute('width', 400);
                canvas.setAttribute('height', 400);
                div.appendChild(canvas);

                div.className = "histogram";
                document.body.appendChild(div);
                let old = JSON.parse(window.localStorage[f.toString().hashCode()] || "[]");
                window.localStorage[f.toString().hashCode()] = JSON.stringify(results);

                var bins = histogram().thresholds(iterations / 5)(results);
                var bins2 = histogram().thresholds(iterations / 5)(old);
                draw(canvas, bins, bins2);
                setTimeout(_run_tests);
            } else {
                x++;
                setTimeout(testcase, 10);
            }
        });
    }
    setTimeout(testcase);

}



window.addEventListener("perspective-ready", function() {

    get_csv('flight_small.csv', function(csv) {

        let table = perspective.table(csv);

        test(50, function(resolve) {
             perspective.table(csv);
             resolve();
        });

        test(500, function(resolve) {
            var view = table.view({
                filter: [["Origin", "contains", "P"]],
                aggregate: "count"
            });
            view.delete();
            resolve();
        });

        test(500, function(resolve) {
            var view = table.view({
                filter: [["Origin", "contains", "P"]],
                aggregate: "count"
            })
            view.to_json({
                end_row: 10
            }).then(function () {
                view.delete();
                resolve();
            });
        });

        test(500, function(resolve) {
            var view = table.view({
                filter: [["Origin", "contains", "P"]],
                row_pivot: ['Dest'],
                aggregate: "count"
            })
            view.to_json().then(function () {
                view.delete();
                resolve();
            });
        });

        test(150, function(resolve) {
            var view = table.view({
                filter: [["Origin", "contains", "P"]],
                aggregate: "count"
            })
            view.to_json().then(function () {
                view.delete();
                resolve();
            })
        });

        test(150, function(resolve) {
            var view = table.view({
                row_pivot: ['Dest'],
                aggregate: "count",
                row_pivot_depth: 1,
            })
            view.to_json().then(function() {
                view.delete();
                resolve();
            });
        });

        test(500, function(resolve) {
            var table2 = table.add_computed([
                {column: "Constant",
                 type: "number",
                 f: () => 0,
                 inputs: [],
                }
            ]);
            table2.delete();
            resolve();
        });

        // Arithmetic
        test(500, function(resolve) {
            var table2 = table.add_computed([
                {column: "Speed",
                 type: "number",
                 f: (airtime, distance) => airtime/distance,
                 inputs: ["AirTime", "Distance"],
                }
            ]);
            table2.delete();
            resolve();
        });

        // Generate string
        test(500, function(resolve) {
            var table2 = table.add_computed([
                {column: "Day",
                 type: "string",
                 f: (x) => {
                    let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
                    return days[x-1];
                 },
                 inputs: ["DayOfWeek"],
                }
            ]);
            table2.delete();
            resolve();
        });

        run_tests();
    });

});