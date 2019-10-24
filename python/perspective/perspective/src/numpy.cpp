/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON
#include <perspective/python/fill.h>
#include <perspective/python/numpy.h>

using namespace perspective;

namespace perspective {
namespace numpy {

    NumpyLoader::NumpyLoader(py::object accessor)
        : m_init(false)
        , m_accessor(accessor) {}

    NumpyLoader::~NumpyLoader() {}

    void
    NumpyLoader::init() {
        m_names = make_names();
        m_types = make_types();
        m_init = true;
    }

    std::vector<std::string>
    NumpyLoader::names() const {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        return m_names;
    }

    std::vector<t_dtype>
    NumpyLoader::types() const {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        return m_types;
    }

    std::uint32_t
    NumpyLoader::row_count() const {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        return m_accessor.attr("row_count")().cast<std::uint32_t>();
    }

    void
    NumpyLoader::fill_table(t_data_table& tbl, const t_schema& input_schema,
        const std::string& index, std::uint32_t offset, std::uint32_t limit, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        bool implicit_index = false;
        std::vector<std::string> col_names(input_schema.columns());
        std::vector<t_dtype> data_types(input_schema.types());

        for (auto cidx = 0; cidx < col_names.size(); ++cidx) {
            auto name = col_names[cidx];
            auto type = data_types[cidx];

            std::cout << "Column " << name << " has infer type " << dtype_to_str(type) << std::endl;

            if (name == "__INDEX__") {
                implicit_index = true;
                std::shared_ptr<t_column> pkey_col_sptr = tbl.add_column_sptr("psp_pkey", type, true);
                fill_column(tbl, pkey_col_sptr, "__INDEX__", type, cidx, is_update);
                tbl.clone_column("psp_pkey", "psp_okey");
                continue;
            }

            auto col = tbl.get_column(name);
            fill_column(tbl, col, name, type, cidx, is_update);
        }

        // Fill index column - recreated every time a `t_data_table` is created.
        if (!implicit_index) {
            if (index == "") {
                // Use row number as index if not explicitly provided or provided with `__INDEX__`
                auto key_col = tbl.add_column("psp_pkey", DTYPE_INT32, true);
                auto okey_col = tbl.add_column("psp_okey", DTYPE_INT32, true);

                for (std::uint32_t ridx = 0; ridx < tbl.size(); ++ridx) {
                    key_col->set_nth<std::int32_t>(ridx, (ridx + offset) % limit);
                    okey_col->set_nth<std::int32_t>(ridx, (ridx + offset) % limit);
                }
            } else {
                tbl.clone_column(index, "psp_pkey");
                tbl.clone_column(index, "psp_okey");
            }
        }
    }

    
    void 
    NumpyLoader::fill_column(t_data_table& tbl, std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

        // TODO: can be removed
        if (type == DTYPE_TIME) {
            fill_datetime_iter(col, name, type, cidx, is_update);
            return;
        }

        std::cout << m_names << std::endl;
        // Use name index instead of column index - prevents off-by-one errors with the "index" column.
        auto name_it = std::find(m_names.begin(), m_names.end(), name); 
        
        if (name_it == m_names.end()) {
            std::stringstream ss;
            ss << "Cannot fill column '" << name << "' as it is not in the table schema.";
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }

        auto nidx = std::distance(m_names.begin(), name_it);

        /**
         * np_dtype is used to attempt `memcpy` of the numpy array into perspective.
         * if memcpy fails, it is most likely a numpy array with `dtype=object`, so use the inferred type from perspective.
         */
        t_dtype np_dtype = m_types[nidx];

        std::cout << "COL " << name << " with dtype " << dtype_to_str(np_dtype) << std::endl;
        
        try {
            py::dict source = m_accessor.attr("_get_numpy_column")(name, type);
            py::object array = source["array"];
            py::object mask = source["mask"];
            copy_array(array, col, np_dtype, 0);

            // Fill validity map
            col->valid_raw_fill();
            col->pprint();
            auto num_invalid = len(mask);

            if (num_invalid > 0) {
                py::array_t<std::uint64_t> null_array = mask;
                std::uint64_t* ptr = (std::uint64_t*) null_array.data();
                for (auto i = 0; i < num_invalid; ++i) {
                    std::uint64_t idx = ptr[i];
                    if (is_update) {
                        col->unset(idx);
                    } else {
                        col->clear(idx);
                    }
                }
            }

            col->pprint();
        } catch (const PerspectiveException& ex) {
            fill_column_iter(tbl, col, name, type, cidx, is_update);
        }
    }

    void
    NumpyLoader::fill_column_iter(t_data_table& tbl, std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        switch (type) {
            case DTYPE_TIME: {
                fill_datetime_iter(col, name, type, cidx, is_update);
            } break;
            case DTYPE_DATE: {
                fill_date_iter(col, name, type, cidx, is_update);
            } break;
            case DTYPE_BOOL: {
                fill_bool_iter(col, name, type, cidx, is_update);
            } break;
            case DTYPE_STR: {
                fill_string_iter(col, name, type, cidx, is_update);
            } break;
            default: {
                fill_numeric_iter(tbl, col, name, type, cidx, is_update);
                break;
            }
        }
    }

    void 
    NumpyLoader::fill_numeric_iter(t_data_table& tbl, std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            t_val item = m_accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            switch (type) {
                case DTYPE_UINT8: {
                    col->set_nth(i, item.cast<std::uint8_t>());
                } break;
                case DTYPE_UINT16: {
                    col->set_nth(i, item.cast<std::uint16_t>());
                } break;
                case DTYPE_UINT32: {
                    col->set_nth(i, item.cast<std::uint32_t>());
                } break;
                case DTYPE_UINT64: {
                    col->set_nth(i, item.cast<std::uint64_t>());
                } break;
                case DTYPE_INT8: {
                    col->set_nth(i, item.cast<std::int8_t>());
                } break;
                case DTYPE_INT16: {
                    col->set_nth(i, item.cast<std::int16_t>());
                } break;
                case DTYPE_INT32: {
                    // This handles cases where a long sequence of e.g. 0 precedes a clearly
                    // float value in an inferred column. Would not be needed if the type
                    // inference checked the entire column/we could reset parsing.
                    double fval = item.cast<double>();
                    if (fval > 2147483647 || fval < -2147483648) {
                        binding::WARN("Promoting %s to float from int32", name);
                        tbl.promote_column(name, DTYPE_FLOAT64, i, true);
                        col = tbl.get_column(name);
                        type = DTYPE_FLOAT64;
                        col->set_nth(i, fval);
                    } else if (isnan(fval)) {
                        binding::WARN("Promoting %s to string from int32", name);
                        tbl.promote_column(name, DTYPE_STR, i, false);
                        col = tbl.get_column(name);
                        fill_string_iter(col, name, DTYPE_STR, cidx, is_update);
                        return;
                    } else {
                        col->set_nth(i, static_cast<std::int32_t>(fval));
                    }
                } break;
                case DTYPE_INT64: {
                    double fval = item.cast<double>();
                    if (isnan(fval)) {
                        binding::WARN("Promoting %s to string from int64", name);
                        tbl.promote_column(name, DTYPE_STR, i, false);
                        col = tbl.get_column(name);
                        fill_string_iter(col, name, DTYPE_STR, cidx, is_update);
                        return;
                    } else {
                        col->set_nth(i, static_cast<std::int64_t>(fval));
                    }
                } break;
                case DTYPE_FLOAT32: {
                    col->set_nth(i, item.cast<float>());
                } break;
                case DTYPE_FLOAT64: {
                    bool is_float = py::isinstance<py::float_>(item);
                    bool is_numpy_nan = is_float && npy_isnan(item.cast<double>());
                    if (!is_float || is_numpy_nan) {
                        binding::WARN("Promoting %s to string from int64", name);
                        tbl.promote_column(name, DTYPE_STR, i, false);
                        col = tbl.get_column(name);
                        fill_string_iter(col, name, DTYPE_STR, cidx, is_update);
                        return;
                    }
                    col->set_nth(i, item.cast<double>());
                } break;
                default:
                    break;
            }
        }
    }

    void
    NumpyLoader::fill_datetime_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        // memcpy doesn't work at the moment - simulate that path but iterate through
        t_uindex nrows = col->size();
        py::dict source = m_accessor.attr("_get_numpy_column")(name, type);
        py::array_t<std::int64_t> array = source["array"].cast<py::array_t<std::int64_t>>();
        std::int64_t* ptr = (std::int64_t*) array.data();

        for (auto i = 0; i < nrows; ++i) {
            col->set_nth(i, ptr[i] * 1000); // convert to milliseconds         
        }

        py::array_t<std::int64_t> mask = source["mask"].cast<py::array_t<std::int64_t>>();
        auto num_nulls = mask.size();
        std::int64_t* mask_ptr = (std::int64_t*) mask.request().ptr;
        for (auto i = 0; i < num_nulls; ++i) {
            col->set_valid(mask_ptr[i], false);
        }
    }

    void
    NumpyLoader::fill_date_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            t_val item = m_accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }


            auto date_components = item.cast<std::map<std::string, std::int32_t>>();
            t_date dt = t_date(date_components["year"], date_components["month"], date_components["day"]);
            col->set_nth(i, dt);
        }
    }

    void
    NumpyLoader::fill_string_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            t_val item = m_accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            col->set_nth(i, item.cast<std::string>());
        }
    }

    void
    NumpyLoader::fill_bool_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            t_val item = m_accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            col->set_nth(i, item.cast<bool>());
        }
    }

    void
    NumpyLoader::copy_array(py::object src, std::shared_ptr<t_column> dest, t_dtype np_dtype, const std::uint64_t offset) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        std::int64_t length = py::len(src);

        // Ensure input is a a numpy array
        py::array array = py::array::ensure(src);

        if (!array) {
            PSP_COMPLAIN_AND_ABORT("Cannot copy a non-numpy array into Perspective.");
        }

        switch (np_dtype) {
            case DTYPE_UINT8: {
                copy_array_helper<std::uint8_t>(array.data(), dest, offset);
            } break;
            case DTYPE_UINT16: {
                copy_array_helper<std::uint16_t>(array.data(), dest, offset);
            } break;
            case DTYPE_UINT32: {
                copy_array_helper<std::uint32_t>(array.data(), dest, offset);
            } break;
            case DTYPE_UINT64: {
                copy_array_helper<std::uint64_t>(array.data(), dest, offset);
            } break;
            case DTYPE_INT8: {
                copy_array_helper<std::int8_t>(array.data(), dest, offset);
            } break;
            case DTYPE_INT16: {
                copy_array_helper<std::int16_t>(array.data(), dest, offset);
            } break;
            case DTYPE_INT32: {
                copy_array_helper<std::int32_t>(array.data(), dest, offset);
            } break;
            case DTYPE_INT64: {
                copy_array_helper<std::int64_t>(array.data(), dest, offset);
            } break;
            case DTYPE_FLOAT32: {
                copy_array_helper<float>(array.data(), dest, offset);
            } break;
            case DTYPE_FLOAT64: {
                copy_array_helper<double>(array.data(), dest, offset);
            } break;
            default: {
                std::stringstream ss;
                ss << "Could not copy numpy array of Perspective `t_dtype` '" << dtype_to_str(np_dtype) << "'" << std::endl;
                PSP_COMPLAIN_AND_ABORT(ss.str());
                break;
            }
        }
    }

    template <typename T>
    void copy_array_helper(const void* src, std::shared_ptr<t_column> dest, const std::uint64_t offset) {
        std::memcpy(dest->get_nth<T>(offset), src, dest->size() * sizeof(T));
    }

    std::vector<std::string>
    NumpyLoader::make_names() {
        auto names = py::list(m_accessor.attr("data")().attr("keys")());
        return names.cast<std::vector<std::string>>();
    }

    std::vector<t_dtype>
    NumpyLoader::make_types() {
        std::vector<t_dtype> rval;
        
        py::list arrays = m_accessor.attr("data")().attr("values")();
        for (const auto& a : arrays) {
            py::array array = py::array::ensure(a);

            if (!array || array.dtype().kind() == 'O' || array.dtype().kind() == 'M') {
                rval.push_back(DTYPE_STR);
                continue;
            }

            if (py::isinstance<py::array_t<std::uint8_t>>(array)) {
                rval.push_back(DTYPE_UINT8);
            } else if (py::isinstance<py::array_t<std::uint16_t>>(array)) {
                rval.push_back(DTYPE_UINT16);
            } else if (py::isinstance<py::array_t<std::uint32_t>>(array)) {
                rval.push_back(DTYPE_UINT32);
            } else if (py::isinstance<py::array_t<std::uint64_t>>(array)) {
                rval.push_back(DTYPE_UINT64);
            } else if (py::isinstance<py::array_t<std::int8_t>>(array)) {
                rval.push_back(DTYPE_INT8);
            } else if (py::isinstance<py::array_t<std::int16_t>>(array)) {
                rval.push_back(DTYPE_INT16);
            } else if (py::isinstance<py::array_t<std::int32_t>>(array)) {
                rval.push_back(DTYPE_INT32);
            } else if (py::isinstance<py::array_t<std::int64_t>>(array)) {
                rval.push_back(DTYPE_INT64);
            } else if (py::isinstance<py::array_t<float>>(array)) {
                rval.push_back(DTYPE_FLOAT32);
            } else if (py::isinstance<py::array_t<double>>(array)) {
                rval.push_back(DTYPE_FLOAT64);
            } else if (py::isinstance<py::array_t<bool>>(array)) {
                rval.push_back(DTYPE_BOOL);
            } else {
                PSP_COMPLAIN_AND_ABORT("Cannot infer type of non-numpy array.");
            }
        }

        return rval;
    }
    
} // namespace numpy
} // namespace perspective
#endif