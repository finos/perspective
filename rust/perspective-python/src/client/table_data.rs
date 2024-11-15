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
    if val.is_instance_of::<PyString>() {
        val.extract::<String>()?.as_str().try_into().into_pyerr()
    } else if let Ok(val) = val.downcast::<PyType>() {
        match val.name()?.as_ref() {
            "builtins.int" | "int" => Ok(ColumnType::Integer),
            "builtins.float" | "float" => Ok(ColumnType::Float),
            "builtins.str" | "str" => Ok(ColumnType::String),
            "builtins.bool" | "bool" => Ok(ColumnType::Boolean),
            "datetime.date" => Ok(ColumnType::Date),
            "datetime.datetime" => Ok(ColumnType::Datetime),
            type_name => Err(PyTypeError::new_err(type_name.to_string())),
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
        let json_module = PyModule::import_bound(py, "json")?;
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
        py: Python<'_>,
        input: Py<PyAny>,
        format: Option<TableReadFormat>,
    ) -> Result<TableData, PyErr> {
        if let Some(update) = UpdateData::from_py_partial(py, &input, format)? {
            Ok(TableData::Update(update))
        } else if let Ok(pylist) = input.downcast_bound::<PyList>(py) {
            let json_module = PyModule::import_bound(py, "json")?;
            let string = json_module.call_method("dumps", (pylist,), None)?;
            Ok(UpdateData::JsonRows(string.extract::<String>()?).into())
        } else if let Ok(pydict) = input.downcast_bound::<PyDict>(py) {
            from_dict(py, pydict)
        } else {
            Err(PyTypeError::new_err(format!(
                "Unknown input type {:?}",
                input.bind(py).get_type().name()?
            )))
        }
    }
}
