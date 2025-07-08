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

use std::pin::pin;
use std::sync::Arc;

use futures::future::BoxFuture;
// use async_lock::RwLock;
use perspective_server::{Server, ServerResult};
use pollster::FutureExt;
use pyo3::IntoPyObjectExt;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::PyAny;

use super::PyAsyncSession;
use super::session_async::PyConnection;
use crate::py_async::AllowThreads;

/// @private
#[pyclass(subclass, module = "perspective")]
#[derive(Clone)]
pub struct AsyncServer {
    pub server: Server,
}

#[pymethods]
impl AsyncServer {
    #[new]
    #[pyo3(signature = (on_poll_request=None))]
    pub fn new(on_poll_request: Option<Py<PyAny>>) -> Self {
        Self {
            server: Server::new(on_poll_request.map(|f| {
                let f = Arc::new(f);
                Arc::new(move |server: &Server| {
                    let f = f.clone();
                    let server = server.clone();
                    Box::pin(async move {
                        Python::with_gil(|py| {
                            f.call1(py, (AsyncServer { server }.into_py_any(py).unwrap(),))
                        })?;
                        Ok(())
                    }) as BoxFuture<'static, ServerResult<()>>
                })
                    as Arc<dyn Fn(&Server) -> BoxFuture<'static, ServerResult<()>> + Send + Sync>
            })),
        }
    }

    pub fn new_session(&self, _py: Python, response_cb: Py<PyAny>) -> PyAsyncSession {
        let session = self
            .server
            .new_session(PyConnection(response_cb.into()))
            .block_on();

        let session = Arc::new(async_lock::RwLock::new(Some(session)));
        PyAsyncSession { session }
    }

    // #[pyo3(signature = (loop_callback=None))]
    // pub fn new_local_client(
    //     &self,
    //     py: Python<'_>,
    //     loop_callback: Option<Py<PyAny>>,
    // ) -> PyResult<crate::client::client_sync::Client> {
    //     let client =
    // crate::client::client_sync::Client(AsyncClient::new_from_client(
    //         self.server
    //             .new_local_client()
    //             .take()
    //             .map_err(PyValueError::new_err)?,
    //     ));

    //     Ok(client)
    // }

    pub async fn poll(&self) -> PyResult<()> {
        AllowThreads(pin!(async move {
            self.server
                .poll()
                .await
                .map_err(|e| PyValueError::new_err(format!("{e}")))
        }))
        .await
    }
}
