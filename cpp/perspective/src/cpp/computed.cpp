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

// TODO: generate the case statements automatically
std::function<t_tscalar(t_tscalar)>
t_computed_column::get_computed_method_1(t_computation computation) {
    switch (computation.m_input_types[0]) {
        case DTYPE_UINT8: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_uint8;
                case INVERT: return computed_method::invert_uint8;
                case SQRT: return computed_method::sqrt_uint8;
                case ABS: return computed_method::abs_uint8;
                case BUCKET_10: return computed_method::bucket_10_uint8;
                case BUCKET_100: return computed_method::bucket_100_uint8;
                case BUCKET_1000: return computed_method::bucket_1000_uint8;
                case BUCKET_0_1: return computed_method::bucket_0_1_uint8;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_uint8;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_uint8;
                default: break;
            }
        } break;
        case DTYPE_UINT16: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_uint16;
                case INVERT: return computed_method::invert_uint16;
                case SQRT: return computed_method::sqrt_uint16;
                case ABS: return computed_method::abs_uint16;
                case BUCKET_10: return computed_method::bucket_10_uint16;
                case BUCKET_100: return computed_method::bucket_100_uint16;
                case BUCKET_1000: return computed_method::bucket_1000_uint16;
                case BUCKET_0_1: return computed_method::bucket_0_1_uint16;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_uint16;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_uint16;
                default: break;
            }
        } break;
        case DTYPE_UINT32: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_uint32;
                case INVERT: return computed_method::invert_uint32;
                case SQRT: return computed_method::sqrt_uint32;
                case ABS: return computed_method::abs_uint32;
                case BUCKET_10: return computed_method::bucket_10_uint32;
                case BUCKET_100: return computed_method::bucket_100_uint32;
                case BUCKET_1000: return computed_method::bucket_1000_uint32;
                case BUCKET_0_1: return computed_method::bucket_0_1_uint32;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_uint32;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_uint32;
                default: break;
            }
        } break;
        case DTYPE_UINT64: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_uint64;
                case INVERT: return computed_method::invert_uint64;
                case SQRT: return computed_method::sqrt_uint64;
                case ABS: return computed_method::abs_uint64;
                case BUCKET_10: return computed_method::bucket_10_uint64;
                case BUCKET_100: return computed_method::bucket_100_uint64;
                case BUCKET_1000: return computed_method::bucket_1000_uint64;
                case BUCKET_0_1: return computed_method::bucket_0_1_uint64;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_uint64;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_uint64;
                default: break;
            }
        } break;
        case DTYPE_INT8: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_int8;
                case INVERT: return computed_method::invert_int8;
                case SQRT: return computed_method::sqrt_int8;
                case ABS: return computed_method::abs_int8;
                case BUCKET_10: return computed_method::bucket_10_int8;
                case BUCKET_100: return computed_method::bucket_100_int8;
                case BUCKET_1000: return computed_method::bucket_1000_int8;
                case BUCKET_0_1: return computed_method::bucket_0_1_int8;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_int8;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_int8;
                default: break;
            }
        } break;
        case DTYPE_INT16: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_int16;
                case INVERT: return computed_method::invert_int16;
                case SQRT: return computed_method::sqrt_int16;
                case ABS: return computed_method::abs_int16;
                case BUCKET_10: return computed_method::bucket_10_int16;
                case BUCKET_100: return computed_method::bucket_100_int16;
                case BUCKET_1000: return computed_method::bucket_1000_int16;
                case BUCKET_0_1: return computed_method::bucket_0_1_int16;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_int16;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_int16;
                default: break;
            }
        } break;
        case DTYPE_INT32: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_int32;
                case INVERT: return computed_method::invert_int32;
                case SQRT: return computed_method::sqrt_int32;
                case ABS: return computed_method::abs_int32;
                case BUCKET_10: return computed_method::bucket_10_int32;
                case BUCKET_100: return computed_method::bucket_100_int32;
                case BUCKET_1000: return computed_method::bucket_1000_int32;
                case BUCKET_0_1: return computed_method::bucket_0_1_int32;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_int32;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_int32;
                default: break;
            }
        } break;
        case DTYPE_INT64: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_int64;
                case INVERT: return computed_method::invert_int64;
                case SQRT: return computed_method::sqrt_int64;
                case ABS: return computed_method::abs_int64;
                case BUCKET_10: return computed_method::bucket_10_int64;
                case BUCKET_100: return computed_method::bucket_100_int64;
                case BUCKET_1000: return computed_method::bucket_1000_int64;
                case BUCKET_0_1: return computed_method::bucket_0_1_int64;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_int64;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_int64;
                default: break;
            }
        } break;
        case DTYPE_FLOAT32: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_float32;
                case INVERT: return computed_method::invert_float32;
                case SQRT: return computed_method::sqrt_float32;
                case ABS: return computed_method::abs_float32;
                case BUCKET_10: return computed_method::bucket_10_float32;
                case BUCKET_100: return computed_method::bucket_100_float32;
                case BUCKET_1000: return computed_method::bucket_1000_float32;
                case BUCKET_0_1: return computed_method::bucket_0_1_float32;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_float32;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_float32;
                default: break;
            }
        } break;
        case DTYPE_FLOAT64: {
            switch (computation.m_name) {
                case POW: return computed_method::pow_float64;
                case INVERT: return computed_method::invert_float64;
                case SQRT: return computed_method::sqrt_float64;
                case ABS: return computed_method::abs_float64;
                case BUCKET_10: return computed_method::bucket_10_float64;
                case BUCKET_100: return computed_method::bucket_100_float64;
                case BUCKET_1000: return computed_method::bucket_1000_float64;
                case BUCKET_0_1: return computed_method::bucket_0_1_float64;
                case BUCKET_0_0_1: return computed_method::bucket_0_0_1_float64;
                case BUCKET_0_0_0_1: return computed_method::bucket_0_0_0_1_float64;
                default: break;
            }
        } break;
        case DTYPE_STR: {
            switch (computation.m_name) {
                case UPPERCASE: return computed_method::uppercase;
                default: break;
            }
        }
        default: break;
    }

    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
}

std::function<t_tscalar(t_tscalar, t_tscalar)>
t_computed_column::get_computed_method_2(t_computation computation) {
    switch (computation.m_input_types[0]) {
        case DTYPE_UINT8: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_UINT8>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_UINT8>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_UINT8>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_UINT8>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_UINT16: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_UINT16>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_UINT16>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_UINT16>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_UINT16>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_UINT32: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_UINT32>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_UINT32>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_UINT32>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_UINT32>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_UINT64: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_UINT64>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_UINT64>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_UINT64>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_UINT64>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_INT8: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_INT8>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_INT8>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_INT8>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_INT8>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_INT16: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_INT16>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_INT16>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_INT16>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_INT16>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_INT32: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_INT32>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_INT32>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_INT32>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_INT32>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_INT64: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_INT64>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_INT64>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_INT64>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_INT64>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_FLOAT32: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_FLOAT32>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_FLOAT32>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_FLOAT32>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_FLOAT32>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                }
            }
        } break;
        case DTYPE_FLOAT64: {
            switch (computation.m_name) {
                case ADD: {
                    return computed_method::add<DTYPE_FLOAT64>;
                } break;
                case SUBTRACT: {
                    return computed_method::subtract<DTYPE_FLOAT64>;
                } break;
                case MULTIPLY: {
                    return computed_method::multiply<DTYPE_FLOAT64>;
                } break;
                case DIVIDE: {
                    return computed_method::divide<DTYPE_FLOAT64>;
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Invalid computation method");
                } break;
            }
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
            method_1 = t_computed_column::get_computed_method_1(computation);
        } break;
        case 2: {
            method_2 = t_computed_column::get_computed_method_2(computation);    
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