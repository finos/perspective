//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_DETAIL_QUERY_PART_RULE_HPP
#define BOOST_URL_RFC_DETAIL_QUERY_PART_RULE_HPP

#include <boost/url/detail/config.hpp>
#include <boost/url/error_types.hpp>
#include <boost/url/pct_string_view.hpp>
#include <boost/url/rfc/query_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <cstdlib>

namespace boost {
namespace urls {
namespace detail {

/** Rule for query-part

    @par BNF
    @code
    query-part    = [ "?" query ]
    @endcode
*/
struct query_part_rule_t
{
    struct value_type
    {
        pct_string_view query;
        std::size_t count = 0;
        bool has_query = false;
    };

    auto
    parse(
        char const*& it,
        char const* end
            ) const noexcept ->
        result<value_type>
    {
        if( it == end ||
            *it != '?')
            return {};
        ++it;
        auto rv = grammar::parse(
            it, end, query_rule);
        if(! rv)
            return rv.error();
        value_type t;
        t.query = rv->buffer();
        t.count = rv->size();
        t.has_query = true;
        return t;
    }
};

constexpr query_part_rule_t query_part_rule{};

} // detail
} // urls
} // boost

#endif