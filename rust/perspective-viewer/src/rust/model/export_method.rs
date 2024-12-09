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

use crate::js::*;

#[derive(Clone, Copy, Eq, PartialEq)]
pub enum ExportMethod {
    Csv,
    CsvAll,
    CsvSelected,
    Json,
    JsonAll,
    JsonSelected,
    Ndjson,
    NdjsonAll,
    NdjsonSelected,
    Html,
    Png,
    Arrow,
    ArrowSelected,
    ArrowAll,
    JsonConfig,
}

impl ExportMethod {
    pub const fn as_filename(&self) -> &'static str {
        match self {
            Self::Csv => ".csv",
            Self::CsvAll => ".all.csv",
            Self::Json => ".json",
            Self::JsonAll => ".all.json",
            Self::Html => ".html",
            Self::Png => ".png",
            Self::Arrow => ".arrow",
            Self::ArrowAll => ".all.arrow",
            Self::JsonConfig => ".config.json",
            Self::CsvSelected => ".selected.csv",
            Self::JsonSelected => ".selected.json",
            Self::ArrowSelected => ".selected.arrow",
            Self::Ndjson => ".ndjson",
            Self::NdjsonAll => ".all.ndjson",
            Self::NdjsonSelected => ".selected.ndjson",
        }
    }

    pub const fn mimetype(&self) -> MimeType {
        match self {
            Self::Png => MimeType::ImagePng,
            _ => MimeType::TextPlain,
        }
    }
}

impl From<ExportMethod> for Html {
    fn from(x: ExportMethod) -> Self {
        html! { <code>{ x.as_filename() }</code> }
    }
}

impl ExportMethod {
    pub fn new_file(&self, x: &str) -> ExportFile {
        ExportFile {
            name: Rc::new(x.to_owned()),
            method: *self,
        }
    }
}

#[derive(Clone, Eq, PartialEq)]
pub struct ExportFile {
    pub name: Rc<String>,
    pub method: ExportMethod,
}

impl ExportFile {
    pub fn as_filename(&self) -> String {
        format!("{}{}", self.name, self.method.as_filename())
    }
}

impl From<ExportFile> for Html {
    fn from(x: ExportFile) -> Self {
        let class = if x.name.is_empty() {
            Some("invalid")
        } else {
            None
        };

        html! { <code {class}>{ x.name }{ x.method.as_filename() }</code> }
    }
}
