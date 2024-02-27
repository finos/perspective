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

#ifdef PSP_ENABLE_PYTHON
#include <perspective/python/fill.h>
#include <perspective/python/numpy.h>

using namespace perspective;

namespace perspective {
namespace numpy {

    const std::vector<std::string> NumpyLoader::DATE_UNITS = {
        "[D]", "[W]", "[M]", "[Y]"
    };

    NumpyLoader::NumpyLoader(t_val accessor) :
        m_init(false),
        m_accessor(accessor) {}

    NumpyLoader::~NumpyLoader() {}

    void
    NumpyLoader::init() {
        m_names = make_names();
        m_types = make_types();
        m_init = true;
    }

    std::vector<t_dtype>
    NumpyLoader::reconcile_dtypes(const std::vector<t_dtype>& inferred_types
    ) const {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        std::uint32_t num_columns = m_names.size();
        std::vector<t_dtype> reconciled_types(num_columns);

        // Get numpy dtypes as string so we can tell the difference between
        // dates and datetimes
        std::vector<std::string> str_dtypes =
            m_accessor.attr("types")().cast<std::vector<std::string>>();

        for (auto i = 0; i < num_columns; ++i) {
            std::string numpy_type_as_string = str_dtypes[i];
            t_dtype numpy_type = m_types[i];
            t_dtype inferred_type = inferred_types[i];

            // Check whether column is a date or a datetime
            if (numpy_type_as_string.find("datetime64") != std::string::npos) {
                for (const std::string& unit : DATE_UNITS) {
                    if (numpy_type_as_string.find(unit) != std::string::npos) {
                        inferred_type = DTYPE_DATE;
                    }
                }
            }

            // Otherwise, numpy type takes precedence unless date/object - need
            // specificity of inferred type
            if (inferred_type == DTYPE_DATE || numpy_type == DTYPE_OBJECT) {
                reconciled_types[i] = inferred_type;
            } else {
                reconciled_types[i] = numpy_type;
            }
        }

        return reconciled_types;
    };

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
    NumpyLoader::fill_table(
        t_data_table& tbl,
        const t_schema& input_schema,
        const std::string& index,
        std::uint32_t offset,
        std::uint32_t limit,
        bool is_update
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        bool implicit_index = false;
        std::vector<std::string> col_names(input_schema.columns());
        std::vector<t_dtype> data_types(input_schema.types());

        for (auto cidx = 0; cidx < col_names.size(); ++cidx) {
            auto name = col_names[cidx];
            auto type = data_types[cidx];

            if (name == "__INDEX__") {
                implicit_index = true;
                std::shared_ptr<t_column> pkey_col_sptr =
                    tbl.add_column_sptr("psp_pkey", type, true);
                fill_column(
                    tbl, pkey_col_sptr, "__INDEX__", type, cidx, is_update
                );
                tbl.clone_column("psp_pkey", "psp_okey");
                continue;
            }

            auto col = tbl.get_column(name);
            fill_column(tbl, col, name, type, cidx, is_update);
        }

        // Fill index column - recreated every time a `t_data_table` is created.
        if (!implicit_index) {
            if (index == "") {
                // Use row number as index if not explicitly provided or
                // provided with `__INDEX__`
                auto key_col = tbl.add_column("psp_pkey", DTYPE_INT32, true);
                auto okey_col = tbl.add_column("psp_okey", DTYPE_INT32, true);

                for (std::uint32_t ridx = 0; ridx < tbl.size(); ++ridx) {
                    key_col->set_nth<std::int32_t>(
                        ridx, (ridx + offset) % limit
                    );
                    okey_col->set_nth<std::int32_t>(
                        ridx, (ridx + offset) % limit
                    );
                }
            } else {
                tbl.clone_column(index, "psp_pkey");
                tbl.clone_column(index, "psp_okey");
            }
        }
    }

    void
    NumpyLoader::fill_column(
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

        // Use name index instead of column index - prevents off-by-one errors
        // with the "index" column.
        auto name_it = std::find(m_names.begin(), m_names.end(), name);

        // If the column name is not in the dataset, return and move on.
        if (name_it == m_names.end()) {
            return;
        }

        auto nidx = std::distance(m_names.begin(), name_it);

        // np_dtype is one of the integer/float/bool dtypes, or `DTYPE_OBJECT`.
        t_dtype np_dtype = m_types[nidx];

        py::dict source = m_accessor.attr("_get_numpy_column")(name);
        py::array array = source["array"].cast<py::array>();
        py::array_t<std::uint64_t> mask =
            source["mask"].cast<py::array_t<std::uint64_t>>();
        std::uint64_t* mask_ptr = (std::uint64_t*)mask.data();
        std::size_t mask_size = mask.size();

        // Check array dtype to make sure that `deconstruct_numpy` didn't cast
        // it to an object.
        if (array.dtype().kind() == 'O') {
            fill_column_iter(
                array, tbl, col, name, DTYPE_OBJECT, type, cidx, is_update
            );
            return;
        }

        // Datetimes are not trivially copyable - they are float64 values that
        // need to be read as int64
        if (type == DTYPE_TIME || type == DTYPE_DATE) {
            fill_column_iter(
                array, tbl, col, name, np_dtype, type, cidx, is_update
            );
            fill_validity_map(col, mask_ptr, mask_size, is_update);
            return;
        }

        /**
         * Catch common type mismatches and fill iteratively when a numpy dtype
         * is of greater bit width than the Perspective t_dtype:
         * - when `np_dtype` is int64 and `t_dtype` is `DTYPE_INT32` or
         * `DTYPE_FLOAT64`
         * - when `np_dtype` is int32 and `t_dtype` is `DTYPE_INT64` or
         * `DTYPE_FLOAT64`, which can happen on windows where np::int_ is int32
         * - when `np_dtype` is float64 and `t_dtype` is `DTYPE_INT32` or
         * `DTYPE_INT64`
         * - when `type` is float64 and `np_dtype` is `DTYPE_FLOAT32` or
         * `DTYPE_FLOAT64`
         *
         * These errors occur frqeuently when a Table is created from non-numpy
         * data or schema, then updated with a numpy array. In these cases, the
         * `t_dtype` of the Table supercedes the array dtype.
         */
        bool should_iter = (np_dtype == DTYPE_INT64
                            && (type == DTYPE_INT32 || type == DTYPE_FLOAT64))
            || (np_dtype == DTYPE_INT32
                && (type == DTYPE_INT64 || type == DTYPE_FLOAT64))
            || (np_dtype == DTYPE_FLOAT64
                && (type == DTYPE_INT32 || type == DTYPE_INT64))
            || (type == DTYPE_INT64
                && (np_dtype == DTYPE_FLOAT32 || np_dtype == DTYPE_FLOAT64));

        if (should_iter) {
            // Skip straight to numeric fill
            fill_numeric_iter(
                array, tbl, col, name, np_dtype, type, cidx, is_update
            );
            return;
        }

        bool copy_status = try_copy_array(array, col, np_dtype, type, 0);

        // Iterate if copy is not supported for the numpy array
        if (copy_status == t_fill_status::FILL_FAIL) {
            fill_column_iter(
                array, tbl, col, name, np_dtype, type, cidx, is_update
            );
        }

        // Fill validity map using null mask
        fill_validity_map(col, mask_ptr, mask_size, is_update);
    }

    template <typename T>
    void
    NumpyLoader::fill_object_iter(
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
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

            col->set_nth(i, item.cast<T>());
        }
    }

    // Add explicit instantiations for int32, int64, and float64 as they have
    // promotion logic
    template <>
    void
    NumpyLoader::fill_object_iter<std::int32_t>(
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
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

            double fval = item.cast<double>();
            if (!is_update && (fval > 2147483647 || fval < -2147483648)) {
                binding::WARN(
                    "Promoting column `%s` to float from int32", name
                );
                tbl.promote_column(name, DTYPE_FLOAT64, i, true);
                col = tbl.get_column(name);
                type = DTYPE_FLOAT64;
                col->set_nth(i, fval);
            } else if (!is_update && isnan(fval)) {
                binding::WARN(
                    "Promoting column `%s` to string from int32", name
                );
                tbl.promote_column(name, DTYPE_STR, i, false);
                col = tbl.get_column(name);
                fill_object_iter<std::string>(
                    tbl, col, name, np_dtype, DTYPE_STR, cidx, is_update
                );
                return;
            } else {
                col->set_nth(i, static_cast<std::int32_t>(fval));
            }
        }
    }

    template <>
    void
    NumpyLoader::fill_object_iter<std::int64_t>(
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
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

            double fval = item.cast<double>();
            if (isnan(fval)) {
                binding::WARN(
                    "Promoting column `%s` to string from int64", name
                );
                tbl.promote_column(name, DTYPE_STR, i, false);
                col = tbl.get_column(name);
                fill_object_iter<std::string>(
                    tbl, col, name, np_dtype, DTYPE_STR, cidx, is_update
                );
                return;
            } else {
                col->set_nth(i, static_cast<std::int64_t>(fval));
            }
        }
    }

    template <>
    void
    NumpyLoader::fill_object_iter<double>(
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
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

            bool is_float = py::isinstance<py::float_>(item);
            bool is_numpy_nan = is_float && npy_isnan(item.cast<double>());
            if (!is_float || is_numpy_nan) {
                binding::WARN(
                    "Promoting column `%s` to string from float64", name
                );
                tbl.promote_column(name, DTYPE_STR, i, false);
                col = tbl.get_column(name);
                fill_object_iter<std::string>(
                    tbl, col, name, np_dtype, DTYPE_STR, cidx, is_update
                );
                return;
            }
            col->set_nth(i, item.cast<double>());
        }
    }

    // Must be below `fill_object_iter` explicit instantiations.
    void
    NumpyLoader::fill_column_iter(
        const py::array& array,
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        // Numpy arrays are guaranteed to be continous and valid by the time
        // they enter this block, but if they're of dtype object, then we need
        // to pass it through `m_accessor.marshal`.
        switch (type) {
            case DTYPE_TIME: {
                // covers dtype `datetime64[us/ns/ms/s]`, date strings, and
                // integer timestamps in ms or s since epoch
                if (np_dtype != DTYPE_TIME) {
                    fill_object_iter<std::int64_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                } else {
                    fill_datetime_iter(
                        array, tbl, col, name, np_dtype, type, cidx, is_update
                    );
                }
            } break;
            case DTYPE_DATE: {
                // `datetime.date` objects or `datetime64[D/W/M/Y]`, always fill
                // by using `marshal`.
                fill_date_iter(col, name, np_dtype, type, cidx, is_update);
            } break;
            case DTYPE_BOOL: {
                if (np_dtype == DTYPE_OBJECT) {
                    fill_object_iter<bool>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                } else {
                    fill_bool_iter(
                        array, tbl, col, name, np_dtype, type, cidx, is_update
                    );
                }
            } break;
            case DTYPE_STR: {
                // dtype `U`
                fill_object_iter<std::string>(
                    tbl, col, name, np_dtype, type, cidx, is_update
                );
            } break;
            default: {
                // dtype `i/u/f` - fill_numeric_iter checks again for
                // `dtype=object`
                fill_numeric_iter(
                    array, tbl, col, name, np_dtype, type, cidx, is_update
                );
                break;
            }
        }
    }

    // `array.dtype=datetime64[ns/us/ms/s]`
    void
    NumpyLoader::fill_datetime_iter(
        const py::array& array,
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();

        // read the array as a double array because of `numpy.nat`
        double* ptr = (double*)array.data();

        for (auto i = 0; i < nrows; ++i) {
            std::int64_t item =
                ptr[i]; // Perspective stores datetimes using int64
            col->set_nth(i, item);
        }
    }

    void
    NumpyLoader::fill_date_iter(
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
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

            auto date_components =
                item.cast<std::map<std::string, std::int32_t>>();
            // date_components["month"] should be [0-11]
            t_date dt = t_date(
                date_components["year"],
                date_components["month"],
                date_components["day"]
            );
            col->set_nth(i, dt);
        }
    }

    void
    NumpyLoader::fill_bool_iter(
        const py::array& array,
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();

        // handle Nan/None in boolean array with dtype=object
        if (np_dtype == DTYPE_OBJECT) {
            // handle object arrays
            fill_object_iter<bool>(
                tbl, col, name, np_dtype, type, cidx, is_update
            );
        } else {
            bool* ptr = (bool*)array.data();

            for (auto i = 0; i < nrows; ++i) {
                bool item = ptr[i];
                col->set_nth(i, item);
            }
        }
    }

    void
    NumpyLoader::fill_numeric_iter(
        const py::array& array,
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        const std::string& name,
        t_dtype np_dtype,
        t_dtype type,
        std::uint32_t cidx,
        bool is_update
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        t_uindex nrows = col->size();
        const void* ptr = array.data();

        // We fill by object when `np_dtype`=object, or if there are type
        // mismatches between `np_dtype` and `type`.
        bool types_mismatched =
            (np_dtype == DTYPE_INT64
             && (type == DTYPE_INT32 || type == DTYPE_FLOAT64))
            || (np_dtype == DTYPE_INT32
                && (type == DTYPE_INT64 || type == DTYPE_FLOAT64))
            || (np_dtype == DTYPE_FLOAT64
                && (type == DTYPE_INT32 || type == DTYPE_INT64))
            || (type == DTYPE_INT64
                && (np_dtype == DTYPE_FLOAT32 || np_dtype == DTYPE_FLOAT64));

        if (types_mismatched || np_dtype == DTYPE_OBJECT) {
            switch (type) {
                case DTYPE_UINT8: {
                    fill_object_iter<std::uint8_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_UINT16: {
                    fill_object_iter<std::uint16_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_UINT32: {
                    fill_object_iter<std::uint32_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_UINT64: {
                    fill_object_iter<std::uint64_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_INT8: {
                    fill_object_iter<std::int8_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_INT16: {
                    fill_object_iter<std::int16_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_INT32: {
                    fill_object_iter<std::int32_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_INT64: {
                    fill_object_iter<std::int64_t>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_FLOAT32: {
                    fill_object_iter<float>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                case DTYPE_FLOAT64: {
                    fill_object_iter<double>(
                        tbl, col, name, np_dtype, type, cidx, is_update
                    );
                    return;
                } break;
                default:
                    PSP_COMPLAIN_AND_ABORT(
                        "Unable to fill non-numeric column `" + name
                        + "` in `fill_numeric_iter`."
                    )
            }
        }

        // Iterate through the C++ array and try to cast. Array is guaranteed to
        // be of the correct dtype and consistent in its values.
        for (auto i = 0; i < nrows; ++i) {
            if (isnan(((double*)ptr)[i]) || npy_isnan(((double*)ptr)[i])) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            switch (type) {
                case DTYPE_UINT8: {
                    col->set_nth(i, ((std::uint8_t*)ptr)[i]);
                } break;
                case DTYPE_UINT16: {
                    col->set_nth(i, ((std::uint16_t*)ptr)[i]);
                } break;
                case DTYPE_UINT32: {
                    col->set_nth(i, ((std::uint32_t*)ptr)[i]);
                } break;
                case DTYPE_UINT64: {
                    col->set_nth(i, ((std::uint64_t*)ptr)[i]);
                } break;
                case DTYPE_INT8: {
                    col->set_nth(i, ((std::int8_t*)ptr)[i]);
                } break;
                case DTYPE_INT16: {
                    col->set_nth(i, ((std::int16_t*)ptr)[i]);
                } break;
                case DTYPE_INT32: {
                    // No need for promotion logic if array is consistent
                    col->set_nth<std::int32_t>(i, ((std::int32_t*)ptr)[i]);
                } break;
                case DTYPE_INT64: {
                    col->set_nth<std::int64_t>(i, ((std::int64_t*)ptr)[i]);
                } break;
                case DTYPE_FLOAT32: {
                    col->set_nth(i, ((float*)ptr)[i]);
                } break;
                case DTYPE_FLOAT64: {
                    col->set_nth<double>(i, ((double*)ptr)[i]);
                } break;
                default:
                    break;
            }
        }
    }

    /******************************************************************************
     *
     * Copy numpy arrays into columns
     */
    t_fill_status
    NumpyLoader::try_copy_array(
        const py::array& src,
        std::shared_ptr<t_column> dest,
        t_dtype np_dtype,
        t_dtype type,
        const std::uint64_t offset
    ) {
        PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
        std::int64_t length = src.size();

        switch (np_dtype) {
            case DTYPE_BOOL:
            case DTYPE_UINT8: {
                copy_array_helper<std::uint8_t>(src.data(), dest, offset);
            } break;
            case DTYPE_UINT16: {
                copy_array_helper<std::uint16_t>(src.data(), dest, offset);
            } break;
            case DTYPE_UINT32: {
                copy_array_helper<std::uint32_t>(src.data(), dest, offset);
            } break;
            case DTYPE_UINT64: {
                copy_array_helper<std::uint64_t>(src.data(), dest, offset);
            } break;
            case DTYPE_INT8: {
                copy_array_helper<std::int8_t>(src.data(), dest, offset);
            } break;
            case DTYPE_INT16: {
                copy_array_helper<std::int16_t>(src.data(), dest, offset);
            } break;
            case DTYPE_INT32: {
                copy_array_helper<std::int32_t>(src.data(), dest, offset);
            } break;
            case DTYPE_INT64: {
                copy_array_helper<std::int64_t>(src.data(), dest, offset);
            } break;
            case DTYPE_FLOAT32: {
                copy_array_helper<float>(src.data(), dest, offset);
            } break;
            case DTYPE_FLOAT64: {
                copy_array_helper<double>(src.data(), dest, offset);
            } break;
            default: {
                return t_fill_status::FILL_FAIL;
            }
        }

        return t_fill_status::FILL_SUCCESS;
    }

    void
    NumpyLoader::fill_validity_map(
        std::shared_ptr<t_column> col,
        std::uint64_t* mask_ptr,
        std::size_t mask_size,
        bool is_update
    ) {
        // Validity map needs to be filled each time - None/np.nan/float('nan')
        // might not have been parsed correctly
        col->valid_raw_fill();

        if (mask_size > 0) {
            for (auto i = 0; i < mask_size; ++i) {
                std::uint64_t idx = mask_ptr[i];
                if (is_update) {
                    col->unset(idx);
                } else {
                    col->clear(idx);
                }
            }
        }
    }

    template <typename T>
    void
    copy_array_helper(
        const void* src,
        std::shared_ptr<t_column> dest,
        const std::uint64_t offset
    ) {
        std::memcpy(dest->get_nth<T>(offset), src, dest->size() * sizeof(T));
    }

    /******************************************************************************
     *
     * Generate metadata for numpy arrays
     */
    std::vector<std::string>
    NumpyLoader::make_names() {
        auto data = m_accessor.attr("data")();
        auto py_names =
            m_accessor.attr("names")().cast<std::vector<std::string>>();

        // Match names to dataset - only keep names that are present in dataset.
        // The `m_names` variable is used internally to access the numpy arrays
        // containing each column. On first-time load, `m_names` contains
        // every name in the dataset. On update, `m_names` is recalculated to
        // only include columns that are present in the update dataset.
        std::vector<std::string> names;
        for (const auto& name : py_names) {
            if (data.contains(py::str(name))) {
                names.push_back(name);
            }
        }

        return names;
    }

    std::vector<t_dtype>
    NumpyLoader::make_types() {
        std::vector<t_dtype> rval(m_names.size());

        auto data = m_accessor.attr("data")();

        for (auto i = 0; i < m_names.size(); ++i) {
            const std::string& name = m_names[i];

            // Access each array by name to guarantee ordered access.
            py::array array = py::array::ensure(data[py::str(name)]);

            if (!array) {
                PSP_COMPLAIN_AND_ABORT(
                    "Perspective does not support the "
                    "mixing of ndarrays and lists."
                );
            }

            // can't use isinstance on datetime/timedelta array, so check the
            // dtype
            char dtype_code = array.dtype().kind();

            if (dtype_code == 'M') {
                // datetime64
                rval[i] = DTYPE_TIME;
                continue;
            } else if (dtype_code == 'm') {
                // coerce timedelta to string
                rval[i] = DTYPE_STR;
                continue;
            }

            // isinstance checks equality of underlying dtype, not just pointer
            // equality
            if (py::isinstance<py::array_t<std::uint8_t>>(array)) {
                rval[i] = DTYPE_UINT8;
            } else if (py::isinstance<py::array_t<std::uint16_t>>(array)) {
                rval[i] = DTYPE_UINT16;
            } else if (py::isinstance<py::array_t<std::uint32_t>>(array)) {
                rval[i] = DTYPE_UINT32;
            } else if (py::isinstance<py::array_t<std::uint64_t>>(array)) {
                rval[i] = DTYPE_UINT64;
            } else if (py::isinstance<py::array_t<std::int8_t>>(array)) {
                rval[i] = DTYPE_INT8;
            } else if (py::isinstance<py::array_t<std::int16_t>>(array)) {
                rval[i] = DTYPE_INT16;
            } else if (py::isinstance<py::array_t<std::int32_t>>(array)) {
                rval[i] = DTYPE_INT32;
            } else if (py::isinstance<py::array_t<std::int64_t>>(array)) {
                rval[i] = DTYPE_INT64;
            } else if (py::isinstance<py::array_t<float>>(array)) {
                rval[i] = DTYPE_FLOAT32;
            } else if (py::isinstance<py::array_t<double>>(array)) {
                rval[i] = DTYPE_FLOAT64;
            } else if (py::isinstance<py::array_t<bool>>(array)) {
                rval[i] = DTYPE_BOOL;
            } else {
                // DTYPE_OBJECT defers to the inferred type: this allows parsing
                // of datetime strings, boolean strings, etc.
                rval[i] = DTYPE_OBJECT;
            }
        }

        return rval;
    }

} // namespace numpy
} // namespace perspective
#endif