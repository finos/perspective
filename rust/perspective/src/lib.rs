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

//! The Rust language bindings for [Perspective](https://perspective.finos.org),
//! a high performance data-visualization and analytics component for the web
//! browser.
//!
//! # Examples
//!
//! A simple example which loads an [Apache Arrow](https://arrow.apache.org/) and
//! computes a "Group By" operation, returning a new Arrow.
//!
//! ```rust
//! use perspective::client::config::ViewConfigUpdate;
//! use perspective::client::{TableInitOptions, UpdateData, ViewWindow};
//! use perspective::server::Server;
//! use perspective::LocalClient;
//!
//! let data = UpdateData::Arrow(arrow_vec_data);
//! let options = TableInitOptions::default();
//! let table = client.table(data.into(), options).await?;
//! let mut view_config = ViewConfigUpdate::default();
//! view_config.group_by = ["CounterParty", "Security"]
//!     .iter()
//!     .map(|x| Some(x.to_string()))
//!     .collect();

//! let view = table.view(Some(view_config)).await?;
//! let arrow = view.to_arrow(ViewWindow::default()).await?;
//! ```

#[cfg(feature = "axum-ws")]
pub mod axum;

use std::ops::Deref;
use std::sync::{Arc, OnceLock};

use async_lock::{RwLock, RwLockReadGuard};
use perspective_client::*;
use perspective_server::*;
pub use {perspective_client as client, perspective_server as server};

#[derive(Clone, Default)]
struct LocalClientState {
    client: Arc<OnceLock<Client>>,
    session: Arc<OnceLock<RwLock<Option<LocalSession>>>>,
    server: Server,
}

impl SessionHandler for LocalClientState {
    async fn send_response<'a>(&'a mut self, msg: &'a [u8]) -> Result<(), ServerError> {
        self.get_client().handle_response(msg).await?;
        Ok(())
    }
}

impl ClientHandler for LocalClientState {
    async fn send_request<'a>(
        &'a self,
        msg: &'a [u8],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let session_lock = self.get_session().await;
        let session = session_lock.as_ref().unwrap();
        session.handle_request(msg).await?;
        session.poll().await?;
        Ok(())
    }
}

impl LocalClientState {
    fn get_client(&self) -> &Client {
        self.client.get_or_init(|| Client::new(self.clone()))
    }

    async fn get_session(&self) -> RwLockReadGuard<'_, Option<LocalSession>> {
        if self.session.get().is_none() {
            let session = self.server.new_session(self.clone()).await;
            self.session
                .get_or_init(|| RwLock::new(Some(session)))
                .read()
                .await
        } else {
            self.session.get().unwrap().read().await
        }
    }
}

/// A [`Client`] specialized for connecting to an in-process [`Server`].
pub struct LocalClient(LocalClientState);

impl Deref for LocalClient {
    type Target = Client;

    fn deref(&self) -> &Self::Target {
        self.0.get_client()
    }
}

impl Drop for LocalClient {
    fn drop(&mut self) {
        if let Some(session) = self.0.session.get() {
            if session.try_read().unwrap().is_some() {
                tracing::error!("`Client` dropped without `Client::close`");
            }
        } else {
            tracing::warn!("`Session` dropped before init");
        }
    }
}

impl LocalClient {
    /// Create a new [`LocalClient`] instance for a [`Server`].
    pub fn new(server: &Server) -> Self {
        let state = LocalClientState {
            server: server.clone(),
            client: Arc::default(),
            session: Arc::default(),
        };

        LocalClient(state)
    }

    /// Close this [`LocalClient`]. Dropping a [`LocalClient`] instead of
    /// calling [`LocalClient::close`] will result in a log error, as this
    /// will leak!
    pub async fn close(self) {
        if let Some(session) = self.0.session.get() {
            session.write().await.take().unwrap().close().await
        } else {
            tracing::warn!("`Session` dropped before init");
        }
    }
}
