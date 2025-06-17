// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::ops::Deref;
use std::rc::Rc;

use wasm_bindgen::JsCast;

use crate::*;

type CSSResource = (&'static str, &'static str);

/// A dictionary of CSS fragments for native HTML elements which should always
/// be loaded (and perhaps lack yew components wrappers from which to have
/// their styles registered).
static DOM_STYLES: &[CSSResource] = &[css!("dom/checkbox"), css!("dom/select")];

thread_local! {
    /// Cache of `CssStyleSheet` objects, which can safely be re-used across
    /// `HTMLPerspectiveViewerElement` instances
    static STYLE_SHEET_CACHE: RefCell<BTreeMap<&'static str, web_sys::CssStyleSheet>> = RefCell::new(
        DOM_STYLES
            .iter()
            .map(|x| (x.0, StyleCache::into_style(x.1)))
            .collect(),
    );
}

/// A state object for `<style>` snippets used by a yew `Component` with a
/// `<StyleProvider>` at the root.
#[derive(Clone)]
pub struct StyleCache(Rc<StyleCacheData>);

impl Deref for StyleCache {
    type Target = StyleCacheData;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl PartialEq for StyleCache {
    fn eq(&self, _other: &Self) -> bool {
        true
    }
}

impl StyleCache {
    pub fn new(is_shadow: bool, elem: &web_sys::HtmlElement) -> StyleCache {
        StyleCache(Rc::new(StyleCacheData::new(is_shadow, elem)))
    }

    /// Insert a new stylesheet into this manager, _immediately_ inserting it
    /// into the DOM as well if any other elements are already connected,
    /// bypassing yew rendering;  when the yew `Component::view` method is
    /// later invoked, this element will get re-attached to the same parent
    /// (though likely in a different order).
    ///
    /// This is done synchronously because CSS registration occurs during
    /// the `create` lifecycle phase, and we want these style elements to be
    /// attached _before_ the style's target nodes are attached.
    pub fn add_style(&self, name: &'static str, css: &'static str) {
        let mut map = self.0.styles.borrow_mut();
        STYLE_SHEET_CACHE.with_borrow_mut(|cache| {
            if !map.contains(name) {
                map.insert(name);
                if !cache.contains_key(name) {
                    let style = Self::into_style(css);
                    cache.insert(name, style);
                }

                self.adopted_style_sheets.splice(
                    map.iter().position(|x| x == &name).unwrap() as u32,
                    0,
                    cache.get(name).unwrap(),
                );
            }
        });
    }

    /// Concert a CSS string to an `HtmlStyleElement`, which are memoized due
    /// to their size and DOM performance impact.
    fn into_style(css: &str) -> web_sys::CssStyleSheet {
        let sheet = web_sys::CssStyleSheet::new().unwrap();
        sheet.replace_sync(css).unwrap();
        sheet
    }
}

/// Using a `BTreeMap` so the resulting `<style>` elements have a stable order
/// when rendered to the DOM.
pub struct StyleCacheData {
    styles: RefCell<BTreeSet<&'static str>>,
    adopted_style_sheets: js_sys::Array,
}

impl StyleCacheData {
    fn new(is_shadow: bool, elem: &web_sys::HtmlElement) -> Self {
        let styles: RefCell<BTreeSet<&'static str>> =
            RefCell::new(DOM_STYLES.iter().map(|x| x.0).collect());

        let root: &JsValue = if is_shadow {
            &elem.shadow_root().unwrap()
        } else {
            &web_sys::window().unwrap().document().unwrap()
        };

        let adopted_style_sheets = js_sys::Reflect::get(root, &"adoptedStyleSheets".into())
            .unwrap()
            .unchecked_into::<js_sys::Array>();

        for name in styles.borrow().iter() {
            STYLE_SHEET_CACHE.with_borrow(|x| adopted_style_sheets.push(x.get(name).unwrap()));
        }

        Self {
            styles,
            adopted_style_sheets,
        }
    }
}
