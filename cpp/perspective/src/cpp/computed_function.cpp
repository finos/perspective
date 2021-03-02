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
        sentinel.m_status = STATUS_VALID;
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
        sentinel.m_status = STATUS_VALID;
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

            if (temp_scalar.get_dtype() != DTYPE_STR || !temp_scalar.is_valid() || temp_scalar.is_none()) {
                return m_none;
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
    m_rval.m_data.m_uint64 = interned;

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
        sentinel.m_status = STATUS_VALID;
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

        if (temp_scalar.get_dtype() != DTYPE_STR || !temp_scalar.is_valid() || temp_scalar.is_none()) {
            return m_none;
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
        sentinel.m_status = STATUS_VALID;
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

        if (temp_scalar.get_dtype() != DTYPE_STR || !temp_scalar.is_valid() || temp_scalar.is_none()) {
            return m_none;
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

/**
 * @brief bucket(num, 10), bucket(date, 15, 'D')
 */
date_bucket::date_bucket()
    : exprtk::igeneric_function<t_tscalar>("TS") {
}

date_bucket::~date_bucket() {}

t_tscalar date_bucket::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_date_bucket_unit unit;

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
                std::cerr << "[date_bucket] Invalid unit in date_bucket(): " << unit << std::endl;
                return mknone();
            }

            unit = date_bucket::UNIT_MAP[unit_str];
        } else {
            std::cerr << "[date_bucket] Invalid parameter in date_bucket()" << std::endl;
            return mknone();
        }
    }

    t_tscalar rval;
    
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
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

    switch (val.get_dtype()) {
        case DTYPE_TIME: {
            auto int_ts = val.to_int64();
            std::int64_t bucketed_ts = floor(static_cast<double>(int_ts) / 1000) * 1000;
            rval.set(t_time(bucketed_ts));
        } break;
        default: break;
    }
}

void _minute_bucket(t_tscalar& val, t_tscalar& rval) {
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

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
        default: break;
    }
}

void _hour_bucket(t_tscalar& val, t_tscalar& rval) {
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

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
        default: break;
    }
}

void _day_bucket(t_tscalar& val, t_tscalar& rval) {
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

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
        default: break;
    }
}

void _week_bucket(t_tscalar& val, t_tscalar& rval) {
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

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
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

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
    if (val.is_none() || !val.is_valid()) rval.set(t_none());

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

/**
 * @brief Generate all type permutations for a numeric function that takes one
 * parameter. Return value from numeric functions are always `double`.
 */
#define NUMERIC_FUNCTION_1(FUNC)    \
    FUNC(uint8)                     \
    FUNC(uint16)                    \
    FUNC(uint32)                    \
    FUNC(uint64)                    \
    FUNC(int8)                      \
    FUNC(int16)                     \
    FUNC(int32)                     \
    FUNC(int64)                     \
    FUNC(float32)                   \
    FUNC(float64)                   \

/**
 * @brief Generate all type permutations for a numeric function that takes
 * one parameter, and uses the math methods defined in the `std` header.
 * `NAME` is expected to map into a valid `std` method.
 */
#define NUMERIC_STD_MATH_FUNCTION_1(NAME)                         \
    STD_MATH_ARITY_1(NAME, uint8)                                 \
    STD_MATH_ARITY_1(NAME, uint16)                                \
    STD_MATH_ARITY_1(NAME, uint32)                                \
    STD_MATH_ARITY_1(NAME, uint64)                                \
    STD_MATH_ARITY_1(NAME, int8)                                  \
    STD_MATH_ARITY_1(NAME, int16)                                 \
    STD_MATH_ARITY_1(NAME, int32)                                 \
    STD_MATH_ARITY_1(NAME, int64)                                 \
    STD_MATH_ARITY_1(NAME, float32)                               \
    STD_MATH_ARITY_1(NAME, float64)                               \

/**
 * @brief Generate a function with `NAME` templated to `T`, using
 * the math functions defined in the `std` header.
 */
#define STD_MATH_ARITY_1(NAME, T)                                   \
    t_tscalar NAME##_##T(t_tscalar x) {                             \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        rval.set(static_cast<float64>(                              \
            std::NAME(static_cast<float64>(x.get<T>()))));        \
        return rval;                                                \
}

NUMERIC_STD_MATH_FUNCTION_1(sqrt);
NUMERIC_STD_MATH_FUNCTION_1(abs);
NUMERIC_STD_MATH_FUNCTION_1(log);
NUMERIC_STD_MATH_FUNCTION_1(exp);


#define POW2(T)                                                     \
    t_tscalar pow2_##T(t_tscalar x) {                               \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        rval.set(static_cast<float64>(                              \
            std::pow(static_cast<float64>(x.get<T>()), 2)           \
        ));                                                         \
        return rval;                                                \
    }

#define INVERT(T)                                                   \
    t_tscalar invert_##T(t_tscalar x) {                             \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        float64 rhs = static_cast<float64>(x.get<T>());             \
        if (rhs != 0) rval.set(static_cast<float64>(1 / rhs));      \
        return rval;                                                \
    }

#define BUCKET_10(T)                                                \
    t_tscalar bucket_10_##T(t_tscalar x) {                          \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 10)) * 10);           \
        return rval;                                                \
    }

#define BUCKET_100(T)                                               \
    t_tscalar bucket_100_##T(t_tscalar x) {                         \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 100)) * 100);         \
        return rval;                                                \
    }

#define BUCKET_1000(T)                                              \
    t_tscalar bucket_1000_##T(t_tscalar x) {                        \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 1000)) * 1000);       \
        return rval;                                                \
    }

#define BUCKET_0_1(T)                                               \
    t_tscalar bucket_0_1_##T(t_tscalar x) {                         \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 0.1)) * 0.1);         \
        return rval;                                                \
    }

#define BUCKET_0_0_1(T)                                             \
    t_tscalar bucket_0_0_1_##T(t_tscalar x) {                       \
        t_tscalar rval = mknone();                                  \
        if (x.is_none() || !x.is_valid()) return rval;              \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 0.01)) * 0.01);       \
        return rval;                                                \
    }

#define BUCKET_0_0_0_1(T)                                               \
    t_tscalar bucket_0_0_0_1_##T(t_tscalar x) {                         \
        t_tscalar rval = mknone();                                      \
        if (x.is_none() || !x.is_valid()) return rval;                  \
        T val = x.get<T>();                                             \
        rval.set(static_cast<float64>(                                  \
            floor(static_cast<float64>(val) / 0.001)) * 0.001);         \
        return rval;                                                    \
    }

NUMERIC_FUNCTION_1(POW2);
NUMERIC_FUNCTION_1(INVERT);
NUMERIC_FUNCTION_1(BUCKET_10);
NUMERIC_FUNCTION_1(BUCKET_100);
NUMERIC_FUNCTION_1(BUCKET_1000);
NUMERIC_FUNCTION_1(BUCKET_0_1);
NUMERIC_FUNCTION_1(BUCKET_0_0_1);
NUMERIC_FUNCTION_1(BUCKET_0_0_0_1);
/**
 * @brief Generate all type permutations for a numeric function that takes two
 * parameters. Return value from numeric functions are always `double`.
 */
#define NUMERIC_FUNCTION_2(FUNC) \
    FUNC(uint8, uint8)         \
    FUNC(uint8, uint16)        \
    FUNC(uint8, uint32)        \
    FUNC(uint8, uint64)        \
    FUNC(uint8, int8)          \
    FUNC(uint8, int16)         \
    FUNC(uint8, int32)         \
    FUNC(uint8, int64)         \
    FUNC(uint8, float32)       \
    FUNC(uint8, float64)       \
    FUNC(uint16, uint8)        \
    FUNC(uint16, uint16)       \
    FUNC(uint16, uint32)       \
    FUNC(uint16, uint64)       \
    FUNC(uint16, int8)         \
    FUNC(uint16, int16)        \
    FUNC(uint16, int32)        \
    FUNC(uint16, int64)        \
    FUNC(uint16, float32)      \
    FUNC(uint16, float64)      \
    FUNC(uint32, uint8)        \
    FUNC(uint32, uint16)       \
    FUNC(uint32, uint32)       \
    FUNC(uint32, uint64)       \
    FUNC(uint32, int8)         \
    FUNC(uint32, int16)        \
    FUNC(uint32, int32)        \
    FUNC(uint32, int64)        \
    FUNC(uint32, float32)      \
    FUNC(uint32, float64)      \
    FUNC(uint64, uint8)        \
    FUNC(uint64, uint16)       \
    FUNC(uint64, uint32)       \
    FUNC(uint64, uint64)       \
    FUNC(uint64, int8)         \
    FUNC(uint64, int16)        \
    FUNC(uint64, int32)        \
    FUNC(uint64, int64)        \
    FUNC(uint64, float32)      \
    FUNC(uint64, float64)      \
    FUNC(int8, uint8)          \
    FUNC(int8, uint16)         \
    FUNC(int8, uint32)         \
    FUNC(int8, uint64)         \
    FUNC(int8, int8)           \
    FUNC(int8, int16)          \
    FUNC(int8, int32)          \
    FUNC(int8, int64)          \
    FUNC(int8, float32)        \
    FUNC(int8, float64)        \
    FUNC(int16, uint8)         \
    FUNC(int16, uint16)        \
    FUNC(int16, uint32)        \
    FUNC(int16, uint64)        \
    FUNC(int16, int8)          \
    FUNC(int16, int16)         \
    FUNC(int16, int32)         \
    FUNC(int16, int64)         \
    FUNC(int16, float32)       \
    FUNC(int16, float64)       \
    FUNC(int32, uint8)         \
    FUNC(int32, uint16)        \
    FUNC(int32, uint32)        \
    FUNC(int32, uint64)        \
    FUNC(int32, int8)          \
    FUNC(int32, int16)         \
    FUNC(int32, int32)         \
    FUNC(int32, int64)         \
    FUNC(int32, float32)       \
    FUNC(int32, float64)       \
    FUNC(int64, uint8)         \
    FUNC(int64, uint16)        \
    FUNC(int64, uint32)        \
    FUNC(int64, uint64)        \
    FUNC(int64, int8)          \
    FUNC(int64, int16)         \
    FUNC(int64, int32)         \
    FUNC(int64, int64)         \
    FUNC(int64, float32)       \
    FUNC(int64, float64)       \
    FUNC(float32, uint8)       \
    FUNC(float32, uint16)      \
    FUNC(float32, uint32)      \
    FUNC(float32, uint64)      \
    FUNC(float32, int8)        \
    FUNC(float32, int16)       \
    FUNC(float32, int32)       \
    FUNC(float32, int64)       \
    FUNC(float32, float32)     \
    FUNC(float32, float64)     \
    FUNC(float64, uint8)       \
    FUNC(float64, uint16)      \
    FUNC(float64, uint32)      \
    FUNC(float64, uint64)      \
    FUNC(float64, int8)        \
    FUNC(float64, int16)       \
    FUNC(float64, int32)       \
    FUNC(float64, int64)       \
    FUNC(float64, float32)     \
    FUNC(float64, float64)     \

#define ADD(T1, T2)                                                 \
    t_tscalar add_##T1##_##T2(t_tscalar x, t_tscalar y) {           \
        t_tscalar rval = mknone();                                  \
        if ((x.is_none() || !x.is_valid())                          \
            || (y.is_none() || !y.is_valid())) return rval;         \
        rval.set(static_cast<float64>(x.get<T1>() + y.get<T2>()));  \
        return rval;                                                \
    }

#define SUBTRACT(T1, T2)                                                 \
    t_tscalar subtract_##T1##_##T2(t_tscalar x, t_tscalar y) {           \
        t_tscalar rval = mknone();                                       \
        if ((x.is_none() || !x.is_valid())                               \
            || (y.is_none() || !y.is_valid())) return rval;              \
        rval.set(static_cast<float64>(x.get<T1>() - y.get<T2>()));       \
        return rval;                                                     \
    }

#define MULTIPLY(T1, T2)                                                \
    t_tscalar multiply_##T1##_##T2(t_tscalar x, t_tscalar y) {          \
        t_tscalar rval = mknone();                                      \
        if ((x.is_none() || !x.is_valid())                              \
            || (y.is_none() || !y.is_valid())) return rval;             \
        rval.set(static_cast<float64>(x.get<T1>() * y.get<T2>()));      \
        return rval;                                                    \
    }

#define DIVIDE(T1, T2)                                                         \
    t_tscalar divide_##T1##_##T2(t_tscalar x, t_tscalar y) {                   \
        t_tscalar rval = mknone();                                             \
        if ((x.is_none() || !x.is_valid())                                     \
            || (y.is_none() || !y.is_valid())) return rval;                    \
        float64 lhs = static_cast<float64>(x.get<T1>());                       \
        float64 rhs = static_cast<float64>(y.get<T2>());                       \
        if (rhs != 0) rval.set(static_cast<float64>(lhs / rhs));               \
        return rval;                                                           \
    }

#define PERCENT_OF(T1, T2)                                                     \
    t_tscalar percent_of_##T1##_##T2(t_tscalar x, t_tscalar y) {               \
        t_tscalar rval = mknone();                                             \
        if ((x.is_none() || !x.is_valid())                                     \
            || (y.is_none() || !y.is_valid())) return rval;                    \
        float64 lhs = static_cast<float64>(x.get<T1>());                       \
        float64 rhs = static_cast<float64>(y.get<T2>());                       \
        if (rhs != 0) rval.set(static_cast<float64>(lhs / rhs) * 100);         \
        return rval;                                                           \
    }

#define POW(T1, T2)                                                            \
    t_tscalar pow_##T1##_##T2(t_tscalar x, t_tscalar y) {                      \
        t_tscalar rval = mknone();                                             \
        if ((x.is_none() || !x.is_valid())                                     \
            || (y.is_none() || !y.is_valid())) return rval;                    \
        float64 lhs = static_cast<float64>(x.get<T1>());                       \
        float64 rhs = static_cast<float64>(y.get<T2>());                       \
        if (rhs != 0) rval.set(static_cast<float64>(std::pow(lhs, rhs)));      \
        return rval;                                                           \
    }

#define EQUALS(T1, T2)                                                  \
    t_tscalar equals_##T1##_##T2(t_tscalar x, t_tscalar y) {            \
        t_tscalar rval;                                                 \
        rval.set(false);                                                \
        if ((x.is_none() || !x.is_valid())                              \
            && (y.is_none() || !y.is_valid())) {                        \
            rval.set(true);                                             \
            return rval;                                                \
        } else if ((x.is_none() || !x.is_valid())                       \
            || (y.is_none() || !y.is_valid())) {                        \
            rval.set(false);                                            \
            return rval;                                                \
        }                                                               \
        rval.set(static_cast<bool>(x.get<T1>() == y.get<T2>()));        \
        return rval;                                                    \
    }

#define NOT_EQUALS(T1, T2)                                              \
    t_tscalar not_equals_##T1##_##T2(t_tscalar x, t_tscalar y) {        \
        t_tscalar rval;                                                 \
        rval.set(false);                                                \
        if ((x.is_none() || !x.is_valid())                              \
            || (y.is_none() || !y.is_valid())) return rval;             \
        rval.set(static_cast<bool>(x.get<T1>() != y.get<T2>()));        \
        return rval;                                                    \
    }

#define GREATER_THAN(T1, T2)                                            \
    t_tscalar greater_than_##T1##_##T2(t_tscalar x, t_tscalar y) {      \
        t_tscalar rval;                                                 \
        rval.set(false);                                                \
        if ((x.is_none() || !x.is_valid())                              \
            || (y.is_none() || !y.is_valid())) return rval;             \
        rval.set(static_cast<bool>(x.get<T1>() > y.get<T2>()));         \
        return rval;                                                    \
    }

#define LESS_THAN(T1, T2)                                               \
    t_tscalar less_than_##T1##_##T2(t_tscalar x, t_tscalar y) {         \
        t_tscalar rval;                                                 \
        rval.set(false);                                                \
        if ((x.is_none() || !x.is_valid())                              \
            || (y.is_none() || !y.is_valid())) return rval;             \
        rval.set(static_cast<bool>(x.get<T1>() < y.get<T2>()));         \
        return rval;                                                    \
    }

NUMERIC_FUNCTION_2(ADD);
NUMERIC_FUNCTION_2(SUBTRACT);
NUMERIC_FUNCTION_2(MULTIPLY);
NUMERIC_FUNCTION_2(DIVIDE);
NUMERIC_FUNCTION_2(POW);
NUMERIC_FUNCTION_2(PERCENT_OF);
NUMERIC_FUNCTION_2(EQUALS);
NUMERIC_FUNCTION_2(NOT_EQUALS);
NUMERIC_FUNCTION_2(GREATER_THAN);
NUMERIC_FUNCTION_2(LESS_THAN);

/**
 * @brief Generate dispatch functions that call the correct computation method
 * with typings.
 */
#define NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE, T1)                             \
    template <>                                                                \
    t_tscalar OP<DTYPE>(t_tscalar x, t_tscalar y) {                            \
        switch (y.get_dtype()) {                                               \
            case DTYPE_UINT8: return OP##_##T1##_uint8(x, y);                  \
            case DTYPE_UINT16: return OP##_##T1##_uint16(x, y);                \
            case DTYPE_UINT32: return OP##_##T1##_uint32(x, y);                \
            case DTYPE_UINT64: return OP##_##T1##_uint64(x, y);                \
            case DTYPE_INT8: return OP##_##T1##_int8(x, y);                    \
            case DTYPE_INT16: return OP##_##T1##_int16(x, y);                  \
            case DTYPE_INT32: return OP##_##T1##_int32(x, y);                  \
            case DTYPE_INT64: return OP##_##T1##_int64(x, y);                  \
            case DTYPE_FLOAT32: return OP##_##T1##_float32(x, y);              \
            case DTYPE_FLOAT64: return OP##_##T1##_float64(x, y);              \
            default: break;                                                    \
        }                                                                      \
        return mknone();                                                       \
    }

/**
 * @brief Given a single function token, generate the function for each t_dtype
 * and matching type.
 */
#define NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(OP)                           \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_UINT8, uint8);                    \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_UINT16, uint16);                  \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_UINT32, uint32);                  \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_UINT64, uint64);                  \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_INT8, int8);                      \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_INT16, int16);                    \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_INT32, int32);                    \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_INT64, int64);                    \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_FLOAT32, float32);                \
    NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE_FLOAT64, float64);                \

NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(add);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(subtract);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(multiply);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(divide);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(pow);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(percent_of);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(equals);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(not_equals);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(greater_than);
NUMERIC_FUNCTION_2_DISPATCH_ALL_TYPES(less_than);

// String functions
t_tscalar length(t_tscalar x) {
    t_tscalar rval = mknone();

    if (x.is_none() || !x.is_valid() || x.get_dtype() != DTYPE_STR) {
        return rval;
    }

    std::string val = x.to_string();
    rval.set(static_cast<std::int64_t>(val.size()));
    return rval;
}

t_tscalar is(t_tscalar x, t_tscalar y) {
    t_tscalar rval;
    rval.set(false);

    if ((x.is_none() || !x.is_valid() || x.get_dtype() != DTYPE_STR)
        || (y.is_none() || !y.is_valid() || y.get_dtype() != DTYPE_STR)) {
        return rval;
    }

    bool eq = strcmp(x.get_char_ptr(), y.get_char_ptr()) == 0;
    rval.set(eq);
    return rval;
}

void uppercase(t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if (x.is_none() || !x.is_valid() || x.get_dtype() != DTYPE_STR) {
        output_column->clear(idx);
        return;
    }

    std::string val = x.to_string();
    boost::to_upper(val);
    output_column->set_nth(idx, val);
}

void lowercase(t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if (x.is_none() || !x.is_valid() || x.get_dtype() != DTYPE_STR) {
        output_column->clear(idx);
        return;
    }

    std::string val = x.to_string();
    boost::to_lower(val);
    output_column->set_nth(idx, val);
}

void concat_space(t_tscalar x, t_tscalar y, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if ((x.is_none() || !x.is_valid() || x.get_dtype() != DTYPE_STR)
        || (y.is_none() || !y.is_valid() || y.get_dtype() != DTYPE_STR)) {
        output_column->clear(idx);
        return;
    }
    std::string val = x.to_string() + " " + y.to_string();
    output_column->set_nth(idx, val);
}

void concat_comma(t_tscalar x, t_tscalar y, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if ((x.is_none() || !x.is_valid() || x.get_dtype() != DTYPE_STR)
        || (y.is_none() || !y.is_valid() || y.get_dtype() != DTYPE_STR)) {
        output_column->clear(idx);
        return;
    }

    std::string val = x.to_string() + ", " + y.to_string();
    output_column->set_nth(idx, val);
}

// Date/Datetime functions
template<>
t_tscalar hour_of_day<DTYPE_DATE>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;
    // Hour of day for a date is always midnight, i.e. 0
    rval.set(static_cast<std::int64_t>(0));
    return rval;
}

template<>
t_tscalar hour_of_day<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds timestamp(x.to_int64());

    // Convert the timestamp to a `sys_time` (alias for `time_point`)
    date::sys_time<std::chrono::milliseconds> ts(timestamp);

    // Use localtime so that the hour of day is consistent with all output
    // datetimes, which are in local time
    std::time_t temp = std::chrono::system_clock::to_time_t(ts);
    std::tm* t = std::localtime(&temp);

    // Get the hour from the resulting `std::tm`
    rval.set(static_cast<std::int64_t>(t->tm_hour));
    return rval;
}

template<>
t_tscalar second_bucket<DTYPE_DATE>(t_tscalar x) {
    if (x.is_none() || !x.is_valid()) return mknone();
    return x;
}

template<>
t_tscalar second_bucket<DTYPE_TIME>(t_tscalar x) {
    // Retrieve the timestamp as an integer and bucket it
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;
    auto int_ts = x.to_int64();
    std::int64_t bucketed_ts = floor(static_cast<double>(int_ts) / 1000) * 1000;
    rval.set(t_time(bucketed_ts));
    return rval;
}

template<>
t_tscalar minute_bucket<DTYPE_DATE>(t_tscalar x) {
    if (x.is_none() || !x.is_valid()) return mknone();
    return x;
}

template<>
t_tscalar minute_bucket<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds ms_timestamp(x.to_int64());

    // Convert milliseconds to minutes
    std::chrono::minutes m_timestamp = std::chrono::duration_cast<std::chrono::minutes>(ms_timestamp);

    // Set a new `t_time` and return it.
    rval.set(
        t_time(std::chrono::duration_cast<std::chrono::milliseconds>(m_timestamp).count()));
    return rval;
}

template<>
t_tscalar hour_bucket<DTYPE_DATE>(t_tscalar x) {
    if (x.is_none() || !x.is_valid()) return mknone();
    return x;
}

template<>
t_tscalar hour_bucket<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a millisecond duration timestamp
    std::chrono::milliseconds ms_timestamp(x.to_int64());

    // Convert the milliseconds to hours
    std::chrono::hours hr_timestamp = std::chrono::duration_cast<std::chrono::hours>(ms_timestamp);

    // Set a new `t_time` and return it.
    rval.set(
        t_time(std::chrono::duration_cast<std::chrono::milliseconds>(hr_timestamp).count()));
    return rval;
}

template<>
t_tscalar day_bucket<DTYPE_DATE>(t_tscalar x) {
    if (x.is_none() || !x.is_valid()) return mknone();
    return x;
}

template<>
t_tscalar day_bucket<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds ms_timestamp(x.to_int64());

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
    return rval;
}

template<>
t_tscalar week_bucket<DTYPE_DATE>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Retrieve the `t_date` struct from the scalar
    t_date val = x.get<t_date>();

    // Construct a `date::year_month_day` value
    date::year year {val.year()};

    // date::month is [1-12], whereas `t_date.month()` is [0-11]
    date::month month {static_cast<std::uint32_t>(val.month()) + 1};
    date::day day {static_cast<std::uint32_t>(val.day())};
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
    return rval;
}

template<>
t_tscalar week_bucket<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds timestamp(x.to_int64());

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
    return rval;
}

template<>
t_tscalar month_bucket<DTYPE_DATE>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;
    t_date val = x.get<t_date>();
    rval.set(t_date(val.year(), val.month(), 1));
    return rval;
}

template<>
t_tscalar month_bucket<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds ms_timestamp(x.to_int64());

    // Convert the timestamp to a `sys_time` (alias for `time_point`)
    date::sys_time<std::chrono::milliseconds> ts(ms_timestamp);

    // Convert the timestamp to local time
    std::time_t temp = std::chrono::system_clock::to_time_t(ts);
    std::tm* t = std::localtime(&temp);

    // Use the `tm` to create the `t_date`
    std::int32_t year = static_cast<std::int32_t>(t->tm_year + 1900);
    std::int32_t month = static_cast<std::uint32_t>(t->tm_mon);
    rval.set(t_date(year, month, 1));
    return rval;
}


template<>
t_tscalar year_bucket<DTYPE_DATE>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;
    t_date val = x.get<t_date>();
    rval.set(t_date(val.year(), 0, 1));
    return rval;
}

template<>
t_tscalar year_bucket<DTYPE_TIME>(t_tscalar x) {
    t_tscalar rval = mknone();
    if (x.is_none() || !x.is_valid()) return rval;

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds ms_timestamp(x.to_int64());

    // Convert the timestamp to a `sys_time` (alias for `time_point`)
    date::sys_time<std::chrono::milliseconds> ts(ms_timestamp);

    // Convert the timestamp to local time
    std::time_t temp = std::chrono::system_clock::to_time_t(ts);
    std::tm* t = std::localtime(&temp);

    // Use the `tm` to create the `t_date`
    std::int32_t year = static_cast<std::int32_t>(t->tm_year + 1900);
    rval.set(t_date(year, 0, 1));
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

template <>
void day_of_week<DTYPE_DATE>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if (x.is_none() || !x.is_valid()) {
        output_column->clear(idx);
        return;
    }

    // Retrieve the `t_date` struct from the scalar
    t_date val = x.get<t_date>();

    // Construct a `date::year_month_day` value
    date::year year {val.year()};

    // date::month is [1-12], whereas `t_date.month()` is [0-11]
    date::month month {static_cast<std::uint32_t>(val.month()) + 1};
    date::day day {static_cast<std::uint32_t>(val.day())};
    date::year_month_day ymd(year, month, day);

    // Construct a `date::year_month_weekday` from `date::sys_days` since epoch
    auto weekday = date::year_month_weekday(ymd).weekday_indexed().weekday();

    // Write the weekday string into the output column
    output_column->set_nth(
        idx, days_of_week[(weekday - date::Sunday).count()]);
}

template <>
void day_of_week<DTYPE_TIME>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if (x.is_none() || !x.is_valid()) {
        output_column->clear(idx);
        return;
    }

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds timestamp(x.to_int64());

    // Convert the timestamp to a `sys_time` (alias for `time_point`)
    date::sys_time<std::chrono::milliseconds> ts(timestamp);

    // Use localtime so that the hour of day is consistent with all output
    // datetimes, which are in local time
    std::time_t temp = std::chrono::system_clock::to_time_t(ts);
    std::tm* t = std::localtime(&temp);

    // Get the weekday from the resulting `std::tm`
    output_column->set_nth(
        idx, days_of_week[t->tm_wday]);
}

template <>
void month_of_year<DTYPE_DATE>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if (x.is_none() || !x.is_valid()) {
        output_column->clear(idx);
        return;
    }

    t_date val = x.get<t_date>();

    // `t_date.month()` is [0-11]
    std::int32_t month = val.month();
    std::string month_of_year = months_of_year[month];
    output_column->set_nth(idx, month_of_year);
}

template <>
void month_of_year<DTYPE_TIME>(
    t_tscalar x, std::int32_t idx, std::shared_ptr<t_column> output_column) {
    if (x.is_none() || !x.is_valid()) {
        output_column->clear(idx);
        return;
    }

    // Convert the int64 to a milliseconds duration timestamp
    std::chrono::milliseconds timestamp(x.to_int64());

    // Convert the timestamp to a `sys_time` (alias for `time_point`)
    date::sys_time<std::chrono::milliseconds> ts(timestamp);

    // Use localtime so that the hour of day is consistent with all output
    // datetimes, which are in local time
    std::time_t temp = std::chrono::system_clock::to_time_t(ts);
    std::tm* t = std::localtime(&temp);

    // Get the month from the resulting `std::tm`
    auto month = t->tm_mon;

    // Get the month string and write into the output column
    output_column->set_nth(idx, months_of_year[month]);
}

} // end namespace computed_function
} // end namespace perspective