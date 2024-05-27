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
use std::cell::OnceCell;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

use futures::lock::Mutex;
use perspective_client::config::Expressions;
use perspective_client::{
    assert_table_api, assert_view_api, clone, Client, ClientError, IntoBoxFnPinBoxFut,
    OnUpdateArgs, OnUpdateMode, OnUpdateOptions, Table, TableData, TableInitOptions, UpdateData,
    UpdateOptions, View, ViewWindow,
};
use perspective_server::Server;
use pyo3::create_exception;
use pyo3::exceptions::PyValueError;
use pyo3::ffi::PyErr_BadArgument;
use pyo3::prelude::*;
use pyo3::types::{PyBytes, PyDict, PyFunction, PyList, PyString};
use pythonize::depythonize;

use crate::client_async::PyAsyncServer;

#[derive(Clone)]
pub struct PyClient {
    client: Client,
}

async fn process_message(server: Server, client: Client, client_id: u32, msg: Vec<u8>) {
    let batch = server.handle_request(client_id, &msg);
    for (_client_id, response) in batch {
        client.handle_response(&response).await.unwrap()
    }
}

#[extend::ext]
pub impl<T> Result<T, ClientError> {
    fn into_pyerr(self) -> PyResult<T> {
        match self {
            Ok(x) => Ok(x),
            Err(x) => Err(PerspectivePyError::new_err(format!("{}", x))),
        }
    }
}

create_exception!(
    perspective,
    PerspectivePyError,
    pyo3::exceptions::PyException
);

#[pyfunction]
fn default_serializer(obj: &PyAny) -> PyResult<String> {
    if let Ok(dt) = obj.downcast::<pyo3::types::PyDateTime>() {
        Ok(dt.str()?.to_string())
    } else if let Ok(d) = obj.downcast::<pyo3::types::PyDate>() {
        Ok(d.str()?.to_string())
    } else if let Ok(d) = obj.downcast::<pyo3::types::PyTime>() {
        Ok(d.str()?.to_string())
    } else {
        Err(pyo3::exceptions::PyTypeError::new_err(
            "Object type not serializable",
        ))
    }
}

#[extend::ext]
impl UpdateData {
    fn from_py_partial(py: Python<'_>, input: &Py<PyAny>) -> Result<Option<UpdateData>, PyErr> {
        if let Ok(pybytes) = input.downcast::<PyBytes>(py) {
            Ok(Some(UpdateData::Arrow(pybytes.as_bytes().to_vec())))
        } else if let Ok(pystring) = input.downcast::<PyString>(py) {
            Ok(Some(UpdateData::Csv(pystring.extract::<String>()?)))
        } else if let Ok(pylist) = input.downcast::<PyList>(py) {
            let json_module = PyModule::import(py, "json")?;
            let kwargs = PyDict::new(py);
            kwargs.set_item("default", wrap_pyfunction!(default_serializer, py)?)?;
            let string = json_module.call_method("dumps", (pylist,), Some(kwargs))?;
            Ok(Some(UpdateData::JsonRows(string.extract::<String>()?)))
        } else if let Ok(pydict) = input.downcast::<PyDict>(py) {
            if pydict.keys().len() == 0 {
                return Err(PyValueError::new_err("Cannot infer type of emtpy dict"));
            }
            let first_key = pydict.keys().get_item(0)?;
            let first_item = pydict
                .get_item(first_key)?
                .ok_or_else(|| PyValueError::new_err("Bad Input"))?;
            if first_item.downcast::<PyList>().is_ok() {
                let json_module = PyModule::import(py, "json")?;
                let kwargs = PyDict::new(py);
                kwargs.set_item("default", wrap_pyfunction!(default_serializer, py)?)?;
                let string = json_module.call_method("dumps", (pydict,), Some(kwargs))?;
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
        } else if let Ok(pylist) = input.downcast::<PyList>(py) {
            let json_module = PyModule::import(py, "json")?;
            let kwargs = PyDict::new(py);
            kwargs.set_item("default", wrap_pyfunction!(default_serializer, py)?)?;
            let string = json_module.call_method("dumps", (pylist,), Some(kwargs))?;
            Ok(TableData::Update(UpdateData::JsonRows(
                string.extract::<String>()?,
            )))
        } else if let Ok(pydict) = input.downcast::<PyDict>(py) {
            let first_key = pydict.keys().get_item(0)?;
            let first_item = pydict
                .get_item(first_key)?
                .ok_or_else(|| PyValueError::new_err("Bad Input"))?;
            if first_item.downcast::<PyList>().is_ok() {
                let json_module = PyModule::import(py, "json")?;
                let kwargs = PyDict::new(py);
                kwargs.set_item("default", wrap_pyfunction!(default_serializer, py)?)?;
                let string = json_module.call_method("dumps", (pydict,), Some(kwargs))?;
                Ok(TableData::Update(UpdateData::JsonColumns(
                    string.extract::<String>()?,
                )))
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

const PSP_CALLBACK_ID: &str = "__PSP_CALLBACK_ID__";

impl PyClient {
    pub fn new(
        server: Option<PyAsyncServer>,
        client_id: Option<u32>,
        loop_cb: Option<Py<PyFunction>>,
    ) -> Self {
        let server = server.map(|x| x.server).unwrap_or_default();
        let client_id = client_id.unwrap_or_else(|| server.new_session());
        let client = Client::new({
            move |client, msg| {
                clone!(server, client, msg);
                process_message(server, client, client_id, msg)
            }
        });

        PyClient { client }
    }

    pub async fn init(&self) -> PyResult<()> {
        self.client.init().await.into_pyerr()
    }

    pub async fn table(
        &self,
        input: Py<PyAny>,
        limit: Option<u32>,
        index: Option<Py<PyString>>,
        name: Option<Py<PyString>>,
    ) -> PyResult<PyTable> {
        let client = self.client.clone();
        let table = Python::with_gil(|py| {
            let mut options = TableInitOptions::default();
            options.name = name.map(|x| x.extract::<String>(py)).transpose()?;
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

            let table_data = TableData::from_py(py, input)?;
            let table = client.table(table_data, options);
            Ok::<_, PyErr>(table)
        })?;

        let table = table.await.into_pyerr()?;
        Ok(PyTable {
            table: Arc::new(Mutex::new(table)),
        })
    }

    pub async fn open_table(&self, name: String) -> PyResult<PyTable> {
        let client = self.client.clone();
        let table = client.open_table(name).await.into_pyerr()?;
        Ok(PyTable {
            table: Arc::new(Mutex::new(table)),
        })
    }
}

#[derive(Clone)]
pub struct PyTable {
    table: Arc<Mutex<Table>>,
}

assert_table_api!(PyTable);

impl PyTable {
    pub async fn get_index(&self) -> Option<String> {
        self.table.lock().await.get_index()
    }

    pub async fn get_limit(&self) -> Option<u32> {
        self.table.lock().await.get_limit()
    }

    pub async fn size(&self) -> PyResult<usize> {
        self.table.lock().await.size().await.into_pyerr()
    }

    pub async fn columns(&self) -> PyResult<Vec<String>> {
        self.table.lock().await.columns().await.into_pyerr()
    }

    pub async fn clear(&self) -> PyResult<()> {
        self.table.lock().await.clear().await.into_pyerr()
    }

    pub async fn delete(&self) -> PyResult<()> {
        self.table.lock().await.delete().await.into_pyerr()
    }

    pub async fn make_port(&self) -> PyResult<i32> {
        self.table.lock().await.make_port().await.into_pyerr()
    }

    pub async fn on_delete(&self, callback_py: Py<PyFunction>) -> PyResult<u32> {
        let callback = {
            let callback_py = callback_py.clone();
            Box::new(move || {
                Python::with_gil(|py| callback_py.call0(py))
                    .expect("`on_delete()` callback failed");
            })
        };

        let callback_id = self
            .table
            .lock()
            .await
            .on_delete(callback)
            .await
            .into_pyerr()?;

        Python::with_gil(move |py| callback_py.setattr(py, PSP_CALLBACK_ID, callback_id))?;
        Ok(callback_id)
    }

    pub async fn remove_delete(&self, callback: Py<PyFunction>) -> PyResult<()> {
        let callback_id =
            Python::with_gil(|py| callback.getattr(py, PSP_CALLBACK_ID)?.extract(py))?;
        self.table
            .lock()
            .await
            .remove_delete(callback_id)
            .await
            .into_pyerr()
    }

    pub async fn remove(&self, input: Py<PyAny>) -> PyResult<()> {
        let table = self.table.lock().await;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input))?;
        table.remove(table_data).await.into_pyerr()
    }

    pub async fn replace(&self, input: Py<PyAny>) -> PyResult<()> {
        let table = self.table.lock().await;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input))?;
        table.replace(table_data).await.into_pyerr()
    }

    pub async fn update(
        &self,
        input: Py<PyAny>,
        format: Option<String>,
        port_id: Option<u32>,
    ) -> PyResult<()> {
        let table = self.table.lock().await;
        let table_data = Python::with_gil(|py| UpdateData::from_py(py, &input))?;
        let options = UpdateOptions { format, port_id };
        table.update(table_data, options).await.into_pyerr()
    }

    pub async fn validate_expressions(
        &self,
        expressions: HashMap<String, String>,
    ) -> PyResult<Py<PyAny>> {
        let records = self
            .table
            .lock()
            .await
            .validate_expressions(Expressions(expressions))
            .await
            .into_pyerr()?;

        Python::with_gil(|py| Ok(pythonize::pythonize(py, &records)?))
    }

    pub async fn schema(&self) -> PyResult<HashMap<String, String>> {
        let schema = self.table.lock().await.schema().await.into_pyerr()?;
        Ok(schema
            .into_iter()
            .map(|(x, y)| (x, format!("{}", y)))
            .collect())
    }

    pub async fn view(&self, kwargs: Option<Py<PyDict>>) -> PyResult<PyView> {
        let config = kwargs
            .map(|config| Python::with_gil(|py| depythonize(config.as_ref(py))))
            .transpose()?;
        let view = self.table.lock().await.view(config).await.into_pyerr()?;
        Ok(PyView {
            view: Arc::new(Mutex::new(view)),
        })
    }
}

#[derive(Clone)]
pub struct PyView {
    view: Arc<Mutex<View>>,
}

assert_view_api!(PyView);

impl PyView {
    pub async fn column_paths(&self) -> PyResult<Vec<String>> {
        self.view.lock().await.column_paths().await.into_pyerr()
    }

    pub async fn delete(&self) -> PyResult<()> {
        self.view.lock().await.delete().await.into_pyerr()
    }

    pub async fn dimensions(&self) -> PyResult<Py<PyAny>> {
        let dim = self.view.lock().await.dimensions().await.into_pyerr()?;
        Ok(Python::with_gil(|py| pythonize::pythonize(py, &dim))?)
    }

    pub async fn expression_schema(&self) -> PyResult<HashMap<String, String>> {
        Ok(self
            .view
            .lock()
            .await
            .expression_schema()
            .await
            .into_pyerr()?
            .into_iter()
            .map(|(k, v)| (k, format!("{}", v)))
            .collect())
    }

    pub async fn get_config(&self) -> PyResult<Py<PyAny>> {
        let config = self.view.lock().await.get_config().await.into_pyerr()?;
        Ok(Python::with_gil(|py| pythonize::pythonize(py, &config))?)
    }

    pub async fn get_min_max(&self, name: String) -> PyResult<(String, String)> {
        self.view.lock().await.get_min_max(name).await.into_pyerr()
    }

    pub async fn num_rows(&self) -> PyResult<u32> {
        self.view.lock().await.num_rows().await.into_pyerr()
    }

    pub async fn schema(&self) -> PyResult<HashMap<String, String>> {
        Ok(self
            .view
            .lock()
            .await
            .schema()
            .await
            .into_pyerr()?
            .into_iter()
            .map(|(k, v)| (k, format!("{}", v)))
            .collect())
    }

    pub async fn on_delete(&self, callback_py: Py<PyFunction>) -> PyResult<u32> {
        let callback = {
            let callback_py = callback_py.clone();
            Box::new(move || {
                Python::with_gil(|py| callback_py.call0(py))
                    .expect("`on_delete()` callback failed");
            })
        };

        let callback_id = self
            .view
            .lock()
            .await
            .on_delete(callback)
            .await
            .into_pyerr()?;
        Python::with_gil(move |py| callback_py.setattr(py, PSP_CALLBACK_ID, callback_id))?;
        Ok(callback_id)
    }

    pub async fn remove_delete(&self, callback: Py<PyFunction>) -> PyResult<()> {
        let callback_id =
            Python::with_gil(|py| callback.getattr(py, PSP_CALLBACK_ID)?.extract(py))?;
        self.view
            .lock()
            .await
            .remove_delete(callback_id)
            .await
            .into_pyerr()
    }

    pub async fn on_update(&self, callback: Py<PyFunction>, mode: Option<String>) -> PyResult<u32> {
        let loop_cb = self.client.loop_cb.clone();
        let callback = move |x: OnUpdateArgs| {
            let loop_cb = loop_cb.clone();
            let callback = callback.clone();
            async move {
                let aggregate_errors: PyResult<()> = {
                    let callback = callback.clone();
                    Python::with_gil(|py| {
                        if let Some(x) = &x.delta {
                            if let Some(loop_cb) = loop_cb.as_ref() {
                                loop_cb.call1(py, (callback, PyBytes::new(py, x)))?;
                            } else {
                                callback.call1(py, (PyBytes::new(py, x),))?;
                            }
                        } else if let Some(loop_cb) = loop_cb.as_ref() {
                            loop_cb.call1(py, (callback,))?;
                        } else {
                            callback.call0(py)?;
                        }

                        Ok(())
                    })
                };

                if let Err(err) = aggregate_errors {
                    tracing::warn!("Error in on_update callback: {:?}", err);
                }
            }
        };

        let mode = mode
            .map(|x| OnUpdateMode::from_str(x.as_str()))
            .transpose()
            .into_pyerr()?;

        self.view
            .lock()
            .await
            .on_update(callback.into_box_fn_pin_bix_fut(), OnUpdateOptions { mode })
            .await
            .into_pyerr()
    }

    pub async fn remove_update(&self, callback_id: u32) -> PyResult<()> {
        self.view
            .lock()
            .await
            .remove_update(callback_id)
            .await
            .into_pyerr()
    }

    pub async fn to_arrow(&self, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.as_ref(py))))
            .transpose()?
            .unwrap_or_default();
        let arrow = self.view.lock().await.to_arrow(window).await.into_pyerr()?;
        Ok(Python::with_gil(|py| PyBytes::new(py, &arrow).into()))
    }

    pub async fn to_csv(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.as_ref(py))))
            .transpose()?
            .unwrap_or_default();

        self.view.lock().await.to_csv(window).await.into_pyerr()
    }

    pub async fn to_columns_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.as_ref(py))))
            .transpose()?
            .unwrap_or_default();

        self.view
            .lock()
            .await
            .to_columns_string(window)
            .await
            .into_pyerr()
    }

    pub async fn to_json_string(&self, window: Option<Py<PyDict>>) -> PyResult<String> {
        let window: ViewWindow = Python::with_gil(|py| window.map(|x| depythonize(x.as_ref(py))))
            .transpose()?
            .unwrap_or_default();

        self.view
            .lock()
            .await
            .to_json_string(window)
            .await
            .into_pyerr()
    }
}
