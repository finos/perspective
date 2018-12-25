/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import "isomorphic-fetch";

// first
Object.defineProperty(window, 'MutationObserver', { value: class {
    constructor(callback: any) {}
    disconnect() {}
    observe(element: any, initObject: any) {}
}});

import {pspPlugin} from '../../src/ts/plugin';

describe('Checks plugin interface', () => {
    test("Check id", () => {
        expect(pspPlugin.id).toMatch('@jpmorganchase/perspective-jupyterlab');
    });
});
