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

use perspective_client::{TableReadFormat, UpdateData};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyBytes, PyDict, PyList, PyString};

fn from_arrow(
    pybytes: &Bound<'_, PyBytes>,
    format: Option<TableReadFormat>,
) -> Result<Option<UpdateData>, PyErr> {
    // TODO need to explicitly qualify this b/c bug in
    // rust-analyzer - should be: just `pybytes.as_bytes()`.
    let vec = pyo3::prelude::PyBytesMethods::as_bytes(pybytes).to_vec();

    match format {
        Some(TableReadFormat::Csv) => Ok(Some(UpdateData::Csv(String::from_utf8(vec)?))),
        Some(TableReadFormat::JsonString) => {
            Ok(Some(UpdateData::JsonRows(String::from_utf8(vec)?)))
        },
        Some(TableReadFormat::ColumnsString) => {
            Ok(Some(UpdateData::JsonColumns(String::from_utf8(vec)?)))
        },
        None | Some(TableReadFormat::Arrow) => Ok(Some(UpdateData::Arrow(vec.into()))),
    }
}

fn from_string(
    pystring: &Bound<'_, PyString>,
    format: Option<TableReadFormat>,
) -> Result<Option<UpdateData>, PyErr> {
    let string = pystring.extract::<String>()?;
    match format {
        None | Some(TableReadFormat::Csv) => Ok(Some(UpdateData::Csv(string))),
        Some(TableReadFormat::JsonString) => Ok(Some(UpdateData::JsonRows(string))),
        Some(TableReadFormat::ColumnsString) => Ok(Some(UpdateData::JsonColumns(string))),
        Some(TableReadFormat::Arrow) => Ok(Some(UpdateData::Arrow(string.into_bytes().into()))),
    }
}

fn from_list(py: Python<'_>, pylist: &Bound<'_, PyList>) -> Result<Option<UpdateData>, PyErr> {
    let json_module = PyModule::import_bound(py, "json")?;
    let string = json_module.call_method("dumps", (pylist,), None)?;
    Ok(Some(UpdateData::JsonRows(string.extract::<String>()?)))
}

fn from_dict(py: Python<'_>, pydict: &Bound<'_, PyDict>) -> Result<Option<UpdateData>, PyErr> {
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
}

#[extend::ext]
pub impl UpdateData {
    fn from_py_partial(
        py: Python<'_>,
        input: &Py<PyAny>,
        format: Option<TableReadFormat>,
    ) -> Result<Option<UpdateData>, PyErr> {
        if let Ok(pybytes) = input.downcast_bound::<PyBytes>(py) {
            from_arrow(pybytes, format)
        } else if let Ok(pystring) = input.downcast_bound::<PyString>(py) {
            from_string(pystring, format)
        } else if let Ok(pylist) = input.downcast_bound::<PyList>(py) {
            from_list(py, pylist)
        } else if let Ok(pydict) = input.downcast_bound::<PyDict>(py) {
            from_dict(py, pydict)
        } else {
            Ok(None)
        }
    }

    fn from_py(
        py: Python<'_>,
        input: &Py<PyAny>,
        format: Option<TableReadFormat>,
    ) -> Result<UpdateData, PyErr> {
        if let Some(x) = Self::from_py_partial(py, input, format)? {
            Ok(x)
        } else {
            Err(PyValueError::new_err(format!(
                "Unknown input type {:?}",
                input.type_id()
            )))
        }
    }
}
