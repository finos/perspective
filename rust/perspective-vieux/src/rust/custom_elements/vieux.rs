////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::vieux::*;
use crate::custom_elements::expression_editor::PerspectiveExpressionEditorElement;
use crate::session::Session;
use crate::utils::perspective::*;
use crate::utils::WeakComponentLink;

use futures::channel::oneshot::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::*;
use yew::prelude::*;

fn get_theme(elem: &HtmlElement) -> String {
    let styles = window().unwrap().get_computed_style(elem).unwrap().unwrap();
    match &styles.get_property_value("--monaco-theme") {
        Err(_) => "vs",
        Ok(ref s) if s.trim() == "" => "vs",
        Ok(x) => x.trim(),
    }
    .to_owned()
}

/// A `customElements` external API.
#[wasm_bindgen]
#[derive(Clone)]
pub struct PerspectiveVieuxElement {
    elem: HtmlElement,
    root: ComponentLink<PerspectiveVieux>,
    session: Session,
    expression_editor: Rc<RefCell<Option<PerspectiveExpressionEditorElement>>>,
}

#[wasm_bindgen]
impl PerspectiveVieuxElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: web_sys::HtmlElement) -> PerspectiveVieuxElement {
        let children = elem.children();
        let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
        let shadow_root = elem
            .attach_shadow(&init)
            .unwrap()
            .unchecked_into::<web_sys::Element>();

        let session = Session::new();
        let props = PerspectiveVieuxProps {
            elem: elem.clone(),
            panels: (
                children.item(0).unwrap().unchecked_into(),
                children.item(1).unwrap().unchecked_into(),
            ),
            session: session.clone(),
            weak_link: WeakComponentLink::default(),
        };

        let app = App::<PerspectiveVieux>::new();
        let root = app.mount_with_props(shadow_root, props);
        PerspectiveVieuxElement {
            elem,
            root,
            session,
            expression_editor: Rc::new(RefCell::new(None)),
        }
    }

    pub fn connected_callback(&self) {}

    pub fn load(&self, table: js_sys::Promise) -> js_sys::Promise {
        assert!(!table.is_undefined());

        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        self.root.send_message(Msg::LoadTable(table, sender));
        future_to_promise(async move { receiver.await.unwrap() })
    }

    pub fn set_view(&self, view: PerspectiveJsView) {
        self.root.send_message(Msg::ViewLoaded(view));
    }

    pub fn delete_view(&self) {
        self.root.send_message(Msg::ViewDeleted);
    }

    /// Toggle (or force) the config panel open/closed.
    pub fn toggle_config(&self, force: Option<bool>) -> js_sys::Promise {
        let (sender, receiver) = channel::<Result<JsValue, JsValue>>();
        let msg = Msg::ToggleConfig(force, Some(sender));
        self.root.send_message(msg);
        future_to_promise(async move { receiver.await.unwrap() })
    }

    fn create_expression_editor(
        &self,
        target: HtmlElement,
        ed: &mut Option<PerspectiveExpressionEditorElement>,
    ) {
        let document = window().unwrap().document().unwrap();
        let editor = document
            .create_element("perspective-expression-editor")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        editor
            .toggle_attribute_with_force("initializing", true)
            .unwrap();

        let this = self.clone();
        let on_save = Rc::new(move |val| this.clone().save_expr(val));

        let this = editor.clone();
        let on_init = Rc::new(move || {
            this.toggle_attribute_with_force("initializing", false)
                .unwrap();
        });

        let this = editor.clone();
        let on_validate = Rc::new(move |valid| {
            this.toggle_attribute_with_force("validating", valid)
                .unwrap();
        });

        let monaco_theme = get_theme(&target);
        let mut element = PerspectiveExpressionEditorElement::new(
            editor,
            self.session.clone(),
            on_save,
            on_init,
            on_validate,
            monaco_theme,
        );

        element.open(target).unwrap();
        *ed = Some(element);
    }

    /// Opens an expression editor at the `target` position, by first creating a
    /// `perspective-expression-editor` custom element, then creating the model.
    pub fn _open_expression_editor(&mut self, target: HtmlElement) {
        let mut x = self.expression_editor.borrow_mut();
        match x.as_mut() {
            Some(x) => x.open(target).unwrap(),
            _ => self.create_expression_editor(target, &mut *x),
        };
    }

    fn save_expr(&mut self, x: JsValue) {
        let mut event_init = web_sys::CustomEventInit::new();
        event_init.detail(&x);
        let event = web_sys::CustomEvent::new_with_event_init_dict(
            "-perspective-add-expression",
            &event_init,
        );

        self.expression_editor
            .borrow_mut()
            .as_mut()
            .unwrap()
            .close()
            .unwrap();

        self.elem.dispatch_event(&event.unwrap()).unwrap();
    }
}
