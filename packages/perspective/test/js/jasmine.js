/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "jasmine-core/lib/jasmine-core/jasmine.css";
import jasmineRequire from "jasmine-core/lib/jasmine-core/jasmine.js";

global.jasmineRequire = window.jasmineRequire = jasmineRequire;

require("jasmine-core/lib/jasmine-core/jasmine-html.js");
require("jasmine-core/lib/jasmine-core/boot.js");

window._onload = window.onload;
window.onload = undefined;

jasmine.pp = function(obj) {
    if (Array.isArray(obj)) {
        return (
            "[\n" +
            obj
                .map(function(x) {
                    return "    " + JSON.stringify(x);
                })
                .join("\n") +
            "\n]"
        );
    } else {
        return JSON.stringify(obj, undefined, 4);
    }
};

var noopTimer = {
    start: function() {},
    elapsed: function() {
        return 0;
    }
};

function ConsoleReporter() {
    var print = console.log.bind(console),
        onComplete = function() {},
        timer = noopTimer,
        specCount,
        failureCount,
        failedSpecs = [],
        pendingCount,
        failedSuites = [];

    let INDENT = 0;

    this.jasmineStarted = function() {
        specCount = 0;
        failureCount = 0;
        pendingCount = 0;
        printNewline();
        timer.start();
    };

    this.jasmineDone = function() {
        printNewline();
        for (var i = 0; i < failedSpecs.length; i++) {
            specFailureDetails(failedSpecs[i]);
        }

        if (specCount > 0) {
            var specCounts = specCount + " " + plural("spec", specCount) + ", " + failureCount + " " + plural("failure", failureCount);

            if (pendingCount) {
                specCounts += ", " + pendingCount + " pending " + plural("spec", pendingCount);
            }

            print(specCounts);
        } else {
            print("No specs found");
        }

        var seconds = timer.elapsed() / 1000;
        print("Finished in " + seconds + " " + plural("second", seconds));

        for (i = 0; i < failedSuites.length; i++) {
            suiteFailureDetails(failedSuites[i]);
        }

        onComplete(failureCount === 0);
    };

    this.specDone = function(result) {
        specCount++;

        if (result.status == "pending") {
            pendingCount++;
            print(indent("* " + result.description, INDENT));
            return;
        }

        if (result.status == "passed") {
            print(indent("✓ " + result.description, INDENT));
            return;
        }

        if (result.status == "failed") {
            failureCount++;
            failedSpecs.push(result);
            print(indent("✕ " + result.description, INDENT));
        }
    };

    this.suiteStarted = function(result) {
        print(indent(result.description, INDENT));
        INDENT += 2;
    };

    this.suiteDone = function(result) {
        INDENT -= 2;
        if (result.failedExpectations && result.failedExpectations.length > 0) {
            failureCount++;
            failedSuites.push(result);
        }
    };

    return this;

    function printNewline() {
        print("\n");
    }

    function plural(str, count) {
        return count == 1 ? str : str + "s";
    }

    function repeat(thing, times) {
        var arr = [];
        for (var i = 0; i < times; i++) {
            arr.push(thing);
        }
        return arr;
    }

    function indent(str, spaces) {
        var lines = (str || "").split("\n");
        var newArr = [];
        for (var i = 0; i < lines.length; i++) {
            newArr.push(repeat(" ", spaces).join("") + lines[i]);
        }
        return newArr.join("\n");
    }

    function specFailureDetails(result) {
        printNewline();
        print(result.fullName);

        for (var i = 0; i < result.failedExpectations.length; i++) {
            var failedExpectation = result.failedExpectations[i];
            printNewline();
            print(indent(failedExpectation.message, 2));
            print(indent(failedExpectation.stack, 2));
        }

        printNewline();
    }

    function suiteFailureDetails(result) {
        for (var i = 0; i < result.failedExpectations.length; i++) {
            printNewline();
            print("An error was thrown in an afterAll");
            printNewline();
            print("AfterAll " + result.failedExpectations[i].message);
        }
        printNewline();
    }
}

jasmine.getEnv().addReporter(new ConsoleReporter());

const start = window._onload;

window.addEventListener("perspective-ready", function() {
    setTimeout(start, 500);
});
