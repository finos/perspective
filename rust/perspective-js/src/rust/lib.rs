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

#![warn(
    clippy::all,
    clippy::panic_in_result_fn,
    clippy::await_holding_refcell_ref,
    unstable_features
)]
#![allow(non_snake_case)]

mod table;
pub mod utils;
mod view;

use js_sys::{Function, Uint8Array};
use perspective_client::config::*;
use perspective_client::*;
use proto::ViewOnUpdateResp;
use ts_rs::TS;
use utils::{ApiResult, LocalPollLoop};
use wasm_bindgen::prelude::*;

pub use crate::table::*;
use crate::utils::{ApiError, JsValueSerdeExt};

#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
export type * from "../../src/ts/ts-rs/ViewWindow.d.ts";
export type * from "../../src/ts/ts-rs/TableInitOptions.d.ts";
export type * from "../../src/ts/ts-rs/ViewConfigUpdate.d.ts";
export type * from "../../src/ts/ts-rs/OnUpdateArgs.d.ts";
export type * from "../../src/ts/ts-rs/OnUpdateOptions.d.ts";
export type * from "../../src/ts/ts-rs/UpdateOptions.d.ts";

import type * as table_init_options from "../../src/ts/ts-rs/ViewWindow.d.ts";
import type * as table_init_options from "../../src/ts/ts-rs/TableInitOptions.d.ts";
import type * as view_config_update from "../../src/ts/ts-rs/ViewConfigUpdate.d.ts";
import type * as on_update_args from "../../src/ts/ts-rs/OnUpdateArgs.d.ts";
import type * as on_update_options from "../../src/ts/ts-rs/OnUpdateOptions.d.ts";
import type * as update_options from "../../src/ts/ts-rs/UpdateOptions.d.ts";
"#;

pub fn generate_type_bindings() {
    ViewWindow::export_all().unwrap();
    TableInitOptions::export_all().unwrap();
    ViewConfigUpdate::export_all().unwrap();
    ViewOnUpdateResp::export_all().unwrap();
    OnUpdateOptions::export_all().unwrap();
    UpdateOptions::export_all().unwrap()
}

#[cfg(feature = "export-init")]
#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
    utils::set_global_logging();
}

#[doc = include_str!("../../docs/client.md")]
#[wasm_bindgen]
pub struct JsClient {
    close: Option<Function>,
    client: Client,
}

#[wasm_bindgen]
extern "C" {
    #[derive(Clone)]
    #[wasm_bindgen(typescript_type = "table_init_options.TableInitOptions")]
    pub type JsTableInitOptions;
}

#[wasm_bindgen]
impl JsClient {
    #[wasm_bindgen(constructor)]
    pub fn new(send_request: Function, close: Option<Function>) -> Self {
        let send1 = send_request.clone();
        let send_loop = LocalPollLoop::new(move |mut buff: Vec<u8>| {
            let buff2 = unsafe { js_sys::Uint8Array::view_mut_raw(buff.as_mut_ptr(), buff.len()) };
            send1.call1(&JsValue::UNDEFINED, &buff2)
        });

        let client = Client::new_with_callback(move |msg| {
            let task = send_loop.poll(msg.to_vec());
            Box::pin(async move {
                task.await;
                Ok(())
            })
        });

        JsClient { close, client }
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

    #[doc = include_str!("../../docs/table.md")]
    #[wasm_bindgen]
    pub async fn table(
        &self,
        value: &JsTableInitData,
        options: Option<JsTableInitOptions>,
    ) -> ApiResult<JsTable> {
        let args = TableData::from_js_value(value)?;
        let options = options
            .into_serde_ext::<Option<TableInitOptions>>()?
            .unwrap_or_default();

        Ok(JsTable(self.client.table(args, options).await?))
    }

    #[doc = include_str!("../../docs/client/terminate.md")]
    #[wasm_bindgen]
    pub fn terminate(&self) -> ApiResult<JsValue> {
        if let Some(f) = self.close.clone() {
            Ok(f.call0(&JsValue::UNDEFINED)?)
        } else {
            Err(ApiError::new("Client type cannot be terminated"))
        }
    }

    #[doc = include_str!("../../docs/client/open_table.md")]
    #[wasm_bindgen]
    pub async fn open_table(&self, entity_id: String) -> ApiResult<JsTable> {
        Ok(JsTable(self.client.open_table(entity_id).await?))
    }

    #[doc = include_str!("../../docs/client/get_hosted_table_names.md")]
    #[wasm_bindgen]
    pub async fn get_hosted_table_names(&self) -> ApiResult<JsValue> {
        Ok(JsValue::from_serde_ext(
            &self.client.get_hosted_table_names().await?,
        )?)
    }

    #[doc = include_str!("../../docs/client/system_info.md")]
    #[wasm_bindgen]
    pub async fn system_info(&self) -> ApiResult<JsValue> {
        let info = self.client.system_info().await?;
        Ok(JsValue::from_serde_ext(&info)?)
    }
}
