/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {currentScript} = document;

module.exports.path = currentScript
    ? currentScript.src
          .split("/")
          .slice(0, -1)
          .join("/") + "/"
    : "";

module.exports.isCrossOrigin = function(webpackOrigin) {
    var inWebpack = !!(webpackOrigin && webpackOrigin.length);
    if (inWebpack) {
        var link = document.createElement("a");
        link.href = webpackOrigin;

        if (link.href.startsWith(window.location.origin)) {
            return false;
        } else {
            // we're CORS
            return true;
        }
    } else {
        return window.location.origin !== module.exports.path.slice(0, window.location.origin.length);
    }
};

module.exports.publicPath = function(webpackOrigin) {
    var inWebpack = !!(webpackOrigin && webpackOrigin.length);
    if (inWebpack) {
        return webpackOrigin;
    } else {
        return module.exports.path;
    }
};

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
