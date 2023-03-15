//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/CPPAlliance/url
//

#ifndef BOOST_URL_IMPL_PARSE_QUERY_IPP
#define BOOST_URL_IMPL_PARSE_QUERY_IPP

#include <boost/url/parse_query.hpp>
#include <boost/url/rfc/query_rule.hpp>
#include <boost/url/grammar/parse.hpp>

#include <boost/url/error.hpp>

namespace boost {
namespace urls {

result<params_encoded_view>
parse_query(string_view s) noexcept
{
    // Handle empty strings differently.
    // We produce {}, versus empty but
    // present query in URL (e.g. "http:?")
    // which produces {{"", none}}.
    if(s.empty())
        return params_encoded_view(
            detail::query_ref(
                s.data(), 0, 0));
    auto rv = grammar::parse(s, query_rule);
    if(! rv)
        return rv.error();
    return params_encoded_view(
        detail::query_ref(
            s.data(), s.size(), rv->size()));
}

} // urls
} // boost

#endif
