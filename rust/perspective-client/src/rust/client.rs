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
use std::sync::Arc;
use std::sync::atomic::AtomicU32;

use async_lock::{Mutex, RwLock};
use futures::Future;
use futures::future::{BoxFuture, LocalBoxFuture, join_all};
use nanoid::*;
use prost::Message;
use serde::{Deserialize, Serialize};

use crate::proto::request::ClientReq;
use crate::proto::response::ClientResp;
use crate::proto::{
    self, ColumnType, GetFeaturesReq, GetFeaturesResp, GetHostedTablesReq, GetHostedTablesResp,
    HostedTable, MakeTableReq, RemoveHostedTablesUpdateReq, Request, Response, ServerSystemInfoReq,
};
use crate::table::{Table, TableInitOptions, TableOptions};
use crate::table_data::{TableData, UpdateData};
use crate::utils::*;
use crate::view::ViewWindow;
use crate::{OnUpdateMode, OnUpdateOptions, asyncfn, clone};

/// Metadata about the engine runtime (such as total heap utilization).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub heap_size: f64,
}

impl From<proto::ServerSystemInfoResp> for SystemInfo {
    fn from(value: proto::ServerSystemInfoResp) -> Self {
        SystemInfo {
            heap_size: value.heap_size,
        }
    }
}

/// Metadata about what features are supported by the `Server` this `Client`
/// is connected to.
pub type Features = Arc<GetFeaturesResp>;

impl GetFeaturesResp {
    pub fn default_op(&self, col_type: ColumnType) -> Option<&str> {
        self.filter_ops
            .get(&(col_type as u32))?
            .options
            .first()
            .map(|x| x.as_str())
    }
}

type BoxFn<I, O> = Box<dyn Fn(I) -> O + Send + Sync + 'static>;
type Box2Fn<I, J, O> = Box<dyn Fn(I, J) -> O + Send + Sync + 'static>;

type Subscriptions<C> = Arc<RwLock<HashMap<u32, C>>>;
type OnErrorCallback =
    Box2Fn<Option<String>, Option<ReconnectCallback>, BoxFuture<'static, Result<(), ClientError>>>;
type OnceCallback = Box<dyn FnOnce(Response) -> ClientResult<()> + Send + Sync + 'static>;
type SendCallback = Arc<
    dyn for<'a> Fn(&'a Request) -> BoxFuture<'a, Result<(), Box<dyn Error + Send + Sync>>>
        + Send
        + Sync
        + 'static,
>;

pub trait ClientHandler: Clone + Send + Sync + 'static {
    fn send_request(
        &self,
        msg: Vec<u8>,
    ) -> impl Future<Output = Result<(), Box<dyn Error + Send + Sync>>> + Send;
}

#[derive(Clone)]
#[doc = include_str!("../../docs/client.md")]
pub struct Client {
    features: Arc<Mutex<Option<Features>>>,
    send: SendCallback,
    id_gen: Arc<AtomicU32>,
    subscriptions_errors: Subscriptions<OnErrorCallback>,
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

/// The type of the `reconnect` parameter passed to [`Client::handle_error`},
/// and to the callback closure of [`Client::on_error`].
///
/// Calling this function from a [`Client::on_error`] closure should run the
/// (implementation specific) client reconnect logic, e.g. rebindign a
/// websocket.
pub type ReconnectCallback =
    Arc<dyn Fn() -> LocalBoxFuture<'static, Result<(), Box<dyn Error>>> + Send + Sync>;

impl Client {
    /// Create a new client instance with a closure that handles message
    /// dispatch. See [`Client::new`] for details.
    pub fn new_with_callback<T, U>(send_request: T) -> Self
    where
        T: Fn(Vec<u8>) -> U + 'static + Sync + Send,
        U: Future<Output = Result<(), Box<dyn Error + Send + Sync>>> + Send + 'static,
    {
        let send_request = Arc::new(send_request);
        let send: SendCallback = Arc::new(move |req| {
            let mut bytes: Vec<u8> = Vec::new();
            req.encode(&mut bytes).unwrap();
            let send_request = send_request.clone();
            Box::pin(async move { send_request(bytes).await })
        });

        Client {
            features: Arc::default(),
            id_gen: Arc::new(AtomicU32::new(1)),
            send,
            subscriptions: Subscriptions::default(),
            subscriptions_errors: Arc::default(),
            subscriptions_once: Arc::default(),
        }
    }

    /// Create a new [`Client`] instance with [`ClientHandler`].
    pub fn new<T>(client_handler: T) -> Self
    where
        T: ClientHandler + 'static + Sync + Send,
    {
        Self::new_with_callback(asyncfn!(client_handler, async move |req| {
            client_handler.send_request(req).await
        }))
    }

    /// Handle a message from the external message queue.
    /// [`Client::handle_response`] is part of the low-level message-handling
    /// API necessary to implement new transports for a [`Client`]
    /// connection to a local-or-remote `perspective_server::Server`, and
    /// doesn't generally need to be called directly by "users" of a
    /// [`Client`] once connected.
    pub async fn handle_response<'a>(&'a self, msg: &'a [u8]) -> ClientResult<bool> {
        let msg = Response::decode(msg)?;
        tracing::debug!("RECV {}", msg);
        let mut wr = self.subscriptions_once.write().await;
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

    // pub async fn handle_error<T>(
    //     &self,
    //     message: Option<String>,
    //     reconnect: Option<T>,
    // ) -> ClientResult<()>
    // where
    //     T: AsyncFn() -> ClientResult<()> + Clone + Send + Sync + 'static,
    // {
    //     let subs = self.subscriptions_errors.read().await;
    //     let tasks = join_all(subs.values().map(|callback| {
    //         callback(
    //             message.clone(),
    //             reconnect.clone().map(move |f| {
    //                 Arc::new(move || {
    //                     clone!(f);
    //                     Box::pin(async move { Ok(f().await?) }) as
    // LocalBoxFuture<'static, _>                 }) as ReconnectCallback
    //             }),
    //         )
    //     }));

    //     tasks.await.into_iter().collect::<Result<(), _>>()?;
    //     Ok(())
    // }

    pub async fn handle_error<T, U>(
        &self,
        message: Option<String>,
        reconnect: Option<T>,
    ) -> ClientResult<()>
    where
        T: Fn() -> U + Clone + Send + Sync + 'static,
        U: Future<Output = ClientResult<()>>,
    {
        let subs = self.subscriptions_errors.read().await;
        let tasks = join_all(subs.values().map(|callback| {
            callback(
                message.clone(),
                reconnect.clone().map(move |f| {
                    Arc::new(move || {
                        clone!(f);
                        Box::pin(async move { Ok(f().await?) }) as LocalBoxFuture<'static, _>
                    }) as ReconnectCallback
                }),
            )
        }));

        tasks.await.into_iter().collect::<Result<(), _>>()?;
        Ok(())
    }

    pub async fn on_error<T, U, V>(&self, on_error: T) -> ClientResult<u32>
    where
        T: Fn(Option<String>, Option<ReconnectCallback>) -> U + Clone + Send + Sync + 'static,
        U: Future<Output = V> + Send + 'static,
        V: Into<Result<(), ClientError>> + Sync + 'static,
    {
        let id = self.gen_id();
        let callback = asyncfn!(on_error, async move |x, y| on_error(x, y).await.into());
        self.subscriptions_errors
            .write()
            .await
            .insert(id, Box::new(move |x, y| Box::pin(callback(x, y))));

        Ok(id)
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

    pub(crate) async fn unsubscribe(&self, update_id: u32) -> ClientResult<()> {
        let callback = self
            .subscriptions
            .write()
            .await
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
            .write()
            .await
            .insert(msg.msg_id, on_update);

        tracing::debug!("SEND {}", msg);
        if let Err(e) = (self.send)(msg).await {
            self.subscriptions_once.write().await.remove(&msg.msg_id);
            Err(ClientError::Unknown(e.to_string()))
        } else {
            Ok(())
        }
    }

    // pub(crate) async fn subscribe(
    //     &self,
    //     msg: &Request,
    //     on_update: BoxFn<Response, BoxFuture<'static, Result<(), ClientError>>>,
    // ) -> ClientResult<()> {
    //     self.subscriptions
    //         .write()
    //         .await
    //         .insert(msg.msg_id, on_update);
    //     tracing::debug!("SEND {}", msg);
    //     if let Err(e) = (self.send)(msg).await {
    //         self.subscriptions.write().await.remove(&msg.msg_id);
    //         Err(ClientError::Unknown(e.to_string()))
    //     } else {
    //         Ok(())
    //     }
    // }

    pub(crate) async fn subscribe<T, U>(&self, msg: &Request, on_update: T) -> ClientResult<()>
    where
        T: Fn(Response) -> U + Send + Sync + 'static,
        U: Future<Output = Result<(), ClientError>> + Send + 'static,
    {
        self.subscriptions
            .write()
            .await
            .insert(msg.msg_id, Box::new(move |x| Box::pin(on_update(x))));

        tracing::debug!("SEND {}", msg);
        if let Err(e) = (self.send)(msg).await {
            self.subscriptions.write().await.remove(&msg.msg_id);
            Err(ClientError::Unknown(e.to_string()))
        } else {
            Ok(())
        }
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

            let table_ = table.clone();
            let callback = asyncfn!(
                table_,
                update,
                async move |update: crate::proto::ViewOnUpdateResp| {
                    let update = UpdateData::Arrow(update.delta.expect("Malformed message").into());
                    let options = crate::UpdateOptions::default();
                    table_.update(update, options).await.unwrap_or_log();
                }
            );

            let options = OnUpdateOptions {
                mode: Some(OnUpdateMode::Row),
            };

            let on_update_token = view.on_update(callback, options).await?;
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
            client_req: Some(ClientReq::GetHostedTablesReq(GetHostedTablesReq {
                subscribe: false,
            })),
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
            client_req: Some(ClientReq::GetHostedTablesReq(GetHostedTablesReq {
                subscribe: false,
            })),
        };

        match self.oneshot(&msg).await? {
            ClientResp::GetHostedTablesResp(GetHostedTablesResp { table_infos }) => {
                Ok(table_infos.into_iter().map(|i| i.entity_id).collect())
            },
            resp => Err(resp.into()),
        }
    }

    #[doc = include_str!("../../docs/client/on_hosted_tables_update.md")]
    pub async fn on_hosted_tables_update<T, U>(&self, on_update: T) -> ClientResult<u32>
    where
        T: Fn() -> U + Send + Sync + 'static,
        U: Future<Output = ()> + Send + 'static,
    {
        let on_update = Arc::new(on_update);
        let callback = asyncfn!(on_update, async move |resp: Response| {
            match resp.client_resp {
                Some(ClientResp::GetHostedTablesResp(_)) | None => {
                    on_update().await;
                    Ok(())
                },
                resp => Err(ClientError::OptionResponseFailed(resp.into())),
            }
        });

        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_owned(),
            client_req: Some(ClientReq::GetHostedTablesReq(GetHostedTablesReq {
                subscribe: true,
            })),
        };

        self.subscribe(&msg, callback).await?;
        Ok(msg.msg_id)
    }

    #[doc = include_str!("../../docs/client/remove_hosted_tables_update.md")]
    pub async fn remove_hosted_tables_update(&self, update_id: u32) -> ClientResult<()> {
        let msg = Request {
            msg_id: self.gen_id(),
            entity_id: "".to_owned(),
            client_req: Some(ClientReq::RemoveHostedTablesUpdateReq(
                RemoveHostedTablesUpdateReq { id: update_id },
            )),
        };

        self.unsubscribe(update_id).await?;
        match self.oneshot(&msg).await? {
            ClientResp::RemoveHostedTablesUpdateResp(_) => Ok(()),
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
