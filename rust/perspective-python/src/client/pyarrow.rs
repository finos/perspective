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

use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes};

fn get_pyarrow_table_cls(py: Python<'_>) -> PyResult<Option<Py<PyAny>>> {
    let sys = PyModule::import_bound(py, "sys")?;
    if sys.getattr("modules")?.contains("pyarrow")? {
        let pandas = PyModule::import_bound(py, "pyarrow")?;
        Ok(Some(pandas.getattr("Table")?.to_object(py)))
    } else {
        Ok(None)
    }
}

pub fn is_arrow_table(py: Python, table: &Bound<'_, PyAny>) -> PyResult<bool> {
    if let Some(table_class) = get_pyarrow_table_cls(py)? {
        table.is_instance(table_class.bind(py))
    } else {
        Ok(false)
    }
}

pub fn to_arrow_bytes<'py>(
    py: Python<'py>,
    table: &Bound<'py, PyAny>,
) -> PyResult<Bound<'py, PyBytes>> {
    let pyarrow = PyModule::import_bound(py, "pyarrow")?;
    let table_class = get_pyarrow_table_cls(py)?
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
