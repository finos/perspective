////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

pub mod registry;

use crate::js::perspective_viewer::*;
use crate::session::Session;
use crate::utils::DebounceMutex;

use registry::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

pub struct PluginData {
    plugins: Vec<JsPerspectiveViewerPlugin>,
    plugins_idx: Option<usize>,
    _session: Session,
    draw_lock: DebounceMutex,
    on_plugin_changed: Vec<Box<dyn Fn(JsPerspectiveViewerPlugin)>>,
}

#[wasm_bindgen]
pub fn register_plugin(name: &str) {
    PLUGIN_REGISTRY.register_plugin(name);
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
    pub fn new(_session: Session) -> Plugin {
        Plugin(Rc::new(RefCell::new(PluginData {
            plugins: PLUGIN_REGISTRY.create_plugins(),
            plugins_idx: None,
            _session,
            on_plugin_changed: vec![],
            draw_lock: DebounceMutex::default(),
        })))
    }

    pub fn add_on_plugin_changed<T>(&self, on_plugin_changed: T)
    where
        T: Fn(JsPerspectiveViewerPlugin) + 'static,
    {
        if self.0.borrow().plugins_idx.is_some() {
            on_plugin_changed(self.get_plugin(None).unwrap());
        }

        self.0
            .borrow_mut()
            .on_plugin_changed
            .insert(0, Box::new(on_plugin_changed));
    }

    pub fn get_all_plugins(&self) -> Vec<JsPerspectiveViewerPlugin> {
        self.0.borrow().plugins.clone()
    }

    pub fn get_plugin(
        &self,
        name: Option<&str>,
    ) -> Result<JsPerspectiveViewerPlugin, JsValue> {
        let idx = match self.find_plugin_idx(name.as_deref()) {
            Some(idx) => idx,
            None => {
                if self.0.borrow().plugins_idx.is_none() {
                    self.set_plugin(Some(&PLUGIN_REGISTRY.default_plugin_name()))?;
                }

                self.0.borrow().plugins_idx.unwrap_or(0)
            }
        };

        self.0
            .borrow()
            .plugins
            .get(idx)
            .cloned()
            .ok_or_else(|| JsValue::from("No Plugin"))
    }

    pub fn draw_lock(&self) -> DebounceMutex {
        self.0.borrow().draw_lock.clone()
    }

    pub fn _trigger(&self) -> Result<(), JsValue> {
        let plugin = self.get_plugin(None)?;
        for listener in self.0.borrow().on_plugin_changed.iter() {
            (*listener)(plugin.clone());
        }

        Ok(())
    }

    pub fn set_plugin(&self, name: Option<&str>) -> Result<bool, JsValue> {
        let default_plugin_name = PLUGIN_REGISTRY.default_plugin_name();
        let name = name.unwrap_or_else(|| default_plugin_name.as_str());
        let idx = self
            .find_plugin_idx(Some(name))
            .ok_or_else(|| JsValue::from(format!("Unkown plugin '{}'", name)))?;

        let changed = !matches!(
            self.0.borrow().plugins_idx,
            Some(selected_idx) if selected_idx == idx
        );

        if changed {
            self.0.borrow_mut().plugins_idx = Some(idx);
            self._trigger()?;
        }

        Ok(changed)
    }

    fn find_plugin_idx(&self, name: Option<&str>) -> Option<usize> {
        match name {
            None => self.0.borrow().plugins_idx,
            Some(name) => {
                let short_name = make_short_name(&name);
                let elements = &self.0.borrow().plugins;
                elements.iter().position(|elem| {
                    make_short_name(&elem.name()).contains(&short_name)
                })
            }
        }
    }
}
