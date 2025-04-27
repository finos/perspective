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
use macro_rules_attribute::apply;
use perspective_client::config::*;
use perspective_client::{
    ColumnType, DeleteOptions, TableData, TableReadFormat, UpdateData, UpdateOptions,
    assert_table_api,
};
use wasm_bindgen::convert::TryFromJsValue;
use wasm_bindgen::prelude::*;
use wasm_bindgen_derive::TryFromJsValue;
use wasm_bindgen_futures::spawn_local;

use crate::client::Client;
use crate::table_data::UpdateDataExt;
use crate::utils::{ApiFuture, ApiResult, JsValueSerdeExt, LocalPollLoop, inherit_docs};
pub use crate::view::*;

#[derive(TryFromJsValue, Clone, PartialEq)]
#[wasm_bindgen]
pub struct Table(pub(crate) perspective_client::Table);

assert_table_api!(Table);

impl From<perspective_client::Table> for Table {
    fn from(value: perspective_client::Table) -> Self {
        Table(value)
    }
}

impl Table {
    pub fn get_table(&self) -> &'_ perspective_client::Table {
        &self.0
    }
}

#[wasm_bindgen]
extern "C" {
    // TODO Fix me
    #[wasm_bindgen(typescript_type = "\
        string | ArrayBuffer | Record<string, unknown[]> | Record<string, unknown>[]")]
    pub type JsTableInitData;

    #[wasm_bindgen(typescript_type = "ViewConfigUpdate")]
    pub type JsViewConfig;

    #[wasm_bindgen(typescript_type = "UpdateOptions")]
    pub type JsUpdateOptions;

    #[wasm_bindgen(typescript_type = "DeleteOptions")]
    pub type JsDeleteOptions;
}

#[wasm_bindgen]
impl Table {
    #[apply(inherit_docs)]
    #[inherit_doc = "table/get_index.md"]
    #[wasm_bindgen]
    pub async fn get_index(&self) -> Option<String> {
        self.0.get_index()
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/get_client.md"]
    #[wasm_bindgen]
    pub async fn get_client(&self) -> Client {
        Client {
            close: None,
            client: self.0.get_client(),
        }
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/get_name.md"]
    #[wasm_bindgen]
    pub async fn get_name(&self) -> String {
        self.0.get_name().to_owned()
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/get_limit.md"]
    #[wasm_bindgen]
    pub async fn get_limit(&self) -> Option<u32> {
        self.0.get_limit()
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/clear.md"]
    #[wasm_bindgen]
    pub async fn clear(&self) -> ApiResult<()> {
        self.0.clear().await?;
        Ok(())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/delete.md"]
    #[wasm_bindgen]
    pub async fn delete(self, options: Option<JsDeleteOptions>) -> ApiResult<()> {
        let options = options
            .into_serde_ext::<Option<DeleteOptions>>()?
            .unwrap_or_default();

        self.0.delete(options).await?;
        Ok(())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/size.md"]
    #[wasm_bindgen]
    pub async fn size(&self) -> ApiResult<f64> {
        Ok(self.0.size().await? as f64)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/schema.md"]
    #[wasm_bindgen]
    pub async fn schema(&self) -> ApiResult<JsValue> {
        let schema = self.0.schema().await?;
        Ok(JsValue::from_serde_ext(&schema)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/columns.md"]
    #[wasm_bindgen]
    pub async fn columns(&self) -> ApiResult<JsValue> {
        let columns = self.0.columns().await?;
        Ok(JsValue::from_serde_ext(&columns)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/make_port.md"]
    #[wasm_bindgen]
    pub async fn make_port(&self) -> ApiResult<i32> {
        Ok(self.0.make_port().await?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/on_delete.md"]
    #[wasm_bindgen]
    pub fn on_delete(&self, on_delete: Function) -> ApiFuture<u32> {
        let table = self.clone();
        ApiFuture::new(async move {
            let emit = LocalPollLoop::new(move |()| on_delete.call0(&JsValue::UNDEFINED));
            let on_delete = Box::new(move || spawn_local(emit.poll(())));
            Ok(table.0.on_delete(on_delete).await?)
        })
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/remove_delete.md"]
    #[wasm_bindgen]
    pub fn remove_delete(&self, callback_id: u32) -> ApiFuture<()> {
        let client = self.0.clone();
        ApiFuture::new(async move {
            client.remove_delete(callback_id).await?;
            Ok(())
        })
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/replace.md"]
    #[wasm_bindgen]
    pub async fn remove(&self, value: &JsValue, options: Option<JsUpdateOptions>) -> ApiResult<()> {
        let options = options
            .into_serde_ext::<Option<UpdateOptions>>()?
            .unwrap_or_default();

        let input = UpdateData::from_js_value(value, options.format)?;
        self.0.remove(input).await?;
        Ok(())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/replace.md"]
    #[wasm_bindgen]
    pub async fn replace(
        &self,
        input: &JsValue,
        options: Option<JsUpdateOptions>,
    ) -> ApiResult<()> {
        let options = options
            .into_serde_ext::<Option<UpdateOptions>>()?
            .unwrap_or_default();

        let input = UpdateData::from_js_value(input, options.format)?;
        self.0.replace(input).await?;
        Ok(())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/update.md"]
    #[wasm_bindgen]
    pub fn update(
        &self,
        input: JsTableInitData,
        options: Option<JsUpdateOptions>,
    ) -> ApiFuture<()> {
        let table = self.clone();
        ApiFuture::new(async move {
            let options = options
                .into_serde_ext::<Option<UpdateOptions>>()?
                .unwrap_or_default();

            let input = UpdateData::from_js_value(&input, options.format)?;
            Ok(table.0.update(input, options).await?)
        })
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/view.md"]
    #[wasm_bindgen]
    pub async fn view(&self, config: Option<JsViewConfig>) -> ApiResult<View> {
        let config = config
            .map(|config| js_sys::JSON::stringify(&config))
            .transpose()?
            .and_then(|x| x.as_string())
            .map(|x| serde_json::from_str(x.as_str()))
            .transpose()?;

        let view = self.0.view(config).await?;
        Ok(View(view))
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "table/validate_expressions.md"]
    #[wasm_bindgen]
    pub async fn validate_expressions(&self, exprs: &JsValue) -> ApiResult<JsValue> {
        let exprs = JsValue::into_serde_ext::<Expressions>(exprs.clone())?;
        let columns = self.0.validate_expressions(exprs).await?;
        Ok(JsValue::from_serde_ext(&columns)?)
    }
}
