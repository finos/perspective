////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::js::plugin::JsPerspectiveViewerPlugin;
use crate::model::*;
use crate::renderer::*;
use crate::session::Session;
use crate::utils::*;
use crate::*;
use std::ops::Deref;

use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;

#[derive(Clone)]
pub struct CustomEvents(Rc<(CustomEventsDataRc, [Subscription; 4])>);

#[derive(Clone)]
struct CustomEventsDataRc(Rc<CustomEventsData>);

impl Deref for CustomEventsDataRc {
    type Target = CustomEventsData;
    fn deref(&self) -> &CustomEventsData {
        &*self.0
    }
}

struct CustomEventsData {
    elem: HtmlElement,
    session: Session,
    renderer: Renderer,
    last_dispatched: RefCell<Option<ViewerConfig>>,
}

derive_session_renderer_model!(CustomEventsData);

impl CustomEvents {
    pub fn new(
        elem: &HtmlElement,
        session: &Session,
        renderer: &Renderer,
    ) -> CustomEvents {
        let data = CustomEventsDataRc(Rc::new(CustomEventsData {
            elem: elem.clone(),
            session: session.clone(),
            renderer: renderer.clone(),
            last_dispatched: Default::default(),
        }));

        let theme_sub = renderer.on_theme_config_updated.add_listener({
            clone!(data);
            move |_| {
                data.clone().dispatch_config_update();
            }
        });

        let settings_sub = renderer.on_settings_open_changed.add_listener({
            clone!(data);
            move |open| {
                data.dispatch_settings_open_changed(open);
                data.clone().dispatch_config_update();
            }
        });

        let plugin_sub = renderer.on_plugin_changed.add_listener({
            clone!(data);
            move |plugin| {
                data.dispatch_plugin_changed(&plugin);
                data.clone().dispatch_config_update();
            }
        });

        let view_sub = session.on_view_created.add_listener({
            clone!(data);
            move |_| {
                data.clone().dispatch_config_update();
            }
        });

        CustomEvents(Rc::new((
            data,
            [theme_sub, settings_sub, plugin_sub, view_sub],
        )))
    }
}

impl CustomEventsDataRc {
    fn dispatch_settings_open_changed(&self, open: bool) {
        let mut event_init = web_sys::CustomEventInit::new();
        event_init.detail(&JsValue::from(open));
        let event = web_sys::CustomEvent::new_with_event_init_dict(
            "perspective-toggle-settings",
            &event_init,
        );

        self.elem
            .toggle_attribute_with_force("settings", open)
            .unwrap();
        self.elem.dispatch_event(&event.unwrap()).unwrap();
    }

    fn dispatch_plugin_changed(&self, plugin: &JsPerspectiveViewerPlugin) {
        let mut event_init = web_sys::CustomEventInit::new();
        event_init.detail(plugin);
        let event = web_sys::CustomEvent::new_with_event_init_dict(
            "perspective-plugin-update",
            &event_init,
        );

        self.elem.dispatch_event(&event.unwrap()).unwrap();
    }

    fn dispatch_config_update(self) {
        let _ = future_to_promise(async move {
            let viewer_config = self.get_viewer_config().await?;
            if viewer_config.view_config != Default::default()
                && Some(&viewer_config) != self.last_dispatched.borrow().as_ref()
            {
                let json_config = JsValue::from_serde(&viewer_config).into_jserror()?;
                let mut event_init = web_sys::CustomEventInit::new();
                event_init.detail(&json_config);
                let event = web_sys::CustomEvent::new_with_event_init_dict(
                    "perspective-config-update",
                    &event_init,
                );

                *self.last_dispatched.borrow_mut() = Some(viewer_config);
                self.elem.dispatch_event(&event.unwrap()).unwrap();
            }

            Ok(JsValue::UNDEFINED)
        });
    }
}
