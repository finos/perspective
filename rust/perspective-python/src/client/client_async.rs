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

use perspective_client::{assert_table_api, assert_view_api};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyBytes, PyDict, PyFunction, PyString};
use pyo3_asyncio::tokio::future_into_py;

use super::python::*;
use crate::server::PyAsyncServer;

#[pyclass]
pub struct PyAsyncClient(PyClient);

#[pymethods]
impl PyAsyncClient {
    #[doc = include_str!("../../docs/table.md")]
    #[pyo3(signature = (input, limit=None, index=None, name=None))]
    pub fn table<'a>(
        &self,
        py: Python<'a>,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
    ) -> PyResult<&'a PyAny> {
        let client = self.0.clone();
        future_into_py(py, async move {
            let table = client.table(input, limit, index, name).await?;
            Ok(PyAsyncTable(table))
        })
    }

    pub fn open_table<'a>(&self, py: Python<'a>, name: String) -> PyResult<&'a PyAny> {
        let client = self.0.clone();
        future_into_py(py, async move {
            let table = client.open_table(name).await?;
            Ok(PyAsyncTable(table))
        })
    }

    pub fn get_hosted_table_names<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let client = self.0.clone();
        future_into_py(py, async move { client.get_hosted_table_names().await })
    }
}

#[pyfunction]
#[pyo3(name = "create_async_client", signature = (loop_cb, server = None, client_id = None))]
pub fn create_async_client(
    py: Python<'_>,
    loop_cb: Py<PyFunction>,
    server: Option<Py<PyAsyncServer>>,
    client_id: Option<u32>,
) -> PyResult<&'_ PyAny> {
    let server = server.and_then(|x| {
        x.extract::<PyAsyncServer>(py)
            .map_err(|e| {
                tracing::error!("Failed to extract PyAsyncServer: {:?}", e);
            })
            .ok()
    });

    future_into_py(py, async move {
        Ok(PyAsyncClient(PyClient::new(server, client_id, loop_cb)))
    })
}

#[pyclass]
#[repr(transparent)]
pub struct PyAsyncTable(PyTable);

assert_table_api!(PyAsyncTable);

#[pymethods]
impl PyAsyncTable {
    #[doc = include_str!("../../docs/table/columns.md")]
    pub fn columns<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.columns().await })
    }

    #[doc = include_str!("../../docs/table/schema.md")]
    pub fn schema<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.schema().await })
    }

    #[doc = include_str!("../../docs/table/size.md")]
    pub fn size<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.size().await })
    }

    #[doc = include_str!("../../docs/table/update.md")]
    pub fn update<'a>(
        &self,
        py: Python<'a>,
        input: Py<PyAny>,
        format: Option<String>,
        port_id: Option<u32>,
    ) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(
            py,
            async move { table.update(input, format, port_id).await },
        )
    }

    #[doc = include_str!("../../docs/table/delete.md")]
    pub fn delete<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.delete().await })
    }

    #[doc = include_str!("../../docs/table/clear.md")]
    fn clear<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.clear().await })
    }

    #[doc = include_str!("../../docs/table/get_index.md")]
    pub fn get_index<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { Ok(table.get_index().await) })
    }

    #[doc = include_str!("../../docs/table/get_limit.md")]
    pub fn get_limit<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { Ok(table.get_limit().await) })
    }

    #[doc = include_str!("../../docs/table/make_port.md")]
    pub fn make_port<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.make_port().await })
    }

    #[doc = include_str!("../../docs/table/on_delete.md")]
    pub fn on_delete<'a>(&self, py: Python<'a>, callback: Py<PyFunction>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.on_delete(callback).await })
    }

    #[doc = include_str!("../../docs/table/remove_delete.md")]
    pub fn remove_delete<'a>(
        &self,
        py: Python<'a>,
        callback: Py<PyFunction>,
    ) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.remove_delete(callback).await })
    }

    #[doc = include_str!("../../docs/table/remove.md")]
    pub fn remove<'a>(&self, py: Python<'a>, input: Py<PyAny>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.remove(input).await })
    }

    #[doc = include_str!("../../docs/table/replace.md")]
    pub fn replace<'a>(&self, py: Python<'a>, data: Py<PyAny>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(py, async move { table.replace(data).await })
    }

    #[doc = include_str!("../../docs/table/validate_expressions.md")]
    pub fn validate_expressions<'a>(
        &self,
        py: Python<'a>,
        expressions: Py<PyAny>,
    ) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(
            py,
            async move { table.validate_expressions(expressions).await },
        )
    }

    #[doc = include_str!("../../docs/table/view.md")]
    #[pyo3(signature = (**config))]
    pub fn view<'a>(&self, py: Python<'a>, config: Option<Py<PyDict>>) -> PyResult<&'a PyAny> {
        let table = self.0.clone();
        future_into_py(
            py,
            async move { Ok(PyAsyncView(table.view(config).await?)) },
        )
    }
}

#[pyclass]
pub struct PyAsyncView(PyView);

assert_view_api!(PyAsyncView);

#[pymethods]
impl PyAsyncView {
    #[doc = include_str!("../../docs/view/column_paths.md")]
    pub fn column_paths<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.column_paths().await })
    }

    #[doc = include_str!("../../docs/view/to_columns_string.md")]
    pub fn to_columns_string<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.to_columns_string(window).await })
    }

    #[doc = include_str!("../../docs/view/to_json_string.md")]
    pub fn to_json_string<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.to_json_string(window).await })
    }

    #[doc = include_str!("../../docs/view/to_json.md")]
    pub fn to_json<'a>(&self, py: Python<'a>, window: Option<Py<PyDict>>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move {
            let json = view.to_json_string(window).await?;
            Python::with_gil(move |py| {
                let json_module = PyModule::import(py, "json")?;
                json_module
                    .call_method1("loads", (json,))
                    .map(|x| x.to_object(py))
            })
        })
    }

    #[doc = include_str!("../../docs/view/to_columns.md")]
    #[pyo3(signature = (**window))]
    pub fn to_columns<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move {
            let json = view.to_columns_string(window).await?;
            Python::with_gil(move |py| {
                let json_module = PyModule::import(py, "json")?;
                json_module
                    .call_method1("loads", (json,))
                    .map(|x| x.to_object(py))
            })
        })
    }

    #[doc = include_str!("../../docs/view/to_csv.md")]
    #[pyo3(signature = (**window))]
    pub fn to_csv<'a>(&self, py: Python<'a>, window: Option<Py<PyDict>>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.to_csv(window).await })
    }

    #[doc = include_str!("../../docs/view/to_arrow.md")]
    #[pyo3(signature = (**window))]
    pub fn to_arrow<'a>(&self, py: Python<'a>, window: Option<Py<PyDict>>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.to_arrow(window).await })
    }

    #[doc = include_str!("../../docs/view/delete.md")]
    pub fn delete<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.delete().await })
    }

    #[doc = include_str!("../../docs/view/dimensions.md")]
    pub fn dimensions<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.dimensions().await })
    }

    #[doc = include_str!("../../docs/view/expression_schema.md")]
    pub fn expression_schema<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.expression_schema().await })
    }

    #[doc = include_str!("../../docs/view/get_config.md")]
    pub fn get_config<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.get_config().await })
    }

    #[doc = include_str!("../../docs/view/get_min_max.md")]
    pub fn get_min_max<'a>(&self, py: Python<'a>, column_name: String) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.get_min_max(column_name).await })
    }

    #[doc = include_str!("../../docs/view/num_rows.md")]
    pub fn num_rows<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.num_rows().await })
    }

    #[doc = include_str!("../../docs/view/schema.md")]
    pub fn schema<'a>(&self, py: Python<'a>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.schema().await })
    }

    #[doc = include_str!("../../docs/view/on_delete.md")]
    pub fn on_delete<'a>(&self, py: Python<'a>, callback: Py<PyFunction>) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.on_delete(callback).await })
    }

    #[doc = include_str!("../../docs/view/remove_delete.md")]
    pub fn remove_delete<'a>(
        &self,
        py: Python<'a>,
        callback: Py<PyFunction>,
    ) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.remove_delete(callback).await })
    }

    #[doc = include_str!("../../docs/view/on_update.md")]
    pub fn on_update<'a>(
        &self,
        py: Python<'a>,
        callback: Py<PyFunction>,
        mode: Option<String>,
    ) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.on_update(callback, mode).await })
    }

    #[doc = include_str!("../../docs/view/remove_update.md")]
    pub fn remove_update<'a>(&self, py: Python<'a>, callback_id: u32) -> PyResult<&'a PyAny> {
        let view = self.0.clone();
        future_into_py(py, async move { view.remove_update(callback_id).await })
    }
}
