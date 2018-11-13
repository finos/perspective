/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * An Object for capturing details of the invoking script's origin.
 *
 * Returns
 * -------
 * An instance of a ScriptPath object.  Interesting methods on this object
 * include:
 *     fullPath : The complete path of this script.
 *     path : The path (no host).
 *     host : The host (no path).
 *     file : The file name itself.
 */
function ScriptPath() {
    var pathParts;
    try {
        throw new Error();
    } catch (e) {
        var stackLines = e.stack.split("\n");
        var callerIndex = 0;
        for (var i in stackLines) {
            if (!stackLines[i].match(/http[s]?:\/\//)) continue;
            callerIndex = Number(i);
            break;
        }
        pathParts = stackLines[callerIndex].match(/((http[s]?:\/\/.+\/)([^\/]+\.(js|html))).*?:/);
    }

    this.fullPath = function() {
        return pathParts ? pathParts[1] : typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    };
    this.path = function() {
        return pathParts ? pathParts[2] : typeof window !== "undefined" ? window.location.pathname : "";
    };
    this.host = function() {
        var x = this.path().match(/.+?\/\/.+?\//);
        return x ? x[0] : typeof window !== "undefined" ? window.location.hostname : "";
    };
    this.file = function() {
        return pathParts ? pathParts[3] : "";
    };
}

var __SCRIPT_PATH__ = new ScriptPath();

module.exports.host = __SCRIPT_PATH__.host();

module.exports.path = __SCRIPT_PATH__.path();

module.exports.BlobWorker = function(responseText, ready) {
    var blob = new Blob([responseText]);
    var obj = window.URL.createObjectURL(blob);
    var worker = new Worker(obj);
    if (ready) {
        ready(worker);
    }
};

module.exports.XHRWorker = function XHRWorker(url, ready) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener(
        "load",
        function() {
            module.exports.BlobWorker(oReq.responseText, ready);
        },
        oReq
    );
    oReq.open("get", url, true);
    oReq.send();
};
