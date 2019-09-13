/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON

#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>
#include <perspective/python/utils.h>
#include <perspective/python/view.h>

namespace perspective {
namespace binding {

/******************************************************************************
 *
 * View API
 */

template <>
bool
is_valid_filter(t_dtype type, t_val date_parser, t_filter_op comp, t_val filter_term) {
    if (comp == t_filter_op::FILTER_OP_IS_NULL
        || comp == t_filter_op::FILTER_OP_IS_NOT_NULL) {
        return true;
    } else if (type == DTYPE_DATE || type == DTYPE_TIME) {
        if (py::isinstance<py::str>(filter_term)) {
            t_val parsed_date = date_parser.attr("parse")(filter_term);
            return !parsed_date.is_none();
        } else {
            return !filter_term.is_none();
        }
    } else {
        return !filter_term.is_none();
    }
};

template <>
std::tuple<std::string, std::string, std::vector<t_tscalar>>
make_filter_term(t_dtype column_type, t_val date_parser, const std::string& column_name, const std::string& filter_op_str, t_val filter_term) {
    t_filter_op filter_op = str_to_filter_op(filter_op_str);
    std::vector<t_tscalar> terms;

    switch (filter_op) {
        case FILTER_OP_NOT_IN:
        case FILTER_OP_IN: {
            std::vector<std::string> filter_terms
                = filter_term.cast<std::vector<std::string>>();
            for (auto term : filter_terms) {
                terms.push_back(mktscalar(get_interned_cstr(term.c_str())));
            }
        } break;
        case FILTER_OP_IS_NULL:
        case FILTER_OP_IS_NOT_NULL: {
            terms.push_back(mktscalar(0));
        } break;
        default: {
            switch (column_type) {
                case DTYPE_INT32: {
                    terms.push_back(mktscalar(filter_term.cast<std::int32_t>()));
                } break;
                case DTYPE_INT64:
                case DTYPE_FLOAT64: {
                    terms.push_back(mktscalar(filter_term.cast<double>()));
                } break;
                case DTYPE_BOOL: {
                    terms.push_back(mktscalar(filter_term.cast<bool>()));
                } break;
                case DTYPE_DATE: {
                    if (py::isinstance<py::str>(filter_term)) {
                        t_val parsed_date = date_parser.attr("parse")(filter_term);
                        terms.push_back(mktscalar(pythondate_to_t_date(parsed_date)));
                    } else {
                        terms.push_back(mktscalar(pythondate_to_t_date(filter_term)));
                    }
                } break;
                case DTYPE_TIME: {
                    if (py::isinstance<py::str>(filter_term)) {
                        t_val parsed_date = date_parser.attr("parse")(filter_term);
                        t_tscalar timestamp = mktscalar(t_time(pythondatetime_to_ms(parsed_date)));
                        terms.push_back(timestamp);
                    } else {
                        t_tscalar timestamp = mktscalar(t_time(pythondatetime_to_ms(filter_term)));
                        terms.push_back(timestamp);
                    }
                } break;
                default: {
                    terms.push_back(
                        mktscalar(get_interned_cstr(filter_term.cast<std::string>().c_str())));
                }
            }
        }
    }
    return std::make_tuple(column_name, filter_op_str, terms);
}

template <>
t_view_config
make_view_config(const t_schema& schema, t_val date_parser, t_val config) {
    auto row_pivots = config.attr("get_row_pivots")().cast<std::vector<std::string>>();
    auto column_pivots = config.attr("get_column_pivots")().cast<std::vector<std::string>>();
    auto p_aggregates = config.attr("get_aggregates")().cast<std::map<std::string, std::string>>();
    auto columns = config.attr("get_columns")().cast<std::vector<std::string>>();
    auto sort = config.attr("get_sort")().cast<std::vector<std::vector<std::string>>>();
    auto filter_op = config.attr("get_filter_op")().cast<std::string>();

    tsl::ordered_map<std::string, std::string> aggregates;

    for (const auto& agg : p_aggregates) {
        aggregates[agg.first] = agg.second;
    };

    bool column_only = false;

    // make sure that primary keys are created for column-only views
    if (row_pivots.size() == 0 && column_pivots.size() > 0) {
        row_pivots.push_back("psp_okey");
        column_only = true;
    }

    // construct filters with filter terms, and fill the vector of tuples
    auto p_filter = config.attr("get_filter")().cast<std::vector<std::vector<t_val>>>();
    std::vector<std::tuple<std::string, std::string, std::vector<t_tscalar>>> filter;

    for (auto f : p_filter) {
        // parse filter details
        std::string column_name = f[0].cast<std::string>();
        std::string filter_op_str = f[1].cast<std::string>();
        t_dtype column_type = schema.get_dtype(column_name);
        t_filter_op filter_operator = str_to_filter_op(filter_op_str);

        // validate the filter before it goes into the core engine
        t_val filter_term = py::none();
        if (f.size() > 2) {
            // null/not null filters do not have a filter term
            filter_term = f[2];
        }

        if (is_valid_filter(column_type, date_parser, filter_operator, filter_term)) {
            filter.push_back(make_filter_term(column_type, date_parser, column_name, filter_op_str, filter_term));
        }
    }

    // create the `t_view_config`
    t_view_config view_config(row_pivots, column_pivots, aggregates, columns, filter, sort,
        filter_op, column_only);

    // transform primitive values into abstractions that the engine can use
    view_config.init(schema);

    // set pivot depths if provided
    if (! config.attr("row_pivot_depth").is_none()) {
        view_config.set_row_pivot_depth(config.attr("row_pivot_depth").cast<std::int32_t>());
    }

    if (! config.attr("column_pivot_depth").is_none()) {
        view_config.set_column_pivot_depth(config.attr("column_pivot_depth").cast<std::int32_t>());
    }

    return view_config;
}

template <typename CTX_T>
std::shared_ptr<View<CTX_T>>
make_view(std::shared_ptr<Table> table, const std::string& name, const std::string& separator,
    t_val view_config, t_val date_parser) {
    auto schema = table->get_schema();

    t_view_config config = make_view_config<t_val>(schema, date_parser, view_config);

    auto ctx = make_context<CTX_T>(table, schema, config, name);

    auto view_ptr = std::make_shared<View<CTX_T>>(table, ctx, name, separator, config);

    return view_ptr;
}

std::shared_ptr<View<t_ctx0>>
make_view_ctx0(std::shared_ptr<Table> table, std::string name, std::string separator,
    t_val view_config, t_val date_parser) {
    return make_view<t_ctx0>(table, name, separator, view_config, date_parser);
}

std::shared_ptr<View<t_ctx1>>
make_view_ctx1(std::shared_ptr<Table> table, std::string name, std::string separator,
    t_val view_config, t_val date_parser) {
    return make_view<t_ctx1>(table, name, separator, view_config, date_parser);
}

std::shared_ptr<View<t_ctx2>>
make_view_ctx2(std::shared_ptr<Table> table, std::string name, std::string separator,
    t_val view_config, t_val date_parser) {
    return make_view<t_ctx2>(table, name, separator, view_config, date_parser);
}

} //namespace binding
} //namespace perspective

#endif