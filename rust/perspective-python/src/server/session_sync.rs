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

// use async_lock::RwLock;
use perspective_client::Session;
use perspective_server::{LocalSession, SessionHandler};
use pollster::FutureExt;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes};

#[pyclass(module = "perspective")]
#[derive(Clone)]
pub struct PySession {
    pub(crate) session: Arc<std::sync::RwLock<Option<LocalSession>>>,
}

#[derive(Clone)]
pub struct PyConnectionSync(pub Arc<Py<PyAny>>);

impl SessionHandler for PyConnectionSync {
    async fn send_response<'a>(
        &'a mut self,
        msg: &'a [u8],
    ) -> Result<(), perspective_server::ServerError> {
        Python::with_gil(move |py| {
            self.0
                .call1(py, (PyBytes::new(py, msg),))
                .map(|_| ())
                .map_err(perspective_server::ServerError::from)
        })?;
        Ok(())
    }
}

impl PySession {
    fn with_session<F, G>(&self, f_ctx: F) -> PyResult<G>
    where
        F: Fn(&LocalSession) -> G,
    {
        let lock = self
            .session
            .read()
            .map_err(|_| PyValueError::new_err("Internal lock error"))?;

        let val = lock.as_ref().ok_or_else(|| {
            PyValueError::new_err(format!("Session {:?} already deleted", self.session))
        })?;

        Ok(f_ctx(val))
    }
}

#[allow(non_local_definitions)]
#[pymethods]
impl PySession {
    pub fn handle_request(&self, py: Python<'_>, data: Vec<u8>) -> PyResult<()> {
        py.allow_threads(|| {
            self.with_session(|session| {
                session
                    .handle_request(&data)
                    .block_on()
                    .map_err(|e| PyValueError::new_err(format!("{e}")))
            })
        })?
    }

    pub fn close(&self, py: Python<'_>) -> PyResult<()> {
        let z = py.allow_threads(|| {
            let lock = self
                .session
                .write()
                .map_err(|_| PyValueError::new_err("Internal lock error"));

            if let Ok(mut lock) = lock {
                lock.take()
            } else {
                None
            }
        });

        z.ok_or_else(|| {
            PyValueError::new_err(format!("Session {:?} already deleted", self.session))
        })?
        .close()
        .block_on();

        Ok(())
    }
}
