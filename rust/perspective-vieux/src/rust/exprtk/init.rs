/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js_object;
use crate::utils::monaco::*;
use crate::utils::*;

use super::language::*;
use super::completions::*;

use js_intern::*;
use js_sys::Reflect;
use serde_json::error;
use std::iter::FromIterator;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

/// Initializes the `plang` language definition using Monaco's `Languages`
/// module.
/// 
/// # Arguments
/// * `base` - the `monaco-editor` theme base to use.
pub async fn init_language(base: &str) -> Result<Editor, error::Error> {
    let exts = monaco_exts();
    let module = monaco_module().await.unchecked_into::<MonacoModule>();
    let languages = module.languages();
    let editor = module.editor();
    languages.register(REGISTER.with(|x| JsValue::from_serde(&x))?);
    let tokenizer = TOKENIZER.with(|x| JsValue::from_serde(&x))?;
    languages.set_monarch_tokens_provider("exprtk", tokenizer);
    let lang_config = LANGUAGE_CONFIG.with(|x| JsValue::from_serde(&x))?;
    languages.set_language_configuration("exprtk", lang_config);
    let provider = get_completions.to_closure();
    let items = js_object!(
        "provideCompletionItems", provider.as_ref();
        "triggerCharacters", js_sys::Array::from_iter([JsValue::from("\"")].iter());
    );

    provider.forget();
    languages.register_completion_item_provider("exprtk", items.into());
    editor.define_theme(
        "exprtk-theme",
        JsValue::from_serde(&DefineThemeArgs {
            base,
            inherit: true,
            rules: vec![],
        })?,
    );

    exts.await;
    Ok(editor)
}

/// Initializes the `MonacoEnvironment` global definition, which the monaco library
/// uses to resolve its Web Workers and features.
pub fn init_environment() -> Result<(), error::Error> {
    let monaco_env = js_object!("getWorker", Closure::once_into_js(EditorWorker::new));
    let window = web_sys::window().unwrap();
    Reflect::set(&window, js_intern!("MonacoEnvironment"), &monaco_env).unwrap();
    Ok(())
}

