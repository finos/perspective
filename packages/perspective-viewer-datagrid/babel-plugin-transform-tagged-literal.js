/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const pattern = new RegExp("[\n\t ]+", "g");

// Replace whitespace in `html` tagged literals for minification.
module.exports = function(babel) {
    const t = babel.types;
    return {
        visitor: {
            TaggedTemplateExpression(path) {
                const node = path.node;
                if (t.isIdentifier(node.tag, {name: "html"})) {
                    for (const type of ["raw", "cooked"]) {
                        for (const element of node.quasi.quasis) {
                            element.value[type] = element.value[type].replace(pattern, " ");
                        }
                    }
                }
            }
        }
    };
};
