/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>
#include <perspective/python/utils.h>

namespace perspective {
namespace binding {

/******************************************************************************
 *
 * Date Parsing
 */
t_date
pythondate_to_t_date(t_val date) {
    return t_date(date.attr("year").cast<std::int32_t>(),
        date.attr("month").cast<std::int32_t>(),
        date.attr("day").cast<std::int32_t>());
}

std::int64_t
pythondatetime_to_ms(t_val datetime) {
    /**
     * Rounding the python timestamp to an int causes microsecond-level precision issues. This can be exposed by
     * passing a datetime with the `microsecond` field set to a roundable value, i.e. 5500. On conversion, the 
     * microsecond value becomes 6000 due to the rounding error.
     */
    return static_cast<std::int64_t>(datetime.attr("timestamp")().cast<double>() * 1000);
}

t_dtype type_string_to_t_dtype(std::string value, std::string name){
    auto type = t_dtype::DTYPE_STR;

    // TODO consider refactor
    if (value == "int" || value == "integer") {
        // Python int
        type = t_dtype::DTYPE_INT64;
    } else if (value == "int8") {
        // Numpy int8
        type = t_dtype::DTYPE_INT8;
    } else if (value == "int16") {
        // Numpy int16
        type = t_dtype::DTYPE_INT16;
    } else if (value == "int32") {
        // Numpy int32
        type = t_dtype::DTYPE_INT32;
    } else if (value == "int64") {
        // Numpy int64
        type = t_dtype::DTYPE_INT64;
    } else if (value == "float") {
        // Python float
        type = t_dtype::DTYPE_FLOAT64;
    } else if (value == "float16") {
        // TODO
        // Numpy float16
        // type = t_dtype::DTYPE_FLOAT16;
        type = t_dtype::DTYPE_FLOAT32;
    } else if (value == "float32" || value == "float") {
        // Numpy float32
        type = t_dtype::DTYPE_FLOAT32;
    } else if (value == "float64") {
        // Numpy float64
        type = t_dtype::DTYPE_FLOAT64;
    } else if (value == "float128") {
        // TODO
        // Numpy float128
        type = t_dtype::DTYPE_FLOAT64;
    } else if (value == "str" || value == "string") {
        // Python unicode str
        type = t_dtype::DTYPE_STR;
    } else if (value == "bool" || value == "boolean") {
        // Python bool
        type = t_dtype::DTYPE_BOOL;
    } else if (value == "bool_") {
        // Numpy bool
        type = t_dtype::DTYPE_BOOL;
    } else if (value == "bool8") {
        // Numpy bool8
        type = t_dtype::DTYPE_BOOL;
    } else if (value == "datetime") {
        // Python datetime
        // TODO inheritance
        type = t_dtype::DTYPE_TIME;
    } else if (value == "datetime64") {
        // Numpy datetime64
        type = t_dtype::DTYPE_TIME;
    } else if (value == "Timestamp") {
        // Pandas timestamp
        type = t_dtype::DTYPE_TIME;
    } else if (value == "date") {
        // Python date
        // TODO inheritance
        type = t_dtype::DTYPE_DATE;
    } else {
        CRITICAL("Unknown type '%s' for key '%s'", value, name);
    }
    return type;
}

t_dtype type_string_to_t_dtype(py::str type, py::str name){
    return type_string_to_t_dtype(type.cast<std::string>(), name.cast<std::string>());
}

t_val
scalar_to_py(const t_tscalar& scalar, bool cast_double, bool cast_string) {
    if (!scalar.is_valid()) {
        return py::none();
    }
    
    switch (scalar.get_dtype()) {
        case DTYPE_BOOL: {
            if (scalar) {
                return py::cast(true);
            } else {
                return py::cast(false);
            }
        }
        case DTYPE_TIME: {
            if (cast_double) {
                auto x = scalar.to_uint64();
                double y = *reinterpret_cast<double*>(&x);
                return py::cast(y);
            } else if (cast_string) {
                return py::cast(scalar.to_string(false)); // should reimplement
            } else {
                auto ms = std::chrono::milliseconds(scalar.to_int64());
                auto time_point = std::chrono::time_point<std::chrono::system_clock>(ms);
                return py::cast(time_point);
            }
        }
        case DTYPE_FLOAT64:
        case DTYPE_FLOAT32: {
            if (cast_double) {
                auto x = scalar.to_uint64();
                double y = *reinterpret_cast<double*>(&x);
                return py::cast(y);
            } else {
                return py::cast(scalar.to_double());
            }
        }
        case DTYPE_DATE: {
            t_date date = scalar.get<t_date>();
            std::tm tm = date.get_tm();
            auto mkt = std::mktime(&tm);
            auto time_point = std::chrono::system_clock::from_time_t(mkt);
            return py::cast(time_point);
        }
        case DTYPE_UINT8:
        case DTYPE_UINT16:
        case DTYPE_UINT32:
        case DTYPE_INT8:
        case DTYPE_INT16:
        case DTYPE_INT32: {
            return py::cast(scalar.to_int64());
        }
        case DTYPE_UINT64:
        case DTYPE_INT64: {
            // This could potentially lose precision
            return py::cast(scalar.to_int64());
        }
        case DTYPE_NONE: {
            return py::none();
        }
        case DTYPE_STR:
        default: {
            std::wstring_convert<utf8convert_type, wchar_t> converter("", L"<Invalid>");
            return py::cast(scalar.to_string());
        }
    }
}

} //namespace binding
} //namespace perspective

#endif