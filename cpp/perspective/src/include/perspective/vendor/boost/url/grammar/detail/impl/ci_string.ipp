//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_GRAMMAR_DETAIL_IMPL_CI_STRING_IPP
#define BOOST_URL_GRAMMAR_DETAIL_IMPL_CI_STRING_IPP

#include <boost/url/grammar/detail/ci_string.hpp>

namespace boost {
namespace urls {
namespace grammar {
namespace detail {

//------------------------------------------------

// https://lemire.me/blog/2020/04/30/for-case-insensitive-string-comparisons-avoid-char-by-char-functions/
// https://github.com/lemire/Code-used-on-Daniel-Lemire-s-blog/blob/master/2020/04/30/tolower.cpp

bool
ci_is_equal(
    string_view s0,
    string_view s1) noexcept
{
    auto n = s0.size();
    auto p1 = s0.data();
    auto p2 = s1.data();
    char a, b;
    // fast loop
    while(n--)
    {
        a = *p1++;
        b = *p2++;
        if(a != b)
            goto slow;
    }
    return true;
slow:
    do
    {
        if( to_lower(a) !=
            to_lower(b))
            return false;
        a = *p1++;
        b = *p2++;
    }
    while(n--);
    return true;
}

//------------------------------------------------

bool
ci_is_less(
    string_view s0,
    string_view s1) noexcept
{
    auto p1 = s0.data();
    auto p2 = s1.data();
    for(auto n = s0.size();n--;)
    {
        auto c1 = to_lower(*p1++);
        auto c2 = to_lower(*p2++);
        if(c1 != c2)
            return c1 < c2;
    }
    // equal
    return false;
}

} // detail
} // grammar
} // urls
} // boost

#endif
