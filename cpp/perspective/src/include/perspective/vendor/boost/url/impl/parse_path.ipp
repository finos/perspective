//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_PARSE_PATH_IPP
#define BOOST_URL_IMPL_PARSE_PATH_IPP

#include <boost/url/parse_path.hpp>
#include <boost/url/error.hpp>
#include <boost/url/detail/path.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/rfc/detail/path_rules.hpp>

namespace boost {
namespace urls {

result<segments_encoded_view>
parse_path(string_view s) noexcept
{
    auto it = s.data();
    auto const end = it + s.size();
    std::size_t dn = 0;
    std::size_t nseg = 0;
    if( it != end &&
            *it != '/')
        ++nseg;
    while(it != end)
    {
        if(*it == '/')
        {
            ++it;
            ++dn;
            ++nseg;
            continue;
        }
        auto rv = grammar::parse(
            it, end, detail::segment_rule);
        if(! rv)
            return rv.error();
        if(rv->empty())
        {
            BOOST_URL_RETURN_EC(
                grammar::error::mismatch);
        }
        dn += rv->decoded_size();
    }
    // adjust nseg
    nseg = detail::path_segments(s, nseg);
    return segments_encoded_view(
        detail::path_ref(s, dn, nseg));
}

} // urls
} // boost

#endif
