import "isomorphic-fetch";

jest.mock('@jupyter-widgets/base');

// first
Object.defineProperty(window, 'MutationObserver', { value: class {
    constructor(callback: any) {}
    disconnect() {}
    observe(element: any, initObject: any) {}
}});

import {PerspectiveView} from '../../dist/index';

describe('Checks view interface', () => {
    test("Check dom", () => {
        let v = new PerspectiveView();
        console.log(v); //TODO
    });

});
