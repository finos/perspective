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

// use async_lock::RwLock;
use perspective_client::Session;
use perspective_server::{LocalSession, SessionHandler};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes};

use crate::py_async::{self, AllowThreads};

#[pyclass(module = "perspective")]
#[derive(Clone)]
pub struct PyAsyncSession {
    pub session: Arc<async_lock::RwLock<Option<LocalSession>>>,
}

#[derive(Clone)]
pub struct PyConnection(pub Arc<Py<PyAny>>);

impl SessionHandler for PyConnection {
    async fn send_response<'a>(
        &'a mut self,
        msg: &'a [u8],
    ) -> Result<(), perspective_server::ServerError> {
        Python::with_gil(move |py| {
            self.0
                .call1(py, (PyBytes::new(py, msg),))
                .and_then(|x| py_async::py_into_future(x.into_bound(py)))
        })?
        .await?;

        Ok(())
    }
}

impl PyAsyncSession {
    async fn with_session<F, G>(&self, f_ctx: F) -> PyResult<G>
    where
        F: for<'a> Fn(&'a LocalSession) -> std::pin::Pin<Box<dyn Future<Output = G> + 'a + Send>>,
    {
        let lock = self.session.read().await;
        let val = lock.as_ref().ok_or_else(|| {
            PyValueError::new_err(format!("Session {:?} already deleted", self.session))
        })?;

        Ok(f_ctx(val).await)
    }
}

#[allow(non_local_definitions)]
#[pymethods]
impl PyAsyncSession {
    pub async fn handle_request(&self, data: Vec<u8>) -> PyResult<()> {
        AllowThreads(pin!(self.with_session(move |session| {
            let data = data.clone();
            Box::pin(async move {
                session
                    .handle_request(&data)
                    .await
                    .map_err(|e| PyValueError::new_err(format!("{}", e)))
            })
        })))
        .await?
    }

    pub async fn close(&self) -> PyResult<()> {
        AllowThreads(pin!(async move {
            let mut lock = self.session.write().await;
            lock.take()
                .ok_or_else(|| {
                    PyValueError::new_err(format!("Session {:?} already deleted", self.session))
                })?
                .close()
                .await;

            Ok(())
        }))
        .await
    }
}
