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

use std::net::SocketAddr;

use axum::extract::State;
use axum::extract::connect_info::ConnectInfo;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use axum::routing::{MethodRouter, get};
use futures::channel::mpsc::{UnboundedReceiver, UnboundedSender, unbounded};
use futures::future::{Either, select};
use futures::{FutureExt, SinkExt, StreamExt};

use crate::client::Session;
use crate::server::{LocalSession, Server, SessionHandler};

/// A local error synonym for this module only.
type PerspectiveWSError = Box<dyn std::error::Error + Send + Sync>;

/// We must share access to the [`WebSocket`] for both sending and receiving
/// messages, a message flow which this enum is used to model. When the
/// client disconnects or the message stream is unrecoverably errored,
/// we must emit an _end_ message as well.
enum PerspectiveWSMessage {
    Incoming(Vec<u8>),
    Outgoing(Vec<u8>),
    End,
}

/// A new-type wrapper for an [`UnboundedSender`], whic bypasses the orphan
/// instance rule allowing us to write a [`SessionHandler`] impl for this
/// struct.
#[derive(Clone)]
struct PerspectiveWSConnection(UnboundedSender<Vec<u8>>);

/// The [`SessionHandler`] implementation provides a method for a
/// [`Session`] to send messages to this
/// [`axum::extract::ws::WebSocket`], which may (or may
/// not) be solicited (e.g. within the async call stack of
/// [`perspective::Session::handle_request`]).
impl SessionHandler for PerspectiveWSConnection {
    async fn send_response<'a>(&'a mut self, resp: &'a [u8]) -> Result<(), PerspectiveWSError> {
        Ok(self.0.send(resp.to_vec()).await?)
    }
}

/// The inner message loop handles the full-duplex stream of messages
/// between the [`perspective::Client`] and [`Session`]. When this
/// funciton returns, messages are no longer processed.
async fn process_message_loop(
    socket: &mut WebSocket,
    receiver: &mut UnboundedReceiver<Vec<u8>>,
    session: &mut LocalSession,
) -> Result<(), PerspectiveWSError> {
    use Either::*;
    use Message::*;
    use PerspectiveWSMessage::*;

    loop {
        let msg = match select(socket.recv().boxed(), receiver.next()).await {
            Right((Some(bytes), _)) => Ok(Outgoing(bytes)),
            Left((Some(Ok(Binary(bytes))), _)) => Ok(Incoming(bytes)),
            Right((None, _)) | Left((None | Some(Ok(Close(_))), _)) => Ok(End),
            Left((Some(Ok(_)), _)) => Err("Unexpected message type".to_string()),
            Left((Some(Err(err)), _)) => Err(format!("{}", err)),
        }?;

        match msg {
            End => break,
            Outgoing(bytes) => socket.send(Binary(bytes)).await?,
            Incoming(bytes) => {
                session.handle_request(&bytes).await?;
            },
        }
    }

    Ok(())
}

/// This handler is responsible for the beginning-to-end lifecycle of a
/// single WebSocket connection to an [`axum`] server.
///
/// Messages will come in from the [`axum::extract::ws::WebSocket`] in binary
/// form via [`Message::Binary`], where they'll be routed to
/// [`perspective::Session::handle_request`]. The server may generate
/// one or more responses, which it will then send back to
/// the [`axum::extract::ws::WebSocket::send`] method via its
/// [`SessionHandler`] impl.
pub fn websocket_handler() -> MethodRouter<Server> {
    async fn websocket_handler_internal(
        ws: WebSocketUpgrade,
        State(server): State<Server>,
        ConnectInfo(addr): ConnectInfo<SocketAddr>,
    ) -> impl IntoResponse {
        tracing::info!("{addr} Connected.");
        ws.on_upgrade(move |mut socket| async move {
            let (send, mut receiver) = unbounded::<Vec<u8>>();
            let mut session = server.new_session(PerspectiveWSConnection(send)).await;
            if let Err(msg) = process_message_loop(&mut socket, &mut receiver, &mut session).await {
                tracing::error!("Internal error {}", msg);
            }

            tracing::info!("{addr} Disconnected.");
            session.close().await;
        })
    }

    get(websocket_handler_internal)
}
