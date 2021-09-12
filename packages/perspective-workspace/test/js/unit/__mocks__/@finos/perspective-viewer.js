/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const originalCreateElement = document.createElement;

document.createElement = (name) => {
    const element = originalCreateElement.call(document, name);
    return name === "perspective-viewer"
        ? patchUnknownElement(element)
        : element;
};

const patchUnknownElement = (element) => {
    let config = {};
    element.load = jest.fn();
    element.save = async () => config;
    element.restore = (value) => {
        config = {...config, ...value};
        return Promise.resolve();
    };

    element.restyleElement = jest.fn();
    return element;
};
