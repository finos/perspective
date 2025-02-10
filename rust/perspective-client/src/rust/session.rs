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

use std::pin::Pin;
use std::sync::Arc;

use futures::Future;
use prost::Message;

use crate::proto::request::ClientReq;
use crate::proto::{Request, Response};
use crate::{Client, ClientError};
#[cfg(doc)]
use crate::{Table, View};

/// The server-side representation of a connection to a [`Client`].
///
/// For each [`Client`] that wants to connect to a `perspective_server::Server`,
/// a dedicated [`Session`] must be created. The [`Session`] handles routing
/// messages emitted by the `perspective_server::Server`ve_server::Server`, as
/// well as owning any resources the [`Client`] may request.
pub trait Session<E> {
    /// Handle an incoming request from the [`Client`]. Calling
    /// [`Session::handle_request`] will result in the `send_response` parameter
    /// which was used to construct this [`Session`] to fire one or more times.
    ///
    /// ```text
    ///                      :
    ///  Client              :   Session
    /// ┏━━━━━━━━━━━━━━━━━━┓ :  ┏━━━━━━━━━━━━━━━━━━━━┓
    /// ┃ send_request     ┃━━━>┃ handle_request (*) ┃
    /// ┃ ..               ┃ :  ┃ ..                 ┃
    /// ┗━━━━━━━━━━━━━━━━━━┛ :  ┗━━━━━━━━━━━━━━━━━━━━┛
    ///                      :
    /// ```
    ///
    /// # Arguments
    ///
    /// - `request` An incoming request message, generated from a
    ///   [`Client::new`]'s `send_request` handler (which may-or-may-not be
    ///   local).
    fn handle_request(&self, request: &[u8]) -> impl Future<Output = Result<(), E>>;

    /// Flush any pending messages which may have resulted from previous
    /// [`Session::handle_request`] calls. Calling [`Session::poll`] may result
    /// in the `send_response` parameter which was used to construct this (or
    /// other) [`Session`] to fire. Whenever a [`Session::handle_request`]
    /// method is invoked for a `perspective_server::Server`, at least one
    /// [`Session::poll`] should be scheduled to clear other clients message
    /// queues.
    ///
    /// ```text
    ///                      :
    ///  Client              :   Session                  Server
    /// ┏━━━━━━━━━━━━━━━━━━┓ :  ┏━━━━━━━━━━━━━━━━━━━┓
    /// ┃ send_request     ┃━┳━>┃ handle_request    ┃    ┏━━━━━━━━━━━━━━━━━━━┓
    /// ┃ ..               ┃ ┗━>┃ poll (*)          ┃━━━>┃ poll (*)          ┃
    /// ┗━━━━━━━━━━━━━━━━━━┛ :  ┃ ..                ┃    ┃ ..                ┃
    ///                      :  ┗━━━━━━━━━━━━━━━━━━━┛    ┗━━━━━━━━━━━━━━━━━━━┛
    /// ```
    fn poll(&self) -> impl Future<Output = Result<(), E>>;

    /// Close this [`Session`], cleaning up any callbacks (e.g. arguments
    /// provided to [`Session::handle_request`]) and resources (e.g. views
    /// returned by a call to [`Table::view`]).
    ///
    /// Dropping a [`Session`] outside of the context of [`Session::close`]
    /// will cause a [`tracing`] error-level log to be emitted, but won't fail.
    /// They will, however, leak.
    fn close(self) -> impl Future<Output = ()>;
}

type ProxyCallback =
    Arc<dyn Fn(&[u8]) -> Result<(), Box<dyn std::error::Error + Send + Sync>> + Send + Sync>;

/// A [`Session`] implementation which tunnels through another [`Client`].
#[derive(Clone)]
pub struct ProxySession {
    parent: Client,
    callback: ProxyCallback,
}

impl ProxySession {
    pub fn new(
        client: Client,
        send_response: impl Fn(&[u8]) -> Result<(), Box<dyn std::error::Error + Send + Sync>>
            + Send
            + Sync
            + 'static,
    ) -> Self {
        ProxySession {
            parent: client,
            callback: Arc::new(send_response),
        }
    }
}

fn encode(response: Response, callback: ProxyCallback) -> Result<(), ClientError> {
    let mut enc = vec![];
    response.encode(&mut enc)?;
    callback(&enc)?;
    Ok(())
}

impl Session<ClientError> for ProxySession {
    async fn handle_request(&self, request: &[u8]) -> Result<(), ClientError> {
        let req = Request::decode(request)?;
        let callback = self.callback.clone();
        match req.client_req.as_ref().unwrap() {
            ClientReq::ViewOnUpdateReq(_) => {
                let on_update = move |response| -> Pin<
                    Box<dyn Future<Output = Result<(), ClientError>> + Send>,
                > {
                    let callback = callback.clone();
                    Box::pin(async move { encode(response, callback) })
                };

                self.parent.subscribe(&req, Box::new(on_update)).await?
            },
            _ => {
                let on_update = move |response| encode(response, callback);
                self.parent
                    .subscribe_once(&req, Box::new(on_update))
                    .await?
            },
        };

        Ok(())
    }

    async fn poll(&self) -> Result<(), ClientError> {
        Ok(())
    }

    async fn close(self) {}
}
