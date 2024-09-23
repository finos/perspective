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

use js_sys::{Function, Uint8Array};
#[cfg(doc)]
use perspective_client::SystemInfo;
use perspective_client::{TableData, TableInitOptions};
use wasm_bindgen::prelude::*;

pub use crate::table::*;
use crate::utils::{inherit_docs, ApiError, ApiResult, JsValueSerdeExt, LocalPollLoop};

#[wasm_bindgen]
extern "C" {
    #[derive(Clone)]
    #[wasm_bindgen(typescript_type = "table_init_options.TableInitOptions")]
    pub type JsTableInitOptions;
}

#[doc = inherit_docs!("client.md")]
#[wasm_bindgen]
pub struct Client {
    pub(crate) close: Option<Function>,
    pub(crate) client: perspective_client::Client,
}

#[wasm_bindgen]
impl Client {
    #[wasm_bindgen(constructor)]
    pub fn new(send_request: Function, close: Option<Function>) -> Self {
        let send1 = send_request.clone();
        let send_loop = LocalPollLoop::new(move |mut buff: Vec<u8>| {
            let buff2 = unsafe { js_sys::Uint8Array::view_mut_raw(buff.as_mut_ptr(), buff.len()) };
            send1.call1(&JsValue::UNDEFINED, &buff2)
        });

        let client = perspective_client::Client::new_with_callback(move |msg| {
            let task = send_loop.poll(msg.to_vec());
            Box::pin(async move {
                task.await;
                Ok(())
            })
        });

        Client { close, client }
    }

    #[wasm_bindgen]
    pub async fn init(&self) -> ApiResult<()> {
        self.client.clone().init().await?;
        Ok(())
    }

    #[doc(hidden)]
    #[wasm_bindgen]
    pub async fn handle_response(&self, value: &JsValue) -> ApiResult<()> {
        let uint8array = Uint8Array::new(value);
        let slice = uint8array.to_vec();
        self.client.handle_response(&slice).await?;
        Ok(())
    }

    #[doc = inherit_docs!("client/table.md")]
    #[wasm_bindgen]
    pub async fn table(
        &self,
        value: &JsTableInitData,
        options: Option<JsTableInitOptions>,
    ) -> ApiResult<Table> {
        let options = options
            .into_serde_ext::<Option<TableInitOptions>>()?
            .unwrap_or_default();

        let args = TableData::from_js_value(value, options.format)?;
        Ok(Table(self.client.table(args, options).await?))
    }

    #[doc = inherit_docs!("client/terminate.md")]
    #[wasm_bindgen]
    pub fn terminate(&self) -> ApiResult<JsValue> {
        if let Some(f) = self.close.clone() {
            Ok(f.call0(&JsValue::UNDEFINED)?)
        } else {
            Err(ApiError::new("Client type cannot be terminated"))
        }
    }

    #[doc = inherit_docs!("client/open_table.md")]
    #[wasm_bindgen]
    pub async fn open_table(&self, entity_id: String) -> ApiResult<Table> {
        Ok(Table(self.client.open_table(entity_id).await?))
    }

    #[doc = inherit_docs!("client/get_hosted_table_names.md")]
    #[wasm_bindgen]
    pub async fn get_hosted_table_names(&self) -> ApiResult<JsValue> {
        Ok(JsValue::from_serde_ext(
            &self.client.get_hosted_table_names().await?,
        )?)
    }

    #[doc = inherit_docs!("client/system_info.md")]
    #[wasm_bindgen]
    pub async fn system_info(&self) -> ApiResult<JsValue> {
        let info = self.client.system_info().await?;
        Ok(JsValue::from_serde_ext(&info)?)
    }
}
