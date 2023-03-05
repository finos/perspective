////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::io::{Read, Write};
use std::str::FromStr;

use flate2::read::ZlibDecoder;
use flate2::write::ZlibEncoder;
use flate2::Compression;
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use super::view_config::*;
use crate::utils::*;

pub enum ViewerConfigEncoding {
    Json,
    String,
    ArrayBuffer,
    JSONString,
}

impl FromStr for ViewerConfigEncoding {
    type Err = JsValue;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "json" => Ok(Self::Json),
            "string" => Ok(Self::String),
            "arraybuffer" => Ok(Self::ArrayBuffer),
            x => Err(format!("Unknown format \"{}\"", x).into()),
        }
    }
}

/// The state of an entire `custom_elements::PerspectiveViewerElement` component
/// and its `Plugin`.
#[derive(Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct ViewerConfig {
    pub plugin: String,
    pub plugin_config: Value,
    pub settings: bool,
    pub theme: Option<String>,
    pub title: Option<String>,

    #[serde(flatten)]
    pub view_config: ViewConfig,
}

impl ViewerConfig {
    /// Encode a `ViewerConfig` to a `JsValue` in a supported type.
    pub fn encode(&self, format: &Option<ViewerConfigEncoding>) -> ApiResult<JsValue> {
        match format {
            Some(ViewerConfigEncoding::String) => {
                let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
                let bytes = rmp_serde::to_vec(self)?;
                encoder.write_all(&bytes)?;
                let encoded = encoder.finish()?;
                Ok(JsValue::from(base64::encode(encoded)))
            }
            Some(ViewerConfigEncoding::ArrayBuffer) => {
                let array = js_sys::Uint8Array::from(&rmp_serde::to_vec(self).unwrap()[..]);
                let start = array.byte_offset();
                let len = array.byte_length();
                Ok(array
                    .buffer()
                    .slice_with_end(start, start + len)
                    .unchecked_into())
            }
            Some(ViewerConfigEncoding::JSONString) => {
                Ok(JsValue::from(serde_json::to_string(self)?))
            }
            None | Some(ViewerConfigEncoding::Json) => Ok(JsValue::from_serde_ext(self)?),
        }
    }
}

#[derive(Clone, Deserialize)]
// #[serde(deny_unknown_fields)]
pub struct ViewerConfigUpdate {
    #[serde(default)]
    pub plugin: PluginUpdate,

    #[serde(default)]
    pub title: TitleUpdate,

    #[serde(default)]
    pub theme: ThemeUpdate,

    #[serde(default)]
    pub settings: SettingsUpdate,

    #[serde(default)]
    pub plugin_config: Option<Value>,

    #[serde(flatten)]
    pub view_config: ViewConfigUpdate,
}

impl ViewerConfigUpdate {
    /// Decode a `JsValue` into a `ViewerConfigUpdate` by auto-detecting format
    /// from JavaScript type.
    pub fn decode(update: &JsValue) -> ApiResult<Self> {
        if update.is_string() {
            let js_str = update.as_string().into_apierror()?;
            let bytes = base64::decode(js_str)?;
            let mut decoder = ZlibDecoder::new(&*bytes);
            let mut decoded = vec![];
            decoder.read_to_end(&mut decoded)?;
            Ok(rmp_serde::from_slice(&decoded)?)
        } else if update.is_instance_of::<js_sys::ArrayBuffer>() {
            let uint8array = js_sys::Uint8Array::new(update);
            let mut slice = vec![0; uint8array.length() as usize];
            uint8array.copy_to(&mut slice[..]);
            Ok(rmp_serde::from_slice(&slice)?)
        } else {
            Ok(update.into_serde_ext()?)
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(untagged)]
pub enum OptionalUpdate<T: Clone> {
    SetDefault,
    Missing,
    Update(T),
}

pub type PluginUpdate = OptionalUpdate<String>;
pub type SettingsUpdate = OptionalUpdate<bool>;
pub type ThemeUpdate = OptionalUpdate<String>;
pub type TitleUpdate = OptionalUpdate<String>;

/// Handles `{}` when included as a field with `#[serde(default)]`.
impl<T: Clone> Default for OptionalUpdate<T> {
    fn default() -> Self {
        Self::Missing
    }
}

/// Handles `{plugin: null}` and `{plugin: val}` by treating this type as an
/// option.
impl<T: Clone> From<Option<T>> for OptionalUpdate<T> {
    fn from(opt: Option<T>) -> Self {
        match opt {
            Some(v) => Self::Update(v),
            None => Self::SetDefault,
        }
    }
}

/// Treats `PluginUpdate` enum as an `Option<T>` when present during
/// deserialization.
impl<'a, T> Deserialize<'a> for OptionalUpdate<T>
where
    T: Deserialize<'a> + Clone,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'a>,
    {
        Option::deserialize(deserializer).map(Into::into)
    }
}
