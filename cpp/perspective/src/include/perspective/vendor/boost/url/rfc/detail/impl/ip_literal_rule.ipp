//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_IP_LITERAL_RULE_IPP
#define BOOST_URL_IMPL_IP_LITERAL_RULE_IPP

#include <boost/url/rfc/detail/ip_literal_rule.hpp>
#include <boost/url/ipv6_address.hpp>
#include <boost/url/grammar/delim_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/grammar/tuple_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/rfc/detail/ipvfuture_rule.hpp>

namespace boost {
namespace urls {
namespace detail {

auto
ip_literal_rule_t::
parse(
    char const*& it,
    char const* const end
        ) const noexcept ->
    result<value_type>
{
    value_type t;

    // '['
    {
        auto rv = grammar::parse(
            it, end, grammar::delim_rule('['));
        if(! rv)
            return rv.error();
    }
    if(it == end)
    {
        // end
        BOOST_URL_RETURN_EC(
            grammar::error::invalid);
    }
    if(*it != 'v')
    {
        // IPv6address
        auto rv = grammar::parse(
            it, end,
            grammar::tuple_rule(
                ipv6_address_rule,
                grammar::squelch(
                    grammar::delim_rule(']'))));
        if(! rv)
            return rv.error();
        t.ipv6 = *rv;
        t.is_ipv6 = true;
        return t;
    }
    {
        // IPvFuture
        auto rv = grammar::parse(
            it, end, 
            grammar::tuple_rule(
                ipvfuture_rule,
                grammar::squelch(
                    grammar::delim_rule(']'))));
        if(! rv)
            return rv.error();
        t.is_ipv6 = false;
        t.ipvfuture = rv->str;
        return t;
    }
}

} // detail
} // urls
} // boost

#endif
