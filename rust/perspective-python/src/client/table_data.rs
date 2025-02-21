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

use perspective_client::{ColumnType, TableData, TableReadFormat, UpdateData};
use pyo3::exceptions::{PyTypeError, PyValueError};
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyAnyMethods, PyDict, PyList, PyString, PyType};

use super::update_data::UpdateDataExt;
use crate::py_err::ResultTClientErrorExt;

fn psp_type_from_py_type(_py: Python<'_>, val: Bound<'_, PyAny>) -> PyResult<ColumnType> {
    if let Ok(pystr) = val.downcast::<PyString>() {
        ColumnType::try_from(pystr.to_string_lossy().as_ref()).into_pyerr()
    } else if let Ok(val) = val.downcast::<PyType>() {
        let (module, typename) = (val.module()?, val.name()?);
        match (
            module.to_string_lossy().as_ref(),
            typename.to_string_lossy().as_ref(),
        ) {
            ("builtins", "int") => Ok(ColumnType::Integer),
            ("builtins", "float") => Ok(ColumnType::Float),
            ("builtins", "str") => Ok(ColumnType::String),
            ("builtins", "bool") => Ok(ColumnType::Boolean),
            ("datetime", "date") => Ok(ColumnType::Date),
            ("datetime", "datetime") => Ok(ColumnType::Datetime),
            (modname, typename) => Err(PyTypeError::new_err(format!("{}.{}", modname, typename))),
        }
    } else {
        Err(PyTypeError::new_err(format!(
            "Unknown schema type {:?}",
            val.get_type().name()?
        )))
    }
}

fn from_dict(py: Python<'_>, pydict: &Bound<'_, PyDict>) -> Result<TableData, PyErr> {
    let first_key = pydict.keys().get_item(0)?;
    let first_item = pydict
        .get_item(first_key)?
        .ok_or_else(|| PyValueError::new_err("Schema has no columns"))?;

    if first_item.downcast::<PyList>().is_ok() {
        let json_module = PyModule::import(py, "json")?;
        let string = json_module.call_method("dumps", (pydict,), None)?;
        Ok(UpdateData::JsonColumns(string.extract::<String>()?).into())
    } else {
        let mut schema = vec![];
        for (key, val) in pydict.into_iter() {
            schema.push((key.extract::<String>()?, psp_type_from_py_type(py, val)?));
        }

        Ok(TableData::Schema(schema))
    }
}

#[extend::ext]
pub impl TableData {
    fn from_py(
        input: Bound<'_, PyAny>,
        format: Option<TableReadFormat>,
    ) -> Result<TableData, PyErr> {
        if let Some(update) = UpdateData::from_py_partial(&input, format)? {
            Ok(TableData::Update(update))
        } else if let Ok(pylist) = input.downcast::<PyList>() {
            let json_module = PyModule::import(input.py(), "json")?;
            let string = json_module.call_method("dumps", (pylist,), None)?;
            Ok(UpdateData::JsonRows(string.extract::<String>()?).into())
        } else if let Ok(pydict) = input.downcast::<PyDict>() {
            from_dict(input.py(), pydict)
        } else {
            Err(PyTypeError::new_err(format!(
                "Unknown input type {:?}",
                input.get_type().name()?
            )))
        }
    }
}
