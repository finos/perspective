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
#include <perspective/python/view.h>

namespace perspective {
namespace binding {

    /******************************************************************************
     *
     * View API
     */

    template <>
    bool
    is_valid_filter(
        t_dtype type, t_val date_parser, t_filter_op comp, t_val filter_term) {
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
    make_filter_term(t_dtype column_type, t_val date_parser,
        const std::string& column_name, const std::string& filter_op_str,
        t_val filter_term) {
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
                        terms.push_back(
                            mktscalar(filter_term.cast<std::int32_t>()));
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
                            t_val parsed_date
                                = date_parser.attr("parse")(filter_term);
                            auto date_components
                                = date_parser
                                      .attr("to_date_components")(parsed_date)
                                      .cast<std::map<std::string,
                                          std::int32_t>>();
                            t_date dt = t_date(date_components["year"],
                                date_components["month"],
                                date_components["day"]);
                            terms.push_back(mktscalar(dt));
                        } else {
                            auto date_components
                                = date_parser
                                      .attr("to_date_components")(filter_term)
                                      .cast<std::map<std::string,
                                          std::int32_t>>();
                            t_date dt = t_date(date_components["year"],
                                date_components["month"],
                                date_components["day"]);
                            terms.push_back(mktscalar(dt));
                        }
                    } break;
                    case DTYPE_TIME: {
                        if (py::isinstance<py::str>(filter_term)) {
                            t_val parsed_date
                                = date_parser.attr("parse")(filter_term);
                            std::int64_t ts
                                = date_parser.attr("to_timestamp")(parsed_date)
                                      .cast<std::int64_t>();
                            t_tscalar timestamp = mktscalar(t_time(ts));
                            terms.push_back(timestamp);
                        } else {
                            t_tscalar timestamp = mktscalar(t_time(
                                date_parser.attr("to_timestamp")(filter_term)
                                    .cast<std::int64_t>()));
                            terms.push_back(timestamp);
                        }
                    } break;
                    default: {
                        terms.push_back(mktscalar(get_interned_cstr(
                            filter_term.cast<std::string>().c_str())));
                    }
                }
            }
        }
        return std::make_tuple(column_name, filter_op_str, terms);
    }

    template <>
    std::shared_ptr<t_view_config>
    make_view_config(const t_gnode& gnode, std::shared_ptr<t_schema> schema,
        t_val date_parser, t_val config) {
        auto row_pivots
            = config.attr("get_group_by")().cast<std::vector<std::string>>();
        auto column_pivots
            = config.attr("get_split_by")().cast<std::vector<std::string>>();
        auto columns
            = config.attr("get_columns")().cast<std::vector<std::string>>();
        auto sort = config.attr("get_sort")()
                        .cast<std::vector<std::vector<std::string>>>();
        auto filter_op = config.attr("get_filter_op")().cast<std::string>();

        // to preserve order, do not cast to std::map - use keys and
        // python 3.7's guarantee that dicts respect insertion order
        auto p_aggregates = py::dict(config.attr("get_aggregates")());
        tsl::ordered_map<std::string, std::vector<std::string>> aggregates;

        for (auto& column : columns) {
            py::str py_column_name = py::str(column);
            if (p_aggregates.contains(py_column_name)) {
                if (py::isinstance<py::str>(p_aggregates[py_column_name])) {
                    std::vector<std::string> agg{
                        p_aggregates[py_column_name].cast<std::string>()};
                    aggregates[column] = agg;
                } else {
                    aggregates[column] = p_aggregates[py_column_name]
                                             .cast<std::vector<std::string>>();
                }
            }
        };

        bool column_only = false;

        // make sure that primary keys are created for column-only views
        if (row_pivots.size() == 0 && column_pivots.size() > 0) {
            row_pivots.push_back("psp_okey");
            column_only = true;
        }

        auto p_expressions = config.attr("get_expressions")()
                                 .cast<std::vector<std::vector<t_val>>>();
        std::vector<std::shared_ptr<t_computed_expression>> expressions;
        expressions.reserve(p_expressions.size());

        // Validate expressions using the vocab
        t_expression_vocab& expression_vocab = *(gnode.get_expression_vocab());
        t_regex_mapping& regex_mapping
            = *(gnode.get_expression_regex_mapping());

        // Will either abort() or succeed completely, and this isn't a public
        // API so we can directly index for speed.
        for (t_uindex idx = 0; idx < p_expressions.size(); ++idx) {
            const auto& expr = p_expressions[idx];
            std::string expression_alias = expr[0].cast<std::string>();
            std::string expression_string = expr[1].cast<std::string>();
            std::string parsed_expression_string = expr[2].cast<std::string>();

            // Don't allow overwriting of "real" table columns or multiple
            // columns with the same alias.
            if (schema->has_column(expression_alias)) {
                std::stringstream ss;
                ss << "View creation failed: cannot create expression column '"
                   << expression_alias
                   << "' that overwrites a column that already exists."
                   << std::endl;
                PSP_COMPLAIN_AND_ABORT(ss.str());
            }

            auto p_column_ids = py::dict(expr[3]);
            std::vector<std::pair<std::string, std::string>> column_ids;
            column_ids.resize(p_column_ids.size());
            t_uindex cidx = 0;

            for (const auto& item : p_column_ids) {
                column_ids[cidx] = std::pair<std::string, std::string>(
                    item.first.cast<std::string>(),
                    item.second.cast<std::string>());
                ++cidx;
            }

            // If the expression cannot be parsed, it will abort() here.
            std::shared_ptr<t_computed_expression> expression
                = t_computed_expression_parser::precompute(expression_alias,
                    expression_string, parsed_expression_string, column_ids,
                    gnode.get_table_sptr(), gnode.get_pkey_map(), schema,
                    expression_vocab, regex_mapping);

            expressions.push_back(expression);
            schema->add_column(expression_alias, expression->get_dtype());
        }

        // construct filters with filter terms, and fill the vector of tuples
        auto p_filter = config.attr("get_filter")()
                            .cast<std::vector<std::vector<t_val>>>();
        std::vector<
            std::tuple<std::string, std::string, std::vector<t_tscalar>>>
            filter;

        for (auto f : p_filter) {
            // parse filter details
            std::string column_name = f[0].cast<std::string>();
            std::string filter_op_str = f[1].cast<std::string>();
            t_dtype column_type = schema->get_dtype(column_name);
            t_filter_op filter_operator = str_to_filter_op(filter_op_str);

            // validate the filter before it goes into the core engine
            t_val filter_term = py::none();
            if (f.size() > 2) {
                // null/not null filters do not have a filter term
                filter_term = f[2];
            }

            if (is_valid_filter(
                    column_type, date_parser, filter_operator, filter_term)) {
                filter.push_back(make_filter_term(column_type, date_parser,
                    column_name, filter_op_str, filter_term));
            }
        }

        // create the `t_view_config`
        auto view_config = std::make_shared<t_view_config>(row_pivots,
            column_pivots, aggregates, columns, filter, sort, expressions,
            filter_op, column_only);

        // transform primitive values into abstractions that the engine can use
        view_config->init(schema);

        // set pivot depths if provided
        if (!config.attr("group_by_depth").is_none()) {
            view_config->set_row_pivot_depth(
                config.attr("group_by_depth").cast<std::int32_t>());
        }

        if (!config.attr("split_by_depth").is_none()) {
            view_config->set_column_pivot_depth(
                config.attr("split_by_depth").cast<std::int32_t>());
        }

        return view_config;
    }

    /******************************************************************************
     *
     * make_view
     */

    template <typename CTX_T>
    std::shared_ptr<View<CTX_T>>
    make_view(std::shared_ptr<Table> table, const std::string& name,
        const std::string& separator, t_val view_config, t_val date_parser) {
        PSP_GIL_READ_LOCK(table->get_pool()->get_lock());

        // Use a copy of the table schema that we can freely mutate during
        // `make_view_config` and pass into the context constructors.
        std::shared_ptr<t_schema> schema
            = std::make_shared<t_schema>(table->get_schema());

        // Pass the gnode into `make_view_config` so we can use its vocab to
        // validate expressions.
        const t_gnode& gnode = *(table->get_gnode());

        std::shared_ptr<t_view_config> config
            = make_view_config<t_val>(gnode, schema, date_parser, view_config);
        {
            PSP_GIL_UNLOCK();
            auto ctx = make_context<CTX_T>(table, schema, config, name);
            auto view_ptr = std::make_shared<View<CTX_T>>(
                table, ctx, name, separator, config);
            return view_ptr;
        }
    }

    std::shared_ptr<View<t_ctxunit>>
    make_view_unit(std::shared_ptr<Table> table, std::string name,
        std::string separator, t_val view_config, t_val date_parser) {
        return make_view<t_ctxunit>(
            table, name, separator, view_config, date_parser);
    }

    std::shared_ptr<View<t_ctx0>>
    make_view_ctx0(std::shared_ptr<Table> table, std::string name,
        std::string separator, t_val view_config, t_val date_parser) {
        return make_view<t_ctx0>(
            table, name, separator, view_config, date_parser);
    }

    std::shared_ptr<View<t_ctx1>>
    make_view_ctx1(std::shared_ptr<Table> table, std::string name,
        std::string separator, t_val view_config, t_val date_parser) {
        return make_view<t_ctx1>(
            table, name, separator, view_config, date_parser);
    }

    std::shared_ptr<View<t_ctx2>>
    make_view_ctx2(std::shared_ptr<Table> table, std::string name,
        std::string separator, t_val view_config, t_val date_parser) {
        return make_view<t_ctx2>(
            table, name, separator, view_config, date_parser);
    }

    /******************************************************************************
     *
     * to_arrow
     */

    py::bytes
    to_arrow_unit(std::shared_ptr<View<t_ctxunit>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col,
        bool compress) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<std::string> str = view->to_arrow(
            start_row, end_row, start_col, end_col, true, compress);
        return py::bytes(*str);
    }

    py::bytes
    to_arrow_zero(std::shared_ptr<View<t_ctx0>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col,
        bool compress) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<std::string> str = view->to_arrow(
            start_row, end_row, start_col, end_col, true, compress);
        return py::bytes(*str);
    }

    py::bytes
    to_arrow_one(std::shared_ptr<View<t_ctx1>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col,
        bool compress) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<std::string> str = view->to_arrow(
            start_row, end_row, start_col, end_col, true, compress);
        return py::bytes(*str);
    }

    py::bytes
    to_arrow_two(std::shared_ptr<View<t_ctx2>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col,
        bool compress) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<std::string> str = view->to_arrow(
            start_row, end_row, start_col, end_col, true, compress);
        return py::bytes(*str);
    }

    std::string
    to_csv_unit(std::shared_ptr<View<t_ctxunit>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        return *view->to_csv(start_row, end_row, start_col, end_col);
    }

    std::string
    to_csv_zero(std::shared_ptr<View<t_ctx0>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        return *view->to_csv(start_row, end_row, start_col, end_col);
    }

    std::string
    to_csv_one(std::shared_ptr<View<t_ctx1>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        return *view->to_csv(start_row, end_row, start_col, end_col);
    }

    std::string
    to_csv_two(std::shared_ptr<View<t_ctx2>> view, std::int32_t start_row,
        std::int32_t end_row, std::int32_t start_col, std::int32_t end_col) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        return *view->to_csv(start_row, end_row, start_col, end_col);
    }

    /******************************************************************************
     *
     * get_row_delta
     */

    py::bytes
    get_row_delta_unit(std::shared_ptr<View<t_ctxunit>> view) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<t_data_slice<t_ctxunit>> slice = view->get_row_delta();
        std::shared_ptr<std::string> arrow
            = view->data_slice_to_arrow(slice, false, false);
        return py::bytes(*arrow);
    }

    py::bytes
    get_row_delta_zero(std::shared_ptr<View<t_ctx0>> view) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<t_data_slice<t_ctx0>> slice = view->get_row_delta();
        std::shared_ptr<std::string> arrow
            = view->data_slice_to_arrow(slice, false, false);
        return py::bytes(*arrow);
    }

    py::bytes
    get_row_delta_one(std::shared_ptr<View<t_ctx1>> view) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<t_data_slice<t_ctx1>> slice = view->get_row_delta();
        std::shared_ptr<std::string> arrow
            = view->data_slice_to_arrow(slice, false, false);
        return py::bytes(*arrow);
    }

    py::bytes
    get_row_delta_two(std::shared_ptr<View<t_ctx2>> view) {
        PSP_GIL_UNLOCK();
        PSP_READ_LOCK(view->get_lock());
        std::shared_ptr<t_data_slice<t_ctx2>> slice = view->get_row_delta();
        std::shared_ptr<std::string> arrow
            = view->data_slice_to_arrow(slice, false, false);
        return py::bytes(*arrow);
    }

} // namespace binding
} // namespace perspective

#endif