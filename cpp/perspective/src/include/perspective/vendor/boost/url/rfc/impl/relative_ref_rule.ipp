//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_IMPL_RELATIVE_REF_RULE_IPP
#define BOOST_URL_RFC_IMPL_RELATIVE_REF_RULE_IPP

#include <boost/url/rfc/relative_ref_rule.hpp>
#include <boost/url/rfc/query_rule.hpp>
#include <boost/url/rfc/detail/fragment_part_rule.hpp>
#include <boost/url/rfc/detail/relative_part_rule.hpp>
#include <boost/url/grammar/delim_rule.hpp>
#include <boost/url/grammar/tuple_rule.hpp>
#include <boost/url/grammar/optional_rule.hpp>
#include <boost/url/grammar/parse.hpp>

namespace boost {
namespace urls {

auto
relative_ref_rule_t::
parse(
    char const*& it,
    char const* const end
        ) const noexcept ->
    result<value_type>
{
    detail::url_impl u(detail::url_impl::from::string);
    u.cs_ = it;

    // relative-part
    {
        auto rv = grammar::parse(
            it, end,
            detail::relative_part_rule);
        if(! rv)
            return rv.error();
        if(rv->has_authority)
            u.apply_authority(rv->authority);
        u.apply_path(
            rv->path, rv->segment_count);
    }

    // [ "?" query ]
    {
        auto rv = grammar::parse(
            it, end, detail::query_part_rule);
        if(! rv)
            return rv.error();
        if(rv->has_query)
        {
            // map "?" to { {} }
            u.apply_query(
                rv->query,
                rv->count +
                    rv->query.empty());
        }
    }

    // [ "#" fragment ]
    {
        auto rv = grammar::parse(
            it, end, detail::fragment_part_rule);
        if(! rv)
            return rv.error();
        if(rv->has_fragment)
            u.apply_frag(rv->fragment);
    }

    return u.construct();
}

} // urls
} // boost

#endif
