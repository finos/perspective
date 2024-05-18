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

use js_sys::{Array, ArrayBuffer, Function, JsString, Object};
use perspective_client::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

use crate::utils::{ApiFuture, ApiResult, JsValueSerdeExt, LocalPollLoop, ToApiError};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "view_window.ViewWindow")]
    pub type JsViewWindow;

    #[wasm_bindgen(typescript_type = "on_update_options.OnUpdateOptions")]
    pub type JsOnUpdateOptions;

}

#[doc = include_str!("../../docs/view.md")]
#[wasm_bindgen]
#[derive(Clone)]
pub struct JsView(pub(crate) View);

assert_view_api!(JsView);

impl From<View> for JsView {
    fn from(value: View) -> Self {
        JsView(value)
    }
}

#[wasm_bindgen]
impl JsView {
    pub fn __get_model(&self) -> JsView {
        self.clone()
    }

    #[doc = include_str!("../../docs/view/column_paths.md")]
    #[wasm_bindgen]
    pub async fn column_paths(&self) -> ApiResult<JsValue> {
        let columns = self.0.column_paths().await?;
        Ok(JsValue::from_serde_ext(&columns)?)
    }

    #[doc = include_str!("../../docs/view/col_to_js_typed_array.md")]
    #[wasm_bindgen]
    pub async fn col_to_js_typed_array(&self, column: &JsString) -> ApiResult<ArrayBuffer> {
        let column = column.as_string().into_apierror()?;
        let arrow = self.0.col_to_js_typed_array(column.as_str()).await?;
        Ok(js_sys::Uint8Array::from(&arrow[..])
            .buffer()
            .unchecked_into())
    }

    #[doc = include_str!("../../docs/view/delete.md")]
    #[wasm_bindgen]
    pub async fn delete(self) -> ApiResult<()> {
        self.0.delete().await?;
        Ok(())
    }

    #[doc = include_str!("../../docs/view/dimensions.md")]
    #[wasm_bindgen]
    pub async fn dimensions(&self) -> ApiResult<JsValue> {
        let dimensions = self.0.dimensions().await?;
        Ok(JsValue::from_serde_ext(&dimensions)?)
    }

    #[doc = include_str!("../../docs/view/expression_schema.md")]
    #[wasm_bindgen]
    pub async fn expression_schema(&self) -> ApiResult<JsValue> {
        let schema = self.0.expression_schema().await?;
        Ok(JsValue::from_serde_ext(&schema)?)
    }

    #[doc = include_str!("../../docs/view/get_config.md")]
    #[wasm_bindgen]
    pub async fn get_config(&self) -> ApiResult<JsValue> {
        let config = self.0.get_config().await?;
        Ok(JsValue::from_serde_ext(&config)?)
    }

    #[doc = include_str!("../../docs/view/get_min_max.md")]
    #[wasm_bindgen]
    pub async fn get_min_max(&self, name: String) -> ApiResult<Array> {
        let result = self.0.get_min_max(name).await?;
        Ok([result.0, result.1]
            .iter()
            .map(|x| js_sys::JSON::parse(x))
            .collect::<Result<_, _>>()?)
    }

    #[doc = include_str!("../../docs/view/num_rows.md")]
    #[wasm_bindgen]
    pub async fn num_rows(&self) -> ApiResult<i32> {
        let size = self.0.num_rows().await?;
        Ok(size as i32)
    }

    #[doc = include_str!("../../docs/view/schema.md")]
    #[wasm_bindgen]
    pub async fn schema(&self) -> ApiResult<JsValue> {
        let schema = self.0.schema().await?;
        Ok(JsValue::from_serde_ext(&schema)?)
    }

    #[doc = include_str!("../../docs/view/to_arrow.md")]
    #[wasm_bindgen]
    pub async fn to_arrow(&self, window: Option<JsViewWindow>) -> ApiResult<ArrayBuffer> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let arrow = self.0.to_arrow(window.unwrap_or_default()).await?;
        Ok(js_sys::Uint8Array::from(&arrow[..])
            .buffer()
            .unchecked_into())
    }

    #[doc = include_str!("../../docs/view/to_columns_string.md")]
    #[wasm_bindgen]
    pub async fn to_columns_string(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let json = self.0.to_columns_string(window.unwrap_or_default()).await?;
        Ok(json)
    }

    #[doc = include_str!("../../docs/view/to_columns.md")]
    #[wasm_bindgen]
    pub async fn to_columns(&self, window: Option<JsViewWindow>) -> ApiResult<Object> {
        let json = self.to_columns_string(window).await?;
        Ok(js_sys::JSON::parse(&json)?.unchecked_into())
    }

    #[doc = include_str!("../../docs/view/to_json_string.md")]
    #[wasm_bindgen]
    pub async fn to_json_string(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        let json = self.0.to_json_string(window.unwrap_or_default()).await?;
        Ok(json)
    }

    #[doc = include_str!("../../docs/view/to_json.md")]
    #[wasm_bindgen]
    pub async fn to_json(&self, window: Option<JsViewWindow>) -> ApiResult<Array> {
        let json = self.to_json_string(window).await?;
        Ok(js_sys::JSON::parse(&json)?.unchecked_into())
    }

    #[doc = include_str!("../../docs/view/to_csv.md")]
    #[wasm_bindgen]
    pub async fn to_csv(&self, window: Option<JsViewWindow>) -> ApiResult<String> {
        let window = window.into_serde_ext::<Option<ViewWindow>>()?;
        Ok(self.0.to_csv(window.unwrap_or_default()).await?)
    }

    #[doc = include_str!("../../docs/view/on_update.md")]
    #[wasm_bindgen]
    pub async fn on_update(
        &self,
        on_update_js: Function,
        options: Option<JsOnUpdateOptions>,
    ) -> ApiResult<u32> {
        let emit = {
            let on_update_js = on_update_js.clone();
            LocalPollLoop::new(move |OnUpdateArgs { delta, port_id }| {
                let js_obj = js_sys::Object::new();
                if let Some(arrow) = delta {
                    js_sys::Reflect::set(
                        &js_obj,
                        &"delta".into(),
                        &js_sys::Uint8Array::from(&arrow[..]).buffer(),
                    )
                    .unwrap();
                }

                js_sys::Reflect::set(&js_obj, &"port_id".into(), &port_id.into()).unwrap();
                on_update_js.call1(&JsValue::UNDEFINED, &js_obj)
            })
        };

        let on_update = Box::new(move |msg| emit.poll(msg));
        let on_update_opts = options
            .into_serde_ext::<Option<OnUpdateOptions>>()?
            .unwrap_or_default();

        let id = self.0.on_update(on_update, on_update_opts).await?;
        Ok(id)
    }

    #[doc = include_str!("../../docs/view/remove_update.md")]
    #[wasm_bindgen]
    pub async fn remove_update(&self, callback_id: u32) -> ApiResult<()> {
        Ok(self.0.remove_update(callback_id).await?)
    }

    #[doc = include_str!("../../docs/view/on_delete.md")]
    #[wasm_bindgen]
    pub async fn on_delete(&self, on_delete: Function) -> ApiResult<u32> {
        let emit = LocalPollLoop::new(move |()| on_delete.call0(&JsValue::UNDEFINED));
        let on_delete = Box::new(move || spawn_local(emit.poll(())));
        Ok(self.0.on_delete(on_delete).await?)
    }

    #[doc = include_str!("../../docs/view/num_columns.md")]
    #[wasm_bindgen]
    pub async fn num_columns(&self) -> ApiResult<u32> {
        // TODO: This is broken because of how split by creates a
        // cartesian product of columns * unique values.
        Ok(self.0.dimensions().await?.num_view_columns)
    }

    #[doc = include_str!("../../docs/view/remove_delete.md")]
    #[wasm_bindgen]
    pub fn remove_delete(&self, callback_id: u32) -> ApiFuture<()> {
        let client = self.0.clone();
        ApiFuture::new(async move {
            client.remove_delete(callback_id).await?;
            Ok(())
        })
    }

    #[doc = include_str!("../../docs/view/collapse.md")]
    #[wasm_bindgen]
    pub async fn collapse(&self, row_index: i32) -> ApiResult<i32> {
        Ok(self.0.collapse(row_index).await? as i32)
    }

    #[doc = include_str!("../../docs/view/expand.md")]
    #[wasm_bindgen]
    pub async fn expand(&self, row_index: i32) -> ApiResult<i32> {
        Ok(self.0.expand(row_index).await? as i32)
    }

    #[doc = include_str!("../../docs/view/set_depth.md")]
    #[wasm_bindgen]
    pub async fn set_depth(&self, depth: i32) -> ApiResult<()> {
        Ok(self.0.set_depth(depth).await?)
    }
}
