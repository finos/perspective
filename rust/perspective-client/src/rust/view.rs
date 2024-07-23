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

use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

use futures::{Future, FutureExt};
use prost::bytes::Bytes;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use self::view_on_update_req::Mode;
use crate::assert_view_api;
use crate::client::Client;
use crate::proto::request::ClientReq;
use crate::proto::response::ClientResp;
use crate::proto::*;
pub use crate::utils::*;

#[derive(Default, Debug, Deserialize, TS)]
pub struct OnUpdateOptions {
    pub mode: Option<OnUpdateMode>,
}

#[derive(Default, Debug, Deserialize, TS)]
pub enum OnUpdateMode {
    #[default]
    #[serde(rename = "row")]
    Row,
}

impl FromStr for OnUpdateMode {
    type Err = ClientError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "row" {
            Ok(OnUpdateMode::Row)
        } else {
            Err(ClientError::Option)
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct Dimensions {
    pub num_view_rows: usize,
    pub num_view_columns: usize,
    pub num_table_rows: usize,
    pub num_table_columns: usize,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, TS)]
pub struct ViewWindow {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_row: Option<f32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_col: Option<f32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_row: Option<f32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_col: Option<f32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub index: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub leaves_only: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub formatted: Option<bool>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub compression: Option<String>,
}

impl From<ViewWindow> for ViewPort {
    fn from(window: ViewWindow) -> Self {
        ViewPort {
            start_row: window.start_row.map(|x| x.floor() as u32),
            start_col: window.start_col.map(|x| x.floor() as u32),
            end_row: window.end_row.map(|x| x.ceil() as u32),
            end_col: window.end_col.map(|x| x.ceil() as u32),
        }
    }
}

#[derive(Clone, Debug)]
pub struct View {
    pub name: String,
    client: Client,
}

assert_view_api!(View);

impl View {
    pub fn new(name: String, client: Client) -> Self {
        View { name, client }
    }

    fn client_message(&self, req: ClientReq) -> Request {
        crate::proto::Request {
            msg_id: self.client.gen_id(),
            entity_id: self.name.clone(),
            client_req: Some(req),
        }
    }

    #[doc = include_str!("../../docs/view/column_paths.md")]
    pub async fn column_paths(&self) -> ClientResult<Vec<String>> {
        let msg = self.client_message(ClientReq::ViewColumnPathsReq(ViewColumnPathsReq {}));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewColumnPathsResp(ViewColumnPathsResp { paths }) => {
                // Ok(paths.into_iter().map(|x| x.path).collect())
                Ok(paths)
            },
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/dimensions.md")]
    pub async fn dimensions(&self) -> ClientResult<ViewDimensionsResp> {
        let msg = self.client_message(ClientReq::ViewDimensionsReq(ViewDimensionsReq {}));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewDimensionsResp(resp) => Ok(resp),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/expression_schema.md")]
    pub async fn expression_schema(&self) -> ClientResult<HashMap<String, ColumnType>> {
        let msg = self.client_message(ClientReq::ViewExpressionSchemaReq(
            ViewExpressionSchemaReq {},
        ));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewExpressionSchemaResp(ViewExpressionSchemaResp { schema }) => Ok(schema
                .into_iter()
                .map(|(x, y)| (x, ColumnType::try_from(y).unwrap()))
                .collect()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/get_config.md")]
    pub async fn get_config(&self) -> ClientResult<crate::config::ViewConfig> {
        let msg = self.client_message(ClientReq::ViewGetConfigReq(ViewGetConfigReq {}));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewGetConfigResp(ViewGetConfigResp {
                config: Some(config),
            }) => Ok(config.into()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/num_rows.md")]
    pub async fn num_rows(&self) -> ClientResult<u32> {
        Ok(self.dimensions().await?.num_view_rows)
    }

    #[doc = include_str!("../../docs/view/schema.md")]
    pub async fn schema(&self) -> ClientResult<HashMap<String, ColumnType>> {
        let msg = self.client_message(ClientReq::ViewSchemaReq(ViewSchemaReq {}));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewSchemaResp(ViewSchemaResp { schema }) => Ok(schema
                .into_iter()
                .map(|(x, y)| (x, ColumnType::try_from(y).unwrap()))
                .collect()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/to_arrow.md")]
    pub async fn to_arrow(&self, window: ViewWindow) -> ClientResult<Bytes> {
        let msg = self.client_message(ClientReq::ViewToArrowReq(ViewToArrowReq {
            viewport: Some(window.clone().into()),
            compression: window.compression,
        }));

        match self.client.oneshot(&msg).await? {
            ClientResp::ViewToArrowResp(ViewToArrowResp { arrow }) => Ok(arrow.into()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/to_columns_string.md")]
    pub async fn to_columns_string(&self, window: ViewWindow) -> ClientResult<String> {
        let msg = self.client_message(ClientReq::ViewToColumnsStringReq(ViewToColumnsStringReq {
            viewport: Some(window.clone().into()),
            id: window.id,
            index: window.index,
            formatted: window.formatted,
            leaves_only: window.leaves_only,
        }));

        match self.client.oneshot(&msg).await? {
            ClientResp::ViewToColumnsStringResp(ViewToColumnsStringResp { json_string }) => {
                Ok(json_string)
            },
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/to_json_string.md")]
    pub async fn to_json_string(&self, window: ViewWindow) -> ClientResult<String> {
        let viewport = ViewPort {
            start_row: window.start_row.map(|x| x.floor() as u32),
            start_col: window.start_col.map(|x| x.floor() as u32),
            end_row: window.end_row.map(|x| x.ceil() as u32),
            end_col: window.end_col.map(|x| x.ceil() as u32),
        };

        let msg = self.client_message(ClientReq::ViewToRowsStringReq(ViewToRowsStringReq {
            viewport: Some(viewport),
            id: window.id,
            index: window.index,
            formatted: window.formatted,
            leaves_only: window.leaves_only,
        }));

        match self.client.oneshot(&msg).await? {
            ClientResp::ViewToRowsStringResp(ViewToRowsStringResp { json_string }) => {
                Ok(json_string)
            },
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/to_csv.md")]
    pub async fn to_csv(&self, window: ViewWindow) -> ClientResult<String> {
        let msg = self.client_message(ClientReq::ViewToCsvReq(ViewToCsvReq {
            viewport: Some(window.into()),
        }));

        match self.client.oneshot(&msg).await? {
            ClientResp::ViewToCsvResp(ViewToCsvResp { csv }) => Ok(csv),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/delete.md")]
    pub async fn delete(&self) -> ClientResult<()> {
        let msg = self.client_message(ClientReq::ViewDeleteReq(ViewDeleteReq {}));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewDeleteResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/get_min_max.md")]
    pub async fn get_min_max(&self, column_name: String) -> ClientResult<(String, String)> {
        let msg = self.client_message(ClientReq::ViewGetMinMaxReq(ViewGetMinMaxReq {
            column_name,
        }));

        match self.client.oneshot(&msg).await? {
            ClientResp::ViewGetMinMaxResp(ViewGetMinMaxResp { min, max }) => Ok((min, max)),
            resp => Err(resp.into()),
        }
    }

    /// This is used when constructing a [`Table`] from a [`View`].
    /// The callback needs to be async to wire up the views on_update to the
    /// tables.
    pub async fn on_update<T, U>(&self, on_update: T, options: OnUpdateOptions) -> ClientResult<u32>
    where
        T: Fn(ViewOnUpdateResp) -> U + Send + Sync + 'static,
        U: Future<Output = ()> + Send + 'static,
    {
        let on_update = Arc::new(on_update);
        let callback = move |resp: Response| {
            let on_update = on_update.clone();
            async move {
                match resp.client_resp {
                    Some(ClientResp::ViewOnUpdateResp(resp)) => {
                        on_update(resp).await;
                        Ok(())
                    },
                    resp => Err(ClientError::OptionResponseFailed(resp.into())),
                }
            }
            .boxed()
        };

        let msg = self.client_message(ClientReq::ViewOnUpdateReq(ViewOnUpdateReq {
            mode: options.mode.map(|OnUpdateMode::Row| Mode::Row as i32),
        }));

        self.client.subscribe(&msg, Box::new(callback)).await?;
        Ok(msg.msg_id)
    }

    #[doc = include_str!("../../docs/view/remove_update.md")]
    pub async fn remove_update(&self, update_id: u32) -> ClientResult<()> {
        let msg = self.client_message(ClientReq::ViewRemoveOnUpdateReq(ViewRemoveOnUpdateReq {
            id: update_id,
        }));

        self.client.unsubscribe(update_id)?;
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewRemoveOnUpdateResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/on_delete.md")]
    pub async fn on_delete(
        &self,
        on_delete: Box<dyn Fn() + Send + Sync + 'static>,
    ) -> ClientResult<u32> {
        let callback = move |resp: Response| match resp.client_resp.unwrap() {
            ClientResp::ViewOnDeleteResp(_) => {
                on_delete();
                Ok(())
            },
            resp => Err(resp.into()),
        };

        let msg = self.client_message(ClientReq::ViewOnDeleteReq(ViewOnDeleteReq {}));
        self.client.subscribe_once(&msg, Box::new(callback)).await?;
        Ok(msg.msg_id)
    }

    #[doc = include_str!("../../docs/view/remove_delete.md")]
    pub async fn remove_delete(&self, callback_id: u32) -> ClientResult<()> {
        let msg = self.client_message(ClientReq::ViewRemoveDeleteReq(ViewRemoveDeleteReq {
            id: callback_id,
        }));

        match self.client.oneshot(&msg).await? {
            ClientResp::ViewRemoveDeleteResp(ViewRemoveDeleteResp {}) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/collapse.md")]
    pub async fn collapse(&self, row_index: u32) -> ClientResult<u32> {
        let msg = self.client_message(ClientReq::ViewCollapseReq(ViewCollapseReq { row_index }));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewCollapseResp(ViewCollapseResp { num_changed }) => Ok(num_changed),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/expand.md")]
    pub async fn expand(&self, row_index: u32) -> ClientResult<u32> {
        let msg = self.client_message(ClientReq::ViewExpandReq(ViewExpandReq { row_index }));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewExpandResp(ViewExpandResp { num_changed }) => Ok(num_changed),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/view/set_depth.md")]
    pub async fn set_depth(&self, depth: u32) -> ClientResult<()> {
        let msg = self.client_message(ClientReq::ViewSetDepthReq(ViewSetDepthReq { depth }));
        match self.client.oneshot(&msg).await? {
            ClientResp::ViewSetDepthResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }
}
