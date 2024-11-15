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
use std::str::FromStr;
use std::sync::Arc;

use async_lock::RwLock;
use futures::FutureExt;
use perspective_client::{
    assert_table_api, assert_view_api, clone, Client, OnUpdateMode, OnUpdateOptions, Table,
    TableData, TableInitOptions, TableReadFormat, UpdateData, UpdateOptions, View,
    ViewOnUpdateResp, ViewWindow,
};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes, PyDict, PyString};
use pythonize::depythonize_bound;

use super::pandas::arrow_to_pandas;
use super::polars::arrow_to_polars;
use super::table_data::TableDataExt;
use super::update_data::UpdateDataExt;
use super::{pandas, polars, pyarrow};
use crate::py_err::{PyPerspectiveError, ResultTClientErrorExt};

#[derive(Clone)]
pub struct PyClient {
    pub(crate) client: Client,
    loop_cb: Arc<RwLock<Option<Py<PyAny>>>>,
    close_cb: Option<Py<PyAny>>,
}

impl PyClient {
    pub fn new(handle_request: Py<PyAny>, handle_close: Option<Py<PyAny>>) -> Self {
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
            close_cb: handle_close,
        }
    }

    pub fn new_from_client(client: Client) -> Self {
        PyClient {
            client,
            loop_cb: Arc::default(),
            close_cb: None,
        }
    }

    pub async fn handle_response(&self, bytes: Py<PyBytes>) -> PyResult<bool> {
        self.client
            .handle_response(Python::with_gil(|py| bytes.as_bytes(py)))
            .await
            .into_pyerr()
    }

    pub async fn table(
        &self,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
        format: Option<Py<PyString>>,
    ) -> PyResult<PyTable> {
        let client = self.client.clone();
        let py_client = self.clone();
        let table = Python::with_gil(|py| {
            let mut options = TableInitOptions {
                name: name.map(|x| x.extract::<String>(py)).transpose()?,
                ..TableInitOptions::default()
            };

            let format = TableReadFormat::parse(format.map(|x| x.to_string()))
                .map_err(PyPerspectiveError::new_err)?;

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

            let input_data = if pyarrow::is_arrow_table(py, input.bind(py))? {
                pyarrow::to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else if pandas::is_pandas_df(py, input.bind(py))? {
                pandas::pandas_to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else if polars::is_polars_df(py, input.bind(py))? || polars::is_polars_df(py, input.bind(py))? {
                polars::polars_to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else {
                input
            };

            let table_data = TableData::from_py(py, input_data, format)?;
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

    pub async fn terminate(&self, py: Python<'_>) -> PyResult<()> {
        if let Some(cb) = &self.close_cb {
            cb.call0(py)?;
        }

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

    pub async fn get_client(&self) -> PyClient {
        PyClient {
            client: self.table.get_client(),
            loop_cb: self.client.loop_cb.clone(),
            close_cb: self.client.close_cb.clone(),
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

    pub async fn remove(&self, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = &self.table;
        let format = TableReadFormat::parse(format).map_err(PyPerspectiveError::new_err)?;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input, format))?;
        table.remove(table_data).await.into_pyerr()
    }

    pub async fn replace(&self, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = &self.table;
        let format = TableReadFormat::parse(format).map_err(PyPerspectiveError::new_err)?;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input, format))?;
        table.replace(table_data).await.into_pyerr()
    }

    pub async fn update(
        &self,
        input: Py<PyAny>,
        port_id: Option<u32>,
        format: Option<String>,
    ) -> PyResult<()> {
        let input_data: Py<PyAny> = Python::with_gil(|py| {
            let data = if pyarrow::is_arrow_table(py, input.bind(py))? {
                pyarrow::to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else if pandas::is_pandas_df(py, input.bind(py))? {
                pandas::pandas_to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else if polars::is_polars_df(py, input.bind(py))? || polars::is_polars_lf(py, input.bind(py))?{ 
                polars::polars_to_arrow_bytes(py, input.bind(py))?.to_object(py)
            } else {
                input
            };
            Ok(data) as PyResult<Py<PyAny>>
        })?;

        let table = &self.table;
        let format = TableReadFormat::parse(format).map_err(PyPerspectiveError::new_err)?;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input_data, format))?;
        let options = UpdateOptions { port_id, format };
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

    pub async fn to_dataframe(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        let window: ViewWindow =
            Python::with_gil(|py| window.map(|x| depythonize_bound(x.into_bound(py).into_any())))
                .transpose()?
                .unwrap_or_default();
        let arrow = self.view.to_arrow(window).await.into_pyerr()?;
        Python::with_gil(|py| arrow_to_pandas(py, &arrow))
    }

    pub async fn to_polars(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        let window: ViewWindow =
            Python::with_gil(|py| window.map(|x| depythonize_bound(x.into_bound(py).into_any())))
                .transpose()?
                .unwrap_or_default();
        let arrow = self.view.to_arrow(window).await.into_pyerr()?;
        Python::with_gil(|py| arrow_to_polars(py, &arrow))
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
