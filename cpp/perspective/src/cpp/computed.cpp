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

t_computation::t_computation(
    t_computation_method_name name,
    const std::vector<t_dtype>& input_types,
    t_dtype return_type)
    : m_name(name)
    , m_input_types(input_types)
    , m_return_type(return_type) {}

t_computed_column_def::t_computed_column_def(
    const std::string& column_name,
    const std::vector<std::string> input_columns,
    const t_computation& computation)
    : m_column_name(column_name)
    , m_input_columns(input_columns)
    , m_computation(computation) {}

t_computation
t_computed_column::get_computation(
    t_computation_method_name name, const std::vector<t_dtype>& input_types) {
    for (const t_computation& computation : t_computed_column::computations) {
        if (computation.m_name == name && computation.m_input_types == input_types) {
            return computation;
        }
    }
    PSP_COMPLAIN_AND_ABORT("Could not find computation.");
};

#define GET_COMPUTED_FUNCTION_1(TYPE) \
    switch (computation.m_name) { \
        case POW: return computed_function::pow_##TYPE; \
        case INVERT: return computed_function::invert_##TYPE;\
        case SQRT: return computed_function::sqrt_##TYPE;\
        case ABS: return computed_function::abs_##TYPE;\
        case BUCKET_10: return computed_function::bucket_10_##TYPE;\
        case BUCKET_100: return computed_function::bucket_100_##TYPE;\
        case BUCKET_1000: return computed_function::bucket_1000_##TYPE;\
        case BUCKET_0_1: return computed_function::bucket_0_1_##TYPE;\
        case BUCKET_0_0_1: return computed_function::bucket_0_0_1_##TYPE;\
        case BUCKET_0_0_0_1: return computed_function::bucket_0_0_0_1_##TYPE;\
        default: break;\
    }

std::function<t_tscalar(t_tscalar)>
t_computed_column::get_computed_function_1(t_computation computation) {
    switch (computation.m_input_types[0]) {
        case DTYPE_UINT8: {
            GET_COMPUTED_FUNCTION_1(uint8);
        } break;
        case DTYPE_UINT16: {
            GET_COMPUTED_FUNCTION_1(uint16);
        } break;
        case DTYPE_UINT32: {
            GET_COMPUTED_FUNCTION_1(uint32);
        } break;
        case DTYPE_UINT64: {
            GET_COMPUTED_FUNCTION_1(uint64);
        } break;
        case DTYPE_INT8: {
            GET_COMPUTED_FUNCTION_1(int8);
        } break;
        case DTYPE_INT16: {
            GET_COMPUTED_FUNCTION_1(int16);
        } break;
        case DTYPE_INT32: {
            GET_COMPUTED_FUNCTION_1(int32);
        } break;
        case DTYPE_INT64: {
            GET_COMPUTED_FUNCTION_1(int64);
        } break;
        case DTYPE_FLOAT32: {
            GET_COMPUTED_FUNCTION_1(float32);
        } break;
        case DTYPE_FLOAT64: {
            GET_COMPUTED_FUNCTION_1(float64);
        } break;
        case DTYPE_STR: {
            switch (computation.m_name) {
                case UPPERCASE: return computed_function::uppercase;
                default: break;
            }
        }
        default: break;
    }

    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
}

#define GET_COMPUTED_FUNCTION_2(DTYPE)                                         \
    switch (computation.m_name) {                                              \
        case ADD: return computed_function::add<DTYPE>;                      \
        case SUBTRACT: return computed_function::subtract<DTYPE>;            \
        case MULTIPLY: return computed_function::multiply<DTYPE>;            \
        case DIVIDE: return computed_function::divide<DTYPE>;                \
        default: break;                                                        \
    }

std::function<t_tscalar(t_tscalar, t_tscalar)>
t_computed_column::get_computed_function_2(t_computation computation) {
    switch (computation.m_input_types[0]) {
        case DTYPE_UINT8: {
            GET_COMPUTED_FUNCTION_2(DTYPE_UINT8);
        } break;
        case DTYPE_UINT16: {
            GET_COMPUTED_FUNCTION_2(DTYPE_UINT16);
        } break;
        case DTYPE_UINT32: {
            GET_COMPUTED_FUNCTION_2(DTYPE_UINT32);
        } break;
        case DTYPE_UINT64: {
            GET_COMPUTED_FUNCTION_2(DTYPE_UINT64);
        } break;
        case DTYPE_INT8: {
            GET_COMPUTED_FUNCTION_2(DTYPE_INT8);
        } break;
        case DTYPE_INT16: {
            GET_COMPUTED_FUNCTION_2(DTYPE_INT16);
        } break;
        case DTYPE_INT32: {
            GET_COMPUTED_FUNCTION_2(DTYPE_INT32);
        } break;
        case DTYPE_INT64: {
            GET_COMPUTED_FUNCTION_2(DTYPE_INT64);
        } break;
        case DTYPE_FLOAT32: {
            GET_COMPUTED_FUNCTION_2(DTYPE_FLOAT32);
        } break;
        case DTYPE_FLOAT64: {
            GET_COMPUTED_FUNCTION_2(DTYPE_FLOAT64);
        } break;
        default: {
            PSP_COMPLAIN_AND_ABORT("Invalid computation method");
        } break;
    }
}

void
t_computed_column::apply_computation(
    const std::vector<std::shared_ptr<t_column>>& table_columns,
    const std::vector<std::shared_ptr<t_column>>& flattened_columns,
    std::shared_ptr<t_column> output_column,
    const std::vector<t_rlookup>& row_indices,
    t_computation computation) {
    std::uint32_t end = row_indices.size();
    if (end == 0) {
        end = flattened_columns[0]->size();
    }
    auto arity = table_columns.size();

    // TODO: track these in an union type?
    std::function<t_tscalar(t_tscalar)> method_1;
    std::function<t_tscalar(t_tscalar, t_tscalar)> method_2;

    switch (arity) {
        case 1: {
            method_1 = t_computed_column::get_computed_function_1(computation);
        } break;
        case 2: {
            method_2 = t_computed_column::get_computed_function_2(computation);    
        } break;
        default: {
            PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
        }
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

        t_tscalar rval = mknone();

        switch (arity) {
            case 1: {
                rval = method_1(args[0]);
            } break;
            case 2: {
                rval = method_2(args[0], args[1]);  
            } break;
            default: {
                PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
            }
        }

        output_column->set_scalar(idx, rval);

        if (rval.is_none()) {
            output_column->set_valid(idx, false);
        }
    }
}

std::vector<t_computation> t_computed_column::computations = {};

void t_computed_column::make_computations() {
    std::vector<t_dtype> dtypes = {DTYPE_FLOAT64, DTYPE_FLOAT32, DTYPE_INT64, DTYPE_INT32, DTYPE_INT16, DTYPE_INT8, DTYPE_UINT64, DTYPE_UINT32, DTYPE_UINT16, DTYPE_UINT8};
    std::vector<t_computation_method_name> numeric_function_1 = {INVERT, POW, SQRT, ABS, BUCKET_10, BUCKET_100, BUCKET_1000, BUCKET_0_1, BUCKET_0_0_1, BUCKET_0_0_0_1};
    std::vector<t_computation_method_name> numeric_function_2 = {ADD, SUBTRACT, MULTIPLY, DIVIDE};

    for (const auto f : numeric_function_1) {
        for (auto i = 0; i < dtypes.size(); ++i) {
            t_computed_column::computations.push_back(
                t_computation{
                    f, 
                    std::vector<t_dtype>{dtypes[i]},
                    DTYPE_FLOAT64
                }
            );
        }
    }

    for (const auto f : numeric_function_2) {
        for (auto i = 0; i < dtypes.size(); ++i) {
            for (auto j = 0; j < dtypes.size(); ++j) {
                t_computed_column::computations.push_back(
                    t_computation{
                        f, 
                        std::vector<t_dtype>{dtypes[i], dtypes[j]},
                        DTYPE_FLOAT64
                    }
                );
            }
        }
    }

    
}

} // end namespace perspective