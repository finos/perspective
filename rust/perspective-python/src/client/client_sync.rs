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

use macro_rules_attribute::apply;
#[cfg(doc)]
use perspective_client::{Schema, TableInitOptions, UpdateOptions, config::ViewConfigUpdate};
use perspective_client::{Session, assert_table_api, assert_view_api};
use pyo3::exceptions::PyTypeError;
use pyo3::marker::Ungil;
use pyo3::prelude::*;
use pyo3::types::*;

use super::client_async::*;
use crate::inherit_doc;
use crate::py_err::ResultTClientErrorExt;
use crate::server::PySyncServer;

#[pyclass(module = "perspective")]
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
                    let bytes = PyBytes::new(py, &msg);
                    handle_request.call1(py, (bytes,))?;
                    Ok(())
                })
            }
        };

        Ok(ProxySession(perspective_client::ProxySession::new(
            client.borrow(py).0.client.clone(),
            callback,
        )))
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

#[apply(inherit_doc)]
#[inherit_doc = "client.md"]
#[pyclass(subclass, module = "perspective")]
pub struct Client(pub(crate) AsyncClient);

#[pymethods]
impl Client {
    #[new]
    #[pyo3(signature = (handle_request, close_cb=None))]
    pub fn new(handle_request: Py<PyAny>, close_cb: Option<Py<PyAny>>) -> PyResult<Self> {
        let client = AsyncClient::new(handle_request, close_cb);
        Ok(Client(client))
    }

    #[staticmethod]
    #[pyo3(signature = (server, loop_callback=None))]
    pub fn from_server(
        py: Python<'_>,
        server: Py<PySyncServer>,
        loop_callback: Option<Py<PyAny>>,
    ) -> PyResult<Self> {
        server.borrow(py).new_local_client(py, loop_callback)
    }

    pub fn handle_response(&self, py: Python<'_>, response: Py<PyBytes>) -> PyResult<bool> {
        self.0.handle_response(response).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "client/table.md"]
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

    #[apply(inherit_doc)]
    #[inherit_doc = "client/open_table.md"]
    pub fn open_table(&self, py: Python<'_>, name: String) -> PyResult<Table> {
        let client = self.0.clone();
        let table = client.open_table(name).py_block_on(py)?;
        Ok(Table(table))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "client/get_hosted_table_names.md"]
    pub fn get_hosted_table_names(&self, py: Python<'_>) -> PyResult<Vec<String>> {
        self.0.get_hosted_table_names().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "client/on_hosted_tables_update.md"]
    pub fn on_hosted_tables_update(&self, py: Python<'_>, callback: Py<PyAny>) -> PyResult<u32> {
        self.0.on_hosted_tables_update(callback).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "client/remove_hosted_tables_update.md"]
    pub fn remove_hosted_tables_update(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        self.0
            .remove_hosted_tables_update(callback_id)
            .py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "client/set_loop_callback.md"]
    pub fn set_loop_callback(&self, py: Python<'_>, loop_cb: Py<PyAny>) -> PyResult<()> {
        self.0.set_loop_callback(loop_cb).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "client/terminate.md"]
    pub fn terminate(&self, py: Python<'_>) -> PyResult<()> {
        self.0.terminate(py)
    }
}

#[pyclass(subclass, name = "Table", module = "perspective")]
pub struct Table(AsyncTable);

assert_table_api!(Table);

#[pymethods]
impl Table {
    #[new]
    fn new() -> PyResult<Self> {
        Err(PyTypeError::new_err(
            "Do not call Table's constructor directly, construct from a Client instance.",
        ))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/get_index.md"]
    pub fn get_index(&self) -> Option<String> {
        self.0.get_index()
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/get_client.md"]
    pub fn get_client(&self, py: Python<'_>) -> Client {
        Client(self.0.get_client().py_block_on(py))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/get_client.md"]
    pub fn get_limit(&self) -> Option<u32> {
        self.0.get_limit()
    }

    pub fn get_name(&self) -> String {
        self.0.get_name()
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/clear.md"]
    pub fn clear(&self, py: Python<'_>) -> PyResult<()> {
        self.0.clear().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/columns.md"]
    pub fn columns(&self, py: Python<'_>) -> PyResult<Vec<String>> {
        self.0.columns().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/delete.md"]
    pub fn delete(&self, py: Python<'_>) -> PyResult<()> {
        self.0.delete().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/make_port.md"]
    pub fn make_port(&self, py: Python<'_>) -> PyResult<i32> {
        let table = self.0.clone();
        table.make_port().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/on_delete.md"]
    pub fn on_delete(&self, py: Python<'_>, callback: Py<PyAny>) -> PyResult<u32> {
        let table = self.0.clone();
        table.on_delete(callback).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/remove.md"]
    #[pyo3(signature = (input, format=None))]
    pub fn remove(&self, py: Python<'_>, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = self.0.clone();
        table.remove(input, format).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/remove_delete.md"]
    pub fn remove_delete(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        let table = self.0.clone();
        table.remove_delete(callback_id).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/schema.md"]
    pub fn schema(&self, py: Python<'_>) -> PyResult<HashMap<String, String>> {
        let table = self.0.clone();
        table.schema().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/validate_expressions.md"]
    pub fn validate_expressions(
        &self,
        py: Python<'_>,
        expression: Py<PyAny>,
    ) -> PyResult<Py<PyAny>> {
        let table = self.0.clone();
        table.validate_expressions(expression).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/view.md"]
    #[pyo3(signature = (**config))]
    pub fn view(&self, py: Python<'_>, config: Option<Py<PyDict>>) -> PyResult<View> {
        Ok(View(self.0.view(config).py_block_on(py)?))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/size.md"]
    pub fn size(&self, py: Python<'_>) -> PyResult<usize> {
        self.0.size().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/update.md"]
    #[pyo3(signature = (input, format=None))]
    pub fn replace(
        &self,
        py: Python<'_>,
        input: Py<PyAny>,
        format: Option<String>,
    ) -> PyResult<()> {
        self.0.replace(input, format).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "table/update.md"]
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

#[apply(inherit_doc)]
#[inherit_doc = "view.md"]
#[pyclass(subclass, name = "View", module = "perspective")]
pub struct View(AsyncView);

assert_view_api!(View);

#[pymethods]
impl View {
    #[new]
    fn new() -> PyResult<Self> {
        Err(PyTypeError::new_err(
            "Do not call View's constructor directly, construct from a Table instance.",
        ))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/column_paths.md"]
    pub fn column_paths(&self, py: Python<'_>) -> PyResult<Vec<String>> {
        self.0.column_paths().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_columns_string.md"]
    #[pyo3(signature = (**window))]
    pub fn to_columns_string(
        &self,
        py: Python<'_>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<String> {
        self.0.to_columns_string(window).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_json_string.md"]
    #[pyo3(signature = (**window))]
    pub fn to_json_string(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_json_string(window).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_ndjson.md"]
    #[pyo3(signature = (**window))]
    pub fn to_ndjson(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_ndjson(window).py_block_on(py)
    }

    #[pyo3(signature = (**window))]
    pub fn to_records<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        let json = self.0.to_json_string(window).py_block_on(py)?;
        let json_module = PyModule::import(py, "json")?;
        json_module.call_method1("loads", (json,))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_json.md"]
    #[pyo3(signature = (**window))]
    pub fn to_json<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        self.to_records(py, window)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_columns.md"]
    #[pyo3(signature = (**window))]
    pub fn to_columns<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        let json = self.0.to_columns_string(window).py_block_on(py)?;
        let json_module = PyModule::import(py, "json")?;
        json_module.call_method1("loads", (json,))
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_csv.md"]
    #[pyo3(signature = (**window))]
    pub fn to_csv(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_csv(window).py_block_on(py)
    }

    #[doc = include_str!("../../docs/client/to_pandas.md")]
    #[pyo3(signature = (**window))]
    // #[deprecated(since="3.2.0", note="Please use `View::to_pandas`")]
    pub fn to_dataframe(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_dataframe(window).py_block_on(py)
    }

    #[doc = include_str!("../../docs/client/to_pandas.md")]
    #[pyo3(signature = (**window))]
    pub fn to_pandas(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_dataframe(window).py_block_on(py)
    }

    #[doc = include_str!("../../docs/client/to_polars.md")]
    #[pyo3(signature = (**window))]
    pub fn to_polars(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_polars(window).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/to_arrow.md"]
    #[pyo3(signature = (**window))]
    pub fn to_arrow(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        self.0.to_arrow(window).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/delete.md"]
    pub fn delete(&self, py: Python<'_>) -> PyResult<()> {
        self.0.delete().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/expand.md"]
    pub fn expand(&self, py: Python<'_>, index: u32) -> PyResult<u32> {
        self.0.expand(index).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/collapse.md"]
    pub fn collapse(&self, py: Python<'_>, index: u32) -> PyResult<u32> {
        self.0.collapse(index).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/dimensions.md"]
    pub fn dimensions(&self, py: Python<'_>) -> PyResult<Py<PyAny>> {
        self.0.dimensions().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/expression_schema.md"]
    pub fn expression_schema(&self, py: Python<'_>) -> PyResult<HashMap<String, String>> {
        self.0.expression_schema().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/get_config.md"]
    pub fn get_config(&self, py: Python<'_>) -> PyResult<Py<PyAny>> {
        self.0.get_config().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/get_min_max.md"]
    pub fn get_min_max(&self, py: Python<'_>, column_name: String) -> PyResult<(String, String)> {
        self.0.get_min_max(column_name).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/num_rows.md"]
    pub fn num_rows(&self, py: Python<'_>) -> PyResult<u32> {
        self.0.num_rows().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/schema.md"]
    pub fn schema(&self, py: Python<'_>) -> PyResult<HashMap<String, String>> {
        self.0.schema().py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/on_delete.md"]
    pub fn on_delete(&self, py: Python<'_>, callback: Py<PyAny>) -> PyResult<u32> {
        self.0.on_delete(callback).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/remove_delete.md"]
    pub fn remove_delete(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        self.0.remove_delete(callback_id).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/on_update.md"]
    #[pyo3(signature = (callback, mode=None))]
    pub fn on_update(
        &self,
        py: Python<'_>,
        callback: Py<PyAny>,
        mode: Option<String>,
    ) -> PyResult<u32> {
        self.0.on_update(callback, mode).py_block_on(py)
    }

    #[apply(inherit_doc)]
    #[inherit_doc = "view/remove_update.md"]
    pub fn remove_update(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        self.0.remove_update(callback_id).py_block_on(py)
    }
}
