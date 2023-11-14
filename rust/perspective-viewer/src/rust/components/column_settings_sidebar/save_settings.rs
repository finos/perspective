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

use yew::{function_component, html, Callback, Html, Properties};

#[derive(Properties, PartialEq, Clone)]
pub struct SaveSettingsProps {
    pub save_enabled: bool,
    pub reset_enabled: bool,
    pub on_reset: Callback<()>,
    pub on_save: Callback<()>,
    pub on_delete: Callback<()>,
    pub show_danger_zone: bool,
    pub disable_delete: bool,
}

#[function_component(SaveSettings)]
pub fn save_settings(p: &SaveSettingsProps) -> Html {
    let reset = p.on_reset.reform(|_| ());
    let save = p.on_save.reform(|_| ());
    let delete = p.on_delete.reform(|_| ());
    html! {
        <div id="save-settings-wrapper">
            if p.show_danger_zone {
                <div id="danger-zone">
                    <button
                        id="psp-expression-editor-button-delete"
                        class="psp-expression-editor__button"
                        onmousedown={ delete }
                        disabled={p.disable_delete}>
                        { "Delete Column" }
                    </button>
                </div>
            }
            <div id="save-settings">
                <button
                    id="psp-expression-editor-button-reset"
                    class="psp-expression-editor__button"
                    onmousedown={ reset }
                    disabled={ !p.reset_enabled }>
                    { "Reset" }
                </button>

                <button
                    id="psp-expression-editor-button-save"
                    class="psp-expression-editor__button"
                    onmousedown={ save }
                    disabled={ !p.save_enabled }>
                    { "Save" }
                </button>
            </div>
        </div>
    }
}
