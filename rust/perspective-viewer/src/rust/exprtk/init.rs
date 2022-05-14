/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::monaco::*;
use crate::js_object;
use crate::utils::*;

use super::completions::*;
use super::language::*;

use js_intern::*;
use js_sys::*;
use serde_json::error;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

/// Initializes the `plang` language definition using Monaco's `Languages`
/// module.
pub async fn init_language() -> Result<Editor, error::Error> {
    let module = monaco_module().await.unchecked_into::<MonacoModule>();
    let languages = module.languages();
    let editor = module.editor();
    languages.register(REGISTER.with(|x| JsValue::from_serde(&x))?);
    let tokenizer = TOKENIZER.with(|x| JsValue::from_serde(&x))?;
    languages.set_monarch_tokens_provider("exprtk", tokenizer);
    let lang_config = LANGUAGE_CONFIG.with(|x| JsValue::from_serde(&x))?;
    languages.set_language_configuration("exprtk", lang_config);
    let provider = get_completions.into_closure();
    let items = js_object!(
        "provideCompletionItems", provider.as_ref();
        "triggerCharacters", [JsValue::from("\"")].iter().collect::<Array>();
    );

    provider.forget();
    languages.register_completion_item_provider("exprtk", items.into());
    Ok(editor)
}

/// Sets the theme arguments globally, which should be fine since it is modal.
///
/// # Arguments
/// * `theme` - the `monaco-editor` theme base to use.
pub fn init_theme(theme: &str, editor: &Editor) {
    let args = DefineThemeArgs {
        base: theme,
        inherit: true,
        rules: vec![],
    };

    let theme_args = JsValue::from_serde(&args).unwrap();
    editor.define_theme("exprtk-theme", theme_args)
}

/// Initializes the `MonacoEnvironment` global definition, which the monaco
/// library uses to resolve its Web Workers and features.
pub async fn init_environment() -> Result<(), error::Error> {
    let worker = new_worker().await;
    let closure = Closure::once_into_js(move |_: JsValue| worker);
    let monaco_env = js_object!("getWorker", closure);
    let window = web_sys::window().unwrap();
    Reflect::set(&window, js_intern!("MonacoEnvironment"), &monaco_env).unwrap();
    Ok(())
}
