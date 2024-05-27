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

use std::rc::Rc;

use yew::prelude::*;

use self::js::PerspectiveValidationError;
use crate::components::containers::trap_door_panel::TrapDoorPanel;
use crate::components::form::code_editor::CodeEditor;
use crate::components::style::LocalStyle;
use crate::js::{copy_to_clipboard, paste_from_clipboard, MimeType};
use crate::model::*;
use crate::presentation::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[derive(Properties, Clone, PartialEq)]
pub struct DebugPanelProps {
    pub session: Session,
    pub renderer: Renderer,
    pub presentation: Presentation,
}

derive_model!(Presentation, Renderer, Session for DebugPanelProps);

impl DebugPanelProps {
    fn set_text(&self, setter: UseStateSetter<Rc<String>>) {
        let props = self.clone();
        ApiFuture::spawn(async move {
            let task = props.get_viewer_config();
            let config = task.await?;
            let json = JsValue::from_serde_ext(&config)?;
            let js_string =
                js_sys::JSON::stringify_with_replacer_and_space(&json, &JsValue::NULL, &2.into())?;

            setter.set(Rc::new(js_string.as_string().unwrap()));
            Ok(())
        });
    }

    fn reset_callback(
        &self,
        text: UseStateSetter<Rc<String>>,
        error: UseStateSetter<Option<PerspectiveValidationError>>,
        modified: UseStateSetter<bool>,
    ) -> impl Fn(()) {
        let props = self.clone();
        move |_| {
            error.set(None);
            props.set_text(text.clone());
            modified.set(false);
        }
    }
}

fn on_save(
    props: &DebugPanelProps,
    text: &Rc<String>,
    error: &UseStateHandle<Option<PerspectiveValidationError>>,
    modified: &UseStateHandle<bool>,
) {
    clone!(props, text, error, modified);
    ApiFuture::spawn(async move {
        match serde_json::from_str(&text) {
            Ok(config) => {
                match props.restore_and_render(config, async { Ok(()) }).await {
                    Ok(_) => {
                        modified.set(false);
                    },
                    Err(e) => {
                        modified.set(true);
                        error.set(Some(PerspectiveValidationError {
                            error_message: JsValue::from(e)
                                .as_string()
                                .unwrap_or_else(|| "Failed to validate viewer config".to_owned()),
                            line: 0_i32,
                            column: 0,
                        }));
                    },
                }
                Ok(())
            },
            Err(err) => {
                modified.set(true);
                error.set(Some(PerspectiveValidationError {
                    error_message: err.to_string(),
                    line: err.line() as i32 - 1,
                    column: err.column() as i32 - 1,
                }));

                Ok(())
            },
        }
    });
}

#[function_component(DebugPanel)]
pub fn debug_panel(props: &DebugPanelProps) -> Html {
    let expr = use_state_eq(|| Rc::new("".to_string()));
    let error = use_state_eq(|| Option::<PerspectiveValidationError>::None);
    let select_all = use_memo((), |()| PubSub::default());
    let modified = use_state_eq(|| false);
    use_effect_with((expr.setter(), props.clone()), {
        clone!(error, modified);
        move |(text, props)| {
            props.set_text(text.clone());
            error.set(None);
            let sub1 = props.renderer().style_changed.add_listener({
                props.reset_callback(text.clone(), error.setter(), modified.setter())
            });

            let sub2 = props.renderer().reset_changed.add_listener({
                props.reset_callback(text.clone(), error.setter(), modified.setter())
            });

            let sub3 = props.session().view_config_changed.add_listener({
                props.reset_callback(text.clone(), error.setter(), modified.setter())
            });

            || {
                drop(sub1);
                drop(sub2);
                drop(sub3);
            }
        }
    });

    let oninput = use_callback(expr.setter(), {
        clone!(modified);
        move |x, expr| {
            modified.set(true);
            expr.set(x)
        }
    });

    let onsave = use_callback((expr.clone(), error.clone(), props.clone()), {
        clone!(modified);
        move |_, (text, error, props)| on_save(props, text, error, &modified)
    });

    let oncopy = use_callback(
        (expr.clone(), select_all.callback()),
        move |_, (text, select_all)| {
            select_all.emit(());
            let mut options = web_sys::BlobPropertyBag::new();
            options.type_("text/plain");
            let blob_txt = (JsValue::from((***text).clone())).clone();
            let blob_parts = js_sys::Array::from_iter([blob_txt].iter());
            let blob = web_sys::Blob::new_with_str_sequence_and_options(&blob_parts, &options);
            ApiFuture::spawn(copy_to_clipboard(
                async move { Ok(blob?) },
                MimeType::TextPlain,
            ));
        },
    );

    let onapply = use_callback((expr.clone(), error.clone(), props.clone()), {
        clone!(modified);
        move |_, (text, error, props)| on_save(props, text, error, &modified)
    });

    let onreset = use_callback((expr.setter(), error.clone(), props.clone()), {
        clone!(modified);
        move |_, (text, error, props)| {
            props.set_text(text.clone());
            error.set(None);
            modified.set(false);
        }
    });

    let onpaste = use_callback((expr.clone(), error.clone(), props.clone()), {
        clone!(modified);
        move |_, (text, error, props)| {
            clone!(text, error, props, modified);
            ApiFuture::spawn(async move {
                if let Some(x) = paste_from_clipboard().await {
                    let x = Rc::new(x);
                    modified.set(true);
                    error.set(None);
                    text.set(x.clone());
                    on_save(&props, &x, &error, &modified);
                }

                Ok(())
            });
        }
    });

    html! {
        <>
            <LocalStyle href={css!("containers/tabs")} />
            <LocalStyle href={css!("form/debug")} />
            <div id="debug-panel-overflow">
                <TrapDoorPanel id="debug-panel" class="sidebar_column">
                    <div class="tab-gutter">
                        <span class="tab selected">
                            <div id="Debug" class="tab-title" />
                            <div class="tab-border" />
                        </span>
                        <span class="tab tab-padding">
                            <div class="tab-title" />
                            <div class="tab-border" />
                        </span>
                    </div>
                    <div id="debug-panel-editor">
                        <CodeEditor
                            expr={&*expr}
                            disabled=false
                            {oninput}
                            {onsave}
                            select_all={select_all.subscriber()}
                            error={(*error).clone()}
                        />
                    </div>
                    <div id="debug-panel-controls">
                        <button disabled={!*modified} onclick={onapply}>{ "Apply" }</button>
                        <button disabled={!*modified} onclick={onreset}>{ "Reset" }</button>
                        <button onclick={oncopy}>{ "Copy" }</button>
                        <button onclick={onpaste}>{ "Paste" }</button>
                    </div>
                </TrapDoorPanel>
            </div>
        </>
    }
}
