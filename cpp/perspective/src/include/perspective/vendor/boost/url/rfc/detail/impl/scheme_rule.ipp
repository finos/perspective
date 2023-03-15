//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_SCHEME_RULE_IPP
#define BOOST_URL_IMPL_SCHEME_RULE_IPP

#include <boost/url/rfc/detail/scheme_rule.hpp>
#include <boost/url/grammar/delim_rule.hpp>
#include <boost/url/grammar/tuple_rule.hpp>
#include <boost/url/grammar/parse.hpp>

namespace boost {
namespace urls {
namespace detail {

auto
scheme_rule::
parse(
    char const*& it,
    char const* end) const noexcept ->
        result<value_type>
{
    auto const start = it;
    if(it == end)
    {
        // end
        BOOST_URL_RETURN_EC(
            grammar::error::mismatch);
    }
    if(! grammar::alpha_chars(*it))
    {
        // expected alpha
        BOOST_URL_RETURN_EC(
            grammar::error::mismatch);
    }

    static
    constexpr
    grammar::lut_chars scheme_chars(
        "0123456789" "+-."
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz");
    it = grammar::find_if_not(
        it + 1, end, scheme_chars);
    value_type t;
    t.scheme = string_view(
        start, it - start);
    t.scheme_id = string_to_scheme(
        t.scheme);
    return t;
}

} // detail
} // urls
} // boost

#endif
