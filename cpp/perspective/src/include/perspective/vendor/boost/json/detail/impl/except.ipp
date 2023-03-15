//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_DETAIL_IMPL_EXCEPT_IPP
#define BOOST_JSON_DETAIL_IMPL_EXCEPT_IPP

#include <boost/json/detail/except.hpp>
#include <boost/version.hpp>
#include <boost/throw_exception.hpp>
#include <stdexcept>

BOOST_JSON_NS_BEGIN

namespace detail {

void
throw_bad_alloc(
    source_location const& loc)
{
    throw_exception(
        std::bad_alloc(),
        loc);
}

void
throw_length_error(
    char const* what,
    source_location const& loc)
{
    throw_exception(
        std::length_error(what),
        loc);
}

void
throw_invalid_argument(
    char const* what,
    source_location const& loc)
{
    throw_exception(
        std::invalid_argument(what),
        loc);
}

void
throw_out_of_range(
    source_location const& loc)
{
    throw_exception(
        std::out_of_range(
            "out of range"),
        loc);
}

void
throw_system_error(
    error_code const& ec,
    source_location const& loc)
{
    throw_exception(
        system_error(ec),
        loc);
}

} // detail
BOOST_JSON_NS_END

#endif
