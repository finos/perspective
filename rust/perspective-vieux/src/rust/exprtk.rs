/////////////////////////////////////////////////////////, kind: (), insert_text: (), insert_text_rules: (), documentation: () ///////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use js_intern::*;
use js_sys::Reflect;
use serde_json::error;
use std::cell::Cell;
use wasm_bindgen::{JsCast, prelude::*};

use crate::js_object;
use crate::utils::monaco::*;

thread_local! {

    static IS_REGISTERED: Cell<bool> = Cell::new(false);

    static REGISTER: RegisterArgs = RegisterArgs { id: "exprtk" };

    static TOKENIZER: MonarchTokensProviderArgs<'static> = MonarchTokensProviderArgs {
        tokenizer: MonarchTokenizer {
            root: vec![
                vec!["\\/\\/.*", "comment"],
                vec!["[a-zA-Z_]+?", "variable"],
                vec!["\".+?\"", "string"],
                vec!["\'.+?\'", "string"],
                vec!["[0-9]", "number"],
                vec!["[\\[\\]\\{\\}\\(\\)]", "delimiter"],
            ],
        },
    };

    static COMPLETIONS: RegisterCompletionItemSuggestions = RegisterCompletionItemSuggestions {
        suggestions: vec![
            CompletionItemSuggestion {
                label: "abs",
                kind: 1,
                insert_text: "abs(${1:x})",
                insert_text_rules: 4,
                documentation: "Absolute value of x",
            },
            CompletionItemSuggestion {
                label: "avg",
                kind: 1,
                insert_text: "avg(${1:x})",
                insert_text_rules: 4,
                documentation: "Average of all inputs",
            },
            CompletionItemSuggestion {
                label: "bucket",
                kind: 1,
                insert_text: "bucket(${1:x})",
                insert_text_rules: 4,
                documentation: "Bucket x by y",
            },
            CompletionItemSuggestion {
                label: "ceil",
                kind: 1,
                insert_text: "ceil(${1:x})",
                insert_text_rules: 4,
                documentation: "Smallest integer >= x",
            },
            CompletionItemSuggestion {
                label: "exp",
                kind: 1,
                insert_text: "exp(${1:x})",
                insert_text_rules: 4,
                documentation: "Natural exponent of x (e ^ x)",
            },
            CompletionItemSuggestion {
                label: "floor",
                kind: 1,
                insert_text: "floor(${1:x})",
                insert_text_rules: 4,
                documentation: "Largest integer <= x",
            },
            CompletionItemSuggestion {
                label: "frac",
                kind: 1,
                insert_text: "frac(${1:x})",
                insert_text_rules: 4,
                documentation: "Fractional portion (after the decimal) of x",
            },
            CompletionItemSuggestion {
                label: "iclamp",
                kind: 1,
                insert_text: "iclamp(${1:x})",
                insert_text_rules: 4,
                documentation: "Inverse clamp x within a range",
            },
            CompletionItemSuggestion {
                label: "inrange",
                kind: 1,
                insert_text: "inrange(${1:x})",
                insert_text_rules: 4,
                documentation: "Returns whether x is within a range",
            },
            CompletionItemSuggestion {
                label: "log",
                kind: 1,
                insert_text: "log(${1:x})",
                insert_text_rules: 4,
                documentation: "Natural log of x",
            },
            CompletionItemSuggestion {
                label: "log10",
                kind: 1,
                insert_text: "log10(${1:x})",
                insert_text_rules: 4,
                documentation: "Base 10 log of x",
            },
            CompletionItemSuggestion {
                label: "log1p",
                kind: 1,
                insert_text: "log1p(${1:x})",
                insert_text_rules: 4,
                documentation: "Natural log of 1 + x where x is very small",
            },
            CompletionItemSuggestion {
                label: "log2",
                kind: 1,
                insert_text: "log2(${1:x})",
                insert_text_rules: 4,
                documentation: "Base 2 log of x",
            },
            CompletionItemSuggestion {
                label: "logn",
                kind: 1,
                insert_text: "logn(${1:x})",
                insert_text_rules: 4,
                documentation: "Base N log of x where N >= 0",
            },
            CompletionItemSuggestion {
                label: "max",
                kind: 1,
                insert_text: "max(${1:x})",
                insert_text_rules: 4,
                documentation: "Maximum value of all inputs",
            },
            CompletionItemSuggestion {
                label: "min",
                kind: 1,
                insert_text: "min(${1:x})",
                insert_text_rules: 4,
                documentation: "Minimum value of all inputs",
            },
            CompletionItemSuggestion {
                label: "mul",
                kind: 1,
                insert_text: "mul(${1:x})",
                insert_text_rules: 4,
                documentation: "Product of all inputs",
            },
            CompletionItemSuggestion {
                label: "percent_of",
                kind: 1,
                insert_text: "percent_of(${1:x})",
                insert_text_rules: 4,
                documentation: "Percent y of x",
            },
            CompletionItemSuggestion {
                label: "pow",
                kind: 1,
                insert_text: "pow(${1:x})",
                insert_text_rules: 4,
                documentation: "x to the power of y",
            },
            CompletionItemSuggestion {
                label: "root",
                kind: 1,
                insert_text: "root(${1:x})",
                insert_text_rules: 4,
                documentation: "N-th root of x where N >= 0",
            },
            CompletionItemSuggestion {
                label: "round",
                kind: 1,
                insert_text: "round(${1:x})",
                insert_text_rules: 4,
                documentation: "Round x to the nearest integer",
            },
            CompletionItemSuggestion {
                label: "sgn",
                kind: 1,
                insert_text: "sgn(${1:x})",
                insert_text_rules: 4,
                documentation: "Sign of x: -1, 1, or 0",
            },
            CompletionItemSuggestion {
                label: "sqrt",
                kind: 1,
                insert_text: "sqrt(${1:x})",
                insert_text_rules: 4,
                documentation: "Square root of x",
            },
            CompletionItemSuggestion {
                label: "sum",
                kind: 1,
                insert_text: "sum(${1:x})",
                insert_text_rules: 4,
                documentation: "Sum of all inputs",
            },
            CompletionItemSuggestion {
                label: "trunc",
                kind: 1,
                insert_text: "trunc(${1:x})",
                insert_text_rules: 4,
                documentation: "Integer portion of x",
            },
            CompletionItemSuggestion {
                label: "acos",
                kind: 1,
                insert_text: "acos(${1:x})",
                insert_text_rules: 4,
                documentation: "Arc cosine of x in radians",
            },
            CompletionItemSuggestion {
                label: "acosh",
                kind: 1,
                insert_text: "acosh(${1:x})",
                insert_text_rules: 4,
                documentation: "Inverse hyperbolic cosine of x in radians",
            },
            CompletionItemSuggestion {
                label: "asin",
                kind: 1,
                insert_text: "asin(${1:x})",
                insert_text_rules: 4,
                documentation: "Arc sine of x in radians",
            },
            CompletionItemSuggestion {
                label: "asinh",
                kind: 1,
                insert_text: "asinh(${1:x})",
                insert_text_rules: 4,
                documentation: "Inverse hyperbolic sine of x in radians",
            },
            CompletionItemSuggestion {
                label: "atan",
                kind: 1,
                insert_text: "atan(${1:x})",
                insert_text_rules: 4,
                documentation: "Arc tangent of x in radians",
            },
            CompletionItemSuggestion {
                label: "atanh",
                kind: 1,
                insert_text: "atanh(${1:x})",
                insert_text_rules: 4,
                documentation: "Inverse hyperbolic tangent of x in radians",
            },
            CompletionItemSuggestion {
                label: "cos",
                kind: 1,
                insert_text: "cos(${1:x})",
                insert_text_rules: 4,
                documentation: "Cosine of x",
            },
            CompletionItemSuggestion {
                label: "cosh",
                kind: 1,
                insert_text: "cosh(${1:x})",
                insert_text_rules: 4,
                documentation: "Hyperbolic cosine of x",
            },
            CompletionItemSuggestion {
                label: "cot",
                kind: 1,
                insert_text: "cot(${1:x})",
                insert_text_rules: 4,
                documentation: "Cotangent of x",
            },
            CompletionItemSuggestion {
                label: "sin",
                kind: 1,
                insert_text: "sin(${1:x})",
                insert_text_rules: 4,
                documentation: "Sine of x",
            },
            CompletionItemSuggestion {
                label: "sinc",
                kind: 1,
                insert_text: "sinc(${1:x})",
                insert_text_rules: 4,
                documentation: "Sine cardinal of x",
            },
            CompletionItemSuggestion {
                label: "sinh",
                kind: 1,
                insert_text: "sinh(${1:x})",
                insert_text_rules: 4,
                documentation: "Hyperbolic sine of x",
            },
            CompletionItemSuggestion {
                label: "tan",
                kind: 1,
                insert_text: "tan(${1:x})",
                insert_text_rules: 4,
                documentation: "Tangent of x",
            },
            CompletionItemSuggestion {
                label: "tanh",
                kind: 1,
                insert_text: "tanh(${1:x})",
                insert_text_rules: 4,
                documentation: "Hyperbolic tangent of x",
            },
            CompletionItemSuggestion {
                label: "deg2rad",
                kind: 1,
                insert_text: "deg2rad(${1:x})",
                insert_text_rules: 4,
                documentation: "Convert x from degrees to radians",
            },
            CompletionItemSuggestion {
                label: "deg2grad",
                kind: 1,
                insert_text: "deg2grad(${1:x})",
                insert_text_rules: 4,
                documentation: "Convert x from degrees to gradians",
            },
            CompletionItemSuggestion {
                label: "rad2deg",
                kind: 1,
                insert_text: "rad2deg(${1:x})",
                insert_text_rules: 4,
                documentation: "Convert x from radians to degrees",
            },
            CompletionItemSuggestion {
                label: "grad2deg",
                kind: 1,
                insert_text: "grad2deg(${1:x})",
                insert_text_rules: 4,
                documentation: "Convert x from gradians to degrees",
            },
            CompletionItemSuggestion {
                label: "concat",
                kind: 1,
                insert_text: "concat(${1:x})",
                insert_text_rules: 4,
                documentation: "Concatenate string literals and columns",
            },
            CompletionItemSuggestion {
                label: "order",
                kind: 1,
                insert_text: "order(${1:x})",
                insert_text_rules: 4,
                documentation: "Generates a sort order for a string column based on input order",
            },
            CompletionItemSuggestion {
                label: "upper",
                kind: 1,
                insert_text: "upper(${1:x})",
                insert_text_rules: 4,
                documentation: "Uppercase of x",
            },
            CompletionItemSuggestion {
                label: "lower",
                kind: 1,
                insert_text: "lower(${1:x})",
                insert_text_rules: 4,
                documentation: "Lowercase of x",
            },
            CompletionItemSuggestion {
                label: "month_of_year",
                kind: 1,
                insert_text: "month_of_year(${1:x})",
                insert_text_rules: 4,
                documentation: "Return a datetime's month of the year as a string",
            },
            CompletionItemSuggestion {
                label: "day_of_week",
                kind: 1,
                insert_text: "day_of_week(${1:x})",
                insert_text_rules: 4,
                documentation: "Return a datetime's day of week as a string",
            },
            CompletionItemSuggestion {
                label: "now",
                kind: 1,
                insert_text: "now(${1:x})",
                insert_text_rules: 4,
                documentation: "The current datetime in local time",
            },
            CompletionItemSuggestion {
                label: "today",
                kind: 1,
                insert_text: "today(${1:x})",
                insert_text_rules: 4,
                documentation: "The current date in local time",
            },
            CompletionItemSuggestion {
                label: "is_null",
                kind: 1,
                insert_text: "is_null(${1:x})",
                insert_text_rules: 4,
                documentation: "Whether x is null",
            },
            CompletionItemSuggestion {
                label: "is_not_null",
                kind: 1,
                insert_text: "is_not_null(${1:x})",
                insert_text_rules: 4,
                documentation: "Whether x is not null",
            },
            CompletionItemSuggestion {
                label: "not",
                kind: 1,
                insert_text: "not(${1:x})",
                insert_text_rules: 4,
                documentation: "not x",
            },
            CompletionItemSuggestion {
                label: "true",
                kind: 1,
                insert_text: "true(${1:x})",
                insert_text_rules: 4,
                documentation: "Boolean value true",
            },
            CompletionItemSuggestion {
                label: "false",
                kind: 1,
                insert_text: "false(${1:x})",
                insert_text_rules: 4,
                documentation: "Boolean value false",
            },
            CompletionItemSuggestion {
                label: "if else",
                kind: 1,
                insert_text: "if else(${1:x})",
                insert_text_rules: 4,
                documentation: "if/else conditional",
            },
            CompletionItemSuggestion {
                label: "for",
                kind: 1,
                insert_text: "for(${1:x})",
                insert_text_rules: 4,
                documentation: "For loop",
            },
        ]
    };

    static THEME: DefineThemeArgs<'static> = DefineThemeArgs {
        base: "vs",
        inherit: true,
        rules: vec![
            // DefineThemeToken {
            //     token: "exprtk-comment",
            //     foreground: "#007700",
            //     font_style: None,
            // },
            // DefineThemeToken {
            //     token: "exprtk-symbol",
            //     foreground: "#0000ff",
            //     font_style: None,
            // },
            // DefineThemeToken {
            //     token: "exprtk-column",
            //     foreground: "#990000",
            //     font_style: None,
            // },
        ],
    }
}

/// This helper _must_ create the `JsValue` anew on each call, or it causes strange
/// & subtle bugs in monaco.
/// https://github.com/microsoft/monaco-editor/issues/1510
fn get_suggestions() -> JsValue {
    COMPLETIONS.with(|x| JsValue::from_serde(x)).unwrap()
}

/// Initializes the `plang` language definition using Monaco's `Languages`
/// module.
async fn init_language() -> Result<Editor, error::Error> {
    let exts = monaco_exts();
    let module = monaco_module().await.unchecked_into::<MonacoModule>();
    let languages = module.languages();
    let editor = module.editor();
    languages.register(REGISTER.with(|x| JsValue::from_serde(&x))?);
    let tokenizer = TOKENIZER.with(|x| JsValue::from_serde(&x))?;
    languages.set_monarch_tokens_provider("exprtk", tokenizer);
    let provider = Closure::wrap(Box::new(get_suggestions) as Box<dyn Fn() -> JsValue>);
    let items = js_object!("provideCompletionItems", provider.as_ref()).into();
    provider.forget();
    languages.register_completion_item_provider("exprtk", items);
    editor.define_theme("exprtk-theme", THEME.with(|x| JsValue::from_serde(&x))?);
    exts.await;
    Ok(editor)
}

/// Initializes the `MonacoEnvironment` global definition, which the monaco library
/// uses to resolve its Web Workers and features.
fn init_environment() -> Result<(), error::Error> {
    let monaco_env = js_object!("getWorker", Closure::once_into_js(EditorWorker::new));
    let window = web_sys::window().unwrap();
    Reflect::set(&window, js_intern!("MonacoEnvironment"), &monaco_env).unwrap();
    Ok(())
}

/// Initialize the `ExprTK` language in `monaco`.  This should only be done once.
pub async fn init_monaco() -> Result<Editor, error::Error> {
    if IS_REGISTERED.with(|x| !x.get()) {
        let editor = init_language().await?;
        init_environment()?;
        IS_REGISTERED.with(|x| x.set(true));
        Ok(editor)
    } else {
        Ok(monaco_module().await.unchecked_into::<MonacoModule>().editor())
    }
}
