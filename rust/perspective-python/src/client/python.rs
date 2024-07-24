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

use std::any::Any;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

use async_lock::RwLock;
use futures::FutureExt;
use perspective_client::proto::ViewOnUpdateResp;
use perspective_client::{
    assert_table_api, assert_view_api, clone, Client, ClientError, OnUpdateMode, OnUpdateOptions,
    Table, TableData, TableInitOptions, UpdateData, UpdateOptions, View, ViewWindow,
};
use pyo3::create_exception;
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes, PyDict, PyList, PyString};
use pythonize::depythonize_bound;

#[derive(Clone)]
pub struct PyClient {
    pub(crate) client: Client,
    loop_cb: Arc<RwLock<Option<Py<PyAny>>>>,
}

#[extend::ext]
pub impl<T> Result<T, ClientError> {
    fn into_pyerr(self) -> PyResult<T> {
        match self {
            Ok(x) => Ok(x),
            Err(x) => Err(PyPerspectiveError::new_err(format!("{}", x))),
        }
    }
}

create_exception!(
    perspective,
    PyPerspectiveError,
    pyo3::exceptions::PyException
);

#[extend::ext]
impl UpdateData {
    fn from_py_partial(py: Python<'_>, input: &Py<PyAny>) -> Result<Option<UpdateData>, PyErr> {
        if let Ok(pybytes) = input.downcast_bound::<PyBytes>(py) {
            Ok(Some(UpdateData::Arrow(
                // TODO need to explicitly qualify this b/c bug in
                // rust-analyzer - should be: just `pybytes.as_bytes()`.
                pyo3::prelude::PyBytesMethods::as_bytes(pybytes)
                    .to_vec()
                    .into(),
            )))
        } else if let Ok(pystring) = input.downcast_bound::<PyString>(py) {
            Ok(Some(UpdateData::Csv(pystring.extract::<String>()?)))
        } else if let Ok(pylist) = input.downcast_bound::<PyList>(py) {
            let json_module = PyModule::import_bound(py, "json")?;
            let string = json_module.call_method("dumps", (pylist,), None)?;
            Ok(Some(UpdateData::JsonRows(string.extract::<String>()?)))
        } else if let Ok(pydict) = input.downcast_bound::<PyDict>(py) {
            if pydict.keys().is_empty() {
                return Err(PyValueError::new_err("Cannot infer type of empty dict"));
            }

            let first_key = pydict.keys().get_item(0)?;
            let first_item = pydict
                .get_item(first_key)?
                .ok_or_else(|| PyValueError::new_err("Bad Input"))?;

            if first_item.downcast::<PyList>().is_ok() {
                let json_module = PyModule::import_bound(py, "json")?;
                let string = json_module.call_method("dumps", (pydict,), None)?;
                Ok(Some(UpdateData::JsonColumns(string.extract::<String>()?)))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    fn from_py(py: Python<'_>, input: &Py<PyAny>) -> Result<UpdateData, PyErr> {
        if let Some(x) = Self::from_py_partial(py, input)? {
            Ok(x)
        } else {
            Err(PyValueError::new_err(format!(
                "Unknown input type {:?}",
                input.type_id()
            )))
        }
    }
}

#[extend::ext]
impl TableData {
    fn from_py(py: Python<'_>, input: Py<PyAny>) -> Result<TableData, PyErr> {
        if let Some(update) = UpdateData::from_py_partial(py, &input)? {
            Ok(TableData::Update(update))
        } else if let Ok(pylist) = input.downcast_bound::<PyList>(py) {
            let json_module = PyModule::import_bound(py, "json")?;
            let string = json_module.call_method("dumps", (pylist,), None)?;
            Ok(UpdateData::JsonRows(string.extract::<String>()?).into())
        } else if let Ok(pydict) = input.downcast_bound::<PyDict>(py) {
            let first_key = pydict.keys().get_item(0)?;
            let first_item = pydict
                .get_item(first_key)?
                .ok_or_else(|| PyValueError::new_err("Bad Input"))?;
            if first_item.downcast::<PyList>().is_ok() {
                let json_module = PyModule::import_bound(py, "json")?;
                let string = json_module.call_method("dumps", (pydict,), None)?;
                Ok(UpdateData::JsonColumns(string.extract::<String>()?).into())
            } else {
                let mut schema = vec![];
                for (key, val) in pydict.into_iter() {
                    schema.push((
                        key.extract::<String>()?,
                        val.extract::<String>()?.as_str().try_into().into_pyerr()?,
                    ));
                }

                Ok(TableData::Schema(schema))
            }
        } else {
            Err(PyValueError::new_err(format!(
                "Unknown input type {:?}",
                input.type_id()
            )))
        }
    }
}

fn get_arrow_table_cls() -> Option<Py<PyAny>> {
    let res: PyResult<Py<PyAny>> = Python::with_gil(|py| {
        let pyarrow = PyModule::import_bound(py, "pyarrow")?;
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

fn is_arrow_table(py: Python, table: &Bound<'_, PyAny>) -> PyResult<bool> {
    if let Some(table_class) = get_arrow_table_cls() {
        table.is_instance(table_class.bind(py))
    } else {
        Ok(false)
    }
}

fn to_arrow_bytes<'py>(
    py: Python<'py>,
    table: &Bound<'py, PyAny>,
) -> PyResult<Bound<'py, PyBytes>> {
    let pyarrow = PyModule::import_bound(py, "pyarrow")?;
    let table_class = get_arrow_table_cls()
        .ok_or_else(|| PyValueError::new_err("Failed to import pyarrow.Table"))?;

    if !table.is_instance(table_class.bind(py))? {
        return Err(PyValueError::new_err("Input is not a pyarrow.Table"));
    }

    let sink = pyarrow.call_method0("BufferOutputStream")?;

    {
        let writer = pyarrow.call_method1(
            "RecordBatchFileWriter",
            (sink.clone(), table.getattr("schema")?),
        )?;

        writer.call_method1("write_table", (table,))?;
        writer.call_method0("close")?;
    }

    // Get the value from the sink and convert it to Python bytes
    let value = sink.call_method0("getvalue")?;
    let obj = value.call_method0("to_pybytes")?;
    let pybytes = obj.downcast_into::<PyBytes>()?;
    Ok(pybytes)
}

fn get_pandas_df_cls(py: Python<'_>) -> Option<Bound<'_, PyAny>> {
    let res: PyResult<Py<PyAny>> = Python::with_gil(|py| {
        let pandas = PyModule::import_bound(py, "pandas")?;
        Ok(pandas.getattr("DataFrame")?.to_object(py))
    });

    match res {
        Ok(x) => Some(x.into_bound(py)),
        Err(_) => {
            tracing::warn!("Failed to import pandas.DataFrame");
            None
        },
    }
}

fn is_pandas_df(py: Python, df: &Bound<'_, PyAny>) -> PyResult<bool> {
    if let Some(df_class) = get_pandas_df_cls(py) {
        df.is_instance(&df_class)
    } else {
        Ok(false)
    }
}

fn pandas_to_arrow_bytes<'py>(
    py: Python<'py>,
    df: &Bound<'py, PyAny>,
) -> PyResult<Bound<'py, PyBytes>> {
    let pyarrow = PyModule::import_bound(py, "pyarrow")?;
    let df_class = get_pandas_df_cls(py)
        .ok_or_else(|| PyValueError::new_err("Failed to import pandas.DataFrame"))?;

    if !df.is_instance(&df_class)? {
        return Err(PyValueError::new_err("Input is not a pandas.DataFrame"));
    }

    let kwargs = PyDict::new_bound(py);
    kwargs.set_item("preserve_index", true)?;

    let table = pyarrow
        .getattr("Table")?
        .call_method("from_pandas", (df,), Some(&kwargs))?;

    // rename from __index_level_0__ to index
    let old_names: Vec<String> = table.getattr("column_names")?.extract()?;
    let mut new_names: Vec<String> = old_names
        .into_iter()
        .map(|e| {
            if e == "__index_level_0__" {
                "index".to_string()
            } else {
                e
            }
        })
        .collect();

    let names = PyList::new_bound(py, new_names.clone());
    let table = table.call_method1("rename_columns", (names,))?;

    // move the index column to be the first column.
    if new_names[new_names.len() - 1] == "index" {
        new_names.rotate_right(1);
        let order = PyList::new_bound(py, new_names);
        let table = table.call_method1("select", (order,))?;
        to_arrow_bytes(py, &table)
    } else {
        to_arrow_bytes(py, &table)
    }
}

impl PyClient {
    pub fn new(handle_request: Py<PyAny>) -> Self {
        let client = Client::new_with_callback({
            move |msg| {
                clone!(handle_request);
                Box::pin(async move {
                    Python::with_gil(move |py| {
                        handle_request.call1(py, (PyBytes::new_bound(py, msg),))
                    })?;

                    Ok(())
                })
            }
        });

        PyClient {
            client,
            loop_cb: Arc::default(),
        }
    }

    pub async fn handle_response(&self, bytes: Py<PyBytes>) -> PyResult<bool> {
        self.client
            .handle_response(Python::with_gil(|py| bytes.as_bytes(py)))
            .await
            .into_pyerr()
    }

    // // TODO
    // pub async fn init(&self) -> PyResult<()> {
    //     self.client.init().await.into_pyerr()
    // }

    pub async fn table(
        &self,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
    ) -> PyResult<PyTable> {
        let client = self.client.clone();
        let py_client = self.clone();
        let table = Python::with_gil(|py| {
            let mut options = TableInitOptions {
                name: name.map(|x| x.extract::<String>(py)).transpose()?,
                ..TableInitOptions::default()
            };

            match (limit, index) {
                (None, None) => {},
                (None, Some(index)) => {
                    options.index = Some(index.extract::<String>(py)?);
                },
                (Some(limit), None) => options.limit = Some(limit),
                (Some(_), Some(_)) => {
                    Err(PyValueError::new_err("Cannot set both `limit` and `index`"))?
                },
            };

            let input_data = if is_arrow_table(py, input.bind(py))? {
                to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else if is_pandas_df(py, input.bind(py))? {
                pandas_to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else {
                input
            };

            let table_data = TableData::from_py(py, input_data)?;
            let table = client.table(table_data, options);
            Ok::<_, PyErr>(table)
        })?;

        let table = table.await.into_pyerr()?;
        Ok(PyTable {
            table: Arc::new(table),
            client: py_client,
        })
    }

    pub async fn open_table(&self, name: String) -> PyResult<PyTable> {
        let client = self.client.clone();
        let py_client = self.clone();
        let table = client.open_table(name).await.into_pyerr()?;
        Ok(PyTable {
            table: Arc::new(table),
            client: py_client,
        })
    }

    pub async fn get_hosted_table_names(&self) -> PyResult<Vec<String>> {
        self.client.get_hosted_table_names().await.into_pyerr()
    }

    pub async fn set_loop_cb(&self, loop_cb: Py<PyAny>) -> PyResult<()> {
        *self.loop_cb.write().await = Some(loop_cb);
        Ok(())
    }
}

#[derive(Clone)]
pub struct PyTable {
    table: Arc<Table>,
    client: PyClient,
}

assert_table_api!(PyTable);

impl PyTable {
    pub async fn get_index(&self) -> Option<String> {
        self.table.get_index()
    }

    pub async fn get_client(&self, loop_cb: Option<Py<PyAny>>) -> PyClient {
        PyClient {
            client: self.table.get_client(),
            loop_cb: Arc::new(RwLock::new(loop_cb)),
        }
    }

    pub async fn get_limit(&self) -> Option<u32> {
        self.table.get_limit()
    }

    pub async fn get_name(&self) -> String {
        self.table.get_name().into()
    }

    pub async fn size(&self) -> PyResult<usize> {
        self.table.size().await.into_pyerr()
    }

    pub async fn columns(&self) -> PyResult<Vec<String>> {
        self.table.columns().await.into_pyerr()
    }

    pub async fn clear(&self) -> PyResult<()> {
        self.table.clear().await.into_pyerr()
    }

    pub async fn delete(&self) -> PyResult<()> {
        self.table.delete().await.into_pyerr()
    }

    pub async fn make_port(&self) -> PyResult<i32> {
        self.table.make_port().await.into_pyerr()
    }

    pub async fn on_delete(&self, callback_py: Py<PyAny>) -> PyResult<u32> {
        let loop_cb = self.client.loop_cb.read().await.clone();
        let callback = {
            let callback_py = callback_py.clone();
            Box::new(move || {
                Python::with_gil(|py| {
                    if let Some(loop_cb) = &loop_cb {
                        loop_cb.call1(py, (&callback_py,))?;
                    } else {
                        callback_py.call0(py)?;
                    }
                    Ok(()) as PyResult<()>
                })
                .expect("`on_delete()` callback failed");
            })
        };

        let callback_id = self.table.on_delete(callback).await.into_pyerr()?;
        Ok(callback_id)
    }

    pub async fn remove_delete(&self, callback_id: u32) -> PyResult<()> {
        self.table.remove_delete(callback_id).await.into_pyerr()
    }

    pub async fn remove(&self, input: Py<PyAny>) -> PyResult<()> {
        let table = &self.table;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input))?;
        table.remove(table_data).await.into_pyerr()
    }

    pub async fn replace(&self, input: Py<PyAny>) -> PyResult<()> {
        let table = &self.table;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input))?;
        table.replace(table_data).await.into_pyerr()
    }

    pub async fn update(
        &self,
        input: Py<PyAny>,
        format: Option<String>,
        port_id: Option<u32>,
    ) -> PyResult<()> {
        let input_data: Py<PyAny> = Python::with_gil(|py| {
            let data = if is_arrow_table(py, input.bind(py))? {
                to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else if is_pandas_df(py, input.bind(py))? {
                pandas_to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else {
                input
            };
            Ok(data) as PyResult<Py<PyAny>>
        })?;

        let table = &self.table;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input_data))?;
        let options = UpdateOptions { format, port_id };
        table.update(table_data, options).await.into_pyerr()?;
        Ok(())
    }

    pub async fn validate_expressions(&self, expressions: Py<PyAny>) -> PyResult<Py<PyAny>> {
        let expressions =
            Python::with_gil(|py| depythonize_bound(expressions.into_bound(py).into_any()))?;
        let records = self
            .table
            .validate_expressions(expressions)
            .await
            .into_pyerr()?;

        Python::with_gil(|py| Ok(pythonize::pythonize(py, &records)?))
    }

    pub async fn schema(&self) -> PyResult<HashMap<String, String>> {
        let schema = self.table.schema().await.into_pyerr()?;
        Ok(schema
            .into_iter()
            .map(|(x, y)| (x, format!("{}", y)))
            .collect())
    }

    pub async fn view(&self, kwargs: Option<Py<PyDict>>) -> PyResult<PyView> {
        let config = kwargs
            .map(|config| {
                Python::with_gil(|py| depythonize_bound(config.into_bound(py).into_any()))
            })
            .transpose()?;

        let view = self.table.view(config).await.into_pyerr()?;
        Ok(PyView {
            view: Arc::new(view),
            client: self.client.clone(),
        })
    }
}

#[derive(Clone)]
pub struct PyView {
    view: Arc<View>,
    client: PyClient,
}

assert_view_api!(PyView);

impl PyView {
    pub async fn column_paths(&self) -> PyResult<Vec<String>> {
        self.view.column_paths().await.into_pyerr()
    }

    pub async fn delete(&self) -> PyResult<()> {
        self.view.delete().await.into_pyerr()
    }

    pub async fn dimensions(&self) -> PyResult<Py<PyAny>> {
        let dim = self.view.dimensions().await.into_pyerr()?;
        Ok(Python::with_gil(|py| pythonize::pythonize(py, &dim))?)
    }

    pub async fn expand(&self, index: u32) -> PyResult<u32> {
        self.view.expand(index).await.into_pyerr()
    }

    pub async fn collapse(&self, index: u32) -> PyResult<u32> {
        self.view.collapse(index).await.into_pyerr()
    }

    pub async fn expression_schema(&self) -> PyResult<HashMap<String, String>> {
        Ok(self
            .view
            .expression_schema()
            .await
            .into_pyerr()?
            .into_iter()
            .map(|(k, v)| (k, format!("{}", v)))
            .collect())
    }

    pub async fn get_config(&self) -> PyResult<Py<PyAny>> {
        let config = self.view.get_config().await.into_pyerr()?;
        Ok(Python::with_gil(|py| pythonize::pythonize(py, &config))?)
    }

    pub async fn get_min_max(&self, name: String) -> PyResult<(String, String)> {
        self.view.get_min_max(name).await.into_pyerr()
    }

    pub async fn num_rows(&self) -> PyResult<u32> {
        self.view.num_rows().await.into_pyerr()
    }

    pub async fn schema(&self) -> PyResult<HashMap<String, String>> {
        Ok(self
            .view
            .schema()
            .await
            .into_pyerr()?
            .into_iter()
            .map(|(k, v)| (k, format!("{}", v)))
            .collect())
    }

    pub async fn on_delete(&self, callback_py: Py<PyAny>) -> PyResult<u32> {
        let callback = {
            let callback_py = callback_py.clone();
            let loop_cb = self.client.loop_cb.read().await.clone();
            Box::new(move || {
                let loop_cb = loop_cb.clone();
                Python::with_gil(|py| {
                    if let Some(loop_cb) = &loop_cb {
                        loop_cb.call1(py, (&callback_py,))?;
                    } else {
                        callback_py.call0(py)?;
                    }

                    Ok(()) as PyResult<()>
                })
                .expect("`on_delete()` callback failed");
            })
        };

        let callback_id = self.view.on_delete(callback).await.into_pyerr()?;
        Ok(callback_id)
    }

    pub async fn remove_delete(&self, callback_id: u32) -> PyResult<()> {
        self.view.remove_delete(callback_id).await.into_pyerr()
    }

    pub async fn on_update(&self, callback: Py<PyAny>, mode: Option<String>) -> PyResult<u32> {
        let loop_cb = self.client.loop_cb.read().await.clone();
        let callback = move |x: ViewOnUpdateResp| {
            let loop_cb = loop_cb.clone();
            let callback = callback.clone();
            async move {
                let aggregate_errors: PyResult<()> = {
                    let callback = callback.clone();
                    Python::with_gil(|py| {
                        match (&x.delta, &loop_cb) {
                            (None, None) => callback.call1(py, (x.port_id,))?,
                            (None, Some(loop_cb)) => loop_cb.call1(py, (&callback, x.port_id))?,
                            (Some(delta), None) => {
                                callback.call1(py, (x.port_id, PyBytes::new_bound(py, delta)))?
                            },
                            (Some(delta), Some(loop_cb)) => loop_cb
                                .call1(py, (callback, x.port_id, PyBytes::new_bound(py, delta)))?,
                        };

                        Ok(())
                    })
                };

                if let Err(err) = aggregate_errors {
                    tracing::warn!("Error in on_update callback: {:?}", err);
                }
            }
            .boxed()
        };

        let mode = mode
            .map(|x| OnUpdateMode::from_str(x.as_str()))
            .transpose()
            .into_pyerr()?;

        self.view
            .on_update(Box::new(callback), OnUpdateOptions { mode })
            .await
            .into_pyerr()
    }

    pub async fn remove_update(&self, callback_id: u32) -> PyResult<()> {
        self.view.remove_update(callback_id).await.into_pyerr()
    }

    pub async fn to_arrow(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        let window: ViewWindow =
            Python::with_gil(|py| window.map(|x| depythonize_bound(x.into_bound(py).into_any())))
                .transpose()?
                .unwrap_or_default();
        let arrow = self.view.to_arrow(window).await.into_pyerr()?;
        Ok(Python::with_gil(|py| PyBytes::new_bound(py, &arrow).into()))
    }

    pub async fn to_csv(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow =
            Python::with_gil(|py| window.map(|x| depythonize_bound(x.into_bound(py).into_any())))
                .transpose()?
                .unwrap_or_default();

        self.view.to_csv(window).await.into_pyerr()
    }

    pub async fn to_columns_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow =
            Python::with_gil(|py| window.map(|x| depythonize_bound(x.into_bound(py).into_any())))
                .transpose()?
                .unwrap_or_default();

        self.view.to_columns_string(window).await.into_pyerr()
    }

    pub async fn to_json_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow =
            Python::with_gil(|py| window.map(|x| depythonize_bound(x.into_bound(py).into_any())))
                .transpose()?
                .unwrap_or_default();

        self.view.to_json_string(window).await.into_pyerr()
    }
}
