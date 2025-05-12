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

use perspective_client::Session;
use pyo3::exceptions::PyTypeError;
use pyo3::prelude::*;
use pyo3::types::*;

use super::client_async::AsyncClient;
use super::client_sync::{Client as SyncClient, PyFutureExt};
use crate::py_err::ResultTClientErrorExt;

#[pyclass(module = "perspective")]
#[derive(Clone)]
pub struct ProxySession(perspective_client::ProxySession);

#[pymethods]
impl ProxySession {
    /// Construct a proxy session from an AsyncClient or Client object and a
    /// `handle_request` callback.  The callback should ultimately invoke
    /// `handle_request` on another client, passing along the argument
    /// passed to it.
    #[new]
    fn new(py: Python<'_>, client: Py<PyAny>, handle_request: Py<PyAny>) -> PyResult<Self> {
        let client = if let Ok(py_client) = client.downcast_bound::<AsyncClient>(py) {
            py_client.borrow().client.clone()
        } else if let Ok(py_client) = client.downcast_bound::<SyncClient>(py) {
            py_client.borrow().0.client.clone()
        } else {
            return Err(PyTypeError::new_err(
                "ProxySession::new() not passed a Perspective client",
            ));
        };

        let callback = {
            move |msg: &[u8]| {
                let msg = msg.to_vec();
                Python::with_gil(|py| {
                    let bytes = PyBytes::new(py, &msg);
                    handle_request.call1(py, (bytes,))?;
                    Ok(())
                })
            }
        };

        Ok(ProxySession(perspective_client::ProxySession::new(
            client, callback,
        )))
    }

    pub fn handle_request(&self, py: Python<'_>, data: Vec<u8>) -> PyResult<()> {
        self.0.handle_request(&data).py_block_on(py).into_pyerr()?;
        Ok(())
    }

    pub async fn handle_request_async(&self, data: Vec<u8>) -> PyResult<()> {
        self.0.handle_request(&data).await.into_pyerr()?;
        Ok(())
    }

    pub fn close(&self, py: Python<'_>) -> PyResult<()> {
        self.0.clone().close().py_block_on(py);
        Ok(())
    }
}
