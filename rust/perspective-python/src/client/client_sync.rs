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

use perspective_client::{assert_table_api, assert_view_api, ProxySession, Session};
use pollster::FutureExt;
use pyo3::marker::Ungil;
use pyo3::prelude::*;
use pyo3::types::*;

use super::python::*;

#[pyclass]
#[derive(Clone)]
pub struct PySyncProxySession(ProxySession);

#[pymethods]
impl PySyncProxySession {
    #[new]
    pub fn new(
        py: Python<'_>,
        client: Py<PySyncClient>,
        handle_request: Py<PyAny>,
    ) -> PyResult<Self> {
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

        Ok(PySyncProxySession(
            ProxySession::new(client.borrow(py).0.client.clone(), callback).py_block_on(py),
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

#[pyclass(subclass)]
pub struct PySyncClient(PyClient);

#[pymethods]
impl PySyncClient {
    #[new]
    pub fn new(callback: Py<PyAny>) -> PyResult<Self> {
        let client = PyClient::new(callback);
        Ok(PySyncClient(client))
    }

    pub fn handle_response(&self, py: Python<'_>, response: Py<PyBytes>) -> PyResult<bool> {
        self.0.handle_response(response).py_block_on(py)
    }

    #[doc = include_str!("../../docs/table.md")]
    #[pyo3(signature = (input, limit=None, index=None, name=None))]
    pub fn table(
        &self,
        py: Python<'_>,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
    ) -> PyResult<PySyncTable> {
        Ok(PySyncTable(
            self.0.table(input, limit, index, name).py_block_on(py)?,
        ))
    }

    #[doc = include_str!("../../docs/client/open_table.md")]
    pub fn open_table(&self, name: String) -> PyResult<PySyncTable> {
        let client = self.0.clone();
        let table = client.open_table(name).block_on()?;
        Ok(PySyncTable(table))
    }

    #[doc = include_str!("../../docs/client/get_hosted_table_names.md")]
    pub fn get_hosted_table_names(&self) -> PyResult<Vec<String>> {
        self.0.get_hosted_table_names().block_on()
    }

    #[doc = include_str!("../../docs/client/set_loop_callback.md")]
    pub fn set_loop_callback(&self, loop_cb: Py<PyAny>) -> PyResult<()> {
        self.0.set_loop_cb(loop_cb).block_on()
    }
}

#[pyclass(subclass, name = "Table")]
pub struct PySyncTable(PyTable);

assert_table_api!(PySyncTable);

#[pymethods]
impl PySyncTable {
    fn get_index(&self) -> Option<String> {
        self.0.get_index().block_on()
    }

    fn get_client(&self, loop_cb: Option<Py<PyAny>>) -> PySyncClient {
        PySyncClient(self.0.get_client(loop_cb).block_on())
    }

    fn get_limit(&self) -> Option<u32> {
        self.0.get_limit().block_on()
    }

    fn get_name(&self) -> String {
        self.0.get_name().block_on()
    }

    #[doc = include_str!("../../docs/table/clear.md")]
    fn clear(&self) -> PyResult<()> {
        self.0.clear().block_on()
    }

    #[doc = include_str!("../../docs/table/columns.md")]
    fn columns(&self) -> PyResult<Vec<String>> {
        self.0.columns().block_on()
    }

    #[doc = include_str!("../../docs/table/delete.md")]
    fn delete(&self) -> PyResult<()> {
        self.0.delete().block_on()
    }

    #[doc = include_str!("../../docs/table/make_port.md")]
    fn make_port(&self) -> PyResult<i32> {
        let table = self.0.clone();
        table.make_port().block_on()
    }

    #[doc = include_str!("../../docs/table/on_delete.md")]
    fn on_delete(&self, callback: Py<PyAny>) -> PyResult<u32> {
        let table = self.0.clone();
        table.on_delete(callback).block_on()
    }

    #[doc = include_str!("../../docs/table/remove.md")]
    pub fn remove(&self, input: Py<PyAny>) -> PyResult<()> {
        let table = self.0.clone();
        table.remove(input).block_on()
    }

    #[doc = include_str!("../../docs/table/remove_delete.md")]
    fn remove_delete(&self, callback_id: u32) -> PyResult<()> {
        let table = self.0.clone();
        table.remove_delete(callback_id).block_on()
    }

    #[doc = include_str!("../../docs/table/schema.md")]
    fn schema(&self) -> PyResult<HashMap<String, String>> {
        let table = self.0.clone();
        table.schema().block_on()
    }

    #[doc = include_str!("../../docs/table/validate_expressions.md")]
    fn validate_expressions(&self, expression: Py<PyAny>) -> PyResult<Py<PyAny>> {
        let table = self.0.clone();
        table.validate_expressions(expression).block_on()
    }

    #[doc = include_str!("../../docs/table/view.md")]
    #[pyo3(signature = (**config))]
    fn view(&self, config: Option<Py<PyDict>>) -> PyResult<PySyncView> {
        Ok(PySyncView(self.0.view(config).block_on()?))
    }

    #[doc = include_str!("../../docs/table/size.md")]
    fn size(&self, py: Python<'_>) -> PyResult<usize> {
        tracing::error!("WIP");
        self.0.size().py_block_on(py)
    }

    #[doc = include_str!("../../docs/table/update.md")]
    #[pyo3(signature = (input))]
    fn replace(&self, input: Py<PyAny>) -> PyResult<()> {
        self.0.replace(input).block_on()
    }

    #[doc = include_str!("../../docs/table/update.md")]
    #[pyo3(signature = (input, format=None, port_id=None))]
    fn update(
        &self,
        py: Python<'_>,
        input: Py<PyAny>,
        format: Option<String>,
        port_id: Option<u32>,
    ) -> PyResult<()> {
        self.0.update(input, format, port_id).py_block_on(py)
    }
}

#[pyclass(subclass, name = "View")]
pub struct PySyncView(PyView);

assert_view_api!(PySyncView);

#[pymethods]
impl PySyncView {
    #[doc = include_str!("../../docs/view/column_paths.md")]
    fn column_paths(&self) -> PyResult<Vec<String>> {
        self.0.column_paths().block_on()
    }

    #[doc = include_str!("../../docs/view/to_columns_string.md")]
    #[pyo3(signature = (**window))]
    fn to_columns_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_columns_string(window).block_on()
    }

    #[doc = include_str!("../../docs/view/to_json_string.md")]
    #[pyo3(signature = (**window))]
    fn to_json_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_json_string(window).block_on()
    }

    #[pyo3(signature = (**window))]
    fn to_records<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        let json = self.0.to_json_string(window).block_on()?;
        let json_module = PyModule::import_bound(py, "json")?;
        json_module.call_method1("loads", (json,))
    }

    #[pyo3(signature = (**window))]
    fn to_json<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        self.to_records(py, window)
    }

    #[pyo3(signature = (**window))]
    fn to_columns<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        let json = self.0.to_columns_string(window).block_on()?;
        let json_module = PyModule::import_bound(py, "json")?;
        json_module.call_method1("loads", (json,))
    }

    #[doc = include_str!("../../docs/view/to_csv.md")]
    #[pyo3(signature = (**window))]
    fn to_csv(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_csv(window).block_on()
    }

    #[doc = include_str!("../../docs/view/to_csv.md")]
    #[pyo3(signature = (**window))]
    fn to_arrow(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        self.0.to_arrow(window).block_on()
    }

    #[doc = include_str!("../../docs/view/delete.md")]
    fn delete(&self) -> PyResult<()> {
        self.0.delete().block_on()
    }

    #[doc = include_str!("../../docs/view/expand.md")]
    fn expand(&self, index: u32) -> PyResult<u32> {
        self.0.expand(index).block_on()
    }

    #[doc = include_str!("../../docs/view/collapse.md")]
    fn collapse(&self, index: u32) -> PyResult<u32> {
        self.0.collapse(index).block_on()
    }

    #[doc = include_str!("../../docs/view/dimensions.md")]
    fn dimensions(&self) -> PyResult<Py<PyAny>> {
        self.0.dimensions().block_on()
    }

    #[doc = include_str!("../../docs/view/expression_schema.md")]
    fn expression_schema(&self) -> PyResult<HashMap<String, String>> {
        self.0.expression_schema().block_on()
    }

    #[doc = include_str!("../../docs/view/get_config.md")]
    fn get_config(&self) -> PyResult<Py<PyAny>> {
        self.0.get_config().block_on()
    }

    #[doc = include_str!("../../docs/view/get_min_max.md")]
    fn get_min_max(&self, column_name: String) -> PyResult<(String, String)> {
        self.0.get_min_max(column_name).block_on()
    }

    #[doc = include_str!("../../docs/view/num_rows.md")]
    fn num_rows(&self) -> PyResult<u32> {
        self.0.num_rows().block_on()
    }

    #[doc = include_str!("../../docs/view/schema.md")]
    fn schema(&self) -> PyResult<HashMap<String, String>> {
        self.0.schema().block_on()
    }

    #[doc = include_str!("../../docs/view/on_delete.md")]
    fn on_delete(&self, callback: Py<PyAny>) -> PyResult<u32> {
        self.0.on_delete(callback).block_on()
    }

    #[doc = include_str!("../../docs/view/remove_delete.md")]
    fn remove_delete(&self, callback_id: u32) -> PyResult<()> {
        self.0.remove_delete(callback_id).block_on()
    }

    #[doc = include_str!("../../docs/view/on_update.md")]
    fn on_update(&self, callback: Py<PyAny>, mode: Option<String>) -> PyResult<u32> {
        self.0.on_update(callback, mode).block_on()
    }

    #[doc = include_str!("../../docs/view/remove_update.md")]
    fn remove_update(&self, callback_id: u32) -> PyResult<()> {
        self.0.remove_update(callback_id).block_on()
    }
}
