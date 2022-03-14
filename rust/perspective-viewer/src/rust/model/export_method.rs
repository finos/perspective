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
        Self::TextPlain
    }
}

impl From<MimeType> for JsValue {
    fn from(x: MimeType) -> Self {
        Self::from(format!("{}", x))
    }
}

impl Display for MimeType {
    fn fmt(&self, fmt: &mut std::fmt::Formatter<'_>) -> std::result::Result<(), std::fmt::Error> {
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
        html! {
            <code>{ x.as_filename() }</code>
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

        html_template! {
            <code class={ class }>
                { x.name }
                { x.method.as_filename() }
            </code>
        }
    }
}
