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

use std::collections::HashMap;
use std::future::Future;

use perspective_client::{assert_table_api, assert_view_api, Session};
#[cfg(doc)]
use perspective_client::{config::ViewConfigUpdate, Schema, TableInitOptions, UpdateOptions};
use pollster::FutureExt;
use pyo3::marker::Ungil;
use pyo3::prelude::*;
use pyo3::types::*;

use super::python::*;
use crate::server::PySyncServer;

#[pyclass]
#[derive(Clone)]
pub struct ProxySession(perspective_client::ProxySession);

#[pymethods]
impl ProxySession {
    #[new]
    pub fn new(py: Python<'_>, client: Py<Client>, handle_request: Py<PyAny>) -> PyResult<Self> {
        let callback = {
            move |msg: &[u8]| {
                let msg = msg.to_vec();
                Python::with_gil(|py| {
                    let bytes = PyBytes::new_bound(py, &msg);
                    handle_request.call1(py, (bytes,))?;
                    Ok(())
                })
            }
        };

        Ok(ProxySession(
            perspective_client::ProxySession::new(client.borrow(py).0.client.clone(), callback)
                .py_block_on(py),
        ))
    }

    pub fn handle_request(&self, py: Python<'_>, data: Vec<u8>) -> PyResult<()> {
        self.0.handle_request(&data).py_block_on(py).into_pyerr()?;
        Ok(())
    }

    pub fn poll(&self, py: Python<'_>) -> PyResult<()> {
        self.0.poll().py_block_on(py).into_pyerr()?;
        Ok(())
    }

    pub fn close(&self, py: Python<'_>) -> PyResult<()> {
        self.0.clone().close().py_block_on(py);
        Ok(())
    }
}

trait PyFutureExt: Future {
    fn py_block_on(self, py: Python<'_>) -> Self::Output
    where
        Self: Sized + Send,
        Self::Output: Ungil,
    {
        use pollster::FutureExt;
        py.allow_threads(move || self.block_on())
    }
}

impl<F: Future> PyFutureExt for F {}

#[doc = crate::inherit_docs!("client.md")]
#[pyclass(subclass)]
pub struct Client(pub(crate) PyClient);

#[pymethods]
impl Client {
    #[new]
    pub fn new(handle_request: Py<PyAny>, close_cb: Option<Py<PyAny>>) -> PyResult<Self> {
        let client = PyClient::new(handle_request, close_cb);
        Ok(Client(client))
    }

    #[staticmethod]
    pub fn from_server(
        py: Python<'_>,
        server: Py<PySyncServer>,
        loop_callback: Option<Py<PyAny>>,
    ) -> PyResult<Self> {
        server.borrow(py).new_local_client(loop_callback)
    }

    pub fn handle_response(&self, py: Python<'_>, response: Py<PyBytes>) -> PyResult<bool> {
        self.0.handle_response(response).py_block_on(py)
    }

    #[doc = crate::inherit_docs!("client/table.md")]
    #[pyo3(signature = (input, limit=None, index=None, name=None, format=None))]
    pub fn table(
        &self,
        py: Python<'_>,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
        format: Option<Py<PyString>>,
    ) -> PyResult<Table> {
        Ok(Table(
            self.0
                .table(input, limit, index, name, format)
                .py_block_on(py)?,
        ))
    }

    #[doc = crate::inherit_docs!("client/open_table.md")]
    pub fn open_table(&self, name: String) -> PyResult<Table> {
        let client = self.0.clone();
        let table = client.open_table(name).block_on()?;
        Ok(Table(table))
    }

    #[doc = crate::inherit_docs!("client/get_hosted_table_names.md")]
    pub fn get_hosted_table_names(&self) -> PyResult<Vec<String>> {
        self.0.get_hosted_table_names().block_on()
    }

    #[doc = crate::inherit_docs!("client/set_loop_callback.md")]
    pub fn set_loop_callback(&self, loop_cb: Py<PyAny>) -> PyResult<()> {
        self.0.set_loop_cb(loop_cb).block_on()
    }

    #[doc = crate::inherit_docs!("client/terminate.md")]
    pub fn terminate(&self, py: Python<'_>) -> PyResult<()> {
        self.0.terminate(py).block_on()
    }
}

#[doc = crate::inherit_docs!("table.md")]
#[pyclass(subclass, name = "Table")]
pub struct Table(PyTable);

assert_table_api!(Table);

#[pymethods]
impl Table {
    #[doc = crate::inherit_docs!("table/get_index.md")]
    pub fn get_index(&self) -> Option<String> {
        self.0.get_index().block_on()
    }

    #[doc = crate::inherit_docs!("table/get_client.md")]
    pub fn get_client(&self) -> Client {
        Client(self.0.get_client().block_on())
    }

    #[doc = crate::inherit_docs!("table/get_client.md")]
    pub fn get_limit(&self) -> Option<u32> {
        self.0.get_limit().block_on()
    }

    pub fn get_name(&self) -> String {
        self.0.get_name().block_on()
    }

    #[doc = crate::inherit_docs!("table/clear.md")]
    pub fn clear(&self) -> PyResult<()> {
        self.0.clear().block_on()
    }

    #[doc = crate::inherit_docs!("table/columns.md")]
    pub fn columns(&self) -> PyResult<Vec<String>> {
        self.0.columns().block_on()
    }

    #[doc = crate::inherit_docs!("table/delete.md")]
    pub fn delete(&self) -> PyResult<()> {
        self.0.delete().block_on()
    }

    #[doc = crate::inherit_docs!("table/make_port.md")]
    pub fn make_port(&self) -> PyResult<i32> {
        let table = self.0.clone();
        table.make_port().block_on()
    }

    #[doc = crate::inherit_docs!("table/on_delete.md")]
    pub fn on_delete(&self, callback: Py<PyAny>) -> PyResult<u32> {
        let table = self.0.clone();
        table.on_delete(callback).block_on()
    }

    #[doc = crate::inherit_docs!("table/remove.md")]
    #[pyo3(signature = (input, format=None))]
    pub fn remove(&self, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = self.0.clone();
        table.remove(input, format).block_on()
    }

    #[doc = crate::inherit_docs!("table/remove_delete.md")]
    pub fn remove_delete(&self, callback_id: u32) -> PyResult<()> {
        let table = self.0.clone();
        table.remove_delete(callback_id).block_on()
    }

    #[doc = crate::inherit_docs!("table/schema.md")]
    pub fn schema(&self) -> PyResult<HashMap<String, String>> {
        let table = self.0.clone();
        table.schema().block_on()
    }

    #[doc = crate::inherit_docs!("table/validate_expressions.md")]
    pub fn validate_expressions(&self, expression: Py<PyAny>) -> PyResult<Py<PyAny>> {
        let table = self.0.clone();
        table.validate_expressions(expression).block_on()
    }

    #[doc = crate::inherit_docs!("table/view.md")]
    #[pyo3(signature = (**config))]
    pub fn view(&self, config: Option<Py<PyDict>>) -> PyResult<View> {
        Ok(View(self.0.view(config).block_on()?))
    }

    #[doc = crate::inherit_docs!("table/size.md")]
    pub fn size(&self, py: Python<'_>) -> PyResult<usize> {
        self.0.size().py_block_on(py)
    }

    #[doc = crate::inherit_docs!("table/update.md")]
    #[pyo3(signature = (input, format=None))]
    pub fn replace(&self, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        self.0.replace(input, format).block_on()
    }

    #[doc = crate::inherit_docs!("table/update.md")]
    #[pyo3(signature = (input, port_id=None, format=None))]
    pub fn update(
        &self,
        py: Python<'_>,
        input: Py<PyAny>,
        port_id: Option<u32>,
        format: Option<String>,
    ) -> PyResult<()> {
        self.0.update(input, port_id, format).py_block_on(py)
    }
}

#[doc = crate::inherit_docs!("view.md")]
#[pyclass(subclass, name = "View")]
pub struct View(PyView);

assert_view_api!(View);

#[pymethods]
impl View {
    #[doc = crate::inherit_docs!("view/column_paths.md")]
    pub fn column_paths(&self) -> PyResult<Vec<String>> {
        self.0.column_paths().block_on()
    }

    #[doc = crate::inherit_docs!("view/to_columns_string.md")]
    #[pyo3(signature = (**window))]
    pub fn to_columns_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_columns_string(window).block_on()
    }

    #[doc = crate::inherit_docs!("view/to_json_string.md")]
    #[pyo3(signature = (**window))]
    pub fn to_json_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_json_string(window).block_on()
    }

    #[pyo3(signature = (**window))]
    pub fn to_records<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        let json = self.0.to_json_string(window).block_on()?;
        let json_module = PyModule::import_bound(py, "json")?;
        json_module.call_method1("loads", (json,))
    }

    #[doc = crate::inherit_docs!("view/to_json.md")]
    #[pyo3(signature = (**window))]
    pub fn to_json<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        self.to_records(py, window)
    }

    #[doc = crate::inherit_docs!("view/to_columns.md")]
    #[pyo3(signature = (**window))]
    pub fn to_columns<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        let json = self.0.to_columns_string(window).block_on()?;
        let json_module = PyModule::import_bound(py, "json")?;
        json_module.call_method1("loads", (json,))
    }

    #[doc = crate::inherit_docs!("view/to_csv.md")]
    #[pyo3(signature = (**window))]
    pub fn to_csv(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_csv(window).block_on()
    }

    #[pyo3(signature = (**window))]
    pub fn to_dataframe(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_dataframe(window).block_on()
    }

    #[doc = crate::inherit_docs!("view/to_arrow.md")]
    #[pyo3(signature = (**window))]
    pub fn to_arrow(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        self.0.to_arrow(window).block_on()
    }

    #[doc = crate::inherit_docs!("view/delete.md")]
    pub fn delete(&self) -> PyResult<()> {
        self.0.delete().block_on()
    }

    #[doc = crate::inherit_docs!("view/expand.md")]
    pub fn expand(&self, index: u32) -> PyResult<u32> {
        self.0.expand(index).block_on()
    }

    #[doc = crate::inherit_docs!("view/collapse.md")]
    pub fn collapse(&self, index: u32) -> PyResult<u32> {
        self.0.collapse(index).block_on()
    }

    #[doc = crate::inherit_docs!("view/dimensions.md")]
    pub fn dimensions(&self) -> PyResult<Py<PyAny>> {
        self.0.dimensions().block_on()
    }

    #[doc = crate::inherit_docs!("view/expression_schema.md")]
    pub fn expression_schema(&self) -> PyResult<HashMap<String, String>> {
        self.0.expression_schema().block_on()
    }

    #[doc = crate::inherit_docs!("view/get_config.md")]
    pub fn get_config(&self) -> PyResult<Py<PyAny>> {
        self.0.get_config().block_on()
    }

    #[doc = crate::inherit_docs!("view/get_min_max.md")]
    pub fn get_min_max(&self, column_name: String) -> PyResult<(String, String)> {
        self.0.get_min_max(column_name).block_on()
    }

    #[doc = crate::inherit_docs!("view/num_rows.md")]
    pub fn num_rows(&self) -> PyResult<u32> {
        self.0.num_rows().block_on()
    }

    #[doc = crate::inherit_docs!("view/schema.md")]
    pub fn schema(&self) -> PyResult<HashMap<String, String>> {
        self.0.schema().block_on()
    }

    #[doc = crate::inherit_docs!("view/on_delete.md")]
    pub fn on_delete(&self, callback: Py<PyAny>) -> PyResult<u32> {
        self.0.on_delete(callback).block_on()
    }

    #[doc = crate::inherit_docs!("view/remove_delete.md")]
    pub fn remove_delete(&self, callback_id: u32) -> PyResult<()> {
        self.0.remove_delete(callback_id).block_on()
    }

    #[doc = crate::inherit_docs!("view/on_update.md")]
    pub fn on_update(&self, callback: Py<PyAny>, mode: Option<String>) -> PyResult<u32> {
        self.0.on_update(callback, mode).block_on()
    }

    #[doc = crate::inherit_docs!("view/remove_update.md")]
    pub fn remove_update(&self, callback_id: u32) -> PyResult<()> {
        self.0.remove_update(callback_id).block_on()
    }
}
