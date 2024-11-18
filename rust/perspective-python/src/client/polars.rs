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
use pyo3::types::{PyAny, PyBytes, PyList};

use super::pyarrow;

fn get_polars_df_cls(py: Python<'_>) -> PyResult<Option<Bound<'_, PyAny>>> {
    let sys = PyModule::import_bound(py, "sys")?;
    if sys.getattr("modules")?.contains("polars")? {
        let polars = PyModule::import_bound(py, "polars")?;
        Ok(Some(
            polars.getattr("DataFrame")?.to_object(py).into_bound(py),
        ))
    } else {
        Ok(None)
    }
}

fn get_polars_lf_cls(py: Python<'_>) -> PyResult<Option<Bound<'_, PyAny>>> {
    let sys = PyModule::import_bound(py, "sys")?;
    if sys.getattr("modules")?.contains("polars")? {
        let polars = PyModule::import_bound(py, "polars")?;
        Ok(Some(
            polars.getattr("LazyFrame")?.to_object(py).into_bound(py),
        ))
    } else {
        Ok(None)
    }
}

pub fn is_polars_df(py: Python, df: &Bound<'_, PyAny>) -> PyResult<bool> {
    if let Some(df_class) = get_polars_df_cls(py)? {
        df.is_instance(&df_class)
    } else {
        Ok(false)
    }
}

pub fn is_polars_lf(py: Python, df: &Bound<'_, PyAny>) -> PyResult<bool> {
    if let Some(df_class) = get_polars_lf_cls(py)? {
        df.is_instance(&df_class)
    } else {
        Ok(false)
    }
}

pub fn arrow_to_polars(py: Python<'_>, arrow: &[u8]) -> PyResult<Py<PyAny>> {
    let polars = PyModule::import_bound(py, "polars")?;
    let bytes = PyBytes::new_bound(py, arrow);
    Ok(polars
        .getattr("read_ipc_stream")?
        .call1((bytes,))?
        .call0()?
        .as_unbound()
        .clone())
}

pub fn polars_to_arrow_bytes<'py>(
    py: Python<'py>,
    df: &Bound<'py, PyAny>,
) -> PyResult<Bound<'py, PyBytes>> {
    let df_class = get_polars_df_cls(py)?
        .ok_or_else(|| PyValueError::new_err("Failed to import polars.DataFrame"))?;

    let lf_class = get_polars_lf_cls(py)?
        .ok_or_else(|| PyValueError::new_err("Failed to import polars.LazyFrame"))?;

    if !df.is_instance(&df_class)? && !df.is_instance(&lf_class)? {
        return Err(PyValueError::new_err(
            "Input is not a polars.DataFrame or polars.LazyFrame",
        ));
    }

    let is_lazyframe = df.is_instance(&lf_class)?;
    let table = if is_lazyframe {
        df.call_method0("collect")?.call_method0("to_arrow")?
    } else {
        df.call_method0("to_arrow")?
    };

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
        pyarrow::to_arrow_bytes(py, &table)
    } else {
        pyarrow::to_arrow_bytes(py, &table)
    }
}
