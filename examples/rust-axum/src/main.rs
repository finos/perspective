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

use std::fs::File;
use std::io::Read;
use std::net::SocketAddr;

use axum::extract::connect_info::ConnectInfo;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use axum::routing::{get, get_service};
use axum::Router;
use futures::channel::mpsc::{unbounded, UnboundedReceiver, UnboundedSender};
use futures::future::{select, Either};
use futures::{FutureExt, SinkExt, StreamExt};
use perspective::client::{TableInitOptions, UpdateData};
use perspective::server::{LocalSession, Server, Session, SessionHandler};
use perspective::LocalClient;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;
use tracing_subscriber::filter::LevelFilter;
use tracing_subscriber::fmt::layer;
use tracing_subscriber::prelude::*;
use tracing_subscriber::registry;

const ROOT_PATH: &str = "../..";
const ARROW_FILE_PATH: &str = "node_modules/superstore-arrow/superstore.arrow";
const SERVER_ADDRESS: &str = "0.0.0.0:3000";

/// A local error synonym for this module only.
type PerspectiveWSError = Box<dyn std::error::Error + Send + Sync>;

/// We must share access to the [`WebSocket`] for both sending and receiving
/// messages, a message flow which this enum is used to model. When the client
/// disconnects or the message stream is unrecoverably errored, we must emit
/// an _end_ message as well.
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

/// The [`SessionHandler`] implementation provides a method for a [`Session`] to
/// send messages to this [`axum::extract::ws::WebSocket`], which may (or may
/// not) be solicited (e.g. within the async call stack of
/// [`perspective::client::Session::handle_request`]).
impl SessionHandler for PerspectiveWSConnection {
    async fn send_response<'a>(&'a mut self, resp: &'a [u8]) -> Result<(), PerspectiveWSError> {
        Ok(self.0.send(resp.to_vec()).await?)
    }
}

/// The inner message loop handles the full-duplex stream of messages between
/// the [`perspective::client::Client`] and [`Session`]. When this funciton
/// returns, messages are no longer processed.
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
                session.poll().await?
            },
        }
    }

    Ok(())
}

/// This handler is responsible for the beginning-to-end lifecycle of a single
/// WebSocket connection to the Axum server. Messages will come in from the
/// [`axum::extract::ws::WebSocket`] in binary form via [`Message::Binary`],
/// where they'll be routed to [`perspective::client::Session::handle_request`].
/// The server may generate one or more responses, which it will then send back
/// to the [`axum::extract::ws::WebSocket::send`] method via its
/// [`SessionHandler`] impl.
async fn websocket_handler(
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

        session.close().await;
    })
}

/// Load the example Apache Arrow file from disk and create a
/// [`perspective::client::Table`] named "my_data_source".
async fn load_server_arrow(server: &Server) -> Result<(), PerspectiveWSError> {
    let client = LocalClient::new(server);
    let mut file = File::open(std::path::Path::new(ROOT_PATH).join(ARROW_FILE_PATH))?;
    let mut feather = Vec::with_capacity(file.metadata()?.len() as usize);
    file.read_to_end(&mut feather)?;
    let data = UpdateData::Arrow(feather.into());
    let mut options = TableInitOptions::default();
    options.set_name("my_data_source");
    client.table(data.into(), options).await?;
    client.close().await;
    Ok(())
}

/// Host a combination HTTP file server + WebSocket server, which serves a
/// simple Perspective application. The app's HTML, etc., assets are served
/// from the root, while the app's embedded WebAssembly
/// [`perspective::client::Client`] will connect to this server over a WebSocket
/// via the path `/ws`.
async fn start_web_server_and_block(server: Server) -> Result<(), PerspectiveWSError> {
    let app = Router::new()
        .route("/", get_service(ServeFile::new("src/index.html")))
        .route("/ws", get(websocket_handler))
        .fallback_service(ServeDir::new(ROOT_PATH))
        .with_state(server)
        .layer(TraceLayer::new_for_http());

    let service = app.into_make_service_with_connect_info::<SocketAddr>();
    let listener = tokio::net::TcpListener::bind(SERVER_ADDRESS).await?;
    tracing::info!("listening on {}", listener.local_addr()?);
    axum::serve(listener, service).await?;
    Ok(())
}

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), PerspectiveWSError> {
    registry()
        .with(layer().compact().with_filter(LevelFilter::INFO))
        .init();

    let server = Server::default();
    load_server_arrow(&server).await?;
    start_web_server_and_block(server).await?;
    Ok(())
}
