////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;
use async_std::sync::Mutex;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::html::ImplicitClone;

/// The available themes as detected in the browser environment or set
/// explicitly when CORS prevents detection.  Detection is expensive and
/// typically must be performed only once, when `document.styleSheets` is
/// up-to-date.
#[derive(Clone)]
pub struct Theme(Rc<ThemeData>);

impl Deref for Theme {
    type Target = ThemeData;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl ImplicitClone for Theme {}

pub struct ThemeData {
    viewer_elem: HtmlElement,
    themes: Mutex<Option<Vec<String>>>,
    pub theme_config_updated: PubSub<(Vec<String>, Option<usize>)>,
}

impl Theme {
    pub fn new(elem: &HtmlElement) -> Self {
        let theme = Self(Rc::new(ThemeData {
            viewer_elem: elem.clone(),
            themes: Default::default(),
            theme_config_updated: PubSub::default(),
        }));

        ApiFuture::spawn(theme.clone().init());
        theme
    }

    async fn init(self) -> Result<(), JsValue> {
        self.set_theme_attribute(self.get_name().await.as_deref())
    }

    /// Get the available theme names from the browser environment by parsing
    /// readable stylesheets.  This method is memoized - the state can be
    /// flushed by calling `reset()`.
    pub async fn get_themes(&self) -> Result<Vec<String>, JsValue> {
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

    pub async fn get_config(&self) -> Result<(Vec<String>, Option<usize>), JsValue> {
        let themes = self.get_themes().await?;
        let name = self.0.viewer_elem.get_attribute("theme");
        let index = name
            .and_then(|x| themes.iter().position(|y| y == &x))
            .or(if !themes.is_empty() { Some(0) } else { None });

        Ok((themes, index))
    }

    /// Returns the currently applied theme, or the default theme if no theme
    /// has been set and themes are detected in the `document`, or `None` if
    /// no themes are available.
    pub async fn get_name(&self) -> Option<String> {
        let (themes, index) = self.get_config().await.ok()?;
        index.and_then(|x| themes.get(x).cloned())
    }

    fn set_theme_attribute(&self, theme: Option<&str>) -> Result<(), JsValue> {
        if let Some(theme) = theme {
            self.0.viewer_elem.set_attribute("theme", theme)
        } else {
            self.0.viewer_elem.remove_attribute("theme")
        }
    }

    /// Set the theme by name, or `None` for the default theme.
    pub async fn set_name(&self, theme: Option<&str>) -> Result<(), JsValue> {
        let (themes, _) = self.get_config().await?;
        let index = if let Some(theme) = theme {
            self.set_theme_attribute(Some(theme))?;
            themes.iter().position(|x| x == theme)
        } else if !themes.is_empty() {
            self.set_theme_attribute(themes.get(0).map(|x| x.as_str()))?;
            Some(0)
        } else {
            self.set_theme_attribute(None)?;
            None
        };

        self.theme_config_updated.emit_all((themes, index));
        Ok(())
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
