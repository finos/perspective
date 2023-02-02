/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const format = require("xml-formatter");
const crypto = require("crypto");

/**
 * Normalize an XML snippet (as a string)
 * @param {string} input denormalized xml
 * @returns
 */
exports.normalize_xml = function normalize_xml(xml) {
    let clean_xml;
    try {
        clean_xml = format_and_clean_xml(xml);
    } catch (e) {
        clean_xml = format_and_clean_xml(`<template>${xml}</template>`);
    }

    const hash = crypto.createHash("md5").update(clean_xml).digest("hex");
    return { hash, xml: clean_xml };
};

function format_and_clean_xml(result) {
    return format(result, {
        filter(x) {
            // TODO We have to strip many geometry attributes due to minute
            // rendering differences on Linux and dev (presumably OSX).
            if (x) {
                // Chrome seems to somewhat arbitrarily reorder these when
                // set using `classList`.
                if (x.attributes?.class) {
                    const cls = x.attributes.class.split(" ");
                    cls.sort();
                    x.attributes.class = cls.join(" ");
                }

                // These are floats and introduce precision errors due to
                // tiny geometry variance.
                if (x.attributes?.r) {
                    delete x.attributes["r"];
                }

                if (x.attributes?.dx) {
                    delete x.attributes["dx"];
                }

                if (x.attributes?.dy) {
                    delete x.attributes["dy"];
                }

                if (x.attributes?.x) {
                    delete x.attributes["x"];
                }

                if (x.attributes?.y) {
                    delete x.attributes["y"];
                }

                if (x.attributes?.x1) {
                    delete x.attributes["x1"];
                }

                if (x.attributes?.y1) {
                    delete x.attributes["y1"];
                }

                if (x.attributes?.x2) {
                    delete x.attributes["x2"];
                }

                if (x.attributes?.y2) {
                    delete x.attributes["y2"];
                }

                if (x.attributes?.style) {
                    delete x.attributes["style"];
                }

                if (x.attributes?.d) {
                    delete x.attributes["d"];
                }

                if (x.attributes?.transform) {
                    delete x.attributes["transform"];
                }

                if (x.name === "svg" && x.attributes?.viewBox) {
                    delete x.attributes["viewBox"];
                }

                if (x.name === "svg" && x.attributes?.height) {
                    delete x.attributes["height"];
                }

                // visibility is flaky on D3 from OS to OS.
                // Just normalize to empty string.
                if (x.name === "g" && x.attributes) {
                    x.attributes.visibility = "";
                }
            }

            return true;
        },
    });
}
