////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::copy::{copy, copy_flat};
use crate::download::{download, download_flat};
use crate::utils::perspective::*;
use crate::utils::*;

use js_sys::Promise;
use num_format::{Locale, ToFormattedString};
use std::cell::RefCell;
use std::future::Future;
use std::rc::Rc;
use typed_html::{dom::DOMTree, html, text};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Element, HtmlElement, MessageEvent};

static CSS: &str = include_str!("../../dist/css/container.css");

type JsResult<T> = Result<T, JsValue>;

/// The overall status, which will be represented in the UI by a color coded button.
#[derive(Debug, Clone)]
pub enum Status {
    Connected,
    Initializing,
    Uninitialized,
    Error,
}

impl Status {
    /// The CSS class name to use for a given `Status`
    pub fn class_name(&self) -> &str {
        match self {
            Status::Connected => "connected",
            Status::Initializing => "initializing",
            Status::Error => "error",
            _ => "",
        }
    }
}

impl Default for Status {
    fn default() -> Self {
        Status::Uninitialized
    }
}

/// The data state of a `StatusBarElement`, which will consult this struct to determine
/// how to render itself.  `web_sys::*` values from the actual DOM state are not
/// restricted from living on this struct, as long as they are relevent to the current
/// data state, but `elem` and the `ShadowRoot` do not live here.
#[derive(Default)]
struct StatusBarState {
    rows: u32,
    virtual_rows: u32,
    is_pivot: bool,
    status: Status,
    view: Option<PerspectiveJsView>,
    table: Option<PerspectiveJsTable>,
    update_callback: Option<Closure<dyn Fn() -> js_sys::Promise>>,
}

impl StatusBarState {
    /// Given a JavaScript `Promise<Table>`, await the result and set this state's
    /// `table`, `rows`, and `status` fields along the way.  `status` specifically is
    /// set twice;  first to `Initializing` synchronously when the method is called,
    /// and later to the resolution state after the async `Promise` has resolved.
    pub fn set_table(
        this: Rc<RefCell<Self>>,
        table: Promise,
    ) -> impl Future<Output = JsResult<()>> {
        this.borrow_mut().status = Status::Initializing;
        async move {
            let table = JsFuture::from(table).await;
            if let Err(_) = table {
                let mut state = this.borrow_mut();
                state.rows = 0;
                state.table = None;
                state.status = Status::Error;
            } else if let Ok(js_table) = table {
                let table: PerspectiveJsTable = js_table.unchecked_into();
                let mut state = this.borrow_mut();
                state.table = Some(table);
                state.status = Status::Connected;
            }
            Ok(())
        }
    }

    /// Set the `PerspectiveJsView` and update other state values from this and the
    /// previously set `PerspectiveJsTable`.
    pub async fn set_view(
        this: &RefCell<Self>,
        view: PerspectiveJsView,
    ) -> Result<(), JsValue> {
        this.borrow_mut().view = Some(view.clone());
        Self::update_state(&this).await?;
        this.borrow_mut().is_pivot = Self::is_pivot(&this).await?;
        Ok(())
    }

    /// Update the row count values from the `Perspective` JavaScript objects.
    pub async fn update_state(this: &RefCell<Self>) -> Result<(), JsValue> {
        let view = this.borrow().view.clone().unwrap();
        let table = this.borrow().table.clone().unwrap();
        let vrows = view.num_rows().await?;
        let rows = table.size().await?;

        this.borrow_mut().virtual_rows = vrows as u32;
        this.borrow_mut().rows = rows as u32;
        Ok(())
    }

    async fn is_pivot(this: &RefCell<Self>) -> Result<bool, JsValue> {
        let view = this.borrow().view.clone().unwrap();
        let config = view.get_config().await?;
        Ok(config.row_pivots().length() > 0
            || config.column_pivots().length() > 0
            || this.borrow().virtual_rows != this.borrow().rows)
    }
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct StatusBarElement {
    css: String,
    elem: web_sys::HtmlElement,
    root: Element,
    state: Rc<RefCell<StatusBarState>>,
}

impl PerspectiveComponent for StatusBarElement {
    fn get_root(&self) -> &web_sys::HtmlElement {
        &self.elem
    }
}

#[wasm_bindgen]
impl StatusBarElement {
    #[wasm_bindgen(constructor)]
    pub fn new(elem: HtmlElement) -> Result<StatusBarElement, JsValue> {
        let _self = {
            let state = Rc::new(RefCell::new(StatusBarState::default()));
            let init = web_sys::ShadowRootInit::new(web_sys::ShadowRootMode::Open);
            let root = elem
                .attach_shadow(&init)
                .unwrap()
                .unchecked_into::<Element>();

            apply_style_node(&root, CSS)?;
            apply_dom_tree(&root, &mut Self::template())?;
            StatusBarElement {
                css: CSS.to_owned(),
                elem,
                root,
                state,
            }
        };

        _self.get_root().add_event_listener_with_callback(
            "click",
            &_self.method_to_jsfunction_arg1(|this, e: MessageEvent| {
                this.on_click(e.unchecked_into())
            }),
        )?;

        _self.render()?;
        Ok(_self)
    }

    /// The HTML template for this component.
    fn template() -> DOMTree<String> {
        html! {
            <div>
                <div class="section">
                    <span id="status" class=""></span>
                </div>
                <div class="section">
                    <span id="reset" class="button"><span>"Reset"</span></span>
                    <span id="export" class="button"><span>"Export"</span></span>
                    <span id="copy" class="button"><span>"Copy"</span></span>
                </div>
                <div id="rows" class="section"></div>
            </div>
        }
    }

    /// The HTML template function for the `rows` box, which shows the data set total rows
    /// and query rows.  This is called every draw loop, so it should be as cheap as
    /// possible!
    fn rows_template(state: &StatusBarState) -> DOMTree<String> {
        let nrows = &(state.rows as u32).to_formatted_string(&Locale::en);
        if state.is_pivot {
            let vrows = (state.virtual_rows as u32).to_formatted_string(&Locale::en);
            html! {
                <div>
                    <span>{ text!("{} ", &vrows) }</span>
                    <span class="icon">{ text!("arrow_back") }</span>
                    <span>{ text!(" {} rows", nrows) }</span>
                </div>
            }
        } else {
            html! {
                <div><span>{ text!("{} rows", &nrows) }</span></div>
            }
        }
    }

    /// Set a `PerspectiveJsView` for this element to display status state from.  Must
    /// not be called until after `set_table()` with the `PerspectiveJsTable` this view
    /// was presumably instanced from.
    pub fn set_view(&mut self, view: PerspectiveJsView) -> Result<Promise, JsValue> {
        let cb = self.async_method_to_jsfunction(|this| async move {
            StatusBarState::update_state(&this.state).await?;
            this.render()
        });

        view.on_update(cb.as_ref().unchecked_ref());
        self.state.borrow_mut().update_callback = Some(cb);
        Ok(self.async_method_to_jspromise(|this| async move {
            StatusBarState::set_view(&this.state, view).await?;
            this.render()
        }))
    }

    /// Set a `PerspectiveJsTable` for this element.  `StatusBarState::set_table` is
    /// called without `await` to ensure the status is set to `Initializing` before
    /// `render()` is called.
    pub fn set_table(&self, table: Promise) -> Result<Promise, JsValue> {
        let table_promise = StatusBarState::set_table(self.state.clone(), table);
        self.render()?;
        Ok(self.async_method_to_jspromise(|this| async move {
            table_promise.await?;
            this.render()
        }))
    }

    /// Render's this widget from it's `state` property using the DOM API directly.
    fn render(&self) -> Result<JsValue, JsValue> {
        let state = self.state.borrow();
        let mut rows_template = Self::rows_template(&state);

        let status = self.root.query_selector("#status")?.unwrap();
        status.set_class_name(state.status.class_name());

        let rows = self.root.query_selector("#rows")?.unwrap();
        rows.set_text_content(Some(""));
        apply_dom_tree(&rows, &mut rows_template)?;
        Ok(JsValue::from_bool(true))
    }

    /// Click dispatch.
    fn on_click(&self, event: web_sys::KeyboardEvent) -> JsResult<()> {
        event.stop_propagation();
        event.prevent_default();
        let target: web_sys::HtmlElement =
            event.composed_path().get(0).unchecked_into();
        match &target.get_attribute("id").unwrap()[..] {
            "export" if event.shift_key() => {
                if let Some(table) = &self.state.borrow().table {
                    let _ = download_flat(table);
                }
            }
            "export" => {
                if let Some(view) = &self.state.borrow().view {
                    let _ = download(view);
                }
            }
            "copy" if event.shift_key() => {
                if let Some(table) = &self.state.borrow().table {
                    let _ = copy_flat(table);
                }
            }
            "copy" => {
                if let Some(view) = &self.state.borrow().view {
                    let _ = copy(view);
                }
            }
            "reset" => {
                let _ = self.reset()?;
            }
            _ => (),
        };
        Ok(())
    }

    /// Cleans up the callback registered to the current `view.on_update()`.
    pub fn remove_on_update_callback(&self) {
        if let StatusBarState {
            update_callback: Some(ref cb),
            view: Some(ref view),
            ..
        } = *self.state.borrow()
        {
            view.remove_update(cb.as_ref().unchecked_ref());
        }
    }

    /// Dispatch a `Reset` event.  This action cannot be handled by the status bar
    /// currently as it does not have access to the `<perspective-viewer>` it is
    /// embedded in.
    fn reset(&self) -> Result<bool, JsValue> {
        let event = web_sys::CustomEvent::new("perspective-statusbar-reset")?;
        self.elem.dispatch_event(&event)
    }
}
