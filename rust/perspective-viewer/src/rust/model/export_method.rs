////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::*;
use std::rc::Rc;
use yew::prelude::*;

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
        match self.method {
            ExportMethod::Csv => format!("{}.csv", self.name),
            ExportMethod::CsvAll => format!("{}.all.csv", self.name),
            ExportMethod::Json => format!("{}.json", self.name),
            ExportMethod::JsonAll => format!("{}.all.json", self.name),
            ExportMethod::Html => format!("{}.html", self.name),
            ExportMethod::Png => format!("{}.png", self.name),
            ExportMethod::Arrow => format!("{}.arrow", self.name),
            ExportMethod::ArrowAll => format!("{}.all.arrow", self.name),
            ExportMethod::JsonConfig => format!("{}.config.json", self.name),
        }
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
            <code class={ class }>{ x.to_filename() }</code>
        }
    }
}
