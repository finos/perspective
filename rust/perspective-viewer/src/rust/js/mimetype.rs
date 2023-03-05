////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::fmt::Display;

use wasm_bindgen::prelude::*;

#[derive(Clone, Copy, Eq, PartialEq)]
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
            Self::TextPlain => "text/plain",
            Self::ImagePng => "image/png",
        })
    }
}
