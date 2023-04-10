////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use wasm_bindgen::JsCast;
use web_sys::{Document, HtmlElement};

/// Blur the current active elemnt, triggering any blur handlers in the
/// application (e.g. modals). This is often necessary when a DOM update will
/// invalidate something that has a `"blur"` event handler.
#[extend::ext]
pub impl Document {
    fn blur_active_element(&self) {
        self.active_element()
            .unwrap()
            .unchecked_into::<HtmlElement>()
            .blur()
            .unwrap();
    }
}
