//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_IMPL_IPVFUTURE_RULE_IPP
#define BOOST_URL_DETAIL_IMPL_IPVFUTURE_RULE_IPP

#include <boost/url/rfc/detail/ipvfuture_rule.hpp>
#include <boost/url/error.hpp>
#include <boost/url/rfc/detail/charsets.hpp>
#include <boost/url/grammar/charset.hpp>
#include <boost/url/grammar/delim_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/grammar/token_rule.hpp>
#include <boost/url/grammar/tuple_rule.hpp>

namespace boost {
namespace urls {
namespace detail {

auto
ipvfuture_rule_t::
parse(
    char const*& it,
    char const* const end
        ) const noexcept ->
    result<value_type>
{
    static constexpr auto
        minor_chars = 
            unreserved_chars +
            sub_delim_chars + ':';
    auto const it0 = it;
    auto rv = grammar::parse(
        it, end,
        grammar::tuple_rule(
            grammar::delim_rule('v'),
            grammar::token_rule(
                grammar::hexdig_chars),
            grammar::delim_rule('.'),
            grammar::token_rule(minor_chars)));
    if(! rv)
        return rv.error();
    value_type t;
    t.major = std::get<0>(*rv);
    t.minor = std::get<1>(*rv);
    if(t.major.empty())
    {
        // can't be empty
        BOOST_URL_RETURN_EC(
            grammar::error::invalid);
    }
    if(t.minor.empty())
    {
        // can't be empty
        BOOST_URL_RETURN_EC(
            grammar::error::invalid);
    }
    t.str = string_view(
        it0, it - it0);
    return t;
}

} // detail
} // urls
} // boost

#endif
