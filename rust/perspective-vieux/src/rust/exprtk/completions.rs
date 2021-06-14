/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::monaco::*;

use super::language::*;

use js_intern::*;
use wasm_bindgen::prelude::*;

/// This helper _must_ create the `JsValue` anew on each call, or it causes strange
/// & subtle bugs in monaco.
/// https://github.com/microsoft/monaco-editor/issues/1510
pub fn get_completions(
    model: MonacoModel,
    position: MonacoPosition,
    token: MonacoTriggerToken,
) -> JsValue {
    // Test the token stream until the cursor to distinguish opening from closing
    // quotes - otherwise the column completion popup will occur at the end of a column
    // name also.
    let tokens = model.get_line_tokens(position.line_number());
    let token_index = tokens.find_token_index_at_offset(position.column());
    let prev_token_type = tokens.get_class_name(token_index) == *js_intern!("mtk23");

    // `trigger_kind` matches the `triggerCharacter` we set above.
    if token.trigger_kind() == 1 {
        if prev_token_type {
            JsValue::UNDEFINED
        } else {
            COMPLETION_COLUMN_NAMES.with(|cols| {
                JsValue::from_serde(&RegisterCompletionItemSuggestions {
                    suggestions: cols
                        .borrow()
                        .iter()
                        .map(|col| CompletionItemSuggestion {
                            label: format!("\"{}\"", col),
                            kind: 14, //Constant
                            insert_text: format!("{}\"", col),
                            insert_text_rules: 4,
                            documentation: format!("The values of column \"{}\"", col),
                        })
                        .collect::<Vec<CompletionItemSuggestion>>(),
                })
                .unwrap()
            })
        }
    } else {
        COMPLETIONS.with(|x| JsValue::from_serde(x)).unwrap()
    }
}
