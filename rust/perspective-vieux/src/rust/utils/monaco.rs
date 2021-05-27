////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use serde::Serialize;
use wasm_bindgen::prelude::*;
use web_sys::HtmlElement;

pub enum KeyMod {
    Shift = 1024
}

pub enum KeyCode {
    Enter = 3
}

#[cfg_attr(not(test), wasm_bindgen(module = "monaco-editor/esm/vs/editor/editor.worker"))]
#[cfg_attr(test, wasm_bindgen(inline_js = "export default function() {}"))]
extern "C" {
    #[wasm_bindgen(js_name = "default")]
    pub type EditorWorker;

    #[wasm_bindgen(constructor, js_class = "default")]
    pub fn new() -> EditorWorker;
}

#[cfg_attr(not(test), wasm_bindgen(module = "monaco-editor/esm/vs/editor/editor.api"))]
#[cfg_attr(test, wasm_bindgen(inline_js = "export function editor() {} export function languages() {}"))]
extern "C" {
    #[wasm_bindgen(js_name = editor)]
    pub type Editor;

    #[wasm_bindgen(static_method_of = Editor, js_class = "editor")]
    pub fn create(container: HtmlElement, options: JsValue) -> MonacoEditor;

    #[wasm_bindgen(static_method_of = Editor, js_class = "editor", js_name = "defineTheme")]
    pub fn define_theme(id: &str, options: JsValue);

    #[wasm_bindgen(js_name = languages)]
    pub type Languages;

    #[wasm_bindgen(static_method_of = Languages, js_class = "languages")]
    pub fn register(options: JsValue);

    #[wasm_bindgen(static_method_of = Languages, js_class = "languages", js_name = "setMonarchTokensProvider")]
    pub fn set_monarch_tokens_provider(id: &str, options: JsValue);

    #[wasm_bindgen(static_method_of = Languages, js_class = "languages", js_name = "registerCompletionItemProvider")]
    pub fn register_completion_item_provider(id: &str, options: JsValue);

    #[derive(Clone)]
    pub type MonacoEditor;

    #[wasm_bindgen(method, js_name = "getModel")]
    pub fn get_model(this: &MonacoEditor) -> MonacoModel;

    #[wasm_bindgen(method, js_name = "getValue")]
    pub fn get_value(this: &MonacoEditor) -> JsValue;

    #[wasm_bindgen(method, js_name = "setValue")]
    pub fn set_value(this: &MonacoEditor, value: &str);

    #[wasm_bindgen(method, js_name = "addCommand")]
    pub fn add_command(this: &MonacoEditor, key_code: u32, value: &js_sys::Function);

    // #[wasm_bindgen(method, js_name = "getValue")]
    // pub fn get_value_str(this: &MonacoEditor) -> String;

    #[wasm_bindgen(method)]
    pub fn focus(this: &MonacoEditor);

    pub type MonacoModel;

    #[wasm_bindgen(method, js_name = "onDidChangeContent")]
    pub fn on_did_change_content(this: &MonacoModel, callback: &js_sys::Function);
}

// Serde does not support closures and wasm_bindgen does not support anonymous object
// construction without `Reflect`, so this signature is not possible and is instead
// constructed manually.

// #[derive(Serialize)]
// #[serde(rename_all = "camelCase")]
// pub struct RegisterCompletionItemProviderArgs {
//     pub provider_completion_items: Closure< ... >,
// }

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterCompletionItemSuggestions {
    pub suggestions: Vec<CompletionItemSuggestion>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompletionItemSuggestion {
    pub label: &'static str,
    pub kind: u32,
    pub insert_text: &'static str,
    pub insert_text_rules: u32,
    pub documentation: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorArgs {
    pub theme: &'static str,
    pub value: &'static str,
    pub language: &'static str,
    pub automatic_layout: bool,
    pub minimap: MinimapArgs
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MinimapArgs {
    pub enabled: bool
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterArgs {
    pub id: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonarchTokensProviderArgs<'a> {
    pub tokenizer: MonarchTokenizer<'a>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonarchTokenizer<'a> {
    pub root: Vec<Vec<&'a str>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DefineThemeArgs<'a> {
    pub base: &'a str,
    pub inherit: bool,
    pub rules: Vec<DefineThemeToken<'a>>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DefineThemeToken<'a> {
    pub token: &'a str,
    pub foreground: &'a str,
    pub font_style: Option<&'a str>,
}
