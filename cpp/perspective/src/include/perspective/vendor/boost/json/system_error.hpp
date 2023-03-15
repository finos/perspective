//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Dmitry Arkhipov (grisumbras@yandex.ru)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_SYSTEM_ERROR_HPP
#define BOOST_JSON_SYSTEM_ERROR_HPP

#include <boost/json/detail/config.hpp>
#include <boost/json/fwd.hpp>
#include <boost/assert/source_location.hpp>
#include <boost/system/error_code.hpp>
#include <boost/system/result.hpp>
#include <boost/system/system_error.hpp>

BOOST_JSON_NS_BEGIN

/// The type of error code used by the library.
using error_code = boost::system::error_code;

/// The type of error category used by the library.
using error_category = boost::system::error_category;

/// The type of error condition used by the library.
using error_condition = boost::system::error_condition;

/// The type of system error thrown by the library.
using system_error = boost::system::system_error;

/** The type of result returned by library functions

    This is an alias template used as the return type for functions that can
    either return a value, or fail with an error code. This is a brief
    synopsis of the type:

    @par Declaration
    @code
    template< class T >
    class result
    {
    public:
        // Return true if the result contains an error
        constexpr bool has_error() const noexcept;

        // These two return true if the result contains a value
        constexpr bool has_value() const noexcept;
        constexpr explicit operator bool() const noexcept;

        // Return the value or throw an exception if has_value() == false
        constexpr T& value();
        constexpr T const& value() const;

        // Return the value, assuming the result contains it
        constexpr T& operator*();
        constexpr T const& operator*() const;

        // Return the error, which is default constructed if has_error() == false
        constexpr error_code error() const noexcept;
        ...more
    };
    @endcode

    @par Usage
    Given the function @ref try_value_to with this signature:

    @code
    template< class T>
    result< T > try_value_to( const value& jv );
    @endcode

    The following statement captures the value in a variable upon success,
    otherwise throws:
    @code
    int n = try_value_to<int>( jv ).value();
    @endcode

    This statement captures the result in a variable and inspects the error
    condition:
    @code
    result< int > r = try_value_to<int>( jv );
    if( r )
        std::cout << *r;
    else
        std::cout << r.error();
    @endcode

    @note For a full synopsis of the type, please see the corresponding
    documentation in Boost.System.

    @tparam T The type of value held by the result.
*/
template< class T >
using result = boost::system::result<T>;

/**
   Helper trait that returns @ref result

   The primary template is an incomplete type. The library provides a partial
   specialisation `result_for<T1, value>`, that has nested type alias `type`
   that aliases the type `result<T1>`.

   The purpose of this trait is to let users provide non-throwing conversions
   for their types without creating a physical dependency on Boost.Json. For
   example:

   @code
   namespace boost
   {
   namespace json
   {

   template<class T>
   struct value_to_tag;

   template<class T1, class T2>
   struct result_for;
   }
   }

   namespace mine
   {
       class my_class;
       ...
       template<class JsonValue>
       boost::json::result_for<my_class, JsonValue>
       tag_invoke(boost::json::try_value_to_tag<my_class>, const JsonValue& jv)
       { ... }
   }
   @endcode

    @see @ref try_value_to, @ref try_value_to_tag
*/
template <class T1, class T2>
struct result_for;

/** Create @ref result storing a portable error code

    This function constructs a `result<T>` that stores @ref error_code with
    `value()` equal to `e` and `category()` equal to
    `boost::system::generic_category()`. <br>

    The main use for this function is in implementation of functions returning
    @ref result, without including `boost/json/system_error.hpp` or even
    `<system_error>`. In particular, it may be useful for customizations of
    @ref try_value_to without creating a physical dependency on Boost.JSON.
    For example:

    @code
    #include <cerrno>
    #include <boost/assert/source_location.hpp>

    namespace boost
    {
    namespace json
    {

    class value;

    template<class T>
    struct try_value_to_tag;

    template<class T1, class T2>
    struct result_for;

    template <class T>
    typename result_for<T, value>::type
    result_from_errno(int e, boost::source_location const* loc) noexcept

    }
    }

    namespace mine
    {

    class my_class;
    ...
    template<class JsonValue>
    boost::json::result_for<my_class, JsonValue>
    tag_invoke(boost::json::try_value_to_tag<my_class>, const JsonValue& jv)
    {
        BOOST_STATIC_CONSTEXPR boost::source_location loc = BOOST_CURRENT_LOCATION;
        if( !jv.is_null() )
            return boost::json::result_from_errno<my_class>(EINVAL, &loc);
        return my_class();
    }

    }
    @endcode

    @par Exception Safety
    Does not throw exceptions.

    @tparam T The value type of returned `result`.

    @param e The error value.

    @param loc The error location.

    @returns @ref error_code with `value()` equal to `e` and `category()` equal
    to `boost::system::generic_category()`.

    @see @ref try_value_to_tag, @ref try_value_to, @ref result_for,
    <a href="https://www.boost.org/doc/libs/develop/libs/system/doc/html/system.html#ref_generic_category">
        `boost::system::generic_category`</a>,
    <a href="https://www.boost.org/doc/libs/master/libs/assert/doc/html/assert.html#source_location_support">
        `boost::source_location`</a>.
*/
template <class T>
typename result_for<T, value>::type
result_from_errno(int e, boost::source_location const* loc) noexcept
{
    error_code ec(e, system::generic_category(), loc);
    return {system::in_place_error, ec};
}

BOOST_JSON_NS_END

#endif
