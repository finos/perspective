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

use std::sync::Arc;

use futures::future::BoxFuture;
#[cfg(doc)]
use perspective_client::{Client, Table};
use perspective_server::ServerResult;
use pollster::FutureExt;
use pyo3::IntoPyObjectExt;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::PyAny;

use super::session_sync::{PyConnectionSync, PySession};
use crate::client::client_async::AsyncClient;

/// An instance of a Perspective server. Each [`Server`] instance is separate,
/// and does not share [`Table`] (or other) data with other [`Server`]s.
///
/// # Arguments
///
/// - `on_poll_request` A callback function which the `Server` will invoke when
///   there are updates that need to be flushed, after which you must
///   _eventually_ call [`Server::poll`] (or else no updates will be processed).
///   This optimization allows batching updates, depending on context.
#[pyclass(subclass, module = "perspective")]
#[derive(Clone)]
pub struct Server {
    pub server: perspective_server::Server,
}

#[pymethods]
impl Server {
    #[new]
    #[pyo3(signature = (on_poll_request=None))]
    pub fn new(on_poll_request: Option<Py<PyAny>>) -> Self {
        Self {
            server: perspective_server::Server::new(on_poll_request.map(|f| {
                let f = Arc::new(f);
                Arc::new(move |server: &perspective_server::Server| {
                    let f = f.clone();
                    let server = server.clone();
                    Box::pin(async move {
                        Python::with_gil(|py| {
                            f.call1(py, (Server { server }.into_py_any(py).unwrap(),))
                        })?;
                        Ok(())
                    }) as BoxFuture<'static, ServerResult<()>>
                })
                    as Arc<
                        dyn Fn(&perspective_server::Server) -> BoxFuture<'static, ServerResult<()>>
                            + Send
                            + Sync,
                    >
            })),
        }
    }

    /// Create a new [`Client`] instance bound to this [`Server`] directly.
    pub fn new_local_client(&self) -> PyResult<crate::client::client_sync::Client> {
        let client = crate::client::client_sync::Client(AsyncClient::new_from_client(
            self.server
                .new_local_client()
                .take()
                .map_err(PyValueError::new_err)?,
        ));

        Ok(client)
    }

    /// Create a [`Session`] for this [`Server`], suitable for exactly one
    /// [`Client`] (not necessarily in this process). A  [`Session`] represents
    /// the server-side state of a single client-to-server connection.
    ///
    /// # Arguments
    ///
    /// - `session_handler` - An implementor of [`SessionHandler`] which will be
    ///   invoked by the [`Server`] when a response message needs to be sent to
    ///   the [`Client`]. The response itself should be passed to
    ///   [`Client::handle_response`] eventually, though it may-or-may-not be in
    ///   the same process.
    pub fn new_session(&self, _py: Python, response_cb: Py<PyAny>) -> PySession {
        let session = self
            .server
            .new_session(PyConnectionSync(response_cb.into()))
            .block_on();

        let session = Arc::new(std::sync::RwLock::new(Some(session)));
        PySession { session }
    }

    /// Flush pending updates to this [`Server`], including notifications to
    /// [`View::on_update`] callbacks.
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
    pub fn poll(&self, py: Python<'_>) -> PyResult<()> {
        py.allow_threads(|| {
            self.server
                .poll()
                .block_on()
                .map_err(|e| PyValueError::new_err(format!("{e}")))
        })
    }
}
