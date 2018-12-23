import "isomorphic-fetch";

jest.mock('@jupyter-widgets/base');

// first
Object.defineProperty(window, 'MutationObserver', { value: class {
    constructor(callback: any) {}
    disconnect() {}
    observe(element: any, initObject: any) {}
}});

import {PerspectiveModel} from '../../src/ts/widget';

describe('Checks view interface', () => {
    test("Check defaults", () => {
        let v = new PerspectiveModel();
        let defs = v.defaults();
        expect(defs._model_name).toEqual(PerspectiveModel.model_name);
        expect(defs._model_module).toEqual(PerspectiveModel.model_module);
        expect(defs._model_module_version).toEqual(PerspectiveModel.model_module_version);
        expect(defs._view_name).toEqual(PerspectiveModel.view_name);
        expect(defs._view_module).toEqual(PerspectiveModel.view_module);
        expect(defs._view_module_version).toEqual(PerspectiveModel.view_module_version);
        expect(defs._data).toEqual(null);
        expect(defs._bin_data).toEqual(null);
        expect(defs.datasrc).toEqual('');
        expect(defs.schema).toEqual({});
        expect(defs.view).toEqual('hypergrid');
        expect(defs.columns).toEqual([]);
        expect(defs.rowpivots).toEqual([]);
        expect(defs.columnpivots).toEqual([]);
        expect(defs.aggregates).toEqual([]);
        expect(defs.sort).toEqual([]);
        expect(defs.index).toEqual('');
        expect(defs.limit).toEqual(-1);
        expect(defs.computedcolumns).toEqual([]);
        expect(defs.settings).toEqual(false);
        expect(defs.embed).toEqual(false);
        expect(defs.dark).toEqual(false)
    });
});
