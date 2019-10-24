/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#ifdef PSP_ENABLE_PYTHON
#pragma once
#include <pybind11/numpy.h>
#include <pybind11/pybind11.h>
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exception.h>
#include <perspective/column.h>
#include <perspective/data_table.h>
#include <perspective/python/utils.h>

namespace perspective {
namespace numpy {

    /**
     * NumpyLoader fast-tracks the loading of Numpy arrays into Perspective, utilizing memcpy whenever possible.
     */
    class PERSPECTIVE_EXPORT NumpyLoader {
        public:
            NumpyLoader(py::object accessor);
            ~NumpyLoader();

            /**
             * Initialize the Numpy loader by constructing the column names and data types arrays.
             */
            void init();

            /**
             * Fill a `t_data_table` with numpy array-backed data.
             */
            void fill_table(t_data_table& tbl, const t_schema& input_schema, const std::string& index, 
                std::uint32_t offset, std::uint32_t limit, bool is_update);

            /**
             * Fill a column with a Numpy array by copying it wholesale into the column without iteration.
             * 
             * @param array
             * @param col
             * @param length
             * @param type
             * @param is_update
             */
            void fill_column(t_data_table& tbl, std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);

            std::vector<std::string> names() const;
            std::vector<t_dtype> types() const;
            std::uint32_t row_count() const;
        private:
            /**
             * When memory cannot be copied (for dtype=object arrays, for example), fill the column through iteration.
             */
            void fill_column_iter(t_data_table& tbl, std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);

            // Fill helpers
            void fill_numeric_iter(t_data_table& tbl, std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);       
            void fill_date_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);
            void fill_datetime_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);
            void fill_string_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);
            void fill_bool_iter(std::shared_ptr<t_column> col, const std::string& name, t_dtype type, std::uint32_t cidx, bool is_update);

            /**
             * Extract a numpy array from src and copy it into dest.
             */
            void copy_array(py::object src, std::shared_ptr<t_column> dest, t_dtype np_dtype, const std::uint64_t offset);

            // Return the column names from the Python data accessor
            std::vector<std::string> make_names();

            // Map the dtype of each numpy array into Perspective `t_dtype`s.
            std::vector<t_dtype> make_types();

            bool m_init;
            py::object m_accessor;
            std::vector<std::string> m_names;
            std::vector<t_dtype> m_types;
    };

    template <typename T>
    void copy_array_helper(const void* src, std::shared_ptr<t_column> dest, const std::uint64_t offset);

} // namespace numpy
} // numpy perspective
#endif