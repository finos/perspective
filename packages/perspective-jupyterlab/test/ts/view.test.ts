import "isomorphic-fetch";

// import { DOMWidgetView } from '@jupyter-widgets/base';
jest.mock('@jupyter-widgets/base');

// const myDOMWidgetView: jest.Mocked<DOMWidgetView> = new DOMWidgetView() as any;

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
