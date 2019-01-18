/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON
#include <perspective/binding.h>
#include <perspective/python.h>
#include <cstdint>


perspective::t_schema* t_schema_init(py::list& columns, py::list& types)
{
    std::vector<std::string> cols;
    std::vector<perspective::t_dtype> ts;

    for(ssize_t i=0; i < py::len(columns); i++) {
        cols.push_back(py::extract<std::string>(columns[i]));
    }

    for(ssize_t i=0; i < py::len(types); i++) {
        ts.push_back(py::extract<perspective::t_dtype>(types[i]));
    }

    return new perspective::t_schema(cols, ts);
}

template<typename T>
void _fill_col(std::vector<T>& dcol, std::shared_ptr<perspective::t_column> col)
{
    perspective::t_uindex nrows = col->size();

    for (auto i = 0; i < nrows; ++i)
    {
        auto elem = dcol[i];
        // std::cout << elem << std::endl;
        col->set_nth(i, elem);
    }
}

template<typename T>
void _fill_col_np(np::ndarray& dcol, std::shared_ptr<perspective::t_column>col)
{
    perspective::t_uindex nrows = col->size();
    for (auto i = 0; i < nrows; ++i)
    {
        // auto elem = dcol[i];
        auto elem = reinterpret_cast<T *>(dcol.get_data()+(i*sizeof(T)));
        // T elem = py::extract<T>(dcol[i]);
        // std::cout << *elem << std::endl;
        col->set_nth(i, *elem);
    }
}

void _fill_data_single_column(perspective::t_table& tbl,
                              const std::string& colname_i,
                              py::list& data_cols_i,
                              perspective::t_dtype col_type)
{
    std::string name = colname_i;
    std::shared_ptr<perspective::t_column> col = tbl.get_column(name);

    switch(col_type){
        case perspective::DTYPE_INT64 : {
            std::vector<std::int64_t> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<std::int64_t>(data_cols_i[i]));
            }

            _fill_col<std::int64_t>(dcol, col);
            break;
        }
        case perspective::DTYPE_UINT64 : {
            std::vector<std::uint64_t> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<std::uint64_t>(data_cols_i[i]));
            }

            _fill_col<std::uint64_t>(dcol, col);
            break;
        }
        case perspective::DTYPE_FLOAT64 : {
            std::vector<double> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<double>(data_cols_i[i]));
            }

            _fill_col<double>(dcol, col);
            break;
        }
        case perspective::DTYPE_BOOL : {
            //FIXME segfault
            std::vector<bool> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<bool>(data_cols_i[i]));
            }

            _fill_col<bool>(dcol, col);
            break;
        }
        case perspective::DTYPE_STR : {

            std::vector<std::string> dcol;

            for(ssize_t i=0; i < py::len(data_cols_i); i++)
            {
                dcol.push_back(py::extract<std::string>(data_cols_i[i]));
            }

            _fill_col<std::string>(dcol, col);
            break;
        }
        default: {
            break;
        }
    }
}

void
_fill_data_single_column_np(perspective::t_table& tbl,
                            const std::string& colname_i,
                            np::ndarray& dcol,
                            perspective::t_dtype col_type)
{
    std::string name = colname_i;
    std::shared_ptr<perspective::t_column> col = tbl.get_column(name);

    switch(col_type){
        case perspective::DTYPE_INT64 : {
            _fill_col_np<std::int64_t>(dcol, col);
            break;
        }
        case perspective::DTYPE_FLOAT64 : {
            _fill_col_np<double>(dcol, col);
            break;
        }
        case perspective::DTYPE_STR : {
            _fill_col_np<std::string>(dcol, col);
            break;
        }
        default: {
            break;
        }
    }
}


np::ndarray _get_as_numpy(perspective::t_table& tbl, const std::string& colname_i)
{
    std::string name = colname_i;
    std::shared_ptr<perspective::t_column> col = tbl.get_column(name);
    return col->_as_numpy();
}



#endif