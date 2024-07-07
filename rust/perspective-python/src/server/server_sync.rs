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

use async_lock::RwLock;
use perspective_server::{Server, Session, SessionHandler};
use pollster::FutureExt;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes};

#[pyclass]
#[derive(Clone)]
pub struct PySyncSession {
    session: Arc<RwLock<Option<Session>>>,
}

#[pyclass]
#[derive(Clone, Default)]
pub struct PySyncServer {
    pub server: Server,
}

#[derive(Clone)]
struct PyConnection(Py<PyAny>);

impl SessionHandler for PyConnection {
    async fn send_response<'a>(
        &'a mut self,
        msg: &'a [u8],
    ) -> Result<(), perspective_server::ServerError> {
        Python::with_gil(|py| self.0.call1(py, (PyBytes::new_bound(py, msg),)))?;
        Ok(())
    }
}

#[pymethods]
impl PySyncServer {
    #[new]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_session(&self, _py: Python, response_cb: Py<PyAny>) -> PySyncSession {
        let session = self
            .server
            .new_session(PyConnection(response_cb))
            .block_on();

        let session = Arc::new(RwLock::new(Some(session)));
        PySyncSession { session }
    }
}

impl PySyncSession {
    fn with_session<F, G>(&self, f_ctx: F) -> PyResult<G>
    where
        F: Fn(&Session) -> G,
    {
        let lock = self.session.read().block_on();
        let val = lock.as_ref().ok_or_else(|| {
            PyValueError::new_err(format!("Session {:?} already deleted", self.session))
        })?;

        Ok(f_ctx(val))
    }
}

#[allow(non_local_definitions)]
#[pymethods]
impl PySyncSession {
    pub fn handle_request(&self, _py: Python<'_>, data: Vec<u8>) -> PyResult<()> {
        // TODO: Make this return a boolean for "should_poll" to determine whether we
        // immediately schedule a poll after this request.
        self.with_session(|session| {
            session
                .handle_request(&data)
                .block_on()
                .map_err(|e| PyValueError::new_err(format!("{}", e)))
        })?
    }

    pub fn poll(&self, _py: Python<'_>) -> PyResult<()> {
        self.with_session(|session| {
            session
                .poll()
                .block_on()
                .map_err(|e| PyValueError::new_err(format!("{}", e)))
        })?
    }

    pub fn close(&self, _py: Python<'_>) -> PyResult<()> {
        let mut lock = self.session.write().block_on();
        lock.take()
            .ok_or_else(|| {
                PyValueError::new_err(format!("Session {:?} already deleted", self.session))
            })?
            .close()
            .block_on();

        Ok(())
    }
}
