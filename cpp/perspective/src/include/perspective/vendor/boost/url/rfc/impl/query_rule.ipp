//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_IMPL_QUERY_RULE_IPP
#define BOOST_URL_RFC_IMPL_QUERY_RULE_IPP

#include <boost/url/rfc/query_rule.hpp>
#include <boost/url/rfc/detail/charsets.hpp>
#include <boost/url/error.hpp>
#include <boost/url/grammar/hexdig_chars.hpp>

namespace boost {
namespace urls {

auto
query_rule_t::
parse(
    char const*& it,
    char const* end
        ) const noexcept ->
    result<value_type>
{
    if(it == end)
    {
        // empty string = 0 params
        return params_encoded_view(
            detail::query_ref(
                string_view(it, 0), 0, 0));
    }
    auto const it0 = it;
    std::size_t dn = 0;
    std::size_t nparam = 1;
    while(it != end)
    {
        if(*it == '&')
        {
            ++nparam;
            ++it;
            continue;
        }
        if(detail::query_chars(*it))
        {
            ++it;
            continue;
        }
        if(*it == '%')
        {
            if(end - it < 3)
            {
                // missing HEXDIG
                BOOST_URL_RETURN_EC(
                    error::missing_pct_hexdig);
            }
            if (!grammar::hexdig_chars(it[1]) ||
                !grammar::hexdig_chars(it[2]))
            {
                // expected HEXDIG
                BOOST_URL_RETURN_EC(
                    error::bad_pct_hexdig);
            }
            it += 3;
            dn += 2;
            continue;
        }
        // got reserved character
        break;
    }
    std::size_t const n(it - it0);
    return params_encoded_view(
        detail::query_ref(
            string_view(it, n),
            n - dn,
            nparam));
}

} // urls
} // boost

#endif
