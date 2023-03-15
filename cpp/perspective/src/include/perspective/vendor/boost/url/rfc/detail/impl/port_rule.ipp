//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_PORT_RULE_IPP
#define BOOST_URL_IMPL_PORT_RULE_IPP

#include <boost/url/rfc/detail/port_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/grammar/token_rule.hpp>
#include <boost/static_assert.hpp>
#include <type_traits>

namespace boost {
namespace urls {
namespace detail {

auto
port_rule::
parse(
    char const*& it,
    char const* end) const noexcept ->
        result<value_type>
{
    value_type t;
    std::uint16_t u = 0;
    auto const start = it;
    while(it != end)
    {
        if(! grammar::digit_chars(*it))
            break;
        auto u0 = u;
        u = 10 * u + *it - '0';
        if(u < u0)
        {
            // overflow
            it = grammar::find_if_not(
                it, end, grammar::digit_chars);
            t.str = string_view(
                start, it - start);
            t.has_number = false;
            return t;
        }
        ++it;
    }
    t.str = string_view(
        start, it - start);
    if(! t.str.empty())
    {
        t.has_number = true;
        t.number = u;
    }
    else
    {
        t.has_number = false;
    }
    return t;
}

auto
port_part_rule_t::
parse(
    char const*& it,
    char const* end) const noexcept ->
        result<value_type>
{
    value_type t;
    if( it == end ||
        *it != ':')
    {
        t.has_port = false;
        return t;
    }
    ++it;
    auto rv = grammar::parse(
        it, end, port_rule{});
    if(! rv)
        return rv.error();
    t.has_port = true;
    t.port = rv->str;
    t.has_number = rv->has_number;
    t.port_number = rv->number;
    return t;
}

} // detail
} // urls
} // boost

#endif
