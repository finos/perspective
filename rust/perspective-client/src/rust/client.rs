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
use std::error::Error;
use std::sync::atomic::AtomicU32;
use std::sync::Arc;

use async_lock::{Mutex, RwLock};
use futures::future::BoxFuture;
use futures::Future;
use nanoid::*;
use prost::Message;
use tracing_unwrap::{OptionExt, ResultExt};

use crate::proto::request::ClientReq;
use crate::proto::response::ClientResp;
use crate::proto::{
    ColumnType, GetFeaturesReq, GetFeaturesResp, GetHostedTablesReq, GetHostedTablesResp,
    HostedTable, MakeTableReq, Request, Response, ServerSystemInfoReq,
};
use crate::table::{SystemInfo, Table, TableInitOptions, TableOptions};
use crate::table_data::{TableData, UpdateData};
use crate::utils::*;
use crate::view::ViewWindow;

/// Metadata about what features are supported by the `Server` this `Client`
/// is connected to.
pub type Features = Arc<GetFeaturesResp>;

impl GetFeaturesResp {
    pub fn default_op(&self, col_type: ColumnType) -> Option<&String> {
        self.filter_ops.get(&(col_type as u32))?.options.first()
    }
}

type BoxFn<I, O> = Box<dyn Fn(I) -> O + Send + Sync + 'static>;

type Subscriptions<C> = Arc<RwLock<HashMap<u32, C>>>;
type OnceCallback = Box<dyn FnOnce(Response) -> ClientResult<()> + Send + Sync + 'static>;
type SendCallback = Arc<
    dyn for<'a> Fn(&'a Request) -> BoxFuture<'a, Result<(), Box<dyn Error + Send + Sync>>>
        + Send
        + Sync
        + 'static,
>;

pub trait ClientHandler: Clone + Send + Sync + 'static {
    fn send_request<'a>(
        &'a self,
        msg: &'a [u8],
    ) -> impl Future<Output = Result<(), Box<dyn Error + Send + Sync>>> + Send;
}

#[derive(Clone)]
#[doc = include_str!("../../docs/client.md")]
pub struct Client {
    features: Arc<Mutex<Option<Features>>>,
    send: SendCallback,
    id_gen: Arc<AtomicU32>,
    subscriptions_once: Subscriptions<OnceCallback>,
    subscriptions: Subscriptions<BoxFn<Response, BoxFuture<'static, Result<(), ClientError>>>>,
}

impl std::fmt::Debug for Client {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Client")
            .field("id_gen", &self.id_gen)
            .finish()
    }
}

impl Client {
    /// Create a new client instance with a closure that handles message
    /// dispatch. See [`Client::new`] for details.
    pub fn new_with_callback<T>(send_request: T) -> Self
    where
        T: for<'a> Fn(&'a [u8]) -> BoxFuture<'a, Result<(), Box<dyn Error + Send + Sync>>>
            + 'static
            + Sync
            + Send,
    {
        let send_request = Arc::new(send_request);
        let send: SendCallback = Arc::new(move |req| {
            let mut bytes: Vec<u8> = Vec::new();
            req.encode(&mut bytes).unwrap();
            let send_request = send_request.clone();
            Box::pin(async move { send_request(&bytes).await })
        });

        Client {
            features: Arc::default(),
            id_gen: Arc::new(AtomicU32::new(1)),
            subscriptions_once: Arc::default(),
            subscriptions: Subscriptions::default(),
            send,
        }
    }

    /// Create a new [`Client`] instance with [`ClientHandler`].
    pub fn new<T>(client_handler: T) -> Self
    where
        T: ClientHandler + 'static + Sync + Send,
    {
        Self::new_with_callback(move |req| {
            let client_handler = client_handler.clone();
            Box::pin(async move { client_handler.send_request(req).await })
        })
    }

    /// Handle a message from the external message queue.
    /// [`Client::handle_response`] is part of the low-level message-handling
    /// API necessary to implement new transports for a [`Client`]
    /// connection to a local-or-remote [`perspective_server::Server`], and
    /// doesn't generally need to be called directly by "users" of a
    /// [`Client`] once connected.
    pub async fn handle_response<'a>(&'a self, msg: &'a [u8]) -> ClientResult<bool> {
        let msg = Response::decode(msg)?;
        tracing::debug!("RECV {}", msg);
        let mut wr = self.subscriptions_once.try_write().unwrap();
        if let Some(handler) = (*wr).remove(&msg.msg_id) {
            drop(wr);
            handler(msg)?;
            return Ok(true);
        } else if let Some(handler) = self.subscriptions.try_read().unwrap().get(&msg.msg_id) {
            drop(wr);
            handler(msg).await?;
            return Ok(true);
        }

        tracing::warn!("Received unsolicited server message");
        Ok(false)
    }

    pub async fn init(&self) -> ClientResult<()> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_owned(),
            client_req: Some(ClientReq::GetFeaturesReq(GetFeaturesReq {})),
        };

        *self.features.lock().await = Some(Arc::new(match self.oneshot(&msg).await? {
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
            .subscriptions
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
        on_update: Box<dyn FnOnce(Response) -> ClientResult<()> + Send + Sync + 'static>,
    ) -> ClientResult<()> {
        self.subscriptions_once
            .try_write()
            .unwrap()
            .insert(msg.msg_id, on_update);

        tracing::debug!("SEND {}", msg);
        Ok((self.send)(msg).await?)
    }

    pub(crate) async fn subscribe(
        &self,
        msg: &Request,
        on_update: BoxFn<Response, BoxFuture<'static, Result<(), ClientError>>>,
    ) -> ClientResult<()> {
        self.subscriptions
            .try_write()
            .unwrap()
            .insert(msg.msg_id, on_update);
        tracing::debug!("SEND {}", msg);
        Ok((self.send)(msg).await?)
    }

    /// Send a `ClientReq` and await both the successful completion of the
    /// `send`, _and_ the `ClientResp` which is returned.
    pub(crate) async fn oneshot(&self, msg: &Request) -> ClientResult<ClientResp> {
        let (sender, receiver) = futures::channel::oneshot::channel::<ClientResp>();
        let on_update = Box::new(move |msg: Response| {
            sender.send(msg.client_resp.unwrap()).map_err(|x| x.into())
        });

        self.subscribe_once(msg, on_update).await?;
        receiver
            .await
            .map_err(|_| ClientError::Unknown("Internal error".to_owned()))
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

        if let TableData::View(view) = &input {
            let window = ViewWindow::default();
            let arrow = view.to_arrow(window).await?;
            let mut table = self
                .crate_table_inner(UpdateData::Arrow(arrow).into(), options.into(), entity_id)
                .await?;

            let callback = {
                let table = table.clone();
                move |update: crate::proto::ViewOnUpdateResp| {
                    let table = table.clone();
                    let update = update.delta.unwrap_or_log();
                    async move {
                        table
                            .update(
                                UpdateData::Arrow(update.into()),
                                crate::UpdateOptions::default(),
                            )
                            .await
                            .unwrap_or_log();
                    }
                }
            };

            let on_update_token = view
                .on_update(callback, crate::view::OnUpdateOptions {
                    mode: Some(crate::view::OnUpdateMode::Row),
                })
                .await?;

            table.view_update_token = Some(on_update_token);
            Ok(table)
        } else {
            self.crate_table_inner(input, options.into(), entity_id)
                .await
        }
    }

    async fn crate_table_inner(
        &self,
        input: TableData,
        options: TableOptions,
        entity_id: String,
    ) -> ClientResult<Table> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: entity_id.clone(),
            client_req: Some(ClientReq::MakeTableReq(MakeTableReq {
                data: Some(input.into()),
                options: Some(options.clone().try_into()?),
            })),
        };

        let client = self.clone();
        match self.oneshot(&msg).await? {
            ClientResp::MakeTableResp(_) => Ok(Table::new(entity_id, client, options)),
            resp => Err(resp.into()),
        }
    }

    async fn get_table_infos(&self) -> ClientResult<Vec<HostedTable>> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_owned(),
            client_req: Some(ClientReq::GetHostedTablesReq(GetHostedTablesReq {})),
        };

        match self.oneshot(&msg).await? {
            ClientResp::GetHostedTablesResp(GetHostedTablesResp { table_infos }) => Ok(table_infos),
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/client/open_table.md")]
    pub async fn open_table(&self, entity_id: String) -> ClientResult<Table> {
        let infos = self.get_table_infos().await?;

        // TODO fix this - name is repeated 2x
        if let Some(info) = infos.into_iter().find(|i| i.entity_id == entity_id) {
            let options = TableOptions {
                index: info.index,
                limit: info.limit,
            };

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

        match self.oneshot(&msg).await? {
            ClientResp::GetHostedTablesResp(GetHostedTablesResp { table_infos }) => {
                Ok(table_infos.into_iter().map(|i| i.entity_id).collect())
            },
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

        match self.oneshot(&msg).await? {
            ClientResp::ServerSystemInfoResp(resp) => Ok(resp.into()),
            resp => Err(resp.into()),
        }
    }
}
