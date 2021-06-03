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
    }

intern::~intern() {}

t_tscalar intern::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    std::string temp_str;

    t_generic_type& gt = parameters[0];

    // intern('abc') - with a scalar string
    t_string_view temp_string(gt);
    temp_str = std::string(temp_string.begin(), temp_string.end()).c_str();

    // Don't allow empty strings
    if (temp_str == "") return rval;

    // If the vocab is a nullptr, we are in type checking mode - TODO might be
    // better to make this explicit so that we never fall into an invalid mode
    // or try to deref a nullptr, maybe with an enum or something.
    if (m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    // Intern the string into the vocabulary, and return the index of the
    // string inside the vocabulary.
    t_uindex interned = m_expression_vocab->get_interned(temp_str);

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
    }

concat::~concat() {}

t_tscalar concat::operator()(t_parameter_list parameters) {
    std::string result;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    if (parameters.size() == 0) return rval;
    
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
            return rval;
        }
    }

    // don't try to intern an empty string as it will throw an error, but
    // by this point we know the params are valid - so return the sentinel
    // string value.
    if (result == "" || m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    t_uindex interned = m_expression_vocab->get_interned(result);
    rval.set(m_expression_vocab->unintern_c(interned));

    return rval;
}

upper::upper(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;
    }

upper::~upper() {}

t_tscalar upper::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;
    std::string temp_str;

    if (parameters.size() != 1) {
        return rval;
    }

    t_generic_type& gt = parameters[0];
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
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;
    }

lower::~lower() {}

t_tscalar lower::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;
    std::string temp_str;

    if (parameters.size() != 1) {
        return rval;
    }

    t_generic_type& gt = parameters[0];
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
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_FLOAT64;
        m_sentinel = sentinel;
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
        return rval;
    }

    t_generic_type& gt = parameters[0];
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
        return rval;
    }

    // generate the map if not generated
    if (m_order_map.size() == 0) {
        for (auto i = 0; i < parameters.size(); ++i) {
            // Because all strings are interned, there should be no string
            // literals passed to any functions.
            t_generic_type& gt = parameters[i];
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
    : exprtk::igeneric_function<t_tscalar>("T") {}

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

    t_generic_type& gt = parameters[0];
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
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;
    }

day_of_week::~day_of_week() {}

t_tscalar day_of_week::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    t_generic_type& gt = parameters[0];
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
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;
    }

month_of_year::~month_of_year() {}

t_tscalar month_of_year::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;

    t_generic_type& gt = parameters[0];
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
bucket::UNIT_MAP = {
    {"s", t_date_bucket_unit::SECONDS},
    {"m", t_date_bucket_unit::MINUTES},
    {"h", t_date_bucket_unit::HOURS},
    {"D", t_date_bucket_unit::DAYS},
    {"W", t_date_bucket_unit::WEEKS},
    {"M", t_date_bucket_unit::MONTHS},
    {"Y", t_date_bucket_unit::YEARS}
};


bucket::bucket()
    : exprtk::igeneric_function<t_tscalar>("T?") {}

bucket::~bucket() {}

t_tscalar bucket::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar unit;
    t_tscalar rval;
    rval.clear();

    // Parameters are already validated in the constructor by Exprtk
    t_generic_type& gt_val = parameters[0]; // always a scalar
    t_generic_type& gt_unit = parameters[1]; // scalar or string

    // Convert value to scalar
    t_scalar_view temp_val(gt_val);
    val.set(temp_val());

    if (val.is_numeric()) {
        rval.m_type = DTYPE_FLOAT64;

        // Bucket by numeric value
        t_scalar_view temp_unit(gt_unit);
        unit.set(temp_unit());
        
        // type-check
        if (!unit.is_numeric() || val.m_status == STATUS_CLEAR || unit.m_status == STATUS_CLEAR) {
            rval.m_status = STATUS_CLEAR;
            return rval;
        }

        if (!val.is_valid() || !unit.is_valid()) {
            return rval;
        }

        rval.set(floor(val.to_double() / unit.to_double()) * unit.to_double());

        return rval;
    }

    // Must be a datetime - second parameter is a string
    t_string_view temp_string(gt_unit);
    std::string unit_str = std::string(temp_string.begin(), temp_string.end());

    if (bucket::UNIT_MAP.count(unit_str) == 0) {
        std::cerr << "[bucket] unknown unit in bucket - the valid units are 's', 'm', 'h', 'D', 'W', 'M', and 'Y'." << std::endl;
        rval.m_type = DTYPE_TIME;
        rval.m_status = STATUS_CLEAR;
        return rval;
    }

    t_date_bucket_unit date_bucket_unit = bucket::UNIT_MAP[unit_str];
    t_dtype val_dtype = val.get_dtype();

    // type-check
    if (!(val_dtype == DTYPE_DATE || val_dtype == DTYPE_TIME)) {
        rval.m_status = STATUS_CLEAR;
    }

    // Depending on unit, datetime columns can result in a date column or a 
    // datetime column.
    if (val_dtype == DTYPE_TIME) {
        switch (date_bucket_unit) {
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
                PSP_COMPLAIN_AND_ABORT("[bucket] invalid date bucket unit!");
            } break;
        }
    } else {
        // but date columns will always output date columns
        rval.m_type = DTYPE_DATE;
    }

    if (!val.is_valid()) {
        return rval;
    }

    switch (date_bucket_unit) {
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
            PSP_COMPLAIN_AND_ABORT("[bucket] invalid date bucket unit!");
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

min_fn::min_fn() {}

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
            return rval;
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

max_fn::max_fn() {}

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
            return rval;
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
    : exprtk::igeneric_function<t_tscalar>("TT") {}

percent_of::~percent_of() {}

t_tscalar percent_of::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();

    // Return a float so we can use it in conditionals
    rval.m_type = DTYPE_FLOAT64;

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
    : exprtk::igeneric_function<t_tscalar>("T"){}

is_null::~is_null() {}

t_tscalar is_null::operator()(t_parameter_list parameters) {
    t_tscalar val;

    t_tscalar rval;
    rval.clear();

    // Return a float so we can use it in conditionals
    rval.m_type = DTYPE_FLOAT64;

    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    val.set(temp());

    // Return a double so we can use it in conditionals
    rval.set(static_cast<double>(val.is_none() || !val.is_valid()));

    return rval;
}

is_not_null::is_not_null()
    : exprtk::igeneric_function<t_tscalar>("T") {}

is_not_null::~is_not_null() {}

t_tscalar is_not_null::operator()(t_parameter_list parameters) {
    t_tscalar val;

    t_tscalar rval;
    rval.clear();

    // Return a float so we can use it in conditionals
    rval.m_type = DTYPE_FLOAT64;

    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    val.set(temp());

    rval.set(static_cast<double>(!val.is_none() && val.is_valid()));

    return rval;
}

to_string::to_string(std::shared_ptr<t_vocab> expression_vocab)
    : exprtk::igeneric_function<t_tscalar>("T")
    , m_expression_vocab(expression_vocab)  {
        t_tscalar sentinel;
        sentinel.clear();

        // The sentinel is a string scalar that is returned to indicate a
        // valid call to the function without actually computing any values.
        sentinel.m_type = DTYPE_STR;
        sentinel.m_data.m_charptr = nullptr;
        m_sentinel = sentinel;
    }

to_string::~to_string() {}

t_tscalar to_string::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_STR;
    std::string temp_str;

    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    val.set(temp());

    if (!val.is_valid()) {
        return rval;
    }

    temp_str = val.to_string();

    // don't try to intern an empty string as it will throw an error, but
    // by this point we know the params are valid - so return the sentinel
    // string value.
    if (temp_str == "" || m_expression_vocab == nullptr) {
        return m_sentinel;
    }

    t_uindex interned = m_expression_vocab->get_interned(temp_str);
    rval.set(m_expression_vocab->unintern_c(interned));
    return rval;
}

to_integer::to_integer()
    : exprtk::igeneric_function<t_tscalar>("T") {}

to_integer::~to_integer() {}

t_tscalar to_integer::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();

    // Use 32-bit integers for WASM
#ifdef PSP_ENABLE_WASM
    rval.m_type = DTYPE_INT32;
#else
    rval.m_type = DTYPE_INT64;
#endif

    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    val.set(temp());

    if (!val.is_valid()) {
        return rval;
    }

    double number = 0;

    // Parse numbers inside strings
    if (val.get_dtype() == DTYPE_STR) {
        std::stringstream ss(val.to_string());
        ss >> number;

        if (ss.fail()) return rval;
    } else {
        number = val.to_double();
    }

#ifdef PSP_ENABLE_WASM
    // check for overflow
    if (number > std::numeric_limits<std::int32_t>::max() || number < std::numeric_limits<std::int32_t>::min()) {
        return rval;
    }

    rval.set(static_cast<std::int32_t>(number));
#else
    rval.set(static_cast<std::int64_t>(number));
#endif

    return rval;
}

to_float::to_float()
    : exprtk::igeneric_function<t_tscalar>("T") {}

to_float::~to_float() {}

t_tscalar to_float::operator()(t_parameter_list parameters) {
    t_tscalar val;
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_FLOAT64;

    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    val.set(temp());

    if (!val.is_valid()) {
        return rval;
    }

    double number = 0;

    // Parse numbers inside strings
    if (val.get_dtype() == DTYPE_STR) {
        std::stringstream ss(val.to_string());
        ss >> number;

        if (ss.fail()) return rval;
    } else {
        number = val.to_double();
    }

    // Don't allow NaN to leak
    if (std::isnan(number)) {
        return rval;
    }

    rval.set(number);
    return rval;
}

make_date::make_date()
    : exprtk::igeneric_function<t_tscalar>("TTT") {}

make_date::~make_date() {}

t_tscalar make_date::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_DATE;

    // 0 = year, 1 = month, 2 = day
    std::int32_t values[3] {0};

    for (auto i = 0; i < parameters.size(); ++i) {
        t_generic_type& gt = parameters[i];
        t_scalar_view temp(gt);
        t_tscalar temp_scalar;
        
        temp_scalar.set(temp());

        if (!temp_scalar.is_numeric()) {
            rval.m_status = STATUS_CLEAR;
            return rval;
        }

        if (!temp_scalar.is_valid()) {
            return rval;
        }

        std::int32_t value = temp_scalar.to_double();
        values[i] = value;
    }

    // Disallow negative values
    if (values[0] < 0 || values[1] <= 0 || values[1] > 12 || values[2] <= 0 || values[2] > 31) {
        return rval;
    }

    // month is 0-11 in t_date
    rval.set(t_date(values[0], values[1] - 1, values[2]));
    return rval;
}

make_datetime::make_datetime()
    : exprtk::igeneric_function<t_tscalar>("T") {}

make_datetime::~make_datetime() {}

t_tscalar make_datetime::operator()(t_parameter_list parameters) {
    t_tscalar rval;
    rval.clear();
    rval.m_type = DTYPE_TIME;

    t_generic_type& gt = parameters[0];
    t_scalar_view temp(gt);
    t_tscalar temp_scalar;
    
    temp_scalar.set(temp());
    t_dtype dtype = temp_scalar.get_dtype();

    if (dtype != DTYPE_INT64 && dtype != DTYPE_FLOAT64) {
        rval.m_status = STATUS_CLEAR;
        return rval;
    }

    if (!temp_scalar.is_valid()) {
        return rval;
    }
    
    std::int64_t timestamp = temp_scalar.to_double();
    rval.set(t_time(timestamp));
    return rval;
}


} // end namespace computed_function
} // end namespace perspective