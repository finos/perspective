////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;
use async_std::sync::Mutex;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;

/// The available themes as detected in the browser environment or set
/// explicitly when CORS prevents detection.  Detection is expensive and
/// typically must be performed only once, when `document.styleSheets` is
/// up-to-date.
#[derive(Clone)]
pub struct ThemeStore(Rc<ThemeStoreData>);

struct ThemeStoreData {
    viewer_elem: HtmlElement,
    themes: Mutex<Option<Vec<String>>>,
}

impl ThemeStore {
    pub fn new(elem: &HtmlElement) -> Self {
        Self(Rc::new(ThemeStoreData {
            viewer_elem: elem.clone(),
            themes: Default::default(), //RefCell::new(None),
        }))
    }

    /// Get the available theme names from the browser environment by parsing
    /// readable stylesheets.  This method is memoized - the state can be
    /// flushed by calling `reset()`.
    pub async fn get_themes(&mut self) -> Result<Vec<String>, JsValue> {
        let mut mutex = self.0.themes.lock().await;
        if mutex.is_none() {
            await_dom_loaded().await?;
            let themes = get_theme_names(&self.0.viewer_elem)?;
            *mutex = Some(themes);
        }

        Ok(mutex.clone().unwrap())
    }

    /// Reset the state.  `styleSheets` will be re-parsed next time
    /// `get_themes()` is called if the `themes` argument is `None`.
    pub async fn reset(&self, themes: Option<Vec<String>>) {
        let mut mutex = self.0.themes.lock().await;
        *mutex = themes;
    }
}

macro_rules! iter_index {
    ($x:expr) => {
        (0..$x.length()).map(|x| $x.item(x))
    };
}

fn fill_rule_theme_names(
    themes: &mut Vec<String>,
    rule: &Option<CssRule>,
    elem: &HtmlElement,
) -> Result<(), JsValue> {
    if let Some(rule) = rule.as_ref().into_jserror()?.dyn_ref::<CssStyleRule>() {
        let txt = rule.selector_text();
        if elem.matches(&txt)? {
            let style = rule.style();
            let x = (0..style.length()).map(|x| style.item(x));
            for property in x {
                if property == "--theme-name" {
                    let name = style.get_property_value("--theme-name")?;
                    let trimmed = name.trim();
                    themes.push(trimmed[1..trimmed.len() - 1].to_owned());
                }
            }
        }
    }

    Ok(())
}

fn fill_sheet_theme_names(
    themes: &mut Vec<String>,
    sheet: &Option<StyleSheet>,
    elem: &HtmlElement,
) -> Result<(), JsValue> {
    let sheet = sheet
        .as_ref()
        .into_jserror()?
        .unchecked_ref::<CssStyleSheet>();

    if let Ok(rules) = sheet.css_rules() {
        for rule in iter_index!(&rules) {
            fill_rule_theme_names(themes, &rule, elem)?;
        }
    }

    Ok(())
}

/// Search the document's `styleSheets` for rules which apply to `elem` and
/// provide the `--theme-name` CSS custom property.
fn get_theme_names(elem: &HtmlElement) -> Result<Vec<String>, JsValue> {
    let doc = window().unwrap().document().unwrap();
    let sheets = doc.style_sheets();
    let mut themes: Vec<String> = vec![];
    for sheet in iter_index!(sheets) {
        fill_sheet_theme_names(&mut themes, &sheet, elem)?;
    }

    Ok(themes)
}
