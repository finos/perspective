/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Bind all methods in a class to the class instance.  It is sad that this is
 * necessary.
 *
 * @export
 * @param {*} self
 */
export function bindall(self) {
    for (const key of Object.getOwnPropertyNames(self.constructor.prototype)) {
        const value = self[key];
        if (key !== "constructor" && typeof value === "function") {
            self[key] = value.bind(self);
        }
    }
}

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
export function ScriptPath() {
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
        return pathParts ? pathParts[1] : window.location.origin + window.location.pathname;
    };
    this.path = function() {
        return pathParts ? pathParts[2] : window.location.pathname;
    };
    this.host = function() {
        let x = this.path().match(/.+?\/\/.+?\//);
        return x ? x[0] : window.location.hostname;
    };
    this.file = function() {
        return pathParts ? pathParts[3] : "";
    };
}

if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== "number") {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, "includes", {
        value: function(searchElement, fromIndex) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            // 1. Let O be ? ToObject(this value).
            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If len is 0, return false.
            if (len === 0) {
                return false;
            }

            // 4. Let n be ? ToInteger(fromIndex).
            //    (If fromIndex is undefined, this step produces the value 0.)
            var n = fromIndex | 0;

            // 5. If n ≥ 0, then
            //  a. Let k be n.
            // 6. Else n < 0,
            //  a. Let k be len + n.
            //  b. If k < 0, let k be 0.
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            function sameValueZero(x, y) {
                return x === y || (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y));
            }

            // 7. Repeat, while k < len
            while (k < len) {
                // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                // b. If SameValueZero(searchElement, elementK) is true, return true.
                if (sameValueZero(o[k], searchElement)) {
                    return true;
                }
                // c. Increase k by 1.
                k++;
            }

            // 8. Return false
            return false;
        }
    });
}
