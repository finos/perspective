/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#ifdef PSP_ENABLE_PYTHON
#include <pybind11/numpy.h>
#include <pybind11/pybind11.h>
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exception.h>
#include <perspective/column.h>
#include <perspective/data_table.h>
#include <perspective/python/utils.h>

#ifdef WIN32
#ifndef PERSPECTIVE_EXPORTS
#define PERSPECTIVE_BINDING_EXPORT __declspec(dllexport)
#else
#define PERSPECTIVE_BINDING_EXPORT __declspec(dllimport)
#endif
#else
#define PERSPECTIVE_BINDING_EXPORT __attribute__((visibility("default")))
#endif

namespace perspective {
namespace numpy {

    enum t_fill_status { FILL_SUCCESS, FILL_FAIL };

    /**
     * NumpyLoader fast-tracks the loading of Numpy arrays into Perspective,
     * utilizing memcpy whenever possible.
     */
    class PERSPECTIVE_BINDING_EXPORT NumpyLoader {
    public:
        NumpyLoader(t_val accessor);
        ~NumpyLoader();

        /**
         * Initialize the Numpy loader by constructing the column names and data
         * types arrays.
         */
        void init();

        /**
         * Given `inferred_types` from Perspective, use the `m_types` array of
         * numpy array dtypes and reconcile differences between numeric dtypes
         * by *preferring the dtype of the numpy array* and returning a vector
         * of the correct, reconciled types.
         *
         * This prevents the situation where Perspective infers an int column to
         * `DTYPE_INT32` but the numpy array dtype is actually "int64".
         *
         * Marked const as this method does not mutate the internal `m_types`
         * property.
         */
        std::vector<t_dtype> reconcile_dtypes(
            const std::vector<t_dtype>& inferred_types) const;

        /**
         * Fill a `t_data_table` with numpy array-backed data.
         */
        void fill_table(t_data_table& tbl, const t_schema& input_schema,
            const std::string& index, std::uint32_t offset, std::uint32_t limit,
            bool is_update);

        /**
         * Fill a column with a Numpy array by copying it wholesale into the
         * column without iteration.
         *
         * If the copy operation fails, fill the column iteratively.
         *
         * @param tbl
         * @param col
         * @param length
         * @param type
         * @param is_update
         */
        void fill_column(t_data_table& tbl, std::shared_ptr<t_column> col,
            const std::string& name, t_dtype type, std::uint32_t cidx,
            bool is_update);

        std::vector<std::string> names() const;
        std::vector<t_dtype> types() const;
        std::uint32_t row_count() const;

        /**
         * Keep a list of numpy datetime64 units that we should treat as dates
         * and not datetimes.
         */
        static const std::vector<std::string> DATE_UNITS;

    private:
        /**
         * When memory cannot be copied for dtype=object arrays, for example),
         * fill the column through iteration.
         */
        void fill_column_iter(const py::array& array, t_data_table& tbl,
            std::shared_ptr<t_column> col, const std::string& name,
            t_dtype np_dtype, t_dtype type, std::uint32_t cidx, bool is_update);

        /**
         * Fill arrays with dtype=object using the data accessor's marshal
         * method.
         *
         * Because we don't iterate through the array directly, don't pass the
         * array into this method/any others that call `marshal`.
         *
         * If filling a column of `DTYPE_TIME`, <T> is always `std::int64_t`.
         */
        template <typename T>
        void fill_object_iter(t_data_table& tbl, std::shared_ptr<t_column> col,
            const std::string& name, t_dtype np_dtype, t_dtype type,
            std::uint32_t cidx, bool is_update);

        // Fill dates that might be `datetime.date` or strings
        void fill_date_iter(std::shared_ptr<t_column> col,
            const std::string& name, t_dtype np_dtype, t_dtype type,
            std::uint32_t cidx, bool is_update);

        // Fill using numpy arrays with defined numpy dtypes that are not
        // `object`

        /**
         * Given a numpy array containing a numeric type, and a determination
         * that `type` is numeric (int/float), fill it iteratively.
         *
         * Iterating through the array and filling the underlying column allows
         * us to cast the array's values to the `t_dtype` of the table, which
         * may be of a higher or a lower bit width (i.e. filling a table that
         * was inferred as `DTYPE_INT32` with `DTYPE_INT64`, which is more
         * commonly used in numpy arrays.)
         */
        void fill_numeric_iter(const py::array& array, t_data_table& tbl,
            std::shared_ptr<t_column> col, const std::string& name,
            t_dtype np_dtype, t_dtype type, std::uint32_t cidx, bool is_update);

        void fill_datetime_iter(const py::array& array, t_data_table& tbl,
            std::shared_ptr<t_column> col, const std::string& name,
            t_dtype np_dtype, t_dtype type, std::uint32_t cidx, bool is_update);

        void fill_bool_iter(const py::array& array, t_data_table& tbl,
            std::shared_ptr<t_column> col, const std::string& name,
            t_dtype np_dtype, t_dtype type, std::uint32_t cidx, bool is_update);

        /**
         * Extract a numpy array from src and copy it into dest.
         *
         * If `np_dtype` and `type` mismatch in the following cases, then fill
         * iteratively:
         *
         * - when `np_dtype` is int64 and `t_dtype` is `DTYPE_INT32` or
         * `DTYPE_FLOAT64`
         * - when `np_dtype` is float64 and `t_dtype` is `DTYPE_INT32` or
         * `DTYPE_INT64`
         *
         * These errors occur frqeuently when a Table is created from non-numpy
         * data, then updated with a numpy array. The `t_dtype` of the Table
         * always supercedes the array dtype, as the table is immutable after
         * creation.
         *
         * Returns a `t_fill_status` enum indicating success or failure of the
         * copy operation.
         */
        t_fill_status try_copy_array(const py::array& src,
            std::shared_ptr<t_column> dest, t_dtype np_dtype, t_dtype type,
            const std::uint64_t offset);

        void fill_validity_map(std::shared_ptr<t_column> col,
            std::uint64_t* mask_ptr, std::size_t mask_size, bool is_update);

        // Return the column names from the Python data accessor
        std::vector<std::string> make_names();

        // Map the dtype of each numpy array into Perspective `t_dtype`s.
        std::vector<t_dtype> make_types();

        bool m_init;

        /**
         * A flag to determine whether to reconcile numpy array dtype with
         * perspective inferred types.
         *
         * Defaults to false - is true when any array dtype is of
         * int/float/bool.
         */
        bool m_has_numeric_dtype;
        t_val m_accessor;
        std::vector<std::string> m_names;
        std::vector<t_dtype> m_types;
    };

    /**
     * Copy the data of a numpy array into a `t_column`.
     */
    template <typename T>
    void copy_array_helper(const void* src, std::shared_ptr<t_column> dest,
        const std::uint64_t offset);

} // namespace numpy
} // namespace perspective
#endif