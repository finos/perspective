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
    Client, OnUpdateMode, OnUpdateOptions, Table, TableData, TableInitOptions, TableReadFormat,
    UpdateData, UpdateOptions, View, ViewOnUpdateResp, ViewWindow, assert_table_api,
    assert_view_api, asyncfn,
};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes, PyDict, PyString};
use pythonize::depythonize;

use super::pandas::arrow_to_pandas;
use super::polars::arrow_to_polars;
use super::table_data::TableDataExt;
use super::update_data::UpdateDataExt;
use super::{pandas, polars, pyarrow};
use crate::py_err::{PyPerspectiveError, ResultTClientErrorExt};

#[pyclass(module = "perspective")]
#[derive(Clone)]
pub struct AsyncClient {
    pub(crate) client: Client,
    loop_cb: Arc<RwLock<Arc<Option<Py<PyAny>>>>>,
    close_cb: Arc<Option<Py<PyAny>>>,
}

impl AsyncClient {
    pub fn new_from_client(client: Client) -> Self {
        AsyncClient {
            client,
            loop_cb: Arc::default(),
            close_cb: Arc::default(),
        }
    }
}

#[pymethods]
impl AsyncClient {
    #[new]
    #[pyo3(signature=(handle_request, handle_close=None))]
    pub fn new(handle_request: Py<PyAny>, handle_close: Option<Py<PyAny>>) -> Self {
        let handle_request = Arc::new(handle_request);
        let client = Client::new_with_callback(asyncfn!(handle_request, async move |msg| {
            if let Some(fut) = Python::with_gil(move |py| -> PyResult<_> {
                let ret = handle_request.call1(py, (PyBytes::new(py, &msg),))?;
                if isawaitable(ret.bind(py)).unwrap_or(false) {
                    Ok(Some(py_async::py_into_future(ret.into_bound(py))?))
                } else {
                    Ok(None)
                }
            })? {
                fut.await?;
            }

            Ok(())
        }));

        AsyncClient {
            client,
            loop_cb: Arc::default(),
            close_cb: handle_close.into(),
        }
    }

    pub async fn handle_response(&self, bytes: Py<PyBytes>) -> PyResult<bool> {
        self.client
            .handle_response(Python::with_gil(|py| bytes.as_bytes(py)))
            .await
            .into_pyerr()
    }

    #[pyo3(signature=(input, limit=None, index=None, name=None, format=None))]
    pub async fn table(
        &self,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
        format: Option<Py<PyString>>,
    ) -> PyResult<AsyncTable> {
        let client = self.client.clone();
        let py_client = Python::with_gil(|_| self.clone());
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

            let input = input.into_bound(py);
            let input_data = if pyarrow::is_arrow_table(py, &input)? {
                pyarrow::to_arrow_bytes(py, &input)?.into_any()
            } else if pandas::is_pandas_df(py, &input)? {
                pandas::pandas_to_arrow_bytes(py, &input)?.into_any()
            } else if polars::is_polars_df(py, &input)? || polars::is_polars_lf(py, &input)? {
                polars::polars_to_arrow_bytes(py, &input)?.into_any()
            } else {
                input
            };

            let table_data = TableData::from_py(input_data, format)?;
            let table = client.table(table_data, options);
            Ok::<_, PyErr>(table)
        })?;

        let table = table.await.into_pyerr()?;
        Ok(AsyncTable {
            table: Arc::new(table),
            client: py_client,
        })
    }

    pub async fn open_table(&self, name: String) -> PyResult<AsyncTable> {
        let client = self.client.clone();
        let py_client = self.clone();
        let table = client.open_table(name).await.into_pyerr()?;
        Ok(AsyncTable {
            table: Arc::new(table),
            client: py_client,
        })
    }

    pub async fn get_hosted_table_names(&self) -> PyResult<Vec<String>> {
        self.client.get_hosted_table_names().await.into_pyerr()
    }

    pub async fn on_hosted_tables_update(&self, callback_py: Py<PyAny>) -> PyResult<u32> {
        let locked_val = self.loop_cb.read().await.clone();
        let loop_cb = Python::with_gil(|py| (*locked_val).as_ref().map(|v| Py::clone_ref(v, py)));
        let callback = Box::new(move || {
            let loop_cb = Python::with_gil(|py| loop_cb.as_ref().map(|v| Py::clone_ref(v, py)));
            let callback = Python::with_gil(|py| Py::clone_ref(&callback_py, py));
            async move {
                let aggregate_errors: PyResult<()> = {
                    let callback = Python::with_gil(|py| Py::clone_ref(&callback, py));
                    Python::with_gil(|py| {
                        match &loop_cb {
                            None => callback.call0(py)?,
                            Some(loop_cb) => loop_cb.call1(py, (&callback,))?,
                        };

                        Ok(())
                    })
                };

                // TODO These are unrecoverable errors - we should mark them as such
                if let Err(err) = aggregate_errors {
                    tracing::warn!("Error in on_hosted_tables_update callback: {:?}", err);
                }
            }
            .boxed()
        });

        let callback_id = self
            .client
            .on_hosted_tables_update(callback)
            .await
            .into_pyerr()?;
        Ok(callback_id)
    }

    pub async fn remove_hosted_tables_update(&self, id: u32) -> PyResult<()> {
        self.client
            .remove_hosted_tables_update(id)
            .await
            .into_pyerr()
    }

    pub async fn set_loop_callback(&self, loop_cb: Py<PyAny>) -> PyResult<()> {
        *self.loop_cb.write().await = Some(loop_cb).into();
        Ok(())
    }

    pub fn terminate(&self, py: Python<'_>) -> PyResult<()> {
        if let Some(cb) = &*self.close_cb {
            cb.call0(py)?;
        }

        Ok(())
    }
}

#[pyclass]
#[derive(Clone)]
pub struct AsyncTable {
    table: Arc<Table>,
    client: AsyncClient,
}

assert_table_api!(AsyncTable);

#[pymethods]
impl AsyncTable {
    pub fn get_index(&self) -> Option<String> {
        self.table.get_index()
    }

    pub async fn get_client(&self) -> AsyncClient {
        AsyncClient {
            client: self.table.get_client(),
            loop_cb: self.client.loop_cb.clone(),
            close_cb: self.client.close_cb.clone(),
        }
    }

    pub fn get_limit(&self) -> Option<u32> {
        self.table.get_limit()
    }

    pub fn get_name(&self) -> String {
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
        let loop_cb = (*self.client.loop_cb.read().await).clone();
        let callback = {
            let callback_py = Python::with_gil(|py| Py::clone_ref(&callback_py, py));
            Box::new(move || {
                Python::with_gil(|py| {
                    if let Some(loop_cb) = &*loop_cb {
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

    #[pyo3(signature=(input, format=None))]
    pub async fn remove(&self, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = &self.table;
        let format = TableReadFormat::parse(format).map_err(PyPerspectiveError::new_err)?;
        let table_data = Python::with_gil(|py| UpdateData::from_py(input.into_bound(py), format))?;
        table.remove(table_data).await.into_pyerr()
    }

    #[pyo3(signature=(input, format=None))]
    pub async fn replace(&self, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = &self.table;
        let format = TableReadFormat::parse(format).map_err(PyPerspectiveError::new_err)?;
        let table_data = Python::with_gil(|py| UpdateData::from_py(input.into_bound(py), format))?;
        table.replace(table_data).await.into_pyerr()
    }

    #[pyo3(signature=(input, port_id=None, format=None))]
    pub async fn update(
        &self,
        input: Py<PyAny>,
        port_id: Option<u32>,
        format: Option<String>,
    ) -> PyResult<()> {
        let input_data: Py<PyAny> = Python::with_gil(|py| {
            let input = input.into_bound(py);
            let data = if pyarrow::is_arrow_table(py, &input)? {
                pyarrow::to_arrow_bytes(py, &input)?.into_any()
            } else if pandas::is_pandas_df(py, &input)? {
                pandas::pandas_to_arrow_bytes(py, &input)?.into_any()
            } else if polars::is_polars_df(py, &input)? || polars::is_polars_lf(py, &input)? {
                polars::polars_to_arrow_bytes(py, &input)?.into_any()
            } else {
                input
            };
            Ok(data.unbind()) as PyResult<Py<PyAny>>
        })?;

        let table = &self.table;
        let format = TableReadFormat::parse(format).map_err(PyPerspectiveError::new_err)?;
        let table_data =
            Python::with_gil(|py| UpdateData::from_py(input_data.into_bound(py), format))?;
        let options = UpdateOptions { port_id, format };
        table.update(table_data, options).await.into_pyerr()?;
        Ok(())
    }

    pub async fn validate_expressions(&self, expressions: Py<PyAny>) -> PyResult<Py<PyAny>> {
        let expressions = Python::with_gil(|py| depythonize(expressions.bind(py)))?;
        let records = self
            .table
            .validate_expressions(expressions)
            .await
            .into_pyerr()?;

        Python::with_gil(|py| Ok(pythonize::pythonize(py, &records)?.unbind()))
    }

    pub async fn schema(&self) -> PyResult<HashMap<String, String>> {
        let schema = self.table.schema().await.into_pyerr()?;
        Ok(schema
            .into_iter()
            .map(|(x, y)| (x, format!("{}", y)))
            .collect())
    }

    #[pyo3(signature = (**kwargs))]
    pub async fn view(&self, kwargs: Option<Py<PyDict>>) -> PyResult<AsyncView> {
        let config = kwargs
            .map(|config| Python::with_gil(|py| depythonize(config.bind(py))))
            .transpose()?;

        let view = self.table.view(config).await.into_pyerr()?;
        Ok(AsyncView {
            view: Arc::new(view),
            client: self.client.clone(),
        })
    }
}

#[pyclass]
#[derive(Clone)]
pub struct AsyncView {
    view: Arc<View>,
    client: AsyncClient,
}

assert_view_api!(AsyncView);

#[pymethods]
impl AsyncView {
    pub async fn column_paths(&self) -> PyResult<Vec<String>> {
        self.view.column_paths().await.into_pyerr()
    }

    pub async fn delete(&self) -> PyResult<()> {
        self.view.delete().await.into_pyerr()
    }

    pub async fn dimensions(&self) -> PyResult<Py<PyAny>> {
        let dim = self.view.dimensions().await.into_pyerr()?;
        Python::with_gil(|py| Ok(pythonize::pythonize(py, &dim)?.unbind()))
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
        Python::with_gil(|py| Ok(pythonize::pythonize(py, &config)?.unbind()))
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
            let callback_py = Arc::new(callback_py);
            let loop_cb = self.client.loop_cb.read().await.clone();
            Box::new(move || {
                let loop_cb = loop_cb.clone();
                Python::with_gil(|py| {
                    if let Some(loop_cb) = &*loop_cb {
                        loop_cb.call1(py, (&*callback_py,))?;
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

    #[pyo3(signature=(callback, mode=None))]
    pub async fn on_update(&self, callback: Py<PyAny>, mode: Option<String>) -> PyResult<u32> {
        let locked_val = self.client.loop_cb.read().await.clone();
        let loop_cb = Python::with_gil(|py| (*locked_val).as_ref().map(|v| Py::clone_ref(v, py)));
        let callback = move |x: ViewOnUpdateResp| {
            let loop_cb = Python::with_gil(|py| loop_cb.as_ref().map(|v| Py::clone_ref(v, py)));
            let callback = Python::with_gil(|py| Py::clone_ref(&callback, py));
            async move {
                let aggregate_errors: PyResult<()> = {
                    let callback = Python::with_gil(|py| Py::clone_ref(&callback, py));
                    Python::with_gil(|py| {
                        match (&x.delta, &loop_cb) {
                            (None, None) => callback.call1(py, (x.port_id,))?,
                            (None, Some(loop_cb)) => loop_cb.call1(py, (&callback, x.port_id))?,
                            (Some(delta), None) => {
                                callback.call1(py, (x.port_id, PyBytes::new(py, delta)))?
                            },
                            (Some(delta), Some(loop_cb)) => {
                                loop_cb.call1(py, (callback, x.port_id, PyBytes::new(py, delta)))?
                            },
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

    #[pyo3(signature=(window=None))]
    pub async fn to_dataframe(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();
        let arrow = self.view.to_arrow(window).await.into_pyerr()?;
        Python::with_gil(|py| arrow_to_pandas(py, &arrow))
    }

    #[pyo3(signature=(window=None))]
    pub async fn to_polars(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();
        let arrow = self.view.to_arrow(window).await.into_pyerr()?;
        Python::with_gil(|py| arrow_to_polars(py, &arrow))
    }

    #[pyo3(signature=(window=None))]
    pub async fn to_arrow(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();
        let arrow = self.view.to_arrow(window).await.into_pyerr()?;
        Ok(Python::with_gil(|py| PyBytes::new(py, &arrow).into()))
    }

    #[pyo3(signature=(window=None))]
    pub async fn to_csv(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();

        self.view.to_csv(window).await.into_pyerr()
    }

    #[pyo3(signature=(window=None))]
    pub async fn to_columns_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();

        self.view.to_columns_string(window).await.into_pyerr()
    }

    #[pyo3(signature=(window=None))]
    pub async fn to_json_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();

        self.view.to_json_string(window).await.into_pyerr()
    }

    #[pyo3(signature=(window=None))]
    pub async fn to_ndjson(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.bind(py))))
            .transpose()?
            .unwrap_or_default();

        self.view.to_ndjson(window).await.into_pyerr()
    }

    #[pyo3(signature = (**window))]
    pub async fn to_records(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        let json = self.to_json_string(window).await?;
        Python::with_gil(|py| {
            let json_module = PyModule::import(py, "json")?;
            let records = json_module.call_method1("loads", (json,))?;
            Ok(records.unbind())
        })
    }

    #[pyo3(signature = (**window))]
    pub async fn to_json(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.to_records(window).await
    }
}

fn isawaitable(object: &Bound<'_, PyAny>) -> PyResult<bool> {
    let py = object.py();
    py.import("inspect")?
        .call_method1("isawaitable", (object,))?
        .extract()
}

mod py_async {
    #[cfg(not(target_os = "emscripten"))]
    pub use pyo3_async_runtimes::tokio::into_future as py_into_future;

    #[cfg(target_os = "emscripten")]
    pub use self::trivial::into_future as py_into_future;

    /// This do-nothing, panic all the time runtime is sufficient in emscripten
    /// for the primitive test suite in test_smoke.py to pass
    mod trivial {
        use std::future::Future;

        use pyo3::prelude::*;
        use pyo3_async_runtimes::generic::{ContextExt, JoinError, Runtime};

        struct TrivialJoinError {}
        impl JoinError for TrivialJoinError {
            fn is_panic(&self) -> bool {
                unimplemented!("TrivialJoinError::is_panic")
            }

            fn into_panic(self) -> Box<dyn std::any::Any + Send + 'static> {
                unimplemented!("TrivialJoinError::into_panic")
            }
        }
        struct TrivialJoinHandle {}
        impl Future for TrivialJoinHandle {
            type Output = Result<(), TrivialJoinError>;

            fn poll(
                self: std::pin::Pin<&mut Self>,
                _cx: &mut std::task::Context<'_>,
            ) -> std::task::Poll<Self::Output> {
                unimplemented!("TrivialJoinHandle::poll")
            }
        }

        struct TrivialRuntime {}

        impl Runtime for TrivialRuntime {
            type JoinError = TrivialJoinError;
            type JoinHandle = TrivialJoinHandle;

            fn spawn<F>(_fut: F) -> Self::JoinHandle
            where
                F: std::future::Future<Output = ()> + Send + 'static,
            {
                unimplemented!("TrivialRuntime::spawn")
            }
        }

        impl ContextExt for TrivialRuntime {
            fn get_task_locals() -> Option<pyo3_async_runtimes::TaskLocals> {
                None
            }

            fn scope<F, R>(
                _locals: pyo3_async_runtimes::TaskLocals,
                _fut: F,
            ) -> std::pin::Pin<Box<dyn std::future::Future<Output = R> + Send>>
            where
                F: std::future::Future<Output = R> + Send + 'static,
            {
                unimplemented!("TrivialRuntime::scope")
            }
        }

        #[allow(unused)]
        pub fn into_future(
            awaitable: Bound<PyAny>,
        ) -> PyResult<impl Future<Output = PyResult<PyObject>> + Send + use<>> {
            pyo3_async_runtimes::generic::into_future::<TrivialRuntime>(awaitable)
        }
    }
}
