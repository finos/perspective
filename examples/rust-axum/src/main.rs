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

use axum::Router;
use axum::routing::get_service;
use perspective::client::{TableInitOptions, UpdateData};
use perspective::server::Server;
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
type AppError = Box<dyn std::error::Error + Send + Sync>;

/// Load the example Apache Arrow file from disk and create a
/// [`perspective::Table`] named "my_data_source".
async fn load_server_arrow(server: &Server) -> Result<(), AppError> {
    let client = server.new_local_client();
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
/// from the root, while the app's embedded WebAssembly [`perspective::Client`]
/// will connect to this server over a WebSocket via the path `/ws`.
async fn start_web_server_and_block(server: Server) -> Result<(), AppError> {
    let app = Router::new()
        .route("/", get_service(ServeFile::new("src/index.html")))
        .route("/ws", perspective::axum::websocket_handler())
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
async fn main() -> Result<(), AppError> {
    registry()
        .with(layer().compact().with_filter(LevelFilter::INFO))
        .init();

    let server = Server::new(None);
    load_server_arrow(&server).await?;
    start_web_server_and_block(server).await?;
    Ok(())
}
