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

use yew::prelude::*;

/// Lowercases `key` and folds every other character to `-`, producing the
/// middle segment of a `--psp-label--{slug}--content` intl variable name.
pub fn intl_slug(key: &str) -> String {
    key.chars()
        .map(|x| {
            if x.is_ascii_alphanumeric() {
                x.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect()
}

fn humanize(key: &str) -> String {
    let mut out = String::with_capacity(key.len());
    for x in key.chars() {
        if x.is_alphanumeric() {
            if out.is_empty() {
                out.extend(x.to_uppercase());
            } else {
                out.push(x);
            }
        } else if matches!(x, '_' | '-') || x.is_whitespace() {
            out.push(' ');
        }
    }

    out
}

/// The inline `style` that routes an element's `:before` text through the intl
/// indirection: `--psp-label--content` is set to a reference to
/// `--psp-label--{var}--content`, falling back to `fallback`, and a generic
/// stylesheet rule renders it.
pub fn intl_content_style(var: &str, fallback: &str) -> String {
    format!("--psp-label--content: var(--psp-label--{var}--content, \"{fallback}\")")
}

#[derive(Properties, PartialEq)]
pub struct IntlLabelProps {
    pub name: String,

    #[prop_or_default]
    pub group: bool,

    #[prop_or_default]
    pub class: Classes,
}

/// A `<label>` whose text is the intl string for a schema key.
#[function_component(IntlLabel)]
pub fn intl_label(props: &IntlLabelProps) -> Html {
    let slug = intl_slug(&props.name);
    let (id, var) = if props.group {
        (
            format!("{}-group-label", props.name),
            format!("group-{slug}"),
        )
    } else {
        (format!("{}-label", props.name), slug)
    };

    let style = intl_content_style(&var, &humanize(&props.name));
    let class = classes!("intl-label", props.class.clone());
    html! { <label {class} {id} {style} /> }
}
