/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/computed_function.h>

namespace perspective {

namespace computed_function {

using int8 = std::int8_t;
using int16 = std::int16_t;
using int32 = std::int32_t;
using int64 = std::int64_t;
using uint8 = std::uint8_t;
using uint16 = std::uint16_t;
using uint32 = std::uint32_t;
using uint64 = std::uint64_t;
using float32 = float;
using float64 = double;

// template <typename T>
// col<T>::col(std::shared_ptr<t_data_table> data_table, const tsl::hopscotch_set<std::string>& input_columns)
//     : m_schema(nullptr)
//     , m_input_columns(std::move(input_columns))
//     , m_columns({})
//     , m_ridxs({}) {
//         // TODO: move into init()?
//         for (const auto& column_name : input_columns) {
//             m_columns[column_name] = data_table->get_column(column_name);
//             m_ridxs[column_name] = 0;
//         }
//     }

// template <typename T>
// col<T>::col(std::shared_ptr<t_schema> schema)
//     : m_schema(schema)
//     , m_columns({})
//     , m_ridxs({}) {}

// template <typename T>
// col<T>::~col() {}

// template <typename T>
// T col<T>::next(
//     const std::string& column_name) {
//     // std::cout << "NOT IMPLEMENTED" << std::endl;
//     std::string error = "next<T>() Not implemented!\n";
//     PSP_COMPLAIN_AND_ABORT(error);
// }

// template <>
// t_tscalar col<t_tscalar>::next(
//     const std::string& column_name) {
//     t_uindex ridx = m_ridxs[column_name];
//     t_tscalar rval = m_columns[column_name]->get_scalar(ridx);
//     m_ridxs[column_name] += 1;
//     return rval;
// }

// template <typename T>
// T col<T>::operator()(t_parameter_list parameters) {
//     auto num_params = parameters.size();

//     if (num_params == 0) {
//         std::stringstream ss;
//         ss << "Expression error: col() function cannot be empty." << std::endl;
//         // std::cout << ss.str();
//         PSP_COMPLAIN_AND_ABORT(ss.str());
//     }

//     t_string_view param = t_string_view(parameters[0]);
//     std::string column_name(param.begin(), param.size());

//     if (m_schema != nullptr) {
//         t_tscalar rval;
//         // scalar is valid here, as operations would fail and return
//         // none if the inputs are not valid scalars.
//         rval.m_status = STATUS_VALID;
//         rval.m_type = m_schema->get_dtype(column_name);
//         m_input_columns.insert(column_name);
//         return rval;
//     }

//     return next(column_name);
// }

intern::intern(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("S")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();
    
        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

intern::~intern() {}

t_tscalar intern::operator()(t_parameter_list parameters) {
    std::string temp_str;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_string == gt.type) {
        // intern('abc') - with a scalar string
        t_string_view temp_string(gt);
        temp_str = std::string(temp_string.begin(), temp_string.end()).c_str();

        // Don't allow empty strings
        if (temp_str == "") return m_none;
    } else {
        // An invalid call.
        return m_none;
    }

    // If the vocab is a nullptr, we are in type checking mode - TODO might be
    // better to make this explicit so that we never fall into an invalid mode
    // or try to deref a nullptr, maybe with an enum or something.
    if (m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    // Intern the string into the vocabulary, and return the index of the
    // string inside the vocabulary.
    t_uindex interned = m_expression_vocab->get_interned(temp_str);

    t_tscalar rval;
    rval.set(m_expression_vocab->unintern_c(interned));
    return rval;
}


concat::concat(std::shared_ptr<t_vocab> expression_vocab)
    : m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

concat::~concat() {}

t_tscalar concat::operator()(t_parameter_list parameters) {
    std::string result;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    if (parameters.size() == 0) return m_none;
    
    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view temp(gt);
            t_tscalar temp_scalar = temp();

            // Invalid type
            if (temp_scalar.get_dtype() != DTYPE_STR || temp_scalar.m_status == STATUS_CLEAR) {
                rval.m_status = STATUS_CLEAR;
                return rval;
            }

            // current param is the right type and we are type checking,
            // so move on to the next param
            if (m_expression_vocab == nullptr) {
                continue;
            }

            // no longer in type-checking - return if the param is invalid.
            if (!temp_scalar.is_valid()) {
                return rval;
            }

            // Read the string out from the scalar
            result += temp_scalar.to_string();
        } else {
            // An invalid call.
            return m_none;
        }
    }

    // don't try to intern an empty string as it will throw an error, but
    // by this point we know the params are valid - so return the sentinel
    // string value.
    if (result == "" || m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    t_uindex interned = m_expression_vocab->get_interned(result);

    // Return the sentinel with the uint64 data field set to the
    // index of the string in the vocab. The compute() and recompute() methods
    // will look in the uint64 field for all DTYPE_STR scalars from
    // expression.value().
    rval.set(m_expression_vocab->unintern_c(interned));

    return rval;
}

upper::upper(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

upper::~upper() {}

t_tscalar upper::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;
    std::string temp_str;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();

        if (temp_scalar.get_dtype() != DTYPE_STR || temp_scalar.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
            return rval;
        }

        if (!temp_scalar.is_valid()) {
            return rval;
        }

        temp_str = temp_scalar.to_string();
    } else {
        // An invalid call.
        return m_none;
    }

    // don't try to intern an empty string as it will throw an error, but
    // by this point we know the params are valid - so return the sentinel
    // string value.
    if (temp_str == "" || m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    boost::to_upper(temp_str);

    t_uindex interned = m_expression_vocab->get_interned(temp_str);
    rval.set(m_expression_vocab->unintern_c(interned));
    return rval;
}

lower::lower(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

lower::~lower() {}

t_tscalar lower::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;
    std::string temp_str;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();

        if (temp_scalar.get_dtype() != DTYPE_STR || temp_scalar.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
            return rval;
        }

        if (!temp_scalar.is_valid() || temp_scalar.is_none()) {
            return rval;
        }

        temp_str = temp_scalar.to_string();
    } else {
        // An invalid call.
        return m_none;
    }

    // don't try to intern an empty string as it will throw an error, but
    // by this point we know the params are valid - so return the sentinel
    // string value.
    if (temp_str == "" || m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    boost::to_lower(temp_str);

    t_uindex interned = m_expression_vocab->get_interned(temp_str);
    rval.set(m_expression_vocab->unintern_c(interned));
    return rval;
}

length::length(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_FLOAT64;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

length::~length() {}

t_tscalar length::operator()(t_parameter_list parameters) {
    std::string temp_str;
    t_tscalar rval;
    rval.clear();

    // return a float to be compatible with the most comparisons - even though
    // a uint would make most sense here, if this column returned a uint
    // comparisons to numeric literals and other numeric columns would always
    // be false, as comparisons are False across types.
    rval.m_type = DTYPE_FLOAT64;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();

        if (temp_scalar.get_dtype() != DTYPE_STR || temp_scalar.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
            return rval;
        }

        if (!temp_scalar.is_valid() || temp_scalar.is_none()) {
            return rval;
        }

        temp_str = temp_scalar.to_string();
    } else {
        // An invalid call.
        return m_none;
    }

    if (m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    rval.set(static_cast<double>(temp_str.size()));
    return rval;
}

order::order(std::shared_ptr<t_vocab> expression_vocab)
    : m_order_map({})
    , m_order_idx(0)
    , m_expression_vocab(expression_vocab) {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_FLOAT64;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

order::~order() {}

t_tscalar order::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();

    // return a float to be compatible with the most comparisons - even though
    // a uint would make most sense here, if this column returned a uint
    // comparisons to numeric literals and other numeric columns would always
    // be false, as comparisons are False across types.
    rval.m_type = DTYPE_FLOAT64;
    std::string temp_str;

    if (parameters.size() <= 1) {
        return m_none;
    }

    // generate the map if not generated
    if (m_order_map.size() == 0) {
        for (auto i = 0; i < parameters.size(); ++i) {
            t_generic_type& gt = parameters[i];

            if (t_generic_type::e_scalar == gt.type) {
                t_scalar_view temp(gt);
                t_tscalar temp_scalar = temp();

                // Invalid type
                if (temp_scalar.get_dtype() != DTYPE_STR || temp_scalar.m_status == STATUS_CLEAR) {
                    rval.m_status = STATUS_CLEAR;
                    return rval;
                }

                // current param is the right type and we are type checking,
                // so move on to the next param
                if (m_expression_vocab == nullptr) {
                    continue;
                }

                // no longer in type-checking - return if the param is invalid.
                if (!temp_scalar.is_valid()) {
                    return rval;
                }

                // params[0] is the column, params[1] onward are sort params
                if (i > 0) {
                    // Read the string param and assign to the order map, and
                    // then increment the internal counter.
                    std::string value = temp_scalar.to_string();
                    m_order_map[value] = m_order_idx;
                    m_order_idx++;
                }
            } else {
                // An invalid call.
                return m_none;
            }
        }
    }

    // don't try to intern an empty string as it will throw an error, but
    // by this point we know the params are valid - so return the sentinel
    // string value.
    if (m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    // read from the map or add the param to the map
    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    t_tscalar col_value = temp();

    // Don't calculate order for invalid scalars.
    if (!col_value.is_valid()) {
        return rval;
    }

    std::string key = col_value.to_string();
    auto found = m_order_map.find(key);

    if (found != m_order_map.end()) {
        rval.set(found->second);
    } else {
        // if the value is not in the map, then put it at the end so that
        // natural sorting can be applied.
        rval.set(m_order_idx);
    }

    return rval;
}

hour_of_day::hour_of_day()
    : exprtk::igeneric_function<t_tscalar>("?") {
    m_none = mknone();
}

hour_of_day::~hour_of_day() {}

t_tscalar hour_of_day::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();

    // return a float to be compatible with the most comparisons - even though
    // a uint would make most sense here, if this column returned a uint
    // comparisons to numeric literals and other numeric columns would always
    // be false, as comparisons are False across types.
    rval.m_type = DTYPE_FLOAT64;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();
        t_dtype dtype = temp_scalar.get_dtype();
        bool valid_dtype = dtype == DTYPE_DATE || dtype == DTYPE_TIME;

        if (!valid_dtype || temp_scalar.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
        }

        if (!temp_scalar.is_valid()) {
            return rval;
        }

        val.set(temp_scalar);
    } else {
        // An invalid call.
        return m_none;
    }
    
    if (val.get_dtype() == DTYPE_TIME) {
        // Convert the int64 to a milliseconds duration timestamp
        std::chrono::milliseconds timestamp(val.to_int64());

        // Convert the timestamp to a `sys_time` (alias for `time_point`)
        date::sys_time<std::chrono::milliseconds> ts(timestamp);

        // Use localtime so that the hour of day is consistent with all output
        // datetimes, which are in local time
        std::time_t temp = std::chrono::system_clock::to_time_t(ts);
        std::tm* t = std::localtime(&temp);

        // Get the hour from the resulting `std::tm`
        rval.set(static_cast<double>(t->tm_hour));
    } else {
        // Hour of day for date column is always 0
        rval.set(0.0);
    }

    return rval;
}

const std::string days_of_week[7] = {
    "1 Sunday",
    "2 Monday",
    "3 Tuesday",
    "4 Wednesday",
    "5 Thursday",
    "6 Friday",
    "7 Saturday"
};

const std::string months_of_year[12] = {
    "01 January",
    "02 February",
    "03 March",
    "04 April",
    "05 May",
    "06 June",
    "07 July",
    "08 August",
    "09 September",
    "10 October",
    "11 November",
    "12 December"
};

day_of_week::day_of_week(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

day_of_week::~day_of_week() {}

t_tscalar day_of_week::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();
        t_dtype dtype = temp_scalar.get_dtype();
        bool valid_dtype = dtype == DTYPE_DATE || dtype == DTYPE_TIME;

        if (!valid_dtype || temp_scalar.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
        }

        if (!temp_scalar.is_valid()) {
            return rval;
        }

        val.set(temp_scalar);
    } else {
        // An invalid call.
        return m_none;
    }

    if (m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    std::string result;
    
    if (val.get_dtype() == DTYPE_TIME) {
        // Convert the int64 to a milliseconds duration timestamp
        std::chrono::milliseconds timestamp(val.to_int64());

        // Convert the timestamp to a `sys_time` (alias for `time_point`)
        date::sys_time<std::chrono::milliseconds> ts(timestamp);

        // Use localtime so that the hour of day is consistent with all output
        // datetimes, which are in local time
        std::time_t temp = std::chrono::system_clock::to_time_t(ts);
        std::tm* t = std::localtime(&temp);

        // Get the weekday from the resulting `std::tm`
        result = days_of_week[t->tm_wday];
    } else {
        // Retrieve the `t_date` struct from the scalar
        t_date date_val = val.get<t_date>();

        // Construct a `date::year_month_day` value
        date::year year {date_val.year()};

        // date::month is [1-12], whereas `t_date.month()` is [0-11]
        date::month month {static_cast<std::uint32_t>(date_val.month()) + 1};
        date::day day {static_cast<std::uint32_t>(date_val.day())};
        date::year_month_day ymd(year, month, day);

        // Construct a `date::year_month_weekday` from `date::sys_days` since epoch
        auto weekday = date::year_month_weekday(ymd).weekday_indexed().weekday();

        result = days_of_week[(weekday - date::Sunday).count()];
    }

    // Intern the string pointer so it does not fall out of reference and
    // cause a memory error.
    t_uindex interned = m_expression_vocab->get_interned(result);
    rval.set(m_expression_vocab->unintern_c(interned));
    return rval;
}

month_of_year::month_of_year(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

month_of_year::~month_of_year() {}

t_tscalar month_of_year::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();
        t_dtype dtype = temp_scalar.get_dtype();
        bool valid_dtype = dtype == DTYPE_DATE || dtype == DTYPE_TIME;

        if (!valid_dtype || temp_scalar.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
        }

        if (!temp_scalar.is_valid()) {
            return rval;
        }

        val.set(temp_scalar);
    } else {
        // An invalid call.
        return m_none;
    }

    if (m_expression_vocab == nullptr) {
        return m_sentinel;
    }
    
    std::string result;

    if (val.get_dtype() == DTYPE_TIME) {
        // Convert the int64 to a milliseconds duration timestamp
        std::chrono::milliseconds timestamp(val.to_int64());

        // Convert the timestamp to a `sys_time` (alias for `time_point`)
        date::sys_time<std::chrono::milliseconds> ts(timestamp);

        // Use localtime so that the hour of day is consistent with all output
        // datetimes, which are in local time
        std::time_t temp = std::chrono::system_clock::to_time_t(ts);
        std::tm* t = std::localtime(&temp);

        // Get the month from the resulting `std::tm`
        auto month = t->tm_mon;

        // Get the month string and write into the output column
        result = months_of_year[month];
    } else {
        t_date date_val = val.get<t_date>();

        // `t_date.month()` is [0-11]
        std::int32_t month = date_val.month();
        result = months_of_year[month];
    }

    // Intern the string pointer so it does not fall out of reference and
    // cause a memory error.
    t_uindex interned = m_expression_vocab->get_interned(result);
    rval.set(m_expression_vocab->unintern_c(interned));
    return rval;
}

tsl::hopscotch_map<std::string, t_date_bucket_unit>
date_bucket::UNIT_MAP = {
    {"s", t_date_bucket_unit::SECONDS},
    {"m", t_date_bucket_unit::MINUTES},
    {"h", t_date_bucket_unit::HOURS},
    {"D", t_date_bucket_unit::DAYS},
    {"W", t_date_bucket_unit::WEEKS},
    {"M", t_date_bucket_unit::MONTHS},
    {"Y", t_date_bucket_unit::YEARS}
};

date_bucket::date_bucket()
    : exprtk::igeneric_function<t_tscalar>("TS") {
    m_none = mknone();
}

date_bucket::~date_bucket() {}

t_tscalar date_bucket::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_date_bucket_unit unit;

    t_tscalar rval;
    rval.clear();

    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view temp(gt);

            // copies value, type, validity
            val.set(temp());
        } else if (t_generic_type::e_string == gt.type) {
            t_string_view temp_string(gt);
            std::string unit_str = std::string(temp_string.begin(), temp_string.end());

            if (date_bucket::UNIT_MAP.count(unit_str) == 0) {
                std::cerr << "[date_bucket] unknown unit in date_bucket - the valid units are 's', 'm', 'h', 'D', 'W', 'M', and 'Y'." << unit << std::endl;
                return m_none;
            }

            unit = date_bucket::UNIT_MAP[unit_str];
        } else {
            std::cerr << "[date_bucket] Invalid parameter in date_bucket()" << std::endl;
            return m_none;
        }
    }

    t_dtype dtype = val.get_dtype();

    // type-check
    if (!(dtype == DTYPE_DATE || dtype == DTYPE_TIME)) {
        rval.m_status = STATUS_CLEAR;
    }

    // Depending on unit, datetime columns can result in a date column or a 
    // datetime column.
    if (val.m_type == DTYPE_TIME) {
        switch (unit) {
            case t_date_bucket_unit::SECONDS:
            case t_date_bucket_unit::MINUTES:
            case t_date_bucket_unit::HOURS: {
                rval.m_type = DTYPE_TIME;
            } break;
            case t_date_bucket_unit::DAYS:
            case t_date_bucket_unit::WEEKS:
            case t_date_bucket_unit::MONTHS:
            case t_date_bucket_unit::YEARS: {
                rval.m_type = DTYPE_DATE;
            } break;
            default: {
                // shouldn't trigger this block - unit has already been validated
                return m_none;
            } break;
        }
    } else {
        // but date columns will always output date columns
        rval.m_type = DTYPE_DATE;
    }

    if (!val.is_valid()) {
        return rval;
    }

    switch (unit) {
        case t_date_bucket_unit::SECONDS: {
            _second_bucket(val, rval);
        } break;
        case t_date_bucket_unit::MINUTES: {
            _minute_bucket(val, rval);
        } break;
        case t_date_bucket_unit::HOURS: {
            _hour_bucket(val, rval);
        } break;
        case t_date_bucket_unit::DAYS: {
            _day_bucket(val, rval);
        } break;
        case t_date_bucket_unit::WEEKS: {
            _week_bucket(val, rval);
        } break;
        case t_date_bucket_unit::MONTHS: {
            _month_bucket(val, rval);
        } break;
        case t_date_bucket_unit::YEARS: {
            _year_bucket(val, rval);
        } break;
        default: {
            // shouldn't trigger this block - unit has already been validated
            return m_none;
        } break;
    }

    return rval;
}

void _second_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_TIME: {
            auto int_ts = val.to_int64();
            std::int64_t bucketed_ts = floor(static_cast<double>(int_ts) / 1000) * 1000;
            rval.set(t_time(bucketed_ts));
        } break;
        default: {
            // echo the original value back into the column.
            rval.set(val);
        }
    }
}

void _minute_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_TIME: {
            // Convert the int64 to a milliseconds duration timestamp
            std::chrono::milliseconds ms_timestamp(val.to_int64());

            // Convert milliseconds to minutes
            std::chrono::minutes m_timestamp = std::chrono::duration_cast<std::chrono::minutes>(ms_timestamp);

            // Set a new `t_time` and return it.
            rval.set(
                t_time(std::chrono::duration_cast<std::chrono::milliseconds>(m_timestamp).count()));
        } break;
        default: {
            rval.set(val);
        } break;
    }
}

void _hour_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_TIME: {
            // Convert the int64 to a millisecond duration timestamp
            std::chrono::milliseconds ms_timestamp(val.to_int64());

            // Convert the milliseconds to hours
            std::chrono::hours hr_timestamp = std::chrono::duration_cast<std::chrono::hours>(ms_timestamp);

            // Set a new `t_time` and return it.
            rval.set(
                t_time(std::chrono::duration_cast<std::chrono::milliseconds>(hr_timestamp).count()));
        } break;
        default: {
            rval.set(val);
        } break;
    }
}

void _day_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_TIME: {
            // Convert the int64 to a milliseconds duration timestamp
            std::chrono::milliseconds ms_timestamp(val.to_int64());

            // Convert the timestamp to a `sys_time` (alias for `time_point`)
            date::sys_time<std::chrono::milliseconds> ts(ms_timestamp);

            // Use localtime so that the day of week is consistent with all output
            // datetimes, which are in local time
            std::time_t temp = std::chrono::system_clock::to_time_t(ts);

            // Convert to a std::tm
            std::tm* t = std::localtime(&temp);

            // Get the year and create a new `t_date`
            std::int32_t year = static_cast<std::int32_t>(t->tm_year + 1900);

            // Month in `t_date` is [0-11]
            std::int32_t month = static_cast<std::uint32_t>(t->tm_mon);
            std::uint32_t day = static_cast<std::uint32_t>(t->tm_mday);

            rval.set(t_date(year, month, day));
        } break;
        default: {
            // echo the original value back into the column.
            rval.set(val);
        } break;
    }
}

void _week_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_DATE: {
            // Retrieve the `t_date` struct from the scalar
            t_date date_val = val.get<t_date>();

            // Construct a `date::year_month_day` value
            date::year year {date_val.year()};

            // date::month is [1-12], whereas `t_date.month()` is [0-11]
            date::month month {static_cast<std::uint32_t>(date_val.month()) + 1};
            date::day day {static_cast<std::uint32_t>(date_val.day())};
            date::year_month_day ymd(year, month, day);

            // Convert to a `sys_days` representing no. of days since epoch
            date::sys_days days_since_epoch = ymd;

            // Subtract Sunday from the ymd to get the beginning of the last day
            ymd = days_since_epoch - (date::weekday{days_since_epoch} - date::Monday);

            // Get the day of month and day of the week
            std::int32_t year_int = static_cast<std::int32_t>(ymd.year());

            // date::month is [1-12], whereas `t_date.month()` is [0-11]
            std::uint32_t month_int = static_cast<std::uint32_t>(ymd.month()) - 1;
            std::uint32_t day_int = static_cast<std::uint32_t>(ymd.day());

            // Return the new `t_date`
            t_date new_date = t_date(year_int, month_int, day_int);
            rval.set(new_date);
        } break;
        case DTYPE_TIME: {
            // Convert the int64 to a milliseconds duration timestamp
            std::chrono::milliseconds timestamp(val.to_int64());

            // Convert the timestamp to a `sys_time` (alias for `time_point`)
            date::sys_time<std::chrono::milliseconds> ts(timestamp);

            // Convert the timestamp to local time
            std::time_t temp = std::chrono::system_clock::to_time_t(ts);
            std::tm* t = std::localtime(&temp);

            // Take the ymd from the `tm`, now in local time, and create a
            // date::year_month_day.
            date::year year {1900 + t->tm_year};

            // date::month is [1-12], whereas `std::tm::tm_mon` is [0-11]
            date::month month {static_cast<std::uint32_t>(t->tm_mon) + 1};
            date::day day {static_cast<std::uint32_t>(t->tm_mday)};
            date::year_month_day ymd(year, month, day);

            // Convert to a `sys_days` representing no. of days since epoch
            date::sys_days days_since_epoch = ymd;

            // Subtract Sunday from the ymd to get the beginning of the last day
            ymd = days_since_epoch - (date::weekday{days_since_epoch} - date::Monday);

            // Get the day of month and day of the week
            std::int32_t year_int = static_cast<std::int32_t>(ymd.year());

            // date::month is [1-12], whereas `t_date.month()` is [0-11]
            std::uint32_t month_int = static_cast<std::uint32_t>(ymd.month()) - 1;
            std::uint32_t day_int = static_cast<std::uint32_t>(ymd.day());

            // Return the new `t_date`
            t_date new_date = t_date(year_int, month_int, day_int);
            rval.set(new_date);
        } break;
        default: break;
    }
}

void _month_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_DATE: {
            t_date date_val = val.get<t_date>();
            rval.set(t_date(date_val.year(), date_val.month(), 1));
        } break;
        case DTYPE_TIME: {
            // Convert the int64 to a milliseconds duration timestamp
            std::chrono::milliseconds ms_timestamp(val.to_int64());

            // Convert the timestamp to a `sys_time` (alias for `time_point`)
            date::sys_time<std::chrono::milliseconds> ts(ms_timestamp);

            // Convert the timestamp to local time
            std::time_t temp = std::chrono::system_clock::to_time_t(ts);
            std::tm* t = std::localtime(&temp);

            // Use the `tm` to create the `t_date`
            std::int32_t year = static_cast<std::int32_t>(t->tm_year + 1900);
            std::int32_t month = static_cast<std::uint32_t>(t->tm_mon);
            rval.set(t_date(year, month, 1));
        } break;
        default: break;
    }
}

void _year_bucket(t_tscalar& val, t_tscalar& rval) {
    switch (val.get_dtype()) {
        case DTYPE_DATE: {
            t_date date_val = val.get<t_date>();
            rval.set(t_date(date_val.year(), 0, 1));
        } break;
        case DTYPE_TIME: {
            // Convert the int64 to a milliseconds duration timestamp
            std::chrono::milliseconds ms_timestamp(val.to_int64());

            // Convert the timestamp to a `sys_time` (alias for `time_point`)
            date::sys_time<std::chrono::milliseconds> ts(ms_timestamp);

            // Convert the timestamp to local time
            std::time_t temp = std::chrono::system_clock::to_time_t(ts);
            std::tm* t = std::localtime(&temp);

            // Use the `tm` to create the `t_date`
            std::int32_t year = static_cast<std::int32_t>(t->tm_year + 1900);
            rval.set(t_date(year, 0, 1));
        } break;
        default: break;
    }
}

t_tscalar now() {
    t_tscalar rval;
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    rval.set(t_time(now));
    return rval;
}

t_tscalar today() {
    t_tscalar rval;

    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch());

    // Convert the timestamp to a `sys_time` (alias for `time_point`)
    date::sys_time<std::chrono::milliseconds> ts(now);

    // Use localtime so that the day of week is consistent with all output
    // datetimes, which are in local time
    std::time_t temp = std::chrono::system_clock::to_time_t(ts);

    // Convert to a std::tm
    std::tm* t = std::localtime(&temp);

    // Get the year and create a new `t_date`
    std::int32_t year = static_cast<std::int32_t>(t->tm_year + 1900);

    // Month in `t_date` is [0-11]
    std::int32_t month = static_cast<std::uint32_t>(t->tm_mon);
    std::uint32_t day = static_cast<std::uint32_t>(t->tm_mday);

    rval.set(t_date(year, month, day));
    return rval;
}

min_fn::min_fn() : m_none(mknone()) {}

min_fn::~min_fn() {}

t_tscalar min_fn::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_FLOAT64;

    std::vector<t_tscalar> inputs;
    inputs.resize(parameters.size());

    // type check through all parameters first before calculating
    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view _temp(gt);
            t_tscalar temp = _temp();

            std::cout << temp.repr() << std::endl;

            if (!temp.is_numeric()) {
                rval.m_status = STATUS_CLEAR;
                return rval;
            } else {
                // correct type - we will check for STATUS_VALID later
                inputs[i] = temp;
                continue;
            }
        } else {
            std::cerr << "[min_fn] Invalid parameter in min_fn()" << std::endl;
            return m_none;
        }
    }

    // types are now valid - we can calculate the value
    for (auto i = 0; i < inputs.size(); ++i) {
        const t_tscalar& val = inputs[i];

        // correct type input but invalid - return
        if (!val.is_valid()) {
            return rval;
        }

        if (i == 0 || (val.to_double() < rval.to_double())) {
            rval.set(val.to_double());
        }
    }

    return rval;
}

max_fn::max_fn() : m_none(mknone())  {}

max_fn::~max_fn() {}

t_tscalar max_fn::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_FLOAT64;

    std::vector<t_tscalar> inputs;
    inputs.resize(parameters.size());

    // type check through all parameters first before calculating
    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view _temp(gt);
            t_tscalar temp = _temp();

            if (!temp.is_numeric()) {
                rval.m_status = STATUS_CLEAR;
                return rval;
            } else {
                // correct type - we will check for STATUS_VALID later
                inputs[i] = temp;
                continue;
            }
        } else {
            std::cerr << "[max_fn] Invalid parameter in max_fn()" << std::endl;
            return m_none;
        }
    }

    // types are now valid - we can calculate the value
    for (auto i = 0; i < inputs.size(); ++i) {
        const t_tscalar& val = inputs[i];

        // correct type input but invalid - return
        if (!val.is_valid()) {
            return rval;
        }

        if (i == 0 || (val.to_double() > rval.to_double())) {
            rval.set(val.to_double());
        }
    }

    return rval;
}

percent_of::percent_of()
    : exprtk::igeneric_function<t_tscalar>("TT")
    , m_none(mknone()) {}

percent_of::~percent_of() {}

t_tscalar percent_of::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();

    // Return a float so we can use it in conditionals
    rval.m_type = DTYPE_FLOAT64;

    if (parameters.size() != 2) return m_none;

    t_generic_type& _x = parameters[0];
    t_generic_type& _y = parameters[1];

    t_scalar_view _x_view(_x);
    t_scalar_view _y_view(_y);

    t_tscalar x = _x_view();
    t_tscalar y = _y_view();

    if (!x.is_numeric() || !y.is_numeric()) {
        rval.m_status = STATUS_CLEAR;
    }

    if (!x.is_valid() || !y.is_valid()) {
        return rval;
    }

    if (y.to_double() == 0) {
        return rval;
    }

    rval.set((x.to_double() / y.to_double()) * 100);
    return rval;
}

is_null::is_null()
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_none(mknone()) {}

is_null::~is_null() {}

t_tscalar is_null::operator()(t_parameter_list parameters) {
    t_tscalar val;

    t_tscalar rval;
    rval.clear();

    // Return a float so we can use it in conditionals
    rval.m_type = DTYPE_FLOAT64;

    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view temp(gt);
            val.set(temp());
        } else {
            std::cerr << "[is_null] Invalid parameter in is_null()" << std::endl;
            return m_none;
        }
    }

    // Return a double so we can use it in conditionals
    rval.set(static_cast<double>(val.is_none() || !val.is_valid()));

    return rval;
}

is_not_null::is_not_null()
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_none(mknone()) {}

is_not_null::~is_not_null() {}

t_tscalar is_not_null::operator()(t_parameter_list parameters) {
    t_tscalar val;

    t_tscalar rval;
    rval.clear();

    // Return a float so we can use it in conditionals
    rval.m_type = DTYPE_FLOAT64;

    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view temp(gt);
            val.set(temp());
        } else {
            std::cerr << "[is_null] Invalid parameter in is_null()" << std::endl;
            return m_none;
        }
    }

    rval.set(static_cast<double>(!val.is_none() && val.is_valid()));

    return rval;
}

} // end namespace computed_function
} // end namespace perspective