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

#![doc = include_str!("../docs/lib_gen.md")]

extern crate link_cplusplus;

use std::collections::HashMap;
use std::error::Error;
use std::sync::Arc;

use async_lock::RwLock;
use ffi::Request;
use futures::future::BoxFuture;
use futures::Future;
pub use perspective_client::Session;

mod ffi;

pub type ServerError = Box<dyn Error + Send + Sync>;

type SessionCallback =
    Arc<dyn for<'a> Fn(&'a [u8]) -> BoxFuture<'a, Result<(), ServerError>> + Send + Sync>;

/// Use [`SessionHandler`] to implement a callback for messages emitted from
/// a [`Session`], to be passed to the [`Server::new_session`] constructor.
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
    server: Arc<ffi::Server>,
    callbacks: Arc<RwLock<HashMap<u32, SessionCallback>>>,
}

unsafe impl Send for Server {}
unsafe impl Sync for Server {}

impl std::fmt::Debug for Server {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let addr = std::ptr::addr_of!(self);
        write!(f, "Server {:?}", addr)?;
        Ok(())
    }
}

impl Default for Server {
    fn default() -> Self {
        let server = Arc::new(ffi::Server::new());
        let callbacks = Arc::default();
        Self { server, callbacks }
    }
}

impl Server {
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
}

/// A struct for implementing [`perspective_client::Session`] against an
/// same-process [`Server`] instance. See also
/// [`perspective_client::ProxySession`] for implement the trait against an
/// arbitrary remote transport.
#[derive(Debug)]
pub struct LocalSession {
    id: u32,
    server: Server,
    closed: bool,
}

unsafe impl Send for LocalSession {}
unsafe impl Sync for LocalSession {}

impl Drop for LocalSession {
    fn drop(&mut self) {
        if !self.closed {
            tracing::error!("`Session` dropped without `Session::close`");
        }
    }
}

impl Session<ServerError> for LocalSession {
    async fn handle_request(&self, request: &[u8]) -> Result<(), ServerError> {
        let request = Request::from(request);
        let responses = self.server.server.handle_request(self.id, &request);
        for response in responses.iter_responses() {
            let cb = self
                .server
                .callbacks
                .read()
                .await
                .get(&response.client_id())
                .cloned();

            if let Some(f) = cb {
                f(response.msg()).await?;
            }
        }

        Ok(())
    }

    async fn poll(&self) -> Result<(), ServerError> {
        let responses = self.server.server.poll();
        for response in responses.iter_responses() {
            let cb = self
                .server
                .callbacks
                .read()
                .await
                .get(&response.client_id())
                .cloned();

            if let Some(f) = cb {
                f(response.msg()).await?;
            }
        }

        Ok(())
    }

    async fn close(mut self) {
        self.closed = true;
        self.server.server.close_session(self.id);
        self.server
            .callbacks
            .write()
            .await
            .remove(&self.id)
            .expect("Already closed");
    }
}
