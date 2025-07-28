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

use async_lock::RwLock;
use futures::Future;
use futures::future::BoxFuture;

use crate::ffi;
use crate::local_client::LocalClient;
use crate::local_session::LocalSession;

pub type ServerError = Box<dyn Error + Send + Sync>;

pub type ServerResult<T> = Result<T, ServerError>;

type SessionCallback =
    Arc<dyn for<'a> Fn(&'a [u8]) -> BoxFuture<'a, Result<(), ServerError>> + Send + Sync>;

type OnPollRequestCallback =
    Arc<dyn Fn(&Server) -> BoxFuture<'static, Result<(), ServerError>> + Send + Sync>;

/// Use [`SessionHandler`] to implement a callback for messages emitted from
/// a [`Session`], to be passed to the [`Server::new_session`] constructor.
///
/// Alternatively, a [`Session`] can be created from a closure instead via
/// [`Server::new_session_with_callback`].
pub trait SessionHandler: Send + Sync {
    /// Dispatch a message from a [`Server`] for a the [`Session`] that took
    /// this `SessionHandler` instance as a constructor argument.
    fn send_response<'a>(
        &'a mut self,
        msg: &'a [u8],
    ) -> impl Future<Output = Result<(), ServerError>> + Send + 'a;
}

/// An instance of a Perspective server. Each [`Server`] instance is separate,
/// and does not share [`perspective_client::Table`] (or other) data with other
/// [`Server`]s.
#[derive(Clone)]
pub struct Server {
    pub(crate) server: Arc<ffi::Server>,
    pub(crate) callbacks: Arc<RwLock<HashMap<u32, SessionCallback>>>,
    pub(crate) on_poll_request: Option<OnPollRequestCallback>,
}

impl std::fmt::Debug for Server {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let addr = std::ptr::addr_of!(self);
        write!(f, "Server {addr:?}")?;
        Ok(())
    }
}

impl Server {
    /// Create a new [`Server`].
    ///
    /// # Arguments
    ///
    /// - `on_poll_request` A callback function which the `Server` will invoke
    ///   when there are updates that need to be flushed, after which you must
    ///   _eventually_ call [`Server::poll`] (or else no updates will be
    ///   processed). This optimization allows batching updates, depending on
    ///   context.
    pub fn new(on_poll_request: Option<OnPollRequestCallback>) -> Self {
        let server = Arc::new(ffi::Server::new(on_poll_request.is_some()));
        let callbacks = Arc::default();
        Self {
            server,
            callbacks,
            on_poll_request,
        }
    }

    /// An alternative method for creating a new [`Session`] for this
    /// [`Server`], from a callback closure instead of a via a trait.
    /// See [`Server::new_session`] for details.
    ///
    /// # Arguments
    ///
    /// - `send_response` -  A function invoked by the [`Server`] when a
    ///   response message needs to be sent to the
    ///   [`perspective_client::Client`].
    pub async fn new_session_with_callback<F>(&self, send_response: F) -> LocalSession
    where
        F: for<'a> Fn(&'a [u8]) -> BoxFuture<'a, Result<(), ServerError>> + 'static + Sync + Send,
    {
        let id = self.server.new_session();
        let server = self.clone();
        self.callbacks
            .write()
            .await
            .insert(id, Arc::new(send_response));

        LocalSession {
            id,
            server,
            closed: false,
        }
    }

    /// Create a [`Session`] for this [`Server`], suitable for exactly one
    /// [`perspective_client::Client`] (not necessarily in this process). A
    /// [`Session`] represents the server-side state of a single
    /// client-to-server connection.
    ///
    /// # Arguments
    ///
    /// - `session_handler` - An implementor of [`SessionHandler`] which will be
    ///   invoked by the [`Server`] when a response message needs to be sent to
    ///   the [`Client`]. The response itself should be passed to
    ///   [`Client::handle_response`] eventually, though it may-or-may-not be in
    ///   the same process.
    pub async fn new_session<F>(&self, session_handler: F) -> LocalSession
    where
        F: SessionHandler + 'static + Sync + Send + Clone,
    {
        self.new_session_with_callback(move |msg| {
            let mut session_handler = session_handler.clone();
            Box::pin(async move { session_handler.send_response(msg).await })
        })
        .await
    }

    /// Create a new [`Client`] instance bound to this [`Server`] directly.
    pub fn new_local_client(&self) -> LocalClient {
        LocalClient::new(self)
    }

    /// Flush any pending messages which may have resulted from previous
    /// [`Session::handle_request`] calls.
    ///
    /// [`Server::poll`] only needs to be called if you've implemented
    /// a custom Perspective [`Server`] and provided the `on_poll_request`
    /// constructor keyword argument.
    ///
    /// Calling [`Session::poll`] may result in the `send_response` parameter
    /// which was used to construct this (or other) [`Session`] to fire.
    /// Whenever a [`Session::handle_request`] method is invoked for a
    /// `perspective_server::Server`, at least one [`Session::poll`] should be
    /// scheduled to clear other clients message queues.
    ///
    /// `poll()` _must_ be called after [`Table::update`] or [`Table::remove`]
    /// and `on_poll_request` is notified, or the changes will not be applied.
    pub async fn poll(&self) -> Result<(), ServerError> {
        let responses = self.server.poll();
        let mut results = Vec::with_capacity(responses.size());
        for response in responses.iter_responses() {
            let cb = self
                .callbacks
                .read()
                .await
                .get(&response.client_id())
                .cloned();

            if let Some(f) = cb {
                results.push(f(response.msg()).await);
            }
        }

        results.into_iter().collect()
    }
}
