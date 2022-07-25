////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::prelude::*;

pub trait CustomElementMetadata {
    const CUSTOM_ELEMENT_NAME: &'static str;

    const STATICS: &'static [&'static str] = [].as_slice();

    const TYPE_NAME: &'static str = std::any::type_name::<Self>();

    fn struct_name() -> &'static str {
        match &Self::TYPE_NAME.rfind(':') {
            Some(pos) => &Self::TYPE_NAME[pos + 1..],
            None => Self::TYPE_NAME,
        }
    }
}

#[wasm_bindgen(inline_js = "
    import * as psp from '@finos/perspective-viewer/dist/pkg/perspective_viewer.js';
    export function bootstrap(name, clsname, statics) {
        const cls = psp[clsname];
        const proto = cls.prototype;
        class x extends HTMLElement {
            constructor() {
                super();
                this._instance = new cls(this);
            }
        }

        const names = Object.getOwnPropertyNames(proto);
        for (const key of names) {
            Object.defineProperty(x.prototype, key, {
                value: function(...args) {
                    return this._instance[key].call(this._instance, ...args);
                }
            });
        }

        for (const key of statics) {
            Object.defineProperty(x, key, {
                value: function(...args) {
                    return psp[key].call(psp, ...args);
                }
            });
        }

        customElements.define(name, x);
    }
")]
extern "C" {
    #[wasm_bindgen(js_name = "bootstrap")]
    fn js_bootstrap(name: &str, cls: &str, statics: js_sys::Array) -> JsValue;
}

pub fn define_web_component<T: CustomElementMetadata>() {
    js_bootstrap(
        T::CUSTOM_ELEMENT_NAME,
        T::struct_name(),
        T::STATICS.iter().cloned().map(JsValue::from).collect(),
    );
}
