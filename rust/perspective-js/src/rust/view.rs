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

use js_sys::{Array, ArrayBuffer, Function, Object};
use macro_rules_attribute::apply;
use perspective_client::{assert_view_api, OnUpdateOptions, ViewWindow};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

#[cfg(doc)]
use crate::table::Table;
use crate::utils::{inherit_docs, ApiFuture, ApiResult, JsValueSerdeExt, LocalPollLoop};

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
import type {OnUpdateOptions, ViewWindow} from "@finos/perspective";
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "ViewWindow")]
    #[derive(Clone)]
    pub type JsViewWindow;

    #[wasm_bindgen(method, setter, js_name = "formatted")]
    pub fn set_formatted(this: &JsViewWindow, x: bool);

    #[wasm_bindgen(typescript_type = "OnUpdateOptions")]
    pub type JsOnUpdateOptions;

}

impl From<ViewWindow> for JsViewWindow {
    fn from(value: ViewWindow) -> Self {
        JsViewWindow::from_serde_ext(&value)
            .unwrap()
            .unchecked_into()
    }
}

#[apply(inherit_docs)]
#[inherit_doc = "view.md"]
#[wasm_bindgen]
#[derive(Clone)]
pub struct View(pub(crate) perspective_client::View);

assert_view_api!(View);

impl From<perspective_client::View> for View {
    fn from(value: perspective_client::View) -> Self {
        View(value)
    }
}

#[wasm_bindgen]
impl View {
    #[doc(hidden)]
    pub fn __get_model(&self) -> View {
        self.clone()
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/column_paths.md"]
    #[wasm_bindgen]
    pub async fn column_paths(&self) -> ApiResult<JsValue> {
        let columns = self.0.column_paths().await?;
        Ok(JsValue::from_serde_ext(&columns)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/delete.md"]
    #[wasm_bindgen]
    pub async fn delete(&self) -> ApiResult<()> {
        self.0.delete().await?;
        Ok(())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/dimensions.md"]
    #[wasm_bindgen]
    pub async fn dimensions(&self) -> ApiResult<JsValue> {
        let dimensions = self.0.dimensions().await?;
        Ok(JsValue::from_serde_ext(&dimensions)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/expression_schema.md"]
    #[wasm_bindgen]
    pub async fn expression_schema(&self) -> ApiResult<JsValue> {
        let schema = self.0.expression_schema().await?;
        Ok(JsValue::from_serde_ext(&schema)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/get_config.md"]
    #[wasm_bindgen]
    pub async fn get_config(&self) -> ApiResult<JsValue> {
        let config = self.0.get_config().await?;
        Ok(JsValue::from_serde_ext(&config)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/get_min_max.md"]
    #[wasm_bindgen]
    pub async fn get_min_max(&self, name: String) -> ApiResult<Array> {
        let result = self.0.get_min_max(name).await?;
        Ok([result.0, result.1]
            .iter()
            .map(|x| js_sys::JSON::parse(x))
            .collect::<Result<_, _>>()?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/num_rows.md"]
    #[wasm_bindgen]
    pub async fn num_rows(&self) -> ApiResult<i32> {
        let size = self.0.num_rows().await?;
        Ok(size as i32)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/schema.md"]
    #[wasm_bindgen]
    pub async fn schema(&self) -> ApiResult<JsValue> {
        let schema = self.0.schema().await?;
        Ok(JsValue::from_serde_ext(&schema)?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_arrow.md"]
    #[wasm_bindgen]
    pub async fn to_arrow(&self, window: Option<JsViewWindow>) -> ApiResult<ArrayBuffer> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let arrow = self.0.to_arrow(window.unwrap_or_default()).await?;
        Ok(js_sys::Uint8Array::from(&arrow[..])
            .buffer()
            .unchecked_into())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_columns_string.md"]
    #[wasm_bindgen]
    pub async fn to_columns_string(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let json = self.0.to_columns_string(window.unwrap_or_default()).await?;
        Ok(json)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_columns.md"]
    #[wasm_bindgen]
    pub async fn to_columns(&self, window: Option<JsViewWindow>) -> ApiResult<Object> {
        let json = self.to_columns_string(window).await?;
        Ok(js_sys::JSON::parse(&json)?.unchecked_into())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_json_string.md"]
    #[wasm_bindgen]
    pub async fn to_json_string(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let json = self.0.to_json_string(window.unwrap_or_default()).await?;
        Ok(json)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_json.md"]
    #[wasm_bindgen]
    pub async fn to_json(&self, window: Option<JsViewWindow>) -> ApiResult<Array> {
        let json = self.to_json_string(window).await?;
        Ok(js_sys::JSON::parse(&json)?.unchecked_into())
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_ndjson.md"]
    #[wasm_bindgen]
    pub async fn to_ndjson(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let ndjson = self.0.to_ndjson(window.unwrap_or_default()).await?;
        Ok(ndjson)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/to_csv.md"]
    #[wasm_bindgen]
    pub async fn to_csv(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        Ok(self.0.to_csv(window.unwrap_or_default()).await?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/on_update.md"]
    #[wasm_bindgen]
    pub async fn on_update(
        &self,
        on_update_js: Function,
        options: Option<JsOnUpdateOptions>,
    ) -> ApiResult<u32> {
        let poll_loop = LocalPollLoop::new(move |args| {
            let js_obj = JsValue::from_serde_ext(&args)?;
            on_update_js.call1(&JsValue::UNDEFINED, &js_obj)
        });

        let on_update = Box::new(move |msg| poll_loop.poll(msg));
        let on_update_opts = options
            .into_serde_ext::<Option<OnUpdateOptions>>()?
            .unwrap_or_default();

        let id = self.0.on_update(on_update, on_update_opts).await?;
        Ok(id)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/remove_update.md"]
    #[wasm_bindgen]
    pub async fn remove_update(&self, callback_id: u32) -> ApiResult<()> {
        Ok(self.0.remove_update(callback_id).await?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/on_delete.md"]
    #[wasm_bindgen]
    pub async fn on_delete(&self, on_delete: Function) -> ApiResult<u32> {
        let emit = LocalPollLoop::new(move |()| on_delete.call0(&JsValue::UNDEFINED));
        let on_delete = Box::new(move || spawn_local(emit.poll(())));
        Ok(self.0.on_delete(on_delete).await?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/num_columns.md"]
    #[wasm_bindgen]
    pub async fn num_columns(&self) -> ApiResult<u32> {
        // TODO: This is broken because of how split by creates a
        // cartesian product of columns * unique values.
        Ok(self.0.dimensions().await?.num_view_columns)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/remove_delete.md"]
    #[wasm_bindgen]
    pub fn remove_delete(&self, callback_id: u32) -> ApiFuture<()> {
        let client = self.0.clone();
        ApiFuture::new(async move {
            client.remove_delete(callback_id).await?;
            Ok(())
        })
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/collapse.md"]
    #[wasm_bindgen]
    pub async fn collapse(&self, row_index: u32) -> ApiResult<u32> {
        Ok(self.0.collapse(row_index).await?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/expand.md"]
    #[wasm_bindgen]
    pub async fn expand(&self, row_index: u32) -> ApiResult<u32> {
        Ok(self.0.expand(row_index).await?)
    }

    #[apply(inherit_docs)]
    #[inherit_doc = "view/set_depth.md"]
    #[wasm_bindgen]
    pub async fn set_depth(&self, depth: u32) -> ApiResult<()> {
        Ok(self.0.set_depth(depth).await?)
    }
}
