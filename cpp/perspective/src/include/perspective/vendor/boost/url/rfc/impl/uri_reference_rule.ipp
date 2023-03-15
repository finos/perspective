//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_IMPL_URI_REFERENCE_RULE_IPP
#define BOOST_URL_RFC_IMPL_URI_REFERENCE_RULE_IPP

#include <boost/url/rfc/uri_reference_rule.hpp>
#include <boost/url/rfc/uri_rule.hpp>
#include <boost/url/rfc/relative_ref_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/grammar/variant_rule.hpp>

namespace boost {
namespace urls {

auto
uri_reference_rule_t::
parse(
    char const*& it,
    char const* const end
        ) const noexcept ->
    result<value_type>
{
    auto rv = grammar::parse(
        it, end,
        grammar::variant_rule(
            uri_rule,
            relative_ref_rule));
    if(! rv)
        return rv.error();
    switch(rv->index())
    {
    default:
    case 0:
        return get<0>(*rv);
    case 1:
        return get<1>(*rv);
    }
}

} // urls
} // boost

#endif
