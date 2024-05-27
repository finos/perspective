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

use perspective_client::{assert_table_api, assert_view_api};
use perspective_server::Server;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyBytes, PyDict, PyFunction, PyString};
use pyo3_asyncio::tokio::future_into_py;

use super::python::*;

fn get_arrow_table_cls() -> Option<Py<PyAny>> {
    let res: PyResult<Py<PyAny>> = Python::with_gil(|py| {
        let pyarrow = PyModule::import(py, "pyarrow")?;
        Ok(pyarrow.getattr("Table")?.to_object(py))
    });
    match res {
        Ok(x) => Some(x),
        Err(_) => {
            tracing::warn!("Failed to import pyarrow.Table");
            None
        },
    }
}

fn is_arrow_table(py: Python, table: &PyAny) -> PyResult<bool> {
    if let Some(table_class) = get_arrow_table_cls() {
        table.is_instance(table_class.as_ref(py))
    } else {
        Ok(false)
    }
}

fn to_arrow_bytes(py: Python, table: &PyAny) -> PyResult<Py<PyBytes>> {
    let pyarrow = PyModule::import(py, "pyarrow")?;
    let table_class = get_arrow_table_cls()
        .ok_or_else(|| PyValueError::new_err("Failed to import pyarrow.Table"))?;

    if !table.is_instance(table_class.as_ref(py))? {
        return Err(PyValueError::new_err("Input is not a pyarrow.Table"));
    }

    let sink = pyarrow.call_method0("BufferOutputStream")?;

    {
        let writer =
            pyarrow.call_method1("RecordBatchFileWriter", (sink, table.getattr("schema")?))?;

        writer.call_method1("write_table", (table,))?;
        writer.call_method0("close")?;
    }

    // Get the value from the sink and convert it to Python bytes
    let value = sink.call_method0("getvalue")?;
    let pybytes = value.call_method0("to_pybytes")?.downcast::<PyBytes>()?;

    Ok(pybytes.into())
}

fn get_pandas_df_cls() -> Option<Py<PyAny>> {
    let res: PyResult<Py<PyAny>> = Python::with_gil(|py| {
        let pandas = PyModule::import(py, "pandas")?;
        Ok(pandas.getattr("DataFrame")?.to_object(py))
    });
    match res {
        Ok(x) => Some(x),
        Err(_) => {
            tracing::warn!("Failed to import pandas.DataFrame");
            None
        },
    }
}

fn is_pandas_df(py: Python, df: &PyAny) -> PyResult<bool> {
    if let Some(df_class) = get_pandas_df_cls() {
        df.is_instance(df_class.as_ref(py))
    } else {
        Ok(false)
    }
}

fn pandas_to_arrow_bytes(py: Python, df: &PyAny) -> PyResult<Py<PyBytes>> {
    let pyarrow = PyModule::import(py, "pyarrow")?;
    let df_class = get_pandas_df_cls()
        .ok_or_else(|| PyValueError::new_err("Failed to import pandas.DataFrame"))?;

    if !df.is_instance(df_class.as_ref(py))? {
        return Err(PyValueError::new_err("Input is not a pandas.DataFrame"));
    }

    let table = pyarrow
        .getattr("Table")?
        .call_method1("from_pandas", (df,))?;
    to_arrow_bytes(py, table)
}

#[pyclass]
#[derive(Clone)]
pub struct PyAsyncServer {
    pub server: Server,
}

impl Default for PyAsyncServer {
    fn default() -> Self {
        Self {
            server: Server::new(),
        }
    }
}

#[allow(non_local_definitions)]
#[pymethods]
impl PyAsyncServer {
    #[new]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn global_session_dispatcher(&mut self, py: Python, response_cb: Py<PyFunction>) -> u32 {
        let client_id = self
            .server
            .register_session_cb(Arc::new(move |client_id, resp| {
                let cb = response_cb.clone();
                let resp = resp.clone();
                let res: PyResult<_> =
                    Python::with_gil(move |py| cb.call1(py, (client_id, PyBytes::new(py, &resp))));
                res.expect("Failed to call response callback");
            }));
        client_id
    }

    pub fn cleanup_session_id(&mut self, client_id: u32) {
        self.server.unregister_session_cb(client_id);
    }

    pub fn handle_request<'a>(
        &self,
        py: Python<'a>,
        client_id: u32,
        data: Vec<u8>,
        response_cb: Py<PyFunction>,
    ) -> PyResult<&'a PyAny> {
        let server = self.server.clone();
        server.handle_request(client_id, &data);
        Ok(())
    }

    pub fn poll<'a>(&self, py: Python<'a>, response_cb: Py<PyFunction>) -> PyResult<&'a PyAny> {
        let server = self.server.clone();
        future_into_py(py, async move {
            let batch = server.poll();
            let res: PyResult<Vec<_>> = Python::with_gil(move |py| {
                let python_context = pyo3_asyncio::tokio::get_current_locals(py)?;
                let mut outs = vec![];
                for (client_id, response) in batch {
                    let fut = response_cb.call1(py, (client_id, PyBytes::new(py, &response)))?;
                    let rust_future =
                        pyo3_asyncio::into_future_with_locals(&python_context, fut.as_ref(py))?;
                    outs.push(pyo3_asyncio::tokio::get_runtime().spawn(rust_future))
                }
                Ok(outs)
            });

            for out in res? {
                out.await.expect("Failed joining future")?;
            }

            Ok(())
        })
    }
}

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
        let input_data = if is_arrow_table(py, input.as_ref(py))? {
            to_arrow_bytes(py, input.as_ref(py))?.to_object(py)
        } else if is_pandas_df(py, input.as_ref(py))? {
            pandas_to_arrow_bytes(py, input.as_ref(py))?.to_object(py)
        } else {
            input
        };
        future_into_py(py, async move {
            let table = client.table(input_data, limit, index, name).await?;
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
}

#[pyfunction]
#[pyo3(name = "create_async_client", signature = (server = None))]
pub fn create_async_client(
    py: Python<'_>,
    server: Option<Py<PyAsyncServer>>,
) -> PyResult<&'_ PyAny> {
    let server = server.and_then(|x| {
        x.extract::<PyAsyncServer>(py)
            .map_err(|e| {
                tracing::error!("Failed to extract PyAsyncServer: {:?}", e);
            })
            .ok()
    });

    future_into_py(py, async move { Ok(PyAsyncClient(PyClient::new(server))) })
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
        let input_data = if is_arrow_table(py, input.as_ref(py))? {
            to_arrow_bytes(py, input.as_ref(py))?.to_object(py)
        } else if is_pandas_df(py, input.as_ref(py))? {
            pandas_to_arrow_bytes(py, input.as_ref(py))?.to_object(py)
        } else {
            input
        };
        future_into_py(py, async move {
            table.update(input_data, format, port_id).await
        })
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
        expressions: HashMap<String, String>,
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
