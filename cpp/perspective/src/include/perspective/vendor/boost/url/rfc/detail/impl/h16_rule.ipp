//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_DETAIL_IMPL_H16_RULE_HPP
#define BOOST_URL_RFC_DETAIL_IMPL_H16_RULE_HPP

#include <boost/url/rfc/detail/h16_rule.hpp>
#include <boost/url/grammar/charset.hpp>
#include <boost/url/grammar/error.hpp>
#include <boost/assert.hpp>

namespace boost {
namespace urls {
namespace detail {

auto
h16_rule_t::
parse(
    char const*& it,
    char const* end
        ) const noexcept ->
    result<value_type>
{
    // VFALCO it might be impossible for
    // this condition to be true (coverage)
    if(it == end)
    {
        // end
        BOOST_URL_RETURN_EC(
            grammar::error::invalid);
    }

    std::uint16_t v;
    for(;;)
    {
        auto d = grammar::hexdig_value(*it);
        if(d < 0)
        {
            // expected HEXDIG
            BOOST_URL_RETURN_EC(
                grammar::error::invalid);
        }
        v = d;
        ++it;
        if(it == end)
            break;
        d = grammar::hexdig_value(*it);
        if(d < 0)
            break;
        v = (16 * v) + d;
        ++it;
        if(it == end)
            break;
        d = grammar::hexdig_value(*it);
        if(d < 0)
            break;
        v = (16 * v) + d;
        ++it;
        if(it == end)
            break;
        d = grammar::hexdig_value(*it);
        if(d < 0)
            break;
        v = (16 * v) + d;
        ++it;
        break;
    }
    return value_type{
        static_cast<
            unsigned char>(v / 256),
        static_cast<
            unsigned char>(v % 256)};
}

} // detail
} // urls
} // boost

#endif
