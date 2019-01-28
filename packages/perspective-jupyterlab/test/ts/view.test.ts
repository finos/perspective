/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "isomorphic-fetch";

jest.mock('@jupyter-widgets/base');

// first
Object.defineProperty(window, 'MutationObserver', { value: class {
    constructor(callback: any) {}
    disconnect() {}
    observe(element: any, initObject: any) {}
}});

import {PerspectiveView} from '../../build/index';

describe('Checks view interface', () => {
    test("Check dom", () => {
        let v = new PerspectiveView();
        console.log(v); //TODO
    });

});
