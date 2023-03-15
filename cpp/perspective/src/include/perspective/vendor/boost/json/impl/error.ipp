//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_IMPL_ERROR_IPP
#define BOOST_JSON_IMPL_ERROR_IPP

#include <boost/json/error.hpp>

BOOST_JSON_NS_BEGIN

error_code
make_error_code(error e)
{
    struct codes : error_category
    {
        const char*
        name() const noexcept override
        {
            return "boost.json";
        }

        std::string
        message(int ev) const override
        {
            switch(static_cast<error>(ev))
            {
            default:
case error::syntax: return "syntax error";
case error::extra_data: return "extra data";
case error::incomplete: return "incomplete JSON";
case error::exponent_overflow: return "exponent overflow";
case error::too_deep: return "too deep";
case error::illegal_leading_surrogate: return "illegal leading surrogate";
case error::illegal_trailing_surrogate: return "illegal trailing surrogate";
case error::expected_hex_digit: return "expected hex digit";
case error::expected_utf16_escape: return "expected utf16 escape";
case error::object_too_large: return "object too large";
case error::array_too_large: return "array too large";
case error::key_too_large: return "key too large";
case error::string_too_large: return "string too large";
case error::input_error: return "input error";

case error::exception: return "got exception";
case error::test_failure: return "test failure";

case error::missing_slash: return "missing slash character";
case error::invalid_escape: return "invalid escape sequence";
case error::token_not_number: return "token is not a number";
case error::value_is_scalar: return "current value is scalar";
case error::not_found: return "no referenced value";
case error::token_overflow: return "token overflow";
case error::past_the_end: return "past-the-end token not supported";

case error::not_number: return "not a number";
case error::not_exact: return "not exact";
case error::not_null: return "value is not null";
case error::not_bool: return "value is not boolean";
case error::not_array: return "value is not an array";
case error::not_object: return "value is not an object";
case error::not_string: return "value is not a string";
case error::size_mismatch: return "array size does not match target size";
case error::exhausted_variants: return "exhausted all variants";
case error::unknown_name: return "unknown name";
            }
        }

        error_condition
        default_error_condition(
            int ev) const noexcept override
        {
            switch(static_cast<error>(ev))
            {
            default:
                return {ev, *this};

case error::syntax:
case error::extra_data:
case error::incomplete:
case error::exponent_overflow:
case error::too_deep:
case error::illegal_leading_surrogate:
case error::illegal_trailing_surrogate:
case error::expected_hex_digit:
case error::expected_utf16_escape:
case error::object_too_large:
case error::array_too_large:
case error::key_too_large:
case error::string_too_large:
case error::input_error:
    return condition::parse_error;

case error::missing_slash:
case error::invalid_escape:
    return condition::pointer_parse_error;

case error::token_not_number:
case error::value_is_scalar:
case error::not_found:
case error::token_overflow:
case error::past_the_end:
    return condition::pointer_use_error;

case error::not_number:
case error::not_exact:
case error::not_null:
case error::not_bool:
case error::not_array:
case error::not_object:
case error::not_string:
case error::size_mismatch:
case error::exhausted_variants:
case error::unknown_name:
    return condition::conversion_error;

case error::exception:
    return condition::generic_error;
            }
        }
    };
    // on some versions of msvc-14.2 the category is put in RO memory
    // erroneusly, if the category object is const,
    // and that may result in crash
    static codes cat{};
    return error_code{static_cast<
        std::underlying_type<error>::type>(e), cat};
}

error_condition
make_error_condition(condition c)
{
    struct codes : error_category
    {
        const char*
        name() const noexcept override
        {
            return "boost.json";
        }

        std::string
        message(int cv) const override
        {
            switch(static_cast<condition>(cv))
            {
            default:
            case condition::parse_error:
                return "A JSON parse error occurred";
            case condition::pointer_parse_error:
                return "A JSON Pointer parse error occurred";
            case condition::pointer_use_error:
                return "An error occurred when JSON Pointer was used with"
                    " a value";
            case condition::conversion_error:
                return "An error occurred during conversion";
            }
        }
    };
    // on some versions of msvc-14.2 the category is put in RO memory
    // erroneusly, if the category object is const,
    // and that may result in crash
    static codes cat{};
    return error_condition{static_cast<
        std::underlying_type<condition>::type>(c), cat};
}

BOOST_JSON_NS_END

#endif
