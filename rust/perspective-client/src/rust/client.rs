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
use std::pin::Pin;
use std::sync::atomic::AtomicU32;
use std::sync::Arc;

use async_lock::{Mutex, RwLock};
use futures::Future;
use nanoid::*;
use prost::Message;
use proto::make_table_data::Data;

use crate::proto::request::ClientReq;
use crate::proto::response::ClientResp;
use crate::proto::{
    ColumnType, GetFeaturesReq, GetFeaturesResp, GetHostedTablesReq, GetHostedTablesResp,
    MakeTableData, MakeTableReq, Request, Response, ServerSystemInfoReq, TableUpdateReq,
    ViewToColumnsStringResp,
};
use crate::table::{SystemInfo, Table, TableInitOptions};
use crate::table_data::{TableData, UpdateData};
use crate::utils::*;
use crate::view::View;
use crate::{proto, Table, TableInitOptions};

pub type Features = Arc<GetFeaturesResp>;

impl GetFeaturesResp {
    pub fn default_op(&self, col_type: ColumnType) -> Option<&String> {
        self.filter_ops.get(&(col_type as u32))?.options.first()
    }
}

/// The possible formats of input data which [`Client::table`] and
/// [`Table::update`] may take as an argument. The latter method will not work
/// with [`TableData::View`] and [`TableData::Schema`] variants, and attempts to
/// call [`Table::update`] with these variants will error.
#[derive(Debug)]
pub enum TableData {
    Schema(Vec<(String, ColumnType)>),
    Csv(String),
    Arrow(Vec<u8>),
    JsonRows(String),
    JsonColumns(String),
    View(View),
}

impl From<TableData> for proto::make_table_data::Data {
    fn from(value: TableData) -> Self {
        match value {
            TableData::Csv(x) => make_table_data::Data::FromCsv(x),
            TableData::Arrow(x) => make_table_data::Data::FromArrow(x),
            TableData::JsonRows(x) => make_table_data::Data::FromRows(x),
            TableData::JsonColumns(x) => make_table_data::Data::FromCols(x),
            TableData::View(view) => make_table_data::Data::FromView(view.name),
            TableData::Schema(x) => make_table_data::Data::FromSchema(proto::Schema {
                schema: x
                    .into_iter()
                    .map(|(name, r#type)| schema::KeyTypePair {
                        name,
                        r#type: r#type as i32,
                    })
                    .collect(),
            }),
        }
    }
}

type Subscriptions<C> = Arc<RwLock<HashMap<u32, C>>>;
type ManyCallback = Box<dyn Fn(ClientResp) -> Result<(), ClientError> + Send + Sync + 'static>;
type OnceCallback = Box<dyn FnOnce(ClientResp) -> Result<(), ClientError> + Send + Sync + 'static>;

type SendFuture = Pin<Box<dyn Future<Output = ()> + Send + Sync + 'static>>;
type SendCallback = Arc<dyn Fn(&Client, &Request) -> SendFuture + Send + Sync + 'static>;

#[derive(Clone)]
#[doc = include_str!("../../docs/client.md")]
pub struct Client {
    features: Arc<Mutex<Option<Features>>>,
    send: SendCallback,
    id_gen: Arc<AtomicU32>,
    subscriptions_once: Subscriptions<OnceCallback>,
    subscriptions_many: Subscriptions<ManyCallback>,
}

impl std::fmt::Debug for Client {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Client")
            .field("id_gen", &self.id_gen)
            .finish()
    }
}

fn encode(req: &Request) -> Vec<u8> {
    let mut bytes: Vec<u8> = Vec::new();
    req.encode(&mut bytes).unwrap();
    bytes
}

impl Client {
    /// Create a new client instance with a closure over an external message
    /// queue's `push()`.
    pub fn new<T>(send_handler: T) -> Self
    where
        T: Fn(&Client, &Vec<u8>) -> Pin<Box<dyn Future<Output = ()> + Send + Sync + 'static>>
            + Send
            + Sync
            + 'static,
    {
        Client {
            features: Arc::default(),
            id_gen: Arc::new(AtomicU32::new(1)),
            subscriptions_once: Arc::default(),
            subscriptions_many: Subscriptions::default(),
            send: Arc::new(move |client, msg| send_handler(client, &encode(msg))),
        }
    }

    /// Create a new client instance with a closure over an external message
    /// queue's `push()`.
    pub fn new_sync<T>(send_handler: T) -> Self
    where
        T: Fn(&Client, &Vec<u8>) + Send + Sync + 'static + Clone,
    {
        Client {
            id_gen: Arc::new(AtomicU32::new(1)),
            features: Arc::default(),
            subscriptions_once: Arc::default(),
            subscriptions_many: Subscriptions::default(),
            send: Arc::new(move |client, msg| {
                let client = client.clone();
                let msg = msg.clone();
                let send_handler = send_handler.clone();
                Box::pin(async move {
                    send_handler(&client, &encode(&msg));
                })
            }),
        }
    }

    /// Handle a message from the external message queue.
    pub fn receive(&self, msg: &Vec<u8>) -> Result<(), ClientError> {
        let msg = Response::decode(msg.as_slice())?;
        tracing::info!("RECV {}", msg);
        let payload = msg.client_resp.ok_or(ClientError::Option)?;
        let mut wr = self.subscriptions_once.try_write().unwrap();
        if let Some(handler) = (*wr).remove(&msg.msg_id) {
            drop(wr);
            handler(payload)?;
        } else if let Some(handler) = self.subscriptions_many.try_read().unwrap().get(&msg.msg_id) {
            drop(wr);
            handler(payload)?;
        } else {
            tracing::warn!("Received unsolicited server message");
        }

        Ok(())
    }

    pub async fn init(&self) -> ClientResult<()> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_owned(),
            client_req: Some(ClientReq::GetFeaturesReq(GetFeaturesReq {})),
        };

        *self.features.lock().await = Some(Arc::new(match self.oneshot(&msg).await {
            ClientResp::GetFeaturesResp(features) => Ok(features),
            resp => Err(resp),
        }?));

        Ok(())
    }

    /// Generate a message ID unique to this client.
    pub(crate) fn gen_id(&self) -> u32 {
        self.id_gen
            .fetch_add(1, std::sync::atomic::Ordering::Acquire)
    }

    pub(crate) fn unsubscribe(&self, update_id: u32) -> ClientResult<()> {
        let callback = self
            .subscriptions_many
            .try_write()
            .unwrap()
            .remove(&update_id)
            .ok_or(ClientError::Unknown("remove_update".to_string()))?;

        drop(callback);
        Ok(())
    }

    /// Register a callback which is expected to respond exactly once.
    pub(crate) async fn subscribe_once(
        &self,
        msg: &Request,
        on_update: Box<dyn FnOnce(ClientResp) -> ClientResult<()> + Send + Sync + 'static>,
    ) {
        self.subscriptions_once
            .try_write()
            .unwrap()
            .insert(msg.msg_id, on_update);

        tracing::info!("SEND {}", msg);
        (self.send)(self, msg).await;
    }

    /// Register a callback which is expected to respond many times.
    pub(crate) async fn subscribe(
        &self,
        msg: &Request,
        on_update: Box<dyn Fn(ClientResp) -> ClientResult<()> + Send + Sync + 'static>,
    ) {
        self.subscriptions_many
            .try_write()
            .unwrap()
            .insert(msg.msg_id, on_update);

        tracing::info!("SEND {}", msg);
        (self.send)(self, msg).await;
    }

    /// Send a `ClientReq` and await both the successful completion of the
    /// `send`, _and_ the `ClientResp` which is returned.
    pub(crate) async fn oneshot(&self, msg: &Request) -> ClientResp {
        let (sender, receiver) = futures::channel::oneshot::channel::<ClientResp>();
        let callback = Box::new(move |msg| sender.send(msg).map_err(|x| x.into()));
        self.subscriptions_once
            .try_write()
            .unwrap()
            .insert(msg.msg_id, callback);

        tracing::info!("SEND {}", msg);
        (self.send)(self, msg).await;
        receiver.await.unwrap()
    }

    pub(crate) fn get_features(&self) -> ClientResult<Features> {
        Ok(self
            .features
            .try_lock()
            .ok_or(ClientError::NotInitialized)?
            .as_ref()
            .ok_or(ClientError::NotInitialized)?
            .clone())
    }

    #[doc = include_str!("../../docs/client/table.md")]
    pub async fn table(&self, input: TableData, options: TableInitOptions) -> ClientResult<Table> {
        let entity_id = match options.name.clone() {
            Some(x) => x.to_owned(),
            None => nanoid!(),
        };

        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: entity_id.clone(),
            client_req: Some(ClientReq::MakeTableReq(MakeTableReq {
                data: Some(MakeTableData {
                    data: Some(input.into()),
                }),
                options: Some(options.clone().try_into()?),
            })),
        };

        let client = self.clone();
        match self.oneshot(&msg).await {
            ClientResp::MakeTableResp(_) => Ok(Table::new(entity_id, client, options)),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/client/open_table.md")]
    pub async fn open_table(&self, entity_id: String) -> ClientResult<Table> {
        let names = self.get_hosted_table_names().await?;
        if names.contains(&entity_id) {
            let options = TableInitOptions::default();
            let client = self.clone();
            Ok(Table::new(entity_id, client, options))
        } else {
            Err(ClientError::Unknown("Unknown table".to_owned()))
        }
    }

    #[doc = include_str!("../../docs/client/get_hosted_table_names.md")]
    pub async fn get_hosted_table_names(&self) -> ClientResult<Vec<String>> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_owned(),
            client_req: Some(ClientReq::GetHostedTablesReq(GetHostedTablesReq {})),
        };

        match self.oneshot(&msg).await {
            ClientResp::GetHostedTablesResp(GetHostedTablesResp { table_names }) => Ok(table_names),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/client/system_info.md")]
    pub async fn system_info(&self) -> ClientResult<SystemInfo> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_string(),
            client_req: Some(ClientReq::ServerSystemInfoReq(ServerSystemInfoReq {})),
        };

        match self.oneshot(&msg).await {
            ClientResp::ServerSystemInfoResp(resp) => Ok(resp.into()),
            resp => Err(resp.into()),
        }
    }
}

fn replace(x: Data) -> Data {
    match x {
        Data::FromArrow(_) => Data::FromArrow("<< redacted >>".to_string().encode_to_vec()),
        Data::FromRows(_) => Data::FromRows("<< redacted >>".to_string()),
        Data::FromCols(_) => Data::FromCols("".to_string()),
        Data::FromCsv(_) => Data::FromCsv("".to_string()),
        x => x,
    }
}

/// `prost` generates `Debug` implementations that includes the `data` field,
/// which makes logs output unreadable. This `Display` implementation hides
/// fields that we don't want ot display in the logs.
impl std::fmt::Display for Request {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut msg = self.clone();
        msg = match msg {
            Request {
                client_req:
                    Some(request::ClientReq::MakeTableReq(MakeTableReq {
                        ref options,
                        data:
                            Some(MakeTableData {
                                data: Some(ref data),
                            }),
                    })),
                ..
            } => Request {
                client_req: Some(request::ClientReq::MakeTableReq(MakeTableReq {
                    options: options.clone(),
                    data: Some(MakeTableData {
                        data: Some(replace(data.clone())),
                    }),
                })),
                ..msg.clone()
            },
            Request {
                client_req:
                    Some(ClientReq::TableUpdateReq(TableUpdateReq {
                        // data,
                        port_id,
                        data:
                            Some(MakeTableData {
                                data: Some(ref data),
                            }),
                    })),
                ..
            } => Request {
                client_req: Some(ClientReq::TableUpdateReq(TableUpdateReq {
                    port_id,
                    data: Some(MakeTableData {
                        data: Some(replace(data.clone())),
                    }),
                })),
                ..msg.clone()
            },
            x => x,
        };

        write!(f, "{}", serde_json::to_string(&msg).unwrap())
    }
}

impl std::fmt::Display for Response {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut msg = self.clone();
        msg = match msg {
            Response {
                client_resp: Some(ClientResp::ViewToColumnsStringResp(_)),
                ..
            } => Response {
                client_resp: Some(ClientResp::ViewToColumnsStringResp(
                    ViewToColumnsStringResp {
                        json_string: "<< redacted >>".to_owned(),
                    },
                )),
                ..msg.clone()
            },
            x => x,
        };

        write!(f, "{}", serde_json::to_string(&msg).unwrap())
    }
}
