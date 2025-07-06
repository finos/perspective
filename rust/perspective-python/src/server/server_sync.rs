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
use perspective_client::Table;
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

    /// Create a new [`Session`] bound to this [`Server`].
    ///
    /// [`Server::new_session`] only needs to be called if you've implemented
    /// a custom Perspective ['Client`]/[`Server`] transport.
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
    /// a custom Perspective ['Client`]/[`Server`] transport and provided the
    /// `on_poll_request` constructor keyword argument.
    pub fn poll(&self, py: Python<'_>) -> PyResult<()> {
        py.allow_threads(|| {
            self.server
                .poll()
                .block_on()
                .map_err(|e| PyValueError::new_err(format!("{}", e)))
        })
    }
}
