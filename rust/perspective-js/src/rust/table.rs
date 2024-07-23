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
use js_sys::{Array, ArrayBuffer, Function, Object, Reflect, Uint8Array, JSON};
use perspective_client::config::*;
use perspective_client::proto::*;
use perspective_client::*;
use wasm_bindgen::convert::TryFromJsValue;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

use crate::utils::{ApiError, ApiFuture, ApiResult, JsValueSerdeExt, LocalPollLoop, ToApiError};
pub use crate::view::*;
use crate::JsClient;

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
    fn from_js_value(value: &JsValue) -> ApiResult<TableData> {
        let err_fn = || JsValue::from(format!("Failed to construct Table {:?}", value));
        if let Some(result) = UpdateData::from_js_value_partial(value)? {
            Ok(result.into())
        } else if value.is_instance_of::<Object>() && Reflect::has(value, &"__get_model".into())? {
            let val = Reflect::get(value, &"__get_model".into())?
                .dyn_into::<Function>()?
                .call0(value)?;

            let view = JsView::try_from_js_value(val)?;
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
                Err(err_fn().into())
            }
        } else {
            Err(err_fn().into())
        }
    }
}

#[ext]
pub(crate) impl UpdateData {
    fn from_js_value_partial(value: &JsValue) -> ApiResult<Option<UpdateData>> {
        let err_fn = || JsValue::from(format!("Failed to construct Table {:?}", value));
        if value.is_undefined() {
            Err(err_fn().into())
        } else if value.is_string() {
            Ok(Some(UpdateData::Csv(value.as_string().into_apierror()?)))
        } else if value.is_instance_of::<ArrayBuffer>() {
            let uint8array = Uint8Array::new(value);
            let slice = uint8array.to_vec();
            Ok(Some(UpdateData::Arrow(slice.into())))
        } else if let Some(uint8array) = value.dyn_ref::<Uint8Array>() {
            let slice = uint8array.to_vec();
            Ok(Some(UpdateData::Arrow(slice.into())))
        } else if value.is_instance_of::<Array>() {
            let rows = JSON::stringify(value)?.as_string().into_apierror()?;
            Ok(Some(UpdateData::JsonRows(rows)))
        } else {
            Ok(None)
        }
    }

    fn from_js_value(value: &JsValue) -> ApiResult<UpdateData> {
        match TableData::from_js_value(value)? {
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

#[derive(Clone)]
#[wasm_bindgen]
pub struct JsTable(pub(crate) Table);

assert_table_api!(JsTable);

impl From<Table> for JsTable {
    fn from(value: Table) -> Self {
        JsTable(value)
    }
}

impl JsTable {
    pub fn get_table(&self) -> &'_ Table {
        &self.0
    }
}

#[wasm_bindgen]
extern "C" {
    // TODO Fix me
    #[wasm_bindgen(typescript_type = "\
        string | ArrayBuffer | Record<string, Array> | Record<string, unknown>[]")]
    pub type JsTableInitData;

    #[wasm_bindgen(typescript_type = "view_config_update.ViewConfigUpdate")]
    pub type JsViewConfig;

    #[wasm_bindgen(typescript_type = "update_options.UpdateOptions")]
    pub type JsUpdateOptions;
}

#[wasm_bindgen]
impl JsTable {
    #[wasm_bindgen]
    pub async fn get_index(&self) -> Option<String> {
        self.0.get_index()
    }

    #[wasm_bindgen]
    pub async fn get_client(&self) -> JsClient {
        JsClient {
            close: None,
            client: self.0.get_client(),
        }
    }

    #[wasm_bindgen]
    pub async fn get_limit(&self) -> Option<u32> {
        self.0.get_limit()
    }

    #[doc = include_str!("../../docs/table/clear.md")]
    #[wasm_bindgen]
    pub async fn clear(&self) -> ApiResult<()> {
        self.0.clear().await?;
        Ok(())
    }

    #[doc = include_str!("../../docs/table/delete.md")]
    #[wasm_bindgen]
    pub async fn delete(self) -> ApiResult<()> {
        self.0.delete().await?;
        Ok(())
    }

    #[doc = include_str!("../../docs/table/size.md")]
    #[wasm_bindgen]
    pub async fn size(&self) -> ApiResult<f64> {
        Ok(self.0.size().await? as f64)
    }

    #[doc = include_str!("../../docs/table/schema.md")]
    #[wasm_bindgen]
    pub async fn schema(&self) -> ApiResult<JsValue> {
        let schema = self.0.schema().await?;
        Ok(JsValue::from_serde_ext(&schema)?)
    }

    #[doc = include_str!("../../docs/table/columns.md")]
    #[wasm_bindgen]
    pub async fn columns(&self) -> ApiResult<JsValue> {
        let columns = self.0.columns().await?;
        Ok(JsValue::from_serde_ext(&columns)?)
    }

    #[doc = include_str!("../../docs/table/make_port.md")]
    #[wasm_bindgen]
    pub async fn make_port(&self) -> ApiResult<i32> {
        Ok(self.0.make_port().await?)
    }

    #[doc = include_str!("../../docs/table/on_delete.md")]
    #[wasm_bindgen]
    pub async fn on_delete(&self, on_delete: Function) -> ApiResult<u32> {
        let emit = LocalPollLoop::new(move |()| on_delete.call0(&JsValue::UNDEFINED));
        let on_delete = Box::new(move || spawn_local(emit.poll(())));
        Ok(self.0.on_delete(on_delete).await?)
    }

    #[doc = include_str!("../../docs/table/remove_delete.md")]
    #[wasm_bindgen]
    pub fn remove_delete(&self, callback_id: u32) -> ApiFuture<()> {
        let client = self.0.clone();
        ApiFuture::new(async move {
            client.remove_delete(callback_id).await?;
            Ok(())
        })
    }

    #[doc = include_str!("../../docs/table/replace.md")]
    #[wasm_bindgen]
    pub async fn remove(&self, value: &JsValue) -> ApiResult<()> {
        let input = UpdateData::from_js_value(value)?;
        self.0.remove(input).await?;
        Ok(())
    }

    #[doc = include_str!("../../docs/table/replace.md")]
    #[wasm_bindgen]
    pub async fn replace(&self, input: &JsValue) -> ApiResult<()> {
        let input = UpdateData::from_js_value(input)?;
        self.0.replace(input).await?;
        Ok(())
    }

    #[doc = include_str!("../../docs/table/update.md")]
    #[wasm_bindgen]
    pub async fn update(
        &self,
        input: &JsTableInitData,
        options: Option<JsUpdateOptions>,
    ) -> ApiResult<()> {
        let input = UpdateData::from_js_value(input)?;
        let options = options
            .into_serde_ext::<Option<UpdateOptions>>()?
            .unwrap_or_default();

        self.0.update(input, options).await?;
        Ok(())
    }

    #[doc = include_str!("../../docs/table/view.md")]
    #[wasm_bindgen]
    pub async fn view(&self, config: Option<JsViewConfig>) -> ApiResult<JsView> {
        let config = config
            .map(|config| js_sys::JSON::stringify(&config))
            .transpose()?
            .and_then(|x| x.as_string())
            .map(|x| serde_json::from_str(x.as_str()))
            .transpose()?;

        let view = self.0.view(config).await?;
        Ok(JsView(view))
    }

    #[doc = include_str!("../../docs/table/validate_expressions.md")]
    #[wasm_bindgen]
    pub async fn validate_expressions(&self, exprs: &JsValue) -> ApiResult<JsValue> {
        let exprs = JsValue::into_serde_ext::<Expressions>(exprs.clone())?;
        let columns = self.0.validate_expressions(exprs).await?;
        Ok(JsValue::from_serde_ext(&columns)?)
    }

    #[allow(clippy::use_self)]
    #[doc(hidden)]
    pub fn unsafe_get_model(&self) -> *const JsTable {
        std::ptr::addr_of!(*self)
    }
}
