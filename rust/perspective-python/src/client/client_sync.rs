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

#[cfg(doc)]
use perspective_client::{Schema, TableInitOptions, UpdateOptions, config::ViewConfigUpdate};
use perspective_client::{assert_table_api, assert_view_api};
use pyo3::exceptions::PyTypeError;
use pyo3::marker::Ungil;
use pyo3::prelude::*;
use pyo3::types::*;

use super::client_async::*;
use crate::server::PySyncServer;

pub(crate) trait PyFutureExt: Future {
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

/// An instance of a [`Client`] is a unique connection to a single
/// `perspective_server::Server`, whether locally in-memory or remote over some
/// transport like a WebSocket.
///
/// [`Client`] and Perspective objects derived from it have _synchronous_ APIs,
/// suitable for use in a repl or script context where this is the _only_
/// [`Client`] connected to its [`perspective_server::Server`]. If you want to
/// integrate with a Web framework or otherwise connect multiple clients,
/// use [`AsyncClient`].
#[pyclass(subclass, module = "perspective")]
pub struct Client(pub(crate) AsyncClient);

#[pymethods]
impl Client {
    #[new]
    #[pyo3(signature = (handle_request, close_cb=None, name=None))]
    pub fn new(
        handle_request: Py<PyAny>,
        close_cb: Option<Py<PyAny>>,
        name: Option<String>,
    ) -> PyResult<Self> {
        let client = AsyncClient::new(handle_request, close_cb, name)?;
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

    /// Handle a message from the external message queue.
    /// [`Client::handle_response`] is part of the low-level message-handling
    /// API necessary to implement new transports for a [`Client`]
    /// connection to a local-or-remote `perspective_server::Server`, and
    /// doesn't generally need to be called directly by "users" of a
    /// [`Client`] once connected.
    pub fn handle_response(&self, py: Python<'_>, response: Py<PyBytes>) -> PyResult<bool> {
        self.0.handle_response(response).py_block_on(py)
    }

    /// Creates a new [`Table`] from either a _schema_ or _data_.
    ///
    /// The [`Client::table`] factory function can be initialized with either a
    /// _schema_ (see [`Table::schema`]), or data in one of these formats:
    ///
    /// - Apache Arrow
    /// - CSV
    /// - JSON row-oriented
    /// - JSON column-oriented
    ///
    /// When instantiated with _data_, the schema is inferred from this data.
    /// While this is convenient, inferrence is sometimes imperfect e.g.
    /// when the input is empty, null or ambiguous. For these cases,
    /// [`Client::table`] can first be instantiated with a explicit schema.
    ///
    /// When instantiated with a _schema_, the resulting [`Table`] is empty but
    /// with known column names and column types. When subsqeuently
    /// populated with [`Table::update`], these columns will be _coerced_ to
    /// the schema's type. This behavior can be useful when
    /// [`Client::table`]'s column type inferences doesn't work.
    ///
    /// The resulting [`Table`] is _virtual_, and invoking its methods
    /// dispatches events to the `perspective_server::Server` this
    /// [`Client`] connects to, where the data is stored and all calculation
    /// occurs.
    ///
    /// # Arguments
    ///
    /// - `arg` - Either _schema_ or initialization _data_.
    /// - `options` - Optional configuration which provides one of:
    ///     - `limit` - The max number of rows the resulting [`Table`] can
    ///       store.
    ///     - `index` - The column name to use as an _index_ column. If this
    ///       `Table` is being instantiated by _data_, this column name must be
    ///       present in the data.
    ///     - `name` - The name of the table. This will be generated if it is
    ///       not provided.
    ///     - `format` - The explicit format of the input data, can be one of
    ///       `"json"`, `"columns"`, `"csv"` or `"arrow"`. This overrides
    ///       language-specific type dispatch behavior, which allows stringified
    ///       and byte array alternative inputs.
    ///
    /// # Python Examples
    ///
    /// Load a CSV from a `str`:
    ///
    /// ```python
    /// table = client.table("x,y\n1,2\n3,4")
    /// ```
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

    /// Opens a [`Table`] that is hosted on the `perspective_server::Server`
    /// that is connected to this [`Client`].
    ///
    /// The `name` property of [`TableInitOptions`] is used to identify each
    /// [`Table`]. [`Table`] `name`s can be looked up for each [`Client`]
    /// via [`Client::get_hosted_table_names`].
    ///
    /// # Python Examples
    ///
    /// ```python
    /// table =  client.open_table("table_one");
    /// ```
    pub fn open_table(&self, py: Python<'_>, name: String) -> PyResult<Table> {
        let client = self.0.clone();
        let table = client.open_table(name).py_block_on(py)?;
        Ok(Table(table))
    }

    /// Retrieves the names of all tables that this client has access to.
    ///
    /// `name` is a string identifier unique to the [`Table`] (per [`Client`]),
    /// which can be used in conjunction with [`Client::open_table`] to get
    /// a [`Table`] instance without the use of [`Client::table`]
    /// constructor directly (e.g., one created by another [`Client`]).
    ///
    /// # Python Examples
    ///
    /// ```python
    /// tables = client.get_hosted_table_names();
    /// ```
    pub fn get_hosted_table_names(&self, py: Python<'_>) -> PyResult<Vec<String>> {
        self.0.get_hosted_table_names().py_block_on(py)
    }

    /// Register a callback which is invoked whenever [`Client::table`] (on this
    /// [`Client`]) or [`Table::delete`] (on a [`Table`] belinging to this
    /// [`Client`]) are called.
    pub fn on_hosted_tables_update(&self, py: Python<'_>, callback: Py<PyAny>) -> PyResult<u32> {
        self.0.on_hosted_tables_update(callback).py_block_on(py)
    }

    /// Remove a callback previously registered via
    /// [`Client::on_hosted_tables_update`].
    pub fn remove_hosted_tables_update(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        self.0
            .remove_hosted_tables_update(callback_id)
            .py_block_on(py)
    }

    pub fn set_loop_callback(&self, py: Python<'_>, loop_cb: Py<PyAny>) -> PyResult<()> {
        self.0.set_loop_callback(loop_cb).py_block_on(py)
    }

    /// Terminates this [`Client`], cleaning up any [`crate::View`] handles the
    /// [`Client`] has open as well as its callbacks.
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

    pub fn get_index(&self) -> Option<String> {
        self.0.get_index()
    }

    pub fn get_client(&self, py: Python<'_>) -> Client {
        Client(self.0.get_client().py_block_on(py))
    }

    /// Returns the user-specified row limit for this table.
    pub fn get_limit(&self) -> Option<u32> {
        self.0.get_limit()
    }

    pub fn get_name(&self) -> String {
        self.0.get_name()
    }

    /// Removes all the rows in the [`Table`], but preserves everything else
    /// including the schema, index, and any callbacks or registered
    /// [`View`] instances.
    ///
    /// Calling [`Table::clear`], like [`Table::update`] and [`Table::remove`],
    /// will trigger an update event to any registered listeners via
    /// [`View::on_update`].
    pub fn clear(&self, py: Python<'_>) -> PyResult<()> {
        self.0.clear().py_block_on(py)
    }

    /// Returns the column names of this [`Table`] in "natural" order (the
    /// ordering implied by the input format).
    ///  
    ///  # Python Examples
    ///
    /// ```python
    /// columns = table.columns()
    /// ```
    pub fn columns(&self, py: Python<'_>) -> PyResult<Vec<String>> {
        self.0.columns().py_block_on(py)
    }

    /// Delete this [`Table`] and cleans up associated resources.
    ///
    /// [`Table`]s do not stop consuming resources or processing updates when
    /// they are garbage collected in their host language - you must call
    /// this method to reclaim these.
    ///
    /// # Arguments
    ///
    /// - `options` An options dictionary.
    ///     - `lazy` Whether to delete this [`Table`] _lazily_. When false (the
    ///       default), the delete will occur immediately, assuming it has no
    ///       [`View`] instances registered to it (which must be deleted first,
    ///       otherwise this method will throw an error). When true, the
    ///       [`Table`] will only be marked for deltion once its [`View`]
    ///       dependency count reaches 0.
    ///
    /// # Python Examples
    ///
    /// ```python
    /// table = client.table("x,y\n1,2\n3,4")
    ///
    /// # ...
    ///
    /// table.delete(lazy=True)
    /// ```
    #[pyo3(signature=(lazy=false))]
    pub fn delete(&self, py: Python<'_>, lazy: bool) -> PyResult<()> {
        self.0.delete(lazy).py_block_on(py)
    }

    pub fn make_port(&self, py: Python<'_>) -> PyResult<i32> {
        let table = self.0.clone();
        table.make_port().py_block_on(py)
    }

    pub fn on_delete(&self, py: Python<'_>, callback: Py<PyAny>) -> PyResult<u32> {
        let table = self.0.clone();
        table.on_delete(callback).py_block_on(py)
    }

    #[pyo3(signature = (input, format=None))]
    pub fn remove(&self, py: Python<'_>, input: Py<PyAny>, format: Option<String>) -> PyResult<()> {
        let table = self.0.clone();
        table.remove(input, format).py_block_on(py)
    }

    pub fn remove_delete(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        let table = self.0.clone();
        table.remove_delete(callback_id).py_block_on(py)
    }

    pub fn schema(&self, py: Python<'_>) -> PyResult<HashMap<String, String>> {
        let table = self.0.clone();
        table.schema().py_block_on(py)
    }

    pub fn validate_expressions(
        &self,
        py: Python<'_>,
        expression: Py<PyAny>,
    ) -> PyResult<Py<PyAny>> {
        let table = self.0.clone();
        table.validate_expressions(expression).py_block_on(py)
    }

    #[pyo3(signature = (**config))]
    pub fn view(&self, py: Python<'_>, config: Option<Py<PyDict>>) -> PyResult<View> {
        Ok(View(self.0.view(config).py_block_on(py)?))
    }

    pub fn size(&self, py: Python<'_>) -> PyResult<usize> {
        self.0.size().py_block_on(py)
    }

    #[pyo3(signature = (input, format=None))]
    pub fn replace(
        &self,
        py: Python<'_>,
        input: Py<PyAny>,
        format: Option<String>,
    ) -> PyResult<()> {
        self.0.replace(input, format).py_block_on(py)
    }

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

    pub fn column_paths(&self, py: Python<'_>) -> PyResult<Vec<String>> {
        self.0.column_paths().py_block_on(py)
    }

    #[pyo3(signature = (**window))]
    pub fn to_columns_string(
        &self,
        py: Python<'_>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<String> {
        self.0.to_columns_string(window).py_block_on(py)
    }

    #[pyo3(signature = (**window))]
    pub fn to_json_string(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_json_string(window).py_block_on(py)
    }

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

    #[pyo3(signature = (**window))]
    pub fn to_json<'a>(
        &self,
        py: Python<'a>,
        window: Option<Py<PyDict>>,
    ) -> PyResult<Bound<'a, PyAny>> {
        self.to_records(py, window)
    }

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

    #[pyo3(signature = (**window))]
    pub fn to_csv(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<String> {
        self.0.to_csv(window).py_block_on(py)
    }

    /// Serialize the data to a `pandas.DataFrame`.
    #[pyo3(signature = (**window))]
    // #[deprecated(since="3.2.0", note="Please use `View::to_pandas`")]
    pub fn to_dataframe(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_dataframe(window).py_block_on(py)
    }

    /// Serialize the data to a `pandas.DataFrame`.
    #[pyo3(signature = (**window))]
    pub fn to_pandas(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_dataframe(window).py_block_on(py)
    }

    /// Serialize the data to a `polars.DataFrame`.
    #[pyo3(signature = (**window))]
    pub fn to_polars(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyAny>> {
        self.0.to_polars(window).py_block_on(py)
    }

    #[pyo3(signature = (**window))]
    pub fn to_arrow(&self, py: Python<'_>, window: Option<Py<PyDict>>) -> PyResult<Py<PyBytes>> {
        self.0.to_arrow(window).py_block_on(py)
    }

    pub fn delete(&self, py: Python<'_>) -> PyResult<()> {
        self.0.delete().py_block_on(py)
    }

    pub fn expand(&self, py: Python<'_>, index: u32) -> PyResult<u32> {
        self.0.expand(index).py_block_on(py)
    }

    pub fn collapse(&self, py: Python<'_>, index: u32) -> PyResult<u32> {
        self.0.collapse(index).py_block_on(py)
    }

    pub fn dimensions(&self, py: Python<'_>) -> PyResult<Py<PyAny>> {
        self.0.dimensions().py_block_on(py)
    }

    pub fn expression_schema(&self, py: Python<'_>) -> PyResult<HashMap<String, String>> {
        self.0.expression_schema().py_block_on(py)
    }

    pub fn get_config(&self, py: Python<'_>) -> PyResult<Py<PyAny>> {
        self.0.get_config().py_block_on(py)
    }

    pub fn get_min_max(&self, py: Python<'_>, column_name: String) -> PyResult<(String, String)> {
        self.0.get_min_max(column_name).py_block_on(py)
    }

    pub fn num_rows(&self, py: Python<'_>) -> PyResult<u32> {
        self.0.num_rows().py_block_on(py)
    }

    pub fn schema(&self, py: Python<'_>) -> PyResult<HashMap<String, String>> {
        self.0.schema().py_block_on(py)
    }

    pub fn on_delete(&self, py: Python<'_>, callback: Py<PyAny>) -> PyResult<u32> {
        self.0.on_delete(callback).py_block_on(py)
    }

    pub fn remove_delete(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        self.0.remove_delete(callback_id).py_block_on(py)
    }

    #[pyo3(signature = (callback, mode=None))]
    pub fn on_update(
        &self,
        py: Python<'_>,
        callback: Py<PyAny>,
        mode: Option<String>,
    ) -> PyResult<u32> {
        self.0.on_update(callback, mode).py_block_on(py)
    }

    pub fn remove_update(&self, py: Python<'_>, callback_id: u32) -> PyResult<()> {
        self.0.remove_update(callback_id).py_block_on(py)
    }
}
