/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON

#include <perspective/python/expressions.h>

namespace perspective {
namespace binding {

    void
    init_expression_parser() {
        t_computed_expression_parser::init();
    }

    t_validated_expression_map
    validate_expressions_py(std::shared_ptr<Table> table,
        const std::vector<std::vector<t_val>>& p_expressions) {
        std::vector<std::tuple<std::string, std::string, std::string,
            std::vector<std::pair<std::string, std::string>>>>
            expressions;
        expressions.resize(p_expressions.size());

        // Convert from vector of t_val into vector of tuples
        for (t_uindex idx = 0; idx < p_expressions.size(); ++idx) {
            const auto& expr = p_expressions[idx];
            std::string expression_alias = expr[0].cast<std::string>();
            std::string expression_string = expr[1].cast<std::string>();
            std::string parsed_expression_string = expr[2].cast<std::string>();

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

            auto tp = std::make_tuple(expression_alias, expression_string,
                parsed_expression_string, column_ids);

            expressions[idx] = tp;
        }

        return table->validate_expressions(expressions);
    }

} // end namespace binding
} // end namespace perspective

#endif