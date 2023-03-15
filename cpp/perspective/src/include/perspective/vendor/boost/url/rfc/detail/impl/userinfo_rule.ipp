//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_DETAIL_IMPL_USERINFO_RULE_IPP
#define BOOST_URL_RFC_DETAIL_IMPL_USERINFO_RULE_IPP

#include <boost/url/rfc/detail/userinfo_rule.hpp>
#include <boost/url/string_view.hpp>
#include <boost/url/rfc/pct_encoded_rule.hpp>
#include <boost/url/grammar/parse.hpp>

namespace boost {
namespace urls {
namespace detail {

auto
userinfo_rule_t::
parse(
    char const*& it,
    char const* const end
        ) const noexcept ->
    result<value_type>
{
    static constexpr auto uchars =
        unreserved_chars +
        sub_delim_chars;
    static constexpr auto pwchars =
        uchars + ':';

    value_type t;

    // user
    auto rv = grammar::parse(
        it, end, pct_encoded_rule(
            grammar::ref(uchars)));
    if(! rv)
        return rv.error();
    t.user = *rv;

    // ':'
    if( it == end ||
        *it != ':')
    {
        t.has_password = false;
        t.password = {};
        return t;
    }
    ++it;

    // pass
    rv = grammar::parse(
        it, end, pct_encoded_rule(
            grammar::ref(pwchars)));
    if(! rv)
        return rv.error();

    t.has_password = true;
    t.password = *rv;
    return t;
}

} // detail
} // urls
} // boost

#endif
