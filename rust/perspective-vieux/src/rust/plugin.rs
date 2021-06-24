////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

pub mod registry;

use crate::session::Session;
use crate::utils::perspective_viewer::*;

use js_sys::*;
use registry::*;
use std::cell::RefCell;
use std::iter::FromIterator;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use yew::prelude::*;

pub struct PluginData {
    plugins: Vec<PerspectiveViewerJsPlugin>,
    plugins_idx: Option<usize>,
    _session: Session,
    on_plugin_changed: Vec<Box<dyn Fn(PerspectiveViewerJsPlugin)>>,
}

#[wasm_bindgen]
pub fn register_plugin(name: &str) {
    PLUGIN_REGISTRY.register_plugin(name);
}

#[wasm_bindgen]
pub fn available_plugin_names() -> Array {
    let names = PLUGIN_REGISTRY.available_plugin_names();
    Array::from_iter(names.iter().map(JsValue::from))
}

#[derive(Clone)]
pub struct Plugin(Rc<RefCell<PluginData>>);

fn make_short_name(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .filter(|x| x.is_alphabetic())
        .collect()
}

impl Plugin {
    pub fn new(
        _session: Session,
        on_plugin_changed: Vec<Box<dyn Fn(PerspectiveViewerJsPlugin)>>,
    ) -> Plugin {
        Plugin(Rc::new(RefCell::new(PluginData {
            plugins: PLUGIN_REGISTRY.create_plugins(),
            plugins_idx: None,
            _session,
            on_plugin_changed, 
        })))
    }

    pub fn add_on_plugin_changed(
        &self,
        on_plugin_changed: Callback<PerspectiveViewerJsPlugin>,
    ) {
        self.0
            .borrow_mut()
            .on_plugin_changed
            .push(Box::new(move |x| on_plugin_changed.emit(x)));
    }

    pub fn get_plugin(&self) -> Result<PerspectiveViewerJsPlugin, JsValue> {
        if self.0.borrow().plugins_idx.is_none() {
            self.set_plugin(Some(&PLUGIN_REGISTRY.default_plugin_name()))?;
        }

        let idx = self.0.borrow().plugins_idx.unwrap_or(0);
        self.0
            .borrow()
            .plugins
            .get(idx)
            .cloned()
            .ok_or_else(|| JsValue::from("No Plugin"))
    }

    pub fn set_plugin(&self, name: Option<&str>) -> Result<bool, JsValue> {
        let name = match name {
            Some(name) => name.to_owned(),
            None => PLUGIN_REGISTRY.default_plugin_name(),
        };

        let short_name = make_short_name(&name);
        let idx = {
            let elements = &self.0.borrow().plugins;
            elements
                .iter()
                .position(|elem| make_short_name(&elem.name()).contains(&short_name))
        };

        match idx {
            None => Err(JsValue::from(format!("Unkown plugin '{}'", name))),
            Some(idx) => {
                let changed = !matches!(
                    self.0.borrow().plugins_idx,
                    Some(selected_idx) if selected_idx == idx
                );

                if changed {
                    self.0.borrow_mut().plugins_idx = Some(idx);
                    for listener in self.0.borrow().on_plugin_changed.iter() {
                        (*listener)(self.get_plugin()?);
                    }
                }
                
                Ok(changed)
            }
        }
    }
}
