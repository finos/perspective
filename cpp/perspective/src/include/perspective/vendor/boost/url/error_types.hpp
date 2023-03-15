//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_ERROR_TYPES_HPP
#define BOOST_URL_ERROR_TYPES_HPP

#include <boost/url/detail/config.hpp>
#include <boost/system/error_code.hpp>
#include <boost/system/system_error.hpp>
#include <boost/system/result.hpp>

namespace boost {
namespace urls {

#ifndef BOOST_URL_DOCS
namespace error_types {
#endif

/// The type of error category used by the library
using error_category = boost::system::error_category;

/// The type of error code used by the library
using error_code = boost::system::error_code;

/// The type of error condition used by the library
using error_condition = boost::system::error_condition;

/// The type of system error thrown by the library
using system_error = boost::system::system_error;

/// A function to return the generic error category used by the library
#ifdef BOOST_URL_DOCS
error_category const& generic_category();
#else
using boost::system::generic_category;
#endif

/// A function to return the system error category used by the library
#if BOOST_URL_DOCS
error_category const& system_category();
#else
using boost::system::system_category;
#endif

/// The set of constants used for cross-platform error codes
#if BOOST_URL_DOCS
enum errc
{
    __see_below__
};
#else
namespace errc = boost::system::errc;
#endif

/** The type of result returned by library functions

    This is an alias template used as the return type
    for functions that can either return a container,
    or fail with an error code. This is a brief
    synopsis of the type:

    @par Declaration
    @code
    template< class T >
    class result
    {
    public:
        //
        // Return true if the result contains an error
        //
        constexpr bool has_error() const noexcept;

        //
        // Return the error
        //
        constexpr error_code error() const noexcept;

        //
        // Return true if the result contains a value
        //
        constexpr bool has_value() const noexcept;
        constexpr explicit operator bool() const noexcept;

        //
        // Return the value, or throw an exception
        //
        constexpr T& value();
        constexpr T const& value() const;

        // Return the value.
        // Precondition: has_value()==true
        //
        constexpr T& operator*() noexcept;
        constexpr T* operator->() noexcept;
        constexpr T const& operator*() const noexcept;
        constexpr T const* operator->() const noexcept;

        ...more
    @endcode

    @par Usage
    Given the function @ref parse_uri with this signature:
    @code
    result< url_view > parse_uri( string_view s ) noexcept;
    @endcode

    The following statement captures the value in a
    variable upon success, otherwise throws:
    @code
    url_view u = parse_uri( "http://example.com/path/to/file.txt" ).value();
    @endcode

    This statement captures the result in a local
    variable and inspects the error condition:
    @code
    result< url_view > rv = parse_uri( "http://example.com/path/to/file.txt" );

    if(! rv )
        std::cout << r.error();
    else
        std::cout << *rv;
    @endcode

    @tparam T The type of value held by the result.

    @see
        @li <a href="https://boost.org/libs/system/doc/html/system.html#ref_resultt_e"
            >`boost::system::result`</a>

*/
template<class T>
using result = boost::system::result<T, error_code>;

#ifndef BOOST_URL_DOCS
} // error_types

using namespace error_types;
#endif

} // urls
} // boost

#endif
