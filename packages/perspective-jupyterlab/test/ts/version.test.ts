import "isomorphic-fetch";

// first
Object.defineProperty(window, 'MutationObserver', { value: class {
    constructor(callback: any) {}
    disconnect() {}
    observe(element: any, initObject: any) {}
}});

import {PERSPECTIVE_VERSION} from '../../src/ts/version';

describe('Checks version', () => {
    test("Check version", () => {
        expect(PERSPECTIVE_VERSION).toBe('0.2.11');
    });
});
