/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

exports.get_contents = async function get_contents(page, selector) {
    return await page.evaluate(async (selector) => {
        const shadow = document.querySelector(selector).shadowRoot;
        const svgs = shadow.querySelectorAll("svg");

        let all_viewers = "";
        for (let v of svgs) {
            all_viewers += v.outerHTML;
        }
        return all_viewers;
    }, selector);
};
