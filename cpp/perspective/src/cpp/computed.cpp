/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/computed.h>

namespace perspective {

//t_computation::t_computation() {}

t_computed_column_def::t_computed_column_def(
    const std::string& column_name,
    const std::vector<std::string> input_columns,
    const t_computation& computation)
    : m_column_name(column_name)
    , m_input_columns(input_columns)
    , m_computation(computation) {}

t_computation
t_computed_column::get_computation(
    t_computation_method name, const std::vector<t_dtype>& input_types) {
    for (const t_computation& computation : t_computed_column::computations) {
        if (computation.m_name == name && computation.m_input_type_1 == input_types[0] && computation.m_input_type_2 == input_types[1]) {
            return computation;
        }
    }
    PSP_COMPLAIN_AND_ABORT("Could not find computation.");
};

void
t_computed_column::apply_computation(
    const std::vector<std::shared_ptr<t_column>>& table_columns,
    const std::vector<std::shared_ptr<t_column>>& flattened_columns,
    std::shared_ptr<t_column> output_column,
    const std::vector<t_rlookup>& row_indices,
    const t_computation& computation) {
    std::uint32_t end = row_indices.size();
    if (end == 0) {
        end = flattened_columns[0]->size();
    }
    auto arity = table_columns.size();

    for (auto c : table_columns) {
        std::cout << get_dtype_descr(c->get_dtype()) << std::endl;
    }

    for (t_uindex idx = 0; idx < end; ++idx) {
        // iterate through row indices OR through all rows
        t_uindex ridx = idx;
        if (row_indices.size() > 0) {
            ridx = row_indices[idx].m_idx;
        }

        // create args
        std::vector<t_tscalar> args;
        for (t_uindex x = 0; x < arity; ++x) {
            t_tscalar t = flattened_columns[x]->get_scalar(idx);
            if (!t.is_valid()) {
                t = table_columns[x]->get_scalar(ridx);
                if (!t.is_valid()) {
                    break;
                }
            }
            args.push_back(t);
        }

        switch (computation.m_return_type) {
            case DTYPE_INT64: {
                output_column->set_nth(
                    idx, t_computed_column::add<t_dtype_to_type<DTYPE_INT64>::type>(
                        args[0].get<t_dtype_to_type<DTYPE_INT64>::type>(), args[1].get<t_dtype_to_type<DTYPE_INT64>::type>()), STATUS_VALID);        
            } break;
            case DTYPE_FLOAT64: {
                switch (computation.input_type_1) {
                    case DTYPE_INT32: {
                        // FIXME: finish
                        output_column->set_nth(
                            idx, t_computed_column::add<t_dtype_to_type<DTYPE_FLOAT64>::type, t_dtype_to_type<DTYPE_INT32>::type>(
                                args[0].get<t_dtype_to_type<DTYPE_FLOAT64>::type>(), args[1].get<t_dtype_to_type<DTYPE_FLOAT64>::type>()), STATUS_VALID);
                    } break;
                    case DTYPE_INT64: {
                        output_column->set_nth(
                            idx, t_computed_column::add<t_dtype_to_type<DTYPE_FLOAT64>::type>(
                                args[0].get<t_dtype_to_type<DTYPE_FLOAT64>::type>(), args[1].get<t_dtype_to_type<DTYPE_FLOAT64>::type>()), STATUS_VALID); 
                    }
                }
                       
            } break;
            default: {
                break;
            }
        }
    }

    output_column->pprint();
}

std::vector<t_computation> t_computed_column::computations = {
    t_computation{DTYPE_INT32, DTYPE_INT32, DTYPE_INT64, ADD},
    t_computation{DTYPE_INT64, DTYPE_INT64, DTYPE_INT64, ADD},
    t_computation{DTYPE_INT32, DTYPE_INT64, DTYPE_INT64, ADD},
    t_computation{DTYPE_INT64, DTYPE_INT32, DTYPE_INT64, ADD},
    t_computation{DTYPE_FLOAT32, DTYPE_INT32, DTYPE_FLOAT64, ADD},
    t_computation{DTYPE_INT32, DTYPE_FLOAT32, DTYPE_FLOAT64, ADD},
    t_computation{DTYPE_FLOAT64, DTYPE_INT32, DTYPE_FLOAT64, ADD},
    t_computation{DTYPE_INT32, DTYPE_FLOAT64, DTYPE_FLOAT64, ADD},
    t_computation{DTYPE_FLOAT32, DTYPE_FLOAT32, DTYPE_FLOAT64, ADD},
    t_computation{DTYPE_FLOAT64, DTYPE_FLOAT64, DTYPE_FLOAT64, ADD},
};

} // end namespace perspective