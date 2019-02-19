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

// before perspective import
Object.defineProperty(window, 'MutationObserver', { value: class {
    constructor(callback: any) {}
    disconnect() {}
    observe(element: any, initObject: any) {}
}});

// mock dom element
Object.defineProperty(document, 'createElement', { value: () => {
    return {
        delete(){},
        appendChild(child: any){},
        addEventListener(foo:any){},
        setAttribute(str:string, val:any){},
        removeAttribute(str:string){},
        classList: {
            add(str:string){},
            remove(str:string){}
        },
        style: {
            setProperty(prop:string, val:string){}
        }
    };
}});



import {PerspectiveWidget} from '../../src/ts/widget';

describe('Checks view interface', () => {
    test("Check values", () => {
        let v = new PerspectiveWidget();
        expect(v.name).toMatch('Perspective');

        //TODO
    });
});
