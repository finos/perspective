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

use pyo3::exceptions::{PyImportError, PyValueError};
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes, PyDict, PyList};

use super::pyarrow;

fn get_pandas_df_cls(py: Python<'_>) -> PyResult<Option<Bound<'_, PyAny>>> {
    let sys = PyModule::import(py, "sys")?;
    if sys.getattr("modules")?.contains("pandas")? {
        let pandas = PyModule::import(py, "pandas")?;
        Ok(Some(pandas.getattr("DataFrame")?.into_pyobject(py)?))
    } else {
        Ok(None)
    }
}

pub fn is_pandas_df(py: Python, df: &Bound<'_, PyAny>) -> PyResult<bool> {
    if let Some(df_class) = get_pandas_df_cls(py)? {
        df.is_instance(&df_class)
    } else {
        Ok(false)
    }
}

// ipc_bytes = self.to_arrow()
// table = pa.ipc.open_stream(ipc_bytes).read_all()
// x = pd.DataFrame(table.to_pandas())
// print("AAA", x)
// return x

pub fn arrow_to_pandas(py: Python<'_>, arrow: &[u8]) -> PyResult<Py<PyAny>> {
    let pyarrow = PyModule::import(py, "pyarrow")?;
    let bytes = PyBytes::new(py, arrow);
    Ok(pyarrow
        .getattr("ipc")?
        .getattr("open_stream")?
        .call1((bytes,))?
        .getattr("read_all")?
        .call0()?
        .getattr("to_pandas")?
        .call0()?
        .unbind())
}

pub fn pandas_to_arrow_bytes<'py>(
    py: Python<'py>,
    df: &Bound<'py, PyAny>,
) -> PyResult<Bound<'py, PyBytes>> {
    let pyarrow = match PyModule::import(py, "pyarrow") {
        Ok(pyarrow) => pyarrow,
        Err(_) => {
            return Err(PyImportError::new_err(
                "Perspective requires pyarrow to convert pandas DataFrames. Please install \
                 pyarrow.",
            ));
        },
    };

    let df_class = get_pandas_df_cls(py)?
        .ok_or_else(|| PyValueError::new_err("Failed to import pandas.DataFrame"))?;

    if !df.is_instance(&df_class)? {
        return Err(PyValueError::new_err("Input is not a pandas.DataFrame"));
    }

    let kwargs = PyDict::new(py);
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

    let names = PyList::new(py, new_names.clone())?;
    let table = table.call_method1("rename_columns", (names,))?;

    // move the index column to be the first column.
    if new_names[new_names.len() - 1] == "index" {
        new_names.rotate_right(1);
        let order = PyList::new(py, new_names)?;
        let table = table.call_method1("select", (order,))?;
        pyarrow::to_arrow_bytes(py, &table)
    } else {
        pyarrow::to_arrow_bytes(py, &table)
    }
}
