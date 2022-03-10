////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::*;
use std::fmt::Display;
use std::rc::Rc;
use yew::prelude::*;

#[derive(Clone, Copy, PartialEq)]
pub enum MimeType {
    TextPlain,
    ImagePng,
}

impl Default for MimeType {
    fn default() -> Self {
        MimeType::TextPlain
    }
}

impl From<MimeType> for JsValue {
    fn from(x: MimeType) -> JsValue {
        JsValue::from(format!("{}", x))
    }
}

impl Display for MimeType {
    fn fmt(
        &self,
        fmt: &mut std::fmt::Formatter<'_>,
    ) -> std::result::Result<(), std::fmt::Error> {
        fmt.write_str(match self {
            MimeType::TextPlain => "text/plain",
            MimeType::ImagePng => "image/png",
        })
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum ExportMethod {
    Csv,
    CsvAll,
    Json,
    JsonAll,
    Html,
    Png,
    Arrow,
    ArrowAll,
    JsonConfig,
}

impl ExportMethod {
    pub fn to_filename(&self) -> &'static str {
        match self {
            ExportMethod::Csv => ".csv",
            ExportMethod::CsvAll => ".all.csv",
            ExportMethod::Json => ".json",
            ExportMethod::JsonAll => ".all.json",
            ExportMethod::Html => ".html",
            ExportMethod::Png => ".png",
            ExportMethod::Arrow => ".arrow",
            ExportMethod::ArrowAll => ".all.arrow",
            ExportMethod::JsonConfig => ".config.json",
        }
    }

    pub fn mimetype(&self) -> MimeType {
        match self {
            ExportMethod::Png => MimeType::ImagePng,
            _ => MimeType::TextPlain,
        }
    }
}

impl From<ExportMethod> for Html {
    fn from(x: ExportMethod) -> Html {
        html! {
            <code>{ x.to_filename() }</code>
        }
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

#[derive(Clone, PartialEq)]
pub struct ExportFile {
    pub name: Rc<String>,
    pub method: ExportMethod,
}

impl ExportFile {
    pub fn to_filename(&self) -> String {
        format!("{}{}", self.name, self.method.to_filename())
    }
}

impl From<ExportFile> for Html {
    fn from(x: ExportFile) -> Self {
        let class = if x.name.is_empty() {
            Some("invalid")
        } else {
            None
        };

        html_template! {
            <code class={ class }>
                { x.name }
                { x.method.to_filename() }
            </code>
        }
    }
}
