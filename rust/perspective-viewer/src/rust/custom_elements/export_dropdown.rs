////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::components::export_dropdown::*;
use crate::custom_elements::modal::*;
use crate::model::*;
use crate::renderer::Renderer;
use crate::session::Session;

use js_intern::*;
use js_sys::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use web_sys::*;
use yew::prelude::*;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ExportDropDownMenuElement {
    modal: ModalElement<ExportDropDownMenu>,
    target: Rc<RefCell<Option<HtmlElement>>>,
}

impl ResizableMessage for <ExportDropDownMenu as Component>::Message {
    fn resize(y: i32, x: i32, _: bool) -> Self {
        ExportDropDownMenuMsg::SetPos(y, x)
    }
}

impl ExportDropDownMenuElement {
    pub fn new(session: Session, renderer: Renderer) -> ExportDropDownMenuElement {
        let document = window().unwrap().document().unwrap();
        let dropdown = document
            .create_element("perspective-filter-dropdown")
            .unwrap()
            .unchecked_into::<HtmlElement>();

        let plugin = renderer.get_active_plugin().unwrap();
        let opts = if Reflect::has(&plugin, js_intern!("render")).unwrap() {
            vec![
                ExportMethod::Csv,
                ExportMethod::Arrow,
                ExportMethod::Html,
                ExportMethod::Png,
            ]
        } else {
            vec![ExportMethod::Csv, ExportMethod::Arrow, ExportMethod::Html]
        };

        let values = vec![
            ExportDropDownMenuItem::OptGroup("Current View", opts),
            ExportDropDownMenuItem::OptGroup(
                "All",
                vec![ExportMethod::CsvAll, ExportMethod::ArrowAll],
            ),
        ];

        let modal_rc: Rc<RefCell<Option<ModalElement<ExportDropDownMenu>>>> =
            Default::default();

        let callback = Callback::from({
            let modal_rc = modal_rc.clone();
            move |x| match x {
                ExportMethod::Csv => {
                    let session = session.clone();
                    let modal = modal_rc.borrow().clone().unwrap();
                    spawn_local(async move {
                        session.download_as_csv(false).await.expect("Export failed");
                        modal.hide().unwrap();
                    });
                }
                ExportMethod::CsvAll => {
                    let session = session.clone();
                    let modal = modal_rc.borrow().clone().unwrap();
                    spawn_local(async move {
                        session.download_as_csv(true).await.expect("Export failed");
                        modal.hide().unwrap();
                    });
                }
                ExportMethod::Arrow => {
                    let session = session.clone();
                    let modal = modal_rc.borrow().clone().unwrap();
                    spawn_local(async move {
                        session
                            .download_as_arrow(false)
                            .await
                            .expect("Export failed");
                        modal.hide().unwrap();
                    });
                }
                ExportMethod::ArrowAll => {
                    let session = session.clone();
                    let modal = modal_rc.borrow().clone().unwrap();
                    spawn_local(async move {
                        session
                            .download_as_arrow(true)
                            .await
                            .expect("Export failed");
                        modal.hide().unwrap();
                    });
                }
                ExportMethod::Html => {
                    let session = session.clone();
                    let renderer = renderer.clone();
                    let modal = modal_rc.borrow().clone().unwrap();
                    spawn_local(async move {
                        (&session, &renderer)
                            .download_as_html()
                            .await
                            .expect("Export failed");

                        modal.hide().unwrap();
                    });
                }
                ExportMethod::Png => {
                    let render = Reflect::get(&plugin, js_intern!("render")).unwrap();
                    render.unchecked_into::<Function>().call0(&plugin).unwrap();
                    modal_rc.borrow().clone().unwrap().hide().unwrap();
                }
            }
        });

        let props = ExportDropDownMenuProps {
            values: Rc::new(values),
            callback,
        };

        let modal = ModalElement::new(dropdown, props, true);
        *modal_rc.borrow_mut() = Some(modal.clone());
        ExportDropDownMenuElement {
            modal,
            target: Default::default(),
        }
    }

    pub fn open(&self, target: HtmlElement) {
        self.modal.open(target, None);
    }

    pub fn hide(&self) -> Result<(), JsValue> {
        self.modal.hide()
    }

    pub fn connected_callback(&self) {}
}
