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

t_computation::t_computation()
    : m_name(INVALID_COMPUTED_FUNCTION) {};

t_computation::t_computation(
    t_computed_function_name name,
    const std::vector<t_dtype>& input_types,
    t_dtype return_type)
    : m_name(name)
    , m_input_types(input_types)
    , m_return_type(return_type) {}

t_computation
t_computed_column::get_computation(
    t_computed_function_name name, const std::vector<t_dtype>& input_types) {
    for (const t_computation& computation : t_computed_column::computations) {
        if (computation.m_name == name && computation.m_input_types == input_types) {
            return computation;
        }
    }

    std::stringstream ss;
    ss
        << "Error: Could not find computation for function `" 
        << computed_function_name_to_string(name)
        << "` with input types: [ ";
    for (t_dtype dtype : input_types) {
        ss << "`" << get_dtype_descr(dtype) << "` ";
    }
    ss << "]" << std::endl;
    std::cerr << ss.str();

    // Return invalid computation instead of abort
    t_computation invalid = t_computation(
        INVALID_COMPUTED_FUNCTION, {}, DTYPE_NONE);
    return invalid;
};


std::vector<t_dtype>
t_computed_column::get_computation_input_types(
    t_computed_function_name name) {
        switch (name) {
            case INVALID_COMPUTED_FUNCTION: return {};
            case ADD:
            case SUBTRACT:
            case MULTIPLY:
            case DIVIDE:
            case POW:
            case PERCENT_OF:
            case INVERT:
            case POW2:
            case SQRT:
            case ABS:
            case LOG:
            case EXP:
            case BUCKET_10:
            case BUCKET_100:
            case BUCKET_1000:
            case BUCKET_0_1:
            case BUCKET_0_0_1:
            case BUCKET_0_0_0_1: {
                return {DTYPE_INT64, DTYPE_FLOAT64};
            } break;
            case UPPERCASE:
            case LOWERCASE:
            case LENGTH:
            case CONCAT_SPACE:
            case CONCAT_COMMA: {
                return {DTYPE_STR};
            };
            case HOUR_OF_DAY:
            case DAY_OF_WEEK:
            case MONTH_OF_YEAR:
            case SECOND_BUCKET:
            case MINUTE_BUCKET:
            case HOUR_BUCKET:
            case DAY_BUCKET:
            case WEEK_BUCKET:
            case MONTH_BUCKET:
            case YEAR_BUCKET: {
                return {DTYPE_TIME, DTYPE_DATE};
            };
            case EQUALS:
            case NOT_EQUALS:
            case GREATER_THAN:
            case LESS_THAN:
            case IS: {
                return {DTYPE_BOOL};
            };
        }
    }

#define GET_NUMERIC_COMPUTED_FUNCTION_1(TYPE)                                  \
    switch (computation.m_name) {                                              \
        case POW2: return computed_function::pow2_##TYPE;                      \
        case INVERT: return computed_function::invert_##TYPE;                  \
        case SQRT: return computed_function::sqrt_##TYPE;                      \
        case ABS: return computed_function::abs_##TYPE;                        \
        case LOG: return computed_function::log_##TYPE;                        \
        case EXP: return computed_function::exp_##TYPE;                        \
        case BUCKET_10: return computed_function::bucket_10_##TYPE;            \
        case BUCKET_100: return computed_function::bucket_100_##TYPE;          \
        case BUCKET_1000: return computed_function::bucket_1000_##TYPE;        \
        case BUCKET_0_1: return computed_function::bucket_0_1_##TYPE;          \
        case BUCKET_0_0_1: return computed_function::bucket_0_0_1_##TYPE;      \
        case BUCKET_0_0_0_1: return computed_function::bucket_0_0_0_1_##TYPE;  \
        default: break;                                                        \
    }

#define GET_DATE_COMPUTED_FUNCTION_1(DTYPE)                                  \
    switch (computation.m_name) {                                            \
        case HOUR_OF_DAY: return computed_function::hour_of_day<DTYPE>;      \
        case SECOND_BUCKET: return computed_function::second_bucket<DTYPE>;  \
        case MINUTE_BUCKET: return computed_function::minute_bucket<DTYPE>;  \
        case HOUR_BUCKET: return computed_function::hour_bucket<DTYPE>;      \
        case DAY_BUCKET: return computed_function::day_bucket<DTYPE>;        \
        case WEEK_BUCKET: return computed_function::week_bucket<DTYPE>;      \
        case MONTH_BUCKET: return computed_function::month_bucket<DTYPE>;    \
        case YEAR_BUCKET: return computed_function::year_bucket<DTYPE>;      \
        default: break;                                                      \
    }

std::function<t_tscalar(t_tscalar)>
t_computed_column::get_computed_function_1(t_computation computation) {
    switch (computation.m_input_types[0]) {
        case DTYPE_UINT8: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(uint8);
        } break;
        case DTYPE_UINT16: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(uint16);
        } break;
        case DTYPE_UINT32: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(uint32);
        } break;
        case DTYPE_UINT64: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(uint64);
        } break;
        case DTYPE_INT8: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(int8);
        } break;
        case DTYPE_INT16: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(int16);
        } break;
        case DTYPE_INT32: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(int32);
        } break;
        case DTYPE_INT64: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(int64);
        } break;
        case DTYPE_FLOAT32: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(float32);
        } break;
        case DTYPE_FLOAT64: {
            GET_NUMERIC_COMPUTED_FUNCTION_1(float64);
        } break;
        case DTYPE_DATE: {
            GET_DATE_COMPUTED_FUNCTION_1(DTYPE_DATE);
        } break;
        case DTYPE_TIME: {
            GET_DATE_COMPUTED_FUNCTION_1(DTYPE_TIME);
        } break;
        case DTYPE_STR: {
            switch (computation.m_name) {
                case LENGTH: return computed_function::length;
                default: break;
            }
        }
        default: break;
    }

    PSP_COMPLAIN_AND_ABORT("Invalid computed function");
}

#define GET_COMPUTED_FUNCTION_2(DTYPE)                                         \
    switch (computation.m_name) {                                              \
        case ADD: return computed_function::add<DTYPE>;                        \
        case SUBTRACT: return computed_function::subtract<DTYPE>;              \
        case MULTIPLY: return computed_function::multiply<DTYPE>;              \
        case DIVIDE: return computed_function::divide<DTYPE>;                  \
        case POW: return computed_function::pow<DTYPE>;                        \
        case PERCENT_OF: return computed_function::percent_of<DTYPE>;          \
        case EQUALS: return computed_function::equals<DTYPE>;                  \
        case NOT_EQUALS: return computed_function::not_equals<DTYPE>;          \
        case GREATER_THAN: return computed_function::greater_than<DTYPE>;      \
        case LESS_THAN: return computed_function::less_than<DTYPE>;            \
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
        case DTYPE_STR: {
            switch (computation.m_name) {
                case IS: return computed_function::is;
                default: break;
            }
        }
        default: break;
    }

    PSP_COMPLAIN_AND_ABORT("Could not find computed function for arity 2.");
}

std::function<void(t_tscalar, std::int32_t idx, std::shared_ptr<t_column> output_column)>
t_computed_column::get_computed_function_string_1(t_computation computation) {
    switch (computation.m_name) {
        case UPPERCASE: return computed_function::uppercase;
        case LOWERCASE: return computed_function::lowercase;
        case DAY_OF_WEEK: {
            switch (computation.m_input_types[0]) {
                case DTYPE_DATE: return computed_function::day_of_week<DTYPE_DATE>;
                case DTYPE_TIME: return computed_function::day_of_week<DTYPE_TIME>;
                default: break;
            }
        } break;
        case MONTH_OF_YEAR: {
            switch (computation.m_input_types[0]) {
                case DTYPE_DATE: return computed_function::month_of_year<DTYPE_DATE>;
                case DTYPE_TIME: return computed_function::month_of_year<DTYPE_TIME>;
                default: break;
            }
        } break;
        default: break;
    }
    PSP_COMPLAIN_AND_ABORT(
            "Could not find computation function for arity 1, string.");
}

std::function<void(t_tscalar, t_tscalar, std::int32_t idx, std::shared_ptr<t_column> output_column)>
t_computed_column::get_computed_function_string_2(t_computation computation) {
    switch (computation.m_name) {
        case CONCAT_SPACE: return computed_function::concat_space;
        case CONCAT_COMMA: return computed_function::concat_comma;
        default: PSP_COMPLAIN_AND_ABORT(
            "Could not find computed function for arity 2, string.");
    }
}

void
t_computed_column::apply_computation(
    const std::vector<std::shared_ptr<t_column>>& table_columns,
    std::shared_ptr<t_column> output_column,
    t_computation computation) {
    auto start = std::chrono::high_resolution_clock::now(); 
    std::uint32_t end = table_columns[0]->size();
    auto arity = table_columns.size();

    std::function<t_tscalar(t_tscalar)> function_1;
    std::function<t_tscalar(t_tscalar, t_tscalar)> function_2;
    std::function<void(t_tscalar, std::int32_t idx, std::shared_ptr<t_column>)> string_function_1;
    std::function<void(t_tscalar, t_tscalar, std::int32_t idx, std::shared_ptr<t_column>)> string_function_2;

    switch (arity) {
        case 1: {
            // Functions that generate strings need to have access to vocab so
            // that strings can be stored.
            switch (computation.m_return_type) {
                case DTYPE_STR: {
                    string_function_1 = t_computed_column::get_computed_function_string_1(computation);
                } break;  
                default: {
                    function_1 = t_computed_column::get_computed_function_1(computation);
                } break;
            } 
        } break;
        case 2: {
            switch (computation.m_return_type) {
                case DTYPE_STR: {
                    string_function_2 = t_computed_column::get_computed_function_string_2(computation);
                } break;  
                default: {
                    function_2 = t_computed_column::get_computed_function_2(computation);
                } break;
            }   
        } break;
        default: {
            PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
        }
    }

    for (t_uindex idx = 0; idx < end; ++idx) {
        bool skip_row = false;
        std::vector<t_tscalar> args;
        for (t_uindex x = 0; x < arity; ++x) {
            t_tscalar t = table_columns[x]->get_scalar(idx);
            if (!t.is_valid()) {
                output_column->clear(idx);
                skip_row = true;
                break;
            }

            args.push_back(t);
        }

        if (skip_row) {
            continue;
        }

        t_tscalar rval = mknone();

        if (computation.m_return_type == DTYPE_STR) {
            switch (arity) {
                case 1: {
                    string_function_1(args[0], idx, output_column);
                } break;
                case 2: {
                    string_function_2(args[0], args[1], idx, output_column); 
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
                }
            }
        } else {
            switch (arity) {
                case 1: {
                    rval = function_1(args[0]);
                } break;
                case 2: {
                    rval = function_2(args[0], args[1]); 
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
                }
            }

            if (!rval.is_valid() || rval.is_none()) {
                output_column->clear(idx);
            } else {
                output_column->set_scalar(idx, rval);
            }
        }
    }
    auto stop = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(stop - start); 
    std::cout << "computed: " << duration.count() << std::endl;
}

void
t_computed_column::reapply_computation(
    const std::vector<std::shared_ptr<t_column>>& table_columns,
    const std::vector<std::shared_ptr<t_column>>& flattened_columns,
    const std::vector<t_rlookup>& changed_rows,
    std::shared_ptr<t_column> output_column,
    t_computation computation) {
    std::uint32_t end = changed_rows.size();
    if (end == 0) {
        end = table_columns[0]->size();
    }
    auto arity = table_columns.size();

    std::function<t_tscalar(t_tscalar)> function_1;
    std::function<t_tscalar(t_tscalar, t_tscalar)> function_2;
    std::function<void(t_tscalar, std::int32_t idx, std::shared_ptr<t_column>)> string_function_1;
    std::function<void(t_tscalar, t_tscalar, std::int32_t idx, std::shared_ptr<t_column>)> string_function_2;

    switch (arity) {
        case 1: {
            // Functions that generate strings need to have access to vocab so
            // that strings can be stored.
            switch (computation.m_return_type) {
                case DTYPE_STR: {
                    string_function_1 = t_computed_column::get_computed_function_string_1(computation);
                } break;  
                default: {
                    function_1 = t_computed_column::get_computed_function_1(computation);
                } break;
            } 
        } break;
        case 2: {
            switch (computation.m_return_type) {
                case DTYPE_STR: {
                    string_function_2 = t_computed_column::get_computed_function_string_2(computation);
                } break;  
                default: {
                    function_2 = t_computed_column::get_computed_function_2(computation);
                } break;
            }   
        } break;
        default: {
            PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
        }
    }

    for (t_uindex idx = 0; idx < end; ++idx) {
        bool row_already_exists = false;
        t_uindex ridx = idx;

        // Look up the changed row index, and whether the row already exists
        if (changed_rows.size() > 0) {
            ridx = changed_rows[idx].m_idx;
            row_already_exists = changed_rows[idx].m_exists;
        }

        // Create args
        std::vector<t_tscalar> args;

        // Required to break out of this loop if any args are invalid
        bool skip_row = false;
        for (t_uindex cidx = 0; cidx < arity; ++cidx) {
            t_tscalar arg = flattened_columns[cidx]->get_scalar(idx);

            if (!arg.is_valid()) {
                /**
                 * If the row already exists, and the cell in `flattened` is
                 * `STATUS_CLEAR`, do not compute the row. 
                 * 
                 * If the row does not exist, and the cell in `flattened` is
                 * `STATUS_INVALID`, do not compute the row.
                 */
                bool should_unset = 
                    (row_already_exists && flattened_columns[cidx]->is_cleared(idx)) ||
                    (!row_already_exists && !flattened_columns[cidx]->is_valid(idx));

                /**
                 * Use `unset` instead of `clear`, as
                 * `t_gstate::update_master_table` will reconcile `STATUS_CLEAR`
                 * into `STATUS_INVALID`.
                 */
                if (should_unset) {
                    output_column->unset(idx);
                    skip_row = true;
                    break;  
                } else {
                    // Use the value in the master table to compute.
                    arg = table_columns[cidx]->get_scalar(ridx);
                }
            }

            args.push_back(arg);
        }

        if (skip_row) {
            continue;
        }
        
        t_tscalar rval = mknone();

        if (computation.m_return_type == DTYPE_STR) {
            switch (arity) {
                case 1: {
                    string_function_1(args[0], idx, output_column);
                } break;
                case 2: {
                    string_function_2(args[0], args[1], idx, output_column); 
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
                }
            }
        } else {
            switch (arity) {
                case 1: {
                    rval = function_1(args[0]);
                } break;
                case 2: {
                    rval = function_2(args[0], args[1]); 
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Computed columns must have 1 or 2 inputs.");
                }
            }

            if (!rval.is_valid() || rval.is_none()) {
                output_column->clear(idx);
            } else {
                output_column->set_scalar(idx, rval);
            }
        }
    }
}

std::vector<t_computation> t_computed_column::computations = {};

void t_computed_column::make_computations() {
    // Generate numeric functions
    std::vector<t_dtype> dtypes = {DTYPE_FLOAT64, DTYPE_FLOAT32, DTYPE_INT64, DTYPE_INT32, DTYPE_INT16, DTYPE_INT8, DTYPE_UINT64, DTYPE_UINT32, DTYPE_UINT16, DTYPE_UINT8};
    std::vector<t_computed_function_name> numeric_function_1 = {INVERT, POW2, SQRT, ABS, LOG, EXP, BUCKET_10, BUCKET_100, BUCKET_1000, BUCKET_0_1, BUCKET_0_0_1, BUCKET_0_0_0_1};
    std::vector<t_computed_function_name> numeric_function_2 = {ADD, SUBTRACT, MULTIPLY, DIVIDE, POW, PERCENT_OF};
    std::vector<t_computed_function_name> numeric_comparison_2 = {EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN};
    
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

    for (const auto f : numeric_comparison_2) {
        for (auto i = 0; i < dtypes.size(); ++i) {
            for (auto j = 0; j < dtypes.size(); ++j) {
                t_computed_column::computations.push_back(
                    t_computation{
                        f, 
                        std::vector<t_dtype>{dtypes[i], dtypes[j]},
                        DTYPE_BOOL
                    }
                );
            }
        }
    }

    // Generate string functions
    std::vector<t_computed_function_name> string_function_1 = {UPPERCASE, LOWERCASE};
    std::vector<t_computed_function_name> string_function_2 = {CONCAT_SPACE, CONCAT_COMMA};

    for (const auto f : string_function_1) {
        t_computed_column::computations.push_back(
            t_computation{
                f, 
                std::vector<t_dtype>{DTYPE_STR},
                DTYPE_STR
            }
        );
    }
    
    for (const auto f : string_function_2) {
        t_computed_column::computations.push_back(
            t_computation{
                f, 
                std::vector<t_dtype>{DTYPE_STR, DTYPE_STR},
                DTYPE_STR
            }
        );
    }

    // Length takes a string and returns an int
    t_computed_column::computations.push_back(
        t_computation{LENGTH, std::vector<t_dtype>{DTYPE_STR}, DTYPE_INT64}
    );

    // IS takes 2 strings and returns a bool
    t_computed_column::computations.push_back(
        t_computation{IS, std::vector<t_dtype>{DTYPE_STR, DTYPE_STR}, DTYPE_BOOL}
    );

    // Generate date/datetime functions
    std::vector<t_dtype> date_dtypes = {DTYPE_DATE, DTYPE_TIME};

    // Returns a `DTYPE_DATE` column
    std::vector<t_computed_function_name> date_to_date_functions = {
        DAY_BUCKET,
        WEEK_BUCKET,
        MONTH_BUCKET,
        YEAR_BUCKET
    };

    // Returns a `DTYPE_TIME` column
    std::vector<t_computed_function_name> date_to_datetime_functions = {
        SECOND_BUCKET,
        MINUTE_BUCKET,
        HOUR_BUCKET,
    };

    // Returns a `DTYPE_STR` column
    std::vector<t_computed_function_name> date_to_string_functions = {
        DAY_OF_WEEK,
        MONTH_OF_YEAR
    };

    for (auto i = 0; i < date_dtypes.size(); ++i) {
        for (auto j = 0; j < date_to_date_functions.size(); ++j) {
            t_computed_column::computations.push_back(
                t_computation {
                    date_to_date_functions[j],
                    std::vector<t_dtype>{date_dtypes[i]},
                    DTYPE_DATE
                }
            );
        };

        for (auto j = 0; j < date_to_datetime_functions.size(); ++j) {
            t_dtype return_type = DTYPE_TIME;
            if (date_dtypes[i] == DTYPE_DATE) {
                // Second/minute/hour buckets have no meaning for date columns,
                // so just return the column as is.
                return_type = DTYPE_DATE;
            }
            t_computed_column::computations.push_back(
                t_computation {
                    date_to_datetime_functions[j],
                    std::vector<t_dtype>{date_dtypes[i]},
                    return_type
                }
            );
        };

        for (auto j = 0; j < date_to_string_functions.size(); ++j) {
            t_computed_column::computations.push_back(
                t_computation {
                    date_to_string_functions[j],
                    std::vector<t_dtype>{date_dtypes[i]},
                    DTYPE_STR
                }
            );
        };
    };

    // Hour of Day returns an int64
    t_computed_column::computations.push_back(
        t_computation{HOUR_OF_DAY, std::vector<t_dtype>{DTYPE_DATE}, DTYPE_INT64}
    );

    t_computed_column::computations.push_back(
        t_computation{HOUR_OF_DAY, std::vector<t_dtype>{DTYPE_TIME}, DTYPE_INT64}
    );    
}

std::map<std::string, std::map<std::string, std::string>>
t_computed_column::computed_functions = {
    // Operators
    {"add", {
        {"name", "add"},
        {"label", "+"},
        {"pattern", "\\+"},
        {"computed_function_name", "+"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"}, // integer needs to be parsed in front-end
        {"format_function", "(x, y) => `(${x} + ${y})`"}, // JS style function
        {"help", "Add together two numeric columns."},
        {"signature", "(x: Number) + (y: Number): Number"}
    }},
    {"subtract", {
        {"name", "subtract"},
        {"label", "-"},
        {"pattern", "\\-"},
        {"computed_function_name", "-"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "(x, y) => `(${x} - ${y})`"},
        {"help", "Subtract two numeric columns."},
        {"signature", "(x: Number) - (y: Number): Number"}
    }},
    {"multiply", {
        {"name", "multiply"},
        {"label", "*"},
        {"pattern", "\\*"},
        {"computed_function_name", "*"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "(x, y) => `(${x} * ${y})`"},
        {"help", "Multiplies two numeric columns."},
        {"signature", "(x: Number) * (y: Number): Number"}
    }},
    {"divide", {
        {"name", "divide"},
        {"label", "/"},
        {"pattern", "\\/"},
        {"computed_function_name", "/"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "(x, y) => `(${x} / ${y})`"},
        {"help", "Divides two numeric columns."},
        {"signature", "(x: Number) / (y: Number): Number"}
    }},
    {"pow", {
        {"name", "pow"},
        {"label", "x ^ y"},
        {"pattern", "\\^"},
        {"computed_function_name", "pow"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(${x} ^ ${y})`"},
        {"help", "Raises the first column to the power of the second column."},
        {"signature", "(x: Number) ^ (y: Number): Number"}
    }},
    {"percent_of", {
        {"name", "percent_of"},
        {"label", "x % y"},
        {"pattern", "\\%"},
        {"computed_function_name", "%"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(x, y) => `(${x} % ${y})`"},
        {"help", "Returns the first column as a percent of the second column."},
        {"signature", "(x: Number) % (y: Number): Number"}
    }},
    {"equals", {
        {"name", "equals"},
        {"label", "x == y"},
        {"pattern", "\\=="},
        {"computed_function_name", "equals"},
        {"input_type", "float"},
        {"return_type", "boolean"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(x, y) => `(${x} == ${y})`"},
        {"help", "Checks the equality of two numeric columns."},
        {"signature", "(x: Number) == (y: Number): Boolean"}
    }},
    {"not_equals", {
        {"name", "not_equals"},
        {"label", "x != y"},
        {"pattern", "\\!="},
        {"computed_function_name", "not_equals"},
        {"input_type", "float"},
        {"return_type", "boolean"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(x, y) => `(${x} != ${y})`"},
        {"help", "Whether two numeric columns are not equal."},
        {"signature", "(x: Number) != (y: Number): Boolean"}
    }},
    {"greater_than", {
        {"name", "greater_than"},
        {"label", "x > y"},
        {"pattern", "\\>"},
        {"computed_function_name", "greater_than"},
        {"input_type", "float"},
        {"return_type", "boolean"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(x, y) => `(${x} > ${y})`"},
        {"help", "Whether the first numeric column is greater than the second numeric column."},
        {"signature", "(x: Number) > (y: Number): Boolean"}
    }},
    {"less_than", {
        {"name", "less_than"},
        {"label", "x < y"},
        {"pattern", "\\<"},
        {"computed_function_name", "less_than"},
        {"input_type", "float"},
        {"return_type", "boolean"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(x, y) => `(${x} < ${y})`"},
        {"help", "Whether the first numeric column is less than the second numeric column."},
        {"signature", "(x: Number) < (y: Number): Boolean"}
    }},
    {"is", {
        {"name", "is"},
        {"label", "x is y"},
        {"pattern", "is"},
        {"computed_function_name", "is"},
        {"input_type", "string"},
        {"return_type", "boolean"},
        {"category", "OperatorTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `(x, y) => `(${x} < ${y})`"},
        {"help", "Checks equality of two string columns."},
        {"signature", "(x: String) is (y: String): Boolean"}
    }},
    // Numeric Functions
    {"invert", {
        {"name", "invert"},
        {"label", "1 / x"},
        {"pattern", "invert"},
        {"computed_function_name", "1/x"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `(1 / ${x})`"},
        {"help", "Returns 1 / the numeric column."},
        {"signature", "invert(x: Number): Number"}
    }},
    {"pow2", {
        {"name", "pow2"},
        {"label", "x ^ 2"},
        {"pattern", "pow2"},
        {"computed_function_name", "x^2"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `(${x} ^ 2)`"},
        {"help", "Returns the numeric column to the power of 2."},
        {"signature", "pow2(x: Number): Number"}
    }},
    {"log", {
        {"name", "log"},
        {"label", "log(x)"},
        {"pattern", "log"},
        {"computed_function_name", "log"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `log(${x})`"},
        {"help", "Returns the natural log of the numeric column."},
        {"signature", "log(x: Number): Number"}
    }},
    {"exp", {
        {"name", "exp"},
        {"label", "exp(x)"},
        {"pattern", "exp"},
        {"computed_function_name", "exp"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `exp(${x})`"},
        {"help", "Returns the base-e exponent of the numeric column."},
        {"signature", "exp(x: Number): Number"}
    }},
    {"sqrt", {
        {"name", "sqrt"},
        {"label", "sqrt(x)"},
        {"pattern", "sqrt"},
        {"computed_function_name", "sqrt"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `sqrt(${x})`"},
        {"help", "Returns the square root of the numeric column."},
        {"signature", "sqrt(x: Number): Number"}
    }},
    {"abs", {
        {"name", "abs"},
        {"label", "abs(x)"},
        {"pattern", "abs"},
        {"computed_function_name", "abs"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `abs(${x})`"},
        {"help", "Returns the absolute value of the numeric column."},
        {"signature", "abs(x: Number): Number"}
    }},
    {"bin10", {
        {"name", "bin10"},
        {"label", "Bucket x by 10"},
        {"pattern", "bin10"},
        {"computed_function_name", "Bucket (10)"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `bin10(${x})`"},
        {"help", "Buckets the numeric column to the nearest 10."},
        {"signature", "bin10(x: Number): Number"}
    }},
    {"bin100", {
        {"name", "bin100"},
        {"label", "Bucket x by 100"},
        {"pattern", "bin100"},
        {"computed_function_name", "Bucket (100)"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `bin100(${x})`"},
        {"help", "Buckets the numeric column to the nearest 100."},
        {"signature", "bin100(x: Number): Number"}
    }},
    {"bin1000", {
        {"name", "bin1000"},
        {"label", "Bucket x by 1000"},
        {"pattern", "bin1000"},
        {"computed_function_name", "Bucket (1000)"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `bin1000(${x})`"},
        {"help", "Buckets the numeric column to the nearest 1000."},
        {"signature", "bin1000(x: Number): Number"}
    }},
    {"bin10th", {
        {"name", "bin10th"},
        {"label", "Bucket x by 1/10"},
        {"pattern", "bin10th"},
        {"computed_function_name", "Bucket (1/10)"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `bin10th(${x})`"},
        {"help", "Buckets the numeric column to the nearest 0.1."},
        {"signature", "bin10th(x: Number): Number"}
    }},
    {"bin100th", {
        {"name", "bin100th"},
        {"label", "Bucket x by 1/100"},
        {"pattern", "bin100th"},
        {"computed_function_name", "Bucket (1/100)"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `bin100th(${x})`"},
        {"help", "Buckets the numeric column to the nearest 0.01."},
        {"signature", "bin100th(x: Number): Number"}
    }},
    {"bin1000th", {
        {"name", "bin1000th"},
        {"label", "Bucket x by 1/1000"},
        {"pattern", "bin1000th"},
        {"computed_function_name", "Bucket (1/1000)"},
        {"input_type", "float"},
        {"return_type", "float"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `bin1000th(${x})`"},
        {"help", "Buckets the numeric column to the nearest 0.001."},
        {"signature", "bin1000th(x: Number): Number"}
    }},
    // String Functions
    {"length", {
        {"name", "length"},
        {"label", "length(x)"},
        {"pattern", "length"},
        {"computed_function_name", "length"},
        {"input_type", "string"},
        {"return_type", "integer"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `length(${x})`"},
        {"help", "Returns the length of the string column."},
        {"signature", "length(x: String): Number"}
    }},
    {"uppercase", {
        {"name", "uppercase"},
        {"label", "uppercase(x)"},
        {"pattern", "uppercase"},
        {"computed_function_name", "Uppercase"},
        {"input_type", "string"},
        {"return_type", "string"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `uppercase(${x})`"},
        {"help", "Converts each string to uppercase in the column."},
        {"signature", "uppercase(x: String): String"}
    }},
    {"lowercase", {
        {"name", "lowercase"},
        {"label", "lowercase(x)"},
        {"pattern", "lowercase"},
        {"computed_function_name", "Lowercase"},
        {"input_type", "string"},
        {"return_type", "string"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `lowercase(${x})`"},
        {"help", "Converts each string to lowercase in the column."},
        {"signature", "lowercase(x: String): String"}
    }},
    {"concat_space", {
        {"name", "concat_space"},
        {"label", "Concat(x, y) with space"},
        {"pattern", "concat_space"},
        {"computed_function_name", "concat_space"},
        {"input_type", "string"},
        {"return_type", "string"},
        {"category", "FunctionTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `concat_space(${x})`"},
        {"help", "Concatenates two columns with a space."},
        {"signature", "concat_space(x: String, y: String): String"}
    }},
    {"concat_comma", {
        {"name", "concat_comma"},
        {"label", "Concat(x, y) with comma"},
        {"pattern", "concat_comma"},
        {"computed_function_name", "concat_comma"},
        {"input_type", "string"},
        {"return_type", "string"},
        {"category", "FunctionTokenType"},
        {"num_params", "2"},
        {"format_function", "x => `concat_comma(${x})`"},
        {"help", "Concatenates two columns with a comma."},
        {"signature", "concat_comma(x: String, y: String): String"}
    }},
    // Date Functions
    {"hour_of_day", {
        {"name", "hour_of_day"},
        {"label", "Hour of day"},
        {"pattern", "hour_of_day"},
        {"computed_function_name", "Hour of Day"},
        {"input_type", "datetime"},
        {"return_type", "integer"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `hour_of_day(${x})`"},
        {"help", "Returns the hour of day (0-23) for the datetime column."},
        {"signature", "hour_of_day(x: Datetime): Number"}
    }},
    {"day_of_week", {
        {"name", "day_of_week"},
        {"label", "Day of week"},
        {"pattern", "day_of_week"},
        {"computed_function_name", "Day of Week"},
        {"input_type", "datetime"},
        {"return_type", "string"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `day_of_week(${x})`"},
        {"help", "Returns the day of week for the datetime column."},
        {"signature", "day_of_week(x: Datetime): String"}
    }},
    {"month_of_year", {
        {"name", "month_of_year"},
        {"label", "Month of year"},
        {"pattern", "month_of_year"},
        {"computed_function_name", "Month of Year"},
        {"input_type", "datetime"},
        {"return_type", "string"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `month_of_year(${x})`"},
        {"help", "Returns the month of year for the datetime column."},
        {"signature", "month_of_year(x: Datetime): String"}
    }},
    {"second_bucket", {
        {"name", "second_bucket"},
        {"label", "Bucket(x) by seconds"},
        {"pattern", "second_bucket"},
        {"computed_function_name", "Bucket (s)"},
        {"input_type", "datetime"},
        {"return_type", "datetime"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `second_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest second."},
        {"signature", "second_bucket(x: Datetime): Datetime"}
    }},
    {"minute_bucket", {
        {"name", "minute_bucket"},
        {"label", "Bucket(x) by minutes"},
        {"pattern", "minute_bucket"},
        {"computed_function_name", "Bucket (m)"},
        {"input_type", "datetime"},
        {"return_type", "datetime"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `minute_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest minute."},
        {"signature", "minute_bucket(x: Datetime): Datetime"}
    }},
    {"hour_bucket", {
        {"name", "hour_bucket"},
        {"label", "Bucket(x) by hours"},
        {"pattern", "hour_bucket"},
        {"computed_function_name", "Bucket (h)"},
        {"input_type", "datetime"},
        {"return_type", "datetime"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `hour_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest hour."},
        {"signature", "hour_bucket(x: Datetime): Datetime"}
    }},
    {"day_bucket", {
        {"name", "day_bucket"},
        {"label", "Bucket(x) by days"},
        {"pattern", "day_bucket"},
        {"computed_function_name", "Bucket (D)"},
        {"input_type", "datetime"},
        {"return_type", "date"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `day_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest day."},
        {"signature", "day_bucket(x: Datetime): Datetime"}
    }},
    {"week_bucket", {
        {"name", "week_bucket"},
        {"label", "Bucket(x) by weeks"},
        {"pattern", "week_bucket"},
        {"computed_function_name", "Bucket (W)"},
        {"input_type", "datetime"},
        {"return_type", "date"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `week_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest week."},
        {"signature", "week_bucket(x: Datetime): Datetime"}
    }},
    {"month_bucket", {
        {"name", "month_bucket"},
        {"label", "Bucket(x) by months"},
        {"pattern", "month_bucket"},
        {"computed_function_name", "Bucket (M)"},
        {"input_type", "datetime"},
        {"return_type", "date"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `month_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest month."},
        {"signature", "month_bucket(x: Datetime): Datetime"}
    }},
    {"year_bucket", {
        {"name", "year_bucket"},
        {"label", "Bucket(x) by years"},
        {"pattern", "year_bucket"},
        {"computed_function_name", "Bucket (Y)"},
        {"input_type", "datetime"},
        {"return_type", "date"},
        {"category", "FunctionTokenType"},
        {"num_params", "1"},
        {"format_function", "x => `year_bucket(${x})`"},
        {"help", "Buckets the datetime column to the nearest year."},
        {"signature", "year_bucket(x: Datetime): Datetime"}
    }}
};

} // end namespace perspective