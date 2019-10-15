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
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/column.h>

namespace perspective {
namespace numpy {

    /**
     * NumpyLoader fast-tracks the loading of Numpy arrays into Perspective, utilizing memcpy whenever possible.
     */
    class PERSPECTIVE_EXPORT NumpyLoader {
        public:
            NumpyLoader();
            ~NumpyLoader();

            /**
             * Fill a `t_data_table` with numpy array-backed data.
             */
            void fill_table(t_data_table& tbl, const std::string& index, std::uint32_t offset,
                std::uint32_t limit, bool is_update)

            /**
             * Fill a column with a Numpy array by copying it wholesale into the column without iteration.
             * 
             * @param array
             * @param col
             * @param length
             * @param type
             * @param is_update
             */
            template <typename T>
            void fill_column(T* array, std::shared_ptr<t_column> col, std::uint64_t length, t_dtype type, bool is_update);

        private:
            /**
             * Given a py::array_t, use instanceof to convert it into a valid Perspective dtype.
             */
            t_dtype convert_type(t_val array);
    };

    /**
     * Given a source and destination column pointer, copy the data from source to destination at `offset`.
     * 
     * @param source
     * @param dest
     * @param length - the length of the source array
     * @param offset
     */
    template <typename T>
    void copy_array(T* source, std::shared_ptr<t_column> dest, const std::uint64_t length, const std::uint64_t offset) {
        std::uint64_t size;
        // TODO: only works for doubles
        std::memcpy((void*) dest->get_nth<T>(offset), (void*) source, length * 8);
        dest->valid_raw_fill();
    }

    template <typename T>
    void NumpyLoader::fill_column(T* source, std::shared_ptr<t_column> col, std::uint64_t length, t_dtype type, bool is_update) {
        copy_array(source, col, length, 0);
    }
   
} // namespace numpy
} // numpy perspective
#endif