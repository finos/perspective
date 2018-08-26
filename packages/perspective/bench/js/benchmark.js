/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "../../src/js/perspective.node.js";
const { performance } = require('perf_hooks');
const fs = require("fs");
const process = require('process');
const os = require('os');

const FACTOR = 4;

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
    console.log(message);
}


function get_csv(url, callback) {
    callback(fs.readFileSync(url).toString());
}

var __tests__ = [];
var attempt = 1;

function test(iterations, f) {
    __tests__.push([iterations, f]);
}

function run_tests() {
    print("Performance suite initiated.");
    print(os.platform() + " " + os.release());
    print(os.cpus()[0].model);
    print(__tests__.length + " scenarios found.");
    setTimeout(_run_tests);
}

const RESULTS = [];

function stddev(values) {
    var avg = average(values);
    
    var squareDiffs = values.map(function(value){
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });
    
    var avgSquareDiff = average(squareDiffs);
  
    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}
  
function average(data) {
    var sum = data.reduce(function(sum, value){
        return sum + value;
    }, 0);
  
    var avg = sum / data.length;
    return avg;
}

function stats(results) {
    const r_avg = average(results);
    const r_std = stddev(results);
    OLD.data[RESULTS.length] = OLD.data[RESULTS.length] || {avg: Infinity, std: Infinity};    
    const old_avg =  OLD.data[RESULTS.length].avg;
    const old_std =  OLD.data[RESULTS.length].std;
    let r_avg_diff = ((r_avg - old_avg) / r_avg) * 100;
    let r_std_diff = ((r_std - old_std) / r_std) * 100;
    r_avg_diff = (r_avg_diff < 0 ? "" : "+") + r_avg_diff.toFixed(2) + "%"; 
    r_std_diff = (r_std_diff < 0 ? "" : "+") + r_std_diff.toFixed(2) + "%"; 
    return {r_avg, r_std, r_avg_diff, r_std_diff, old_avg, old_std};
}

let HTML = "<html><head><script>window.__RESULTS__=RESULTS1;window.__OLD__=OLD1</script><script>SCRIPT</script></head><body></body></html>";

const OLD = JSON.parse(fs.readFileSync('bench/results/results.json'));
        
function _run_tests() {

    if (__tests__.length === 0) {
        print("Performance suite complete.");
        const data = JSON.stringify({
            data: RESULTS.map(y => {
                let results = y.results;
                let {r_avg, r_std, r_avg_diff, r_std_diff, old_avg, old_std} = y.stats;
                return {
                    code: y.code,
                    bins: histogram().thresholds(100)(results).map(x => ([x.x0, x.length])),
                    avg: r_avg,
                    std: r_std,
                    avg_diff: r_avg_diff,
                    std_diff: r_std_diff,
                    old_avg: old_avg,
                    old_std: old_std
                };
            }),
            model: os.cpus()[0].model,
            release: os.release(),
            platform: os.platform()
        });
        fs.writeFileSync('build/report.html', HTML.replace("SCRIPT", fs.readFileSync('build/report.js')).replace("RESULTS1", data).replace("OLD1", JSON.stringify(OLD)));
        fs.writeFileSync('bench/results/results.json', data);
        return;
    }

    var f = __tests__[0];
    let iterations = f[0];
    f = f[1];
    __tests__ = __tests__.slice(1);
    print("Running scenario " + attempt + (__tests__.length > 0 ? (" (" + __tests__.length + " remaining).") : ""));
    attempt ++;

    print(indent(code(f)));    

    var x = 0;
    var results = [];
    var start_all = performance.now();
    var testcase = function() {
        var start = performance.now();
        new Promise(f).then(function () {
            results.push(performance.now() - start);
            try {
                process.stdout.clearLine();  // clear current text
                process.stdout.cursorTo(0);  
                process.stdout.write(x + "/" + iterations, false);
            } catch (e) {

            }
            if (x >= iterations) {
                print("");
                print("");
                print("Completed in " + numberWithCommas((performance.now() - start_all).toFixed(3)) + "ms", false);
                const r_stats = stats(results);
                RESULTS.push({results: results, code: code(f), stats: r_stats});
                let {r_avg, r_std, r_avg_diff, r_std_diff, old_avg, old_std} = r_stats;
                print(`avg: ${r_avg.toFixed(2)} (${old_avg.toFixed(2)}) ${r_avg_diff}`);
                print(`std: ${r_std.toFixed(2)} (${old_std.toFixed(2)}) ${r_std_diff}`);
                print("");
                setTimeout(_run_tests);
            } else {
                x++;
                setTimeout(testcase, 10);
            }
        }).catch(console.error);
    }
    setTimeout(testcase);

}

function code(f) {
    var y = f.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1].replace(/\t/g, '    ');
    var indentation = y.split('\n')[1].match(/^[\s\t]*/)[0].length;
    var z = y.split('\n').map(function(q) { return q.slice(indentation, q.length); }).join('\n')
    return z;
}

function indent(txt) {
    return txt.split('\n').map(x => "    " + x).join('\n');
}


get_csv('build/flight_small.csv', function(csv) {

    let table = perspective.table(csv);

    test(50 * FACTOR, function(resolve) {
            perspective.table(csv);
            resolve();
    });

    test(500 * FACTOR, function(resolve) {
        var view = table.view({
            filter: [["Origin", "contains", "P"]],
            aggregate: "count"
        });
        view.delete();
        resolve();
    });

    test(500 * FACTOR, function(resolve) {
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

    test(500 * FACTOR, function(resolve) {
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

    test(150 * FACTOR, function(resolve) {
        var view = table.view({
            filter: [["Origin", "contains", "P"]],
            aggregate: "count"
        })
        view.to_json().then(function () {
            view.delete();
            resolve();
        })
    });

    test(150 * FACTOR, function(resolve) {
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

    
    test(150 * FACTOR, function(resolve) {
        var view = table.view({
            row_pivot: ['Dest'],
            aggregate: "mean",
            row_pivot_depth: 1,
        })
        view.to_json().then(function() {
            view.delete();
            resolve();
        });
    });
       
        // test(500, function(resolve) {
        //     var table2 = table.add_computed([
        //         {column: "Constant",
        //          type: "number",
        //          f: () => 0,
        //          inputs: [],
        //         }
        //     ]);
        //     table2.delete();
        //     resolve();
        // });

        // Arithmetic
        // test(500, function(resolve) {
        //     var table2 = table.add_computed([
        //         {column: "Speed",
        //          type: "number",
        //          f: (airtime, distance) => airtime/distance,
        //          inputs: ["AirTime", "Distance"],
        //         }
        //     ]);
        //     table2.delete();
        //     resolve();
        // });

        // // Generate string
        // test(500, function(resolve) {
        //     var table2 = table.add_computed([
        //         {column: "Day",
        //          type: "string",
        //          f: (x) => {
        //             let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
        //             return days[x-1];
        //          },
        //          inputs: ["DayOfWeek"],
        //         }
        //     ]);
        //     table2.delete();
        //     resolve();
        // });

    run_tests();
});

//});