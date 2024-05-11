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

use nanoid::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::client::{Client, Features, TableData};
use crate::config::{Expressions, ViewConfigUpdate};
use crate::proto::make_table_req::make_table_options::MakeTableType;
use crate::proto::make_table_req::MakeTableOptions;
use crate::proto::request::ClientReq;
use crate::proto::response::ClientResp;
use crate::proto::*;
use crate::utils::*;
use crate::view::View;
use crate::{assert_table_api, proto};

pub type Schema = HashMap<String, ColumnType>;

/// Options which impact the behavior of [`Client::table`], as well as
/// subsequent calls to [`Table::update`], even though this latter method
/// itself does not take [`TableInitOptions`] as an argument, since this
/// parameter is fixed at creation.
#[derive(Clone, Debug, Default, Serialize, Deserialize, TS)]
pub struct TableInitOptions {
    #[serde(default)]
    #[ts(optional)]
    pub name: Option<String>,

    /// This [`Table`] should use the column named by the `index` parameter as
    /// the `index`, which causes [`Table::update`] and [`Client::table`] input
    /// to either insert or update existing rows based on `index` column
    /// value equality.
    #[serde(default)]
    #[ts(optional)]
    pub index: Option<String>,

    /// This [`Table`] should be limited to `limit` rows, after which the
    /// _earliest_ rows will be overwritten (where _earliest_ is defined as
    /// relative to insertion order).
    #[serde(default)]
    #[ts(optional)]
    pub limit: Option<u32>,
}

impl TryFrom<TableInitOptions> for MakeTableOptions {
    type Error = ClientError;

    fn try_from(value: TableInitOptions) -> Result<Self, Self::Error> {
        Ok(MakeTableOptions {
            make_table_type: match value {
                TableInitOptions {
                    index: Some(_),
                    limit: Some(_),
                    ..
                } => Err(ClientError::BadTableOptions)?,
                TableInitOptions {
                    index: Some(index), ..
                } => Some(MakeTableType::MakeIndexTable(index)),
                TableInitOptions {
                    limit: Some(limit), ..
                } => Some(MakeTableType::MakeLimitTable(limit)),
                _ => None,
            },
        })
    }
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, TS)]
pub struct UpdateOptions {
    pub format: Option<String>,
    pub port_id: Option<u32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ValidateExpressionsData {
    pub expression_schema: HashMap<String, ColumnType>,
    pub errors: HashMap<String, table_validate_expr_resp::ExprValidationError>,
    pub expression_alias: HashMap<String, String>,
}

#[doc = include_str!("../../docs/table.md")]
#[derive(Clone)]
pub struct Table {
    name: String,
    client: Client,
    options: TableInitOptions,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub heap_size: u64,
}

impl From<proto::ServerSystemInfoResp> for SystemInfo {
    fn from(value: proto::ServerSystemInfoResp) -> Self {
        SystemInfo {
            heap_size: value.heap_size,
        }
    }
}

assert_table_api!(Table);

impl Table {
    pub(crate) fn new(name: String, client: Client, options: TableInitOptions) -> Self {
        Table {
            name,
            client,
            options,
        }
    }

    fn client_message(&self, req: ClientReq) -> Request {
        Request {
            msg_id: self.client.gen_id(),
            entity_id: self.name.clone(),
            client_req: Some(req),
        }
    }

    pub fn get_features(&self) -> ClientResult<Features> {
        self.client.get_features()
    }

    #[doc = include_str!("../../docs/table/get_index.md")]
    pub fn get_index(&self) -> Option<String> {
        self.options.index.as_ref().map(|index| index.to_owned())
    }

    #[doc = include_str!("../../docs/table/get_limit.md")]
    pub fn get_limit(&self) -> Option<u32> {
        self.options.limit.as_ref().map(|limit| *limit)
    }

    #[doc = include_str!("../../docs/table/clear.md")]
    pub async fn clear(&self) -> ClientResult<()> {
        self.replace(TableData::JsonRows("[]".to_owned())).await
    }

    #[doc = include_str!("../../docs/table/delete.md")]
    pub async fn delete(&self) -> ClientResult<()> {
        let msg = self.client_message(ClientReq::TableDeleteReq(TableDeleteReq {}));
        match self.client.oneshot(&msg).await {
            ClientResp::TableDeleteResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/columns.md")]
    pub async fn columns(&self) -> ClientResult<Vec<String>> {
        let msg = self.client_message(ClientReq::TableSchemaReq(TableSchemaReq {}));
        match self.client.oneshot(&msg).await {
            ClientResp::TableSchemaResp(TableSchemaResp { schema }) => Ok(schema
                .map(|x| x.schema.into_iter().map(|x| x.name.to_owned()).collect())
                .unwrap()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/size.md")]
    pub async fn size(&self) -> ClientResult<usize> {
        let msg = self.client_message(ClientReq::TableSizeReq(TableSizeReq {}));
        match self.client.oneshot(&msg).await {
            ClientResp::TableSizeResp(TableSizeResp { size }) => Ok(size as usize),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/schema.md")]
    pub async fn schema(&self) -> ClientResult<HashMap<String, ColumnType>> {
        let msg = self.client_message(ClientReq::TableSchemaReq(TableSchemaReq {}));
        match self.client.oneshot(&msg).await {
            ClientResp::TableSchemaResp(TableSchemaResp { schema }) => Ok(schema
                .map(|x| {
                    x.schema
                        .into_iter()
                        .map(|x| (x.name, ColumnType::try_from(x.r#type).unwrap()))
                        .collect()
                })
                .unwrap()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/make_port.md")]
    pub async fn make_port(&self) -> ClientResult<i32> {
        let msg = self.client_message(ClientReq::TableMakePortReq(TableMakePortReq {}));
        match self.client.oneshot(&msg).await {
            ClientResp::TableMakePortResp(TableMakePortResp { port_id }) => Ok(port_id as i32),
            _ => Err(ClientError::Unknown("make_port".to_string())),
        }
    }

    #[doc = include_str!("../../docs/table/on_delete.md")]
    pub async fn on_delete(
        &self,
        on_delete: Box<dyn Fn() + Send + Sync + 'static>,
    ) -> ClientResult<u32> {
        let callback = move |resp| match resp {
            ClientResp::TableOnDeleteResp(_) => {
                on_delete();
                Ok(())
            },
            resp => Err(resp.into()),
        };

        let msg = self.client_message(ClientReq::TableOnDeleteReq(TableOnDeleteReq {}));
        self.client.subscribe_once(&msg, Box::new(callback)).await;
        Ok(msg.msg_id)
    }

    #[doc = include_str!("../../docs/table/remove_delete.md")]
    pub async fn remove_delete(&self, callback_id: u32) -> ClientResult<()> {
        let msg = self.client_message(ClientReq::TableRemoveDeleteReq(TableRemoveDeleteReq {
            id: callback_id,
        }));

        match self.client.oneshot(&msg).await {
            ClientResp::TableRemoveDeleteResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/remove.md")]
    pub async fn remove(&self, input: TableData) -> ClientResult<()> {
        let data = match input {
            TableData::Csv(x) => make_table_data::Data::FromCsv(x),
            TableData::Arrow(x) => make_table_data::Data::FromArrow(x),
            TableData::JsonRows(x) => make_table_data::Data::FromRows(x),
            TableData::JsonColumns(x) => make_table_data::Data::FromCols(x),
            TableData::Schema(_) => Err(ClientError::Internal(
                "Can't `remove()` from Schema".to_string(),
            ))?,
            TableData::View(_) => Err(ClientError::Internal(
                "Can't `remove()` from View".to_string(),
            ))?,
        };

        let msg = self.client_message(ClientReq::TableRemoveReq(TableRemoveReq {
            data: Some(MakeTableData { data: Some(data) }),
        }));

        match self.client.oneshot(&msg).await {
            ClientResp::TableRemoveResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/replace.md")]
    pub async fn replace(&self, input: TableData) -> ClientResult<()> {
        let data = match input {
            TableData::Csv(x) => make_table_data::Data::FromCsv(x),
            TableData::Arrow(x) => make_table_data::Data::FromArrow(x),
            TableData::JsonRows(x) => make_table_data::Data::FromRows(x),
            TableData::JsonColumns(x) => make_table_data::Data::FromCols(x),
            TableData::Schema(_) => Err(ClientError::Internal(
                "Can't `replace()` from Schema".to_string(),
            ))?,
            TableData::View(_) => Err(ClientError::Internal(
                "Can't `replace()` from View".to_string(),
            ))?,
        };

        let msg = self.client_message(ClientReq::TableReplaceReq(TableReplaceReq {
            data: Some(MakeTableData { data: Some(data) }),
        }));

        match self.client.oneshot(&msg).await {
            ClientResp::TableReplaceResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/update.md")]
    pub async fn update(&self, input: TableData, options: UpdateOptions) -> ClientResult<()> {
        let data = match input {
            TableData::Csv(x) => make_table_data::Data::FromCsv(x),
            TableData::Arrow(x) => make_table_data::Data::FromArrow(x),
            TableData::JsonRows(x) => make_table_data::Data::FromRows(x),
            TableData::JsonColumns(x) => make_table_data::Data::FromCols(x),
            TableData::Schema(_) => Err(ClientError::Internal(
                "Can't `update()` from Schema".to_string(),
            ))?,
            TableData::View(_) => Err(ClientError::Internal(
                "Can't `update()` from View".to_string(),
            ))?,
        };

        let msg = self.client_message(ClientReq::TableUpdateReq(TableUpdateReq {
            data: Some(MakeTableData { data: Some(data) }),
            port_id: options.port_id.unwrap_or(0),
        }));

        match self.client.oneshot(&msg).await {
            ClientResp::TableUpdateResp(_) => Ok(()),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/validate_expressions.md")]
    pub async fn validate_expressions(
        &self,
        expressions: Expressions,
    ) -> ClientResult<ValidateExpressionsData> {
        let msg = self.client_message(ClientReq::TableValidateExprReq(TableValidateExprReq {
            column_to_expr: expressions.0,
        }));

        match self.client.oneshot(&msg).await {
            ClientResp::TableValidateExprResp(result) => Ok(ValidateExpressionsData {
                errors: result.errors,
                expression_alias: result.expression_alias,
                expression_schema: result
                    .expression_schema
                    .into_iter()
                    .map(|(x, y)| (x, ColumnType::try_from(y).unwrap()))
                    .collect(),
            }),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/table/view.md")]
    pub async fn view(&self, config: Option<ViewConfigUpdate>) -> ClientResult<View> {
        let view_name = nanoid!();
        let msg = Request {
            msg_id: self.client.gen_id(),
            entity_id: self.name.clone(),
            client_req: ClientReq::TableMakeViewReq(TableMakeViewReq {
                view_id: view_name.clone(),
                config: config.map(|x| x.into()),
            })
            .into(),
        };

        match self.client.oneshot(&msg).await {
            ClientResp::TableMakeViewResp(TableMakeViewResp { view_id })
                if view_id == view_name =>
            {
                Ok(View::new(view_name, self.client.clone()))
            },
            resp => Err(resp.into()),
        }
    }
}
