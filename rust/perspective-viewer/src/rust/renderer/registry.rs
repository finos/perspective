////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::thread::LocalKey;

use extend::ext;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;

use crate::js::plugin::*;

thread_local! {
    pub static PLUGIN_REGISTRY: Rc<RefCell<Vec<PluginRecord>>> = Rc::new(RefCell::new(vec![]));
}

pub struct PluginRecord {
    name: String,
    category: String,
    tag_name: String,
}

/// A global registry of all plugins that have been registered.
#[ext]
pub impl LocalKey<Rc<RefCell<Vec<PluginRecord>>>> {
    fn create_plugins(&'static self) -> Vec<JsPerspectiveViewerPlugin> {
        register_default();
        self.with(
            |plugins| -> Result<Vec<JsPerspectiveViewerPlugin>, JsValue> {
                let mut elements = vec![];
                for plugin in plugins.borrow().iter() {
                    let element = create_plugin(&plugin.tag_name);
                    let style = element.unchecked_ref::<HtmlElement>().style();
                    style.set_property("position", "absolute")?;
                    style.set_property("top", "0")?;
                    style.set_property("right", "0")?;
                    style.set_property("bottom", "0")?;
                    style.set_property("left", "0")?;
                    elements.push(element);
                }

                Ok(elements)
            },
        )
        .unwrap()
    }

    fn default_plugin_name(&'static self) -> String {
        register_default();
        self.with(|plugins| {
            plugins
                .borrow()
                .iter()
                .map(|plugin| plugin.name.to_owned())
                .next()
                .unwrap()
        })
    }

    fn available_plugin_names_by_category(&'static self) -> HashMap<String, Vec<String>> {
        register_default();
        self.with(|plugins| {
            plugins.borrow().iter().fold(
                HashMap::<String, Vec<String>>::default(),
                |mut acc, plugin| {
                    acc.entry(plugin.category.to_owned())
                        .or_default()
                        .push(plugin.name.to_owned());
                    acc
                },
            )
        })
    }

    fn register_plugin(&'static self, tag_name: &str) {
        assert!(
            !self.with(|plugin| plugin.borrow().iter().any(|n| n.tag_name == tag_name)),
            "Plugin Custom Element '{}' already registered",
            tag_name
        );

        self.with(|plugin| {
            let plugin_inst = create_plugin(tag_name);
            let record = PluginRecord {
                tag_name: tag_name.to_owned(),
                name: plugin_inst.name(),
                category: plugin_inst
                    .category()
                    .unwrap_or_else(|| "Custom".to_owned()),
            };

            plugin.borrow_mut().push(record);
        });
    }

    #[cfg(test)]
    fn reset(&'static self) {
        self.with(|plugins| plugins.borrow_mut().clear());
    }
}

fn register_default() {
    PLUGIN_REGISTRY.with(|plugins| {
        if plugins.borrow().len() == 0 {
            plugins.borrow_mut().push(PluginRecord {
                name: "Debug".to_owned(),
                category: "Custom".to_owned(),
                tag_name: "perspective-viewer-plugin".to_owned(),
            })
        }
    })
}

fn create_plugin(tag_name: &str) -> JsPerspectiveViewerPlugin {
    web_sys::window()
        .unwrap()
        .document()
        .unwrap()
        .create_element(tag_name)
        .unwrap()
        .unchecked_into()
}
