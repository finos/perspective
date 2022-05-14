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

    t_dtype
    type_string_to_t_dtype(std::string value, std::string name) {
        auto type = t_dtype::DTYPE_STR;

        // TODO consider refactor
        if (value == "int" || value == "integer" || value == "int64"
            || value == "long") {
            // Python int, long, and Numpy int64
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
        } else if (value == "str" || value == "string" || value == "unicode") {
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
        } else if (value == "Period") {
            // Pandas period
            type = t_dtype::DTYPE_TIME;
        } else if (value == "date") {
            // Python date
            // TODO inheritance
            type = t_dtype::DTYPE_DATE;
        } else if (value == "timedelta64" || value == "time") {
            // cast time/timedelta to string to preserve units
            type = t_dtype::DTYPE_STR;
        } else if (value == "object") {
            // Python object, stored as PyObject * pointer
            type = t_dtype::DTYPE_OBJECT;
        } else {
            CRITICAL("Unknown type '%s' for key '%s'", value, name);
        }
        return type;
    }

    t_dtype
    type_string_to_t_dtype(py::str type, py::str name) {
        return type_string_to_t_dtype(
            type.cast<std::string>(), name.cast<std::string>());
    }

    t_val
    scalar_to_py(const t_tscalar& scalar, bool cast_double, bool cast_string) {
        if (!scalar.is_valid()) {
            return py::none();
        }

        switch (scalar.get_dtype()) {
            case DTYPE_BOOL: {
                if (scalar.as_bool()) {
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
                    return py::cast(
                        scalar.to_string(false)); // should reimplement
                } else {
                    /**
                     * datetimes are stored as milliseconds since epoch.
                     * Before datetimes are loaded into Perspective, if they are
                     * time zone aware, they must be converted into UTC.
                     */
                    auto i64 = scalar.to_int64();

                    // check for datetime >= 10000-01-01 00:00:00
                    if (i64 >= 253402318800000) {
                        // Python has a max year of 9999 - Perspective is able
                        // to store POSIX timestamps above Python's
                        // `datetime.max`, but it cannot be converted back out
                        // to Python so it is functionally useless. Instead,
                        // truncate the offending date and return
                        // `datetime.max`.
                        std::stringstream ss;
                        ss << "Python cannot display dates above "
                              "`datetime.max` - timestamp `";
                        ss << i64;
                        ss << "` will be truncated to `datetime.max`.";
                        ss << std::endl;
                        std::cerr << ss.str();
                        i64 = 253402300799000;
                    }

                    auto ms = std::chrono::milliseconds(i64);
                    auto time_point
                        = std::chrono::time_point<std::chrono::system_clock>(
                            ms);
                    /**
                     * Pybind converts std::time_point to local time, and the
                     * `datetime.datetime` object created by `py::cast` has NO
                     * `timezone` property. It is created using
                     * `std::localtime`, and cannot be made timezone-aware.
                     */
                    return py::cast(time_point);
                }
            }
            case DTYPE_FLOAT32: {
                return py::cast(scalar.get<float>());
            }
            case DTYPE_FLOAT64: {
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
            case DTYPE_INT32:
            case DTYPE_UINT64:
            case DTYPE_INT64: {
                return py::cast(scalar.to_int64());
            }
            case DTYPE_OBJECT: {
                // Extract pointer
                PyObject* ptr
                    = static_cast<PyObject*>((void*)scalar.to_uint64());

                // nullptr
                if (!scalar.to_uint64()) {
                    return py::none();
                }
                // Reconstruct python object
                return py::cast<py::object>(ptr);
            }
            case DTYPE_NONE: {
                return py::none();
            }
            case DTYPE_STR:
            default: {
                return py::cast(scalar.to_string());
            }
        }
    }

} // namespace binding
} // namespace perspective

#endif