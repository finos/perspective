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

use extend::ext;
use js_sys::{Array, ArrayBuffer, Function, JSON, Object, Reflect, Uint8Array};
use perspective_client::{ColumnType, TableData, TableReadFormat, UpdateData};
use wasm_bindgen::convert::TryFromJsValue;
use wasm_bindgen::prelude::*;

use crate::apierror;
use crate::utils::{ApiError, ApiResult, JsValueSerdeExt, ToApiError};
pub use crate::view::*;

#[ext]
impl Vec<(String, ColumnType)> {
    fn from_js_value(value: &JsValue) -> ApiResult<Vec<(String, ColumnType)>> {
        Ok(Object::keys(value.unchecked_ref())
            .iter()
            .map(|x| -> Result<_, JsValue> {
                let key = x.as_string().into_apierror()?;
                let val = Reflect::get(value, &x)?
                    .as_string()
                    .into_apierror()?
                    .into_serde_ext()?;

                Ok((key, val))
            })
            .collect::<Result<Vec<_>, _>>()?)
    }
}

#[ext]
pub(crate) impl TableData {
    fn from_js_value(value: &JsValue, format: Option<TableReadFormat>) -> ApiResult<TableData> {
        if let Some(result) = UpdateData::from_js_value_partial(value, format)? {
            Ok(result.into())
        } else if value.is_instance_of::<Object>() && Reflect::has(value, &"__get_model".into())? {
            let val = Reflect::get(value, &"__get_model".into())?
                .dyn_into::<Function>()?
                .call0(value)?;

            let view = View::try_from_js_value(val)?;
            Ok(TableData::View(view.0))
        } else if value.is_instance_of::<Object>() {
            let all_strings = || {
                Object::values(value.unchecked_ref())
                    .to_vec()
                    .iter()
                    .all(|x| x.is_string())
            };

            let all_arrays = || {
                Object::values(value.unchecked_ref())
                    .to_vec()
                    .iter()
                    .all(|x| x.is_instance_of::<Array>())
            };

            if all_strings() {
                Ok(TableData::Schema(Vec::from_js_value(value)?))
            } else if all_arrays() {
                let json = JSON::stringify(value)?.as_string().into_apierror()?;
                Ok(UpdateData::JsonColumns(json).into())
            } else {
                Err(apierror!(TableError(value.clone())))
            }
        } else {
            Err(apierror!(TableError(value.clone())))
        }
    }
}

#[ext]
pub(crate) impl UpdateData {
    fn from_js_value_partial(
        value: &JsValue,
        format: Option<TableReadFormat>,
    ) -> ApiResult<Option<UpdateData>> {
        if value.is_undefined() {
            Err(apierror!(TableError(value.clone())))
        } else if value.is_string() {
            match format {
                None | Some(TableReadFormat::Csv) => {
                    Ok(Some(UpdateData::Csv(value.as_string().into_apierror()?)))
                },
                Some(TableReadFormat::JsonString) => Ok(Some(UpdateData::JsonRows(
                    value.as_string().into_apierror()?,
                ))),
                Some(TableReadFormat::ColumnsString) => Ok(Some(UpdateData::JsonColumns(
                    value.as_string().into_apierror()?,
                ))),
                Some(TableReadFormat::Arrow) => Ok(Some(UpdateData::Arrow(
                    value.as_string().into_apierror()?.into_bytes().into(),
                ))),
                Some(TableReadFormat::Ndjson) => {
                    Ok(Some(UpdateData::Ndjson(value.as_string().into_apierror()?)))
                },
            }
        } else if value.is_instance_of::<ArrayBuffer>() {
            let uint8array = Uint8Array::new(value);
            let slice = uint8array.to_vec();
            match format {
                Some(TableReadFormat::Csv) => Ok(Some(UpdateData::Csv(String::from_utf8(slice)?))),
                Some(TableReadFormat::JsonString) => {
                    Ok(Some(UpdateData::JsonRows(String::from_utf8(slice)?)))
                },
                Some(TableReadFormat::ColumnsString) => {
                    Ok(Some(UpdateData::JsonColumns(String::from_utf8(slice)?)))
                },
                Some(TableReadFormat::Ndjson) => {
                    Ok(Some(UpdateData::Ndjson(String::from_utf8(slice)?)))
                },
                None | Some(TableReadFormat::Arrow) => Ok(Some(UpdateData::Arrow(slice.into()))),
            }
        } else if let Some(uint8array) = value.dyn_ref::<Uint8Array>() {
            let slice = uint8array.to_vec();
            match format {
                Some(TableReadFormat::Csv) => Ok(Some(UpdateData::Csv(String::from_utf8(slice)?))),
                Some(TableReadFormat::JsonString) => {
                    Ok(Some(UpdateData::JsonRows(String::from_utf8(slice)?)))
                },
                Some(TableReadFormat::ColumnsString) => {
                    Ok(Some(UpdateData::JsonColumns(String::from_utf8(slice)?)))
                },
                Some(TableReadFormat::Ndjson) => {
                    Ok(Some(UpdateData::Ndjson(String::from_utf8(slice)?)))
                },
                None | Some(TableReadFormat::Arrow) => Ok(Some(UpdateData::Arrow(slice.into()))),
            }
        } else if value.is_instance_of::<Array>() {
            let rows = JSON::stringify(value)?.as_string().into_apierror()?;
            Ok(Some(UpdateData::JsonRows(rows)))
        } else {
            Ok(None)
        }
    }

    fn from_js_value(value: &JsValue, format: Option<TableReadFormat>) -> ApiResult<UpdateData> {
        match TableData::from_js_value(value, format)? {
            TableData::Schema(_) => Err(ApiError::new(
                "Method cannot be called with `Schema` argument",
            )),
            TableData::Update(x) => Ok(x),
            TableData::View(_) => Err(ApiError::new(
                "Method cannot be called with `Schema` argument",
            )),
        }
    }
}
