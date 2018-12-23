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
