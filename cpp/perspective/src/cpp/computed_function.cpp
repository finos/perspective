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
        t_tscalar rval;

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_status = STATUS_INVALID;
        sentinel.m_data.m_uint64 = 0;
        sentinel.m_data.m_charptr = nullptr;

        // The rval is the scalar that is returned out from each call to the
        // function. Because strings are interned in a vocabulary, the only
        // thing that is returned is a uint64 value that contains the index
        // into the expression vocab.
        rval.m_type = DTYPE_STR;
        rval.m_status = STATUS_VALID;
        rval.m_data.m_uint64 = 0;
        rval.m_data.m_charptr = nullptr;

        m_sentinel = sentinel;
        m_rval = rval;

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

    t_uindex interned = m_expression_vocab->get_interned(temp_str);
    m_rval.set(m_expression_vocab->unintern_c(interned));

    // Return the sentinel with the uint64 data field set to the
    // index of the string in the vocab. The compute() and recompute() methods
    // will look in the uint64 field for all DTYPE_STR scalars from
    // expression.value().
    // m_rval.m_data.m_uint64 = interned;
    return m_rval;
}


concat::concat(std::shared_ptr<t_vocab> expression_vocab)
    : m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        t_tscalar rval;

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_status = STATUS_INVALID;
        sentinel.m_data.m_uint64 = 0;
        sentinel.m_data.m_charptr = nullptr;

        // The rval is the scalar that is returned out from each call to the
        // function. Because strings are interned in a vocabulary, the only
        // thing that is returned is a uint64 value that contains the index
        // into the expression vocab.
        rval.m_type = DTYPE_STR;
        rval.m_status = STATUS_VALID;
        rval.m_data.m_uint64 = 0;
        rval.m_data.m_charptr = nullptr;

        m_sentinel = sentinel;
        m_rval = rval;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

concat::~concat() {}

t_tscalar concat::operator()(t_parameter_list parameters) {
    std::string result;

    if (parameters.size() == 0) return m_none;
    
    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];

        if (t_generic_type::e_scalar == gt.type) {
            t_scalar_view temp(gt);
            t_tscalar temp_scalar = temp();

            if (temp_scalar.get_dtype() != DTYPE_STR) {
                m_rval.m_status = STATUS_CLEAR;
            }

            if (!temp_scalar.is_valid() || temp_scalar.is_none()) {
                return m_rval;
            }

            if (m_expression_vocab != nullptr) {
                if (temp_scalar.m_data.m_uint64 >= 0
                    && temp_scalar.m_data.m_uint64 < m_expression_vocab->get_vlenidx()) {
                    result += std::string(m_expression_vocab->unintern_c(temp_scalar.m_data.m_uint64));
                } else if (temp_scalar.m_data.m_charptr != nullptr) {
                    // If there are no values in the uint64/it is uninitialized, but
                    // the scalar has a charptr value then read the string out from
                    // the scalar itself.
                    result += temp_scalar.to_string();
                } else {
                    PSP_COMPLAIN_AND_ABORT("[concat] Invalid scalar found: " + temp_scalar.repr());
                }
            }
        } else if (t_generic_type::e_string == gt.type) {
            // upper('abc') - with a scalar string
            t_string_view temp_string(gt);
            std::string temp_str = std::string(temp_string.begin(), temp_string.end()).c_str();

            // Don't allow empty strings
            if (temp_str == "") return m_none;

            result += temp_str;
        } else {
            // An invalid call.
            m_rval.m_status = STATUS_CLEAR;
            return m_rval;
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
    m_rval.m_data.m_uint64 = interned;
    m_rval.m_status = STATUS_VALID;

    return m_rval;
}

upper::upper(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        t_tscalar rval;

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_status = STATUS_INVALID;
        sentinel.m_data.m_uint64 = 0;
        sentinel.m_data.m_charptr = nullptr;


        // The rval is the scalar that is returned out from each call to the
        // function. Because strings are interned in a vocabulary, the only
        // thing that is returned is a uint64 value that contains the index
        // into the expression vocab.
        rval.m_type = DTYPE_STR;
        rval.m_status = STATUS_VALID;
        rval.m_data.m_uint64 = 0;
        rval.m_data.m_charptr = nullptr;

        m_sentinel = sentinel;
        m_rval = rval;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

upper::~upper() {}

t_tscalar upper::operator()(t_parameter_list parameters) {
    std::string temp_str;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();

        if (temp_scalar.get_dtype() != DTYPE_STR) {
            m_rval.m_status = STATUS_CLEAR;
        }

        if (!temp_scalar.is_valid() || temp_scalar.is_none()) {
            return m_rval;
        }

        if (m_expression_vocab != nullptr) {
            if (temp_scalar.m_data.m_uint64 >= 0
                && temp_scalar.m_data.m_uint64 < m_expression_vocab->get_vlenidx()) {
                temp_str = std::string(m_expression_vocab->unintern_c(temp_scalar.m_data.m_uint64));
            } else if (temp_scalar.m_data.m_charptr != nullptr) {
                // If there are no values in the uint64/it is uninitialized, but
                // the scalar has a charptr value then read the string out from
                // the scalar itself.
                temp_str = temp_scalar.to_string();
            } else {
                PSP_COMPLAIN_AND_ABORT("[upper] Invalid scalar found: " + temp_scalar.repr());
            }
        } else {
            return m_sentinel;
        }
    } else if (t_generic_type::e_string == gt.type) {
        // upper('abc') - with a scalar string
        t_string_view temp_string(gt);
        temp_str = std::string(temp_string.begin(), temp_string.end()).c_str();

        // Don't allow empty strings
        if (temp_str == "") return m_none;
    } else {
        // An invalid call.
        m_rval.m_status = STATUS_CLEAR;
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

    // Return the sentinel with the uint64 data field set to the
    // index of the string in the vocab. The compute() and recompute() methods
    // will look in the uint64 field for all DTYPE_STR scalars from
    // expression.value().
    m_rval.m_data.m_uint64 = interned;
    m_rval.m_status = STATUS_VALID;

    return m_rval;
}

lower::lower(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("?")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        t_tscalar rval;

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_status = STATUS_INVALID;
        sentinel.m_data.m_uint64 = 0;
        sentinel.m_data.m_charptr = nullptr;


        // The rval is the scalar that is returned out from each call to the
        // function. Because strings are interned in a vocabulary, the only
        // thing that is returned is a uint64 value that contains the index
        // into the expression vocab.
        rval.m_type = DTYPE_STR;
        rval.m_status = STATUS_VALID;
        rval.m_data.m_uint64 = 0;
        rval.m_data.m_charptr = nullptr;

        m_sentinel = sentinel;
        m_rval = rval;

        // m_none is a scalar with DTYPE_NONE that indicates an invalid
        // call to the function.
        m_none = mknone();
    }

lower::~lower() {}

t_tscalar lower::operator()(t_parameter_list parameters) {
    std::string temp_str;

    if (parameters.size() != 1) {
        return m_none;
    }

    t_generic_type& gt = parameters[0];

    if (t_generic_type::e_scalar == gt.type) {
        t_scalar_view temp(gt);
        t_tscalar temp_scalar = temp();

        if (temp_scalar.get_dtype() != DTYPE_STR) {
            m_rval.m_status = STATUS_CLEAR;
        }

        if (!temp_scalar.is_valid() || temp_scalar.is_none()) {
            return m_rval;
        }

        if (m_expression_vocab != nullptr) {
            if (temp_scalar.m_data.m_uint64 >= 0
                && temp_scalar.m_data.m_uint64 < m_expression_vocab->get_vlenidx()) {
                temp_str = std::string(m_expression_vocab->unintern_c(temp_scalar.m_data.m_uint64));
            } else if (temp_scalar.m_data.m_charptr != nullptr) {
                // If there are no values in the uint64/it is uninitialized, but
                // the scalar has a charptr value then read the string out from
                // the scalar itself.
                temp_str = temp_scalar.to_string();
            } else {
                PSP_COMPLAIN_AND_ABORT("[lower] Invalid scalar found: " + temp_scalar.repr());
            }
        } else {
            return m_sentinel;
        }
    } else if (t_generic_type::e_string == gt.type) {
        // upper('abc') - with a scalar string
        t_string_view temp_string(gt);
        temp_str = std::string(temp_string.begin(), temp_string.end()).c_str();

        // Don't allow empty strings
        if (temp_str == "") return m_none;
    } else {
        // An invalid call.
        m_rval.m_status = STATUS_CLEAR;
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

    // Return the sentinel with the uint64 data field set to the
    // index of the string in the vocab. The compute() and recompute() methods
    // will look in the uint64 field for all DTYPE_STR scalars from
    // expression.value().
    m_rval.m_data.m_uint64 = interned;
    m_rval.m_status = STATUS_VALID;

    return m_rval;
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
                return mknone();
            }

            unit = date_bucket::UNIT_MAP[unit_str];
        } else {
            std::cerr << "[date_bucket] Invalid parameter in date_bucket()" << std::endl;
            return mknone();
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
                return mknone();
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
            return mknone();
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

} // end namespace computed_function
} // end namespace perspective