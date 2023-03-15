//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_GRAMMAR_IMPL_CI_STRING_IPP
#define BOOST_URL_GRAMMAR_IMPL_CI_STRING_IPP

#include <boost/url/grammar/ci_string.hpp>

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

//------------------------------------------------

int
ci_compare(
    string_view s0,
    string_view s1) noexcept
{
    int bias;
    std::size_t n;
    if( s0.size() <
        s1.size())
    {
        bias = -1;
        n = s0.size();
    }
    else
    {
        if( s0.size() >
            s1.size())
            bias = 1;
        else
            bias = 0;
        n = s1.size();
    }
    auto it0 = s0.data();
    auto it1 = s1.data();
    while(n--)
    {
        auto c0 =
            to_lower(*it0++);
        auto c1 =
            to_lower(*it1++);
        if(c0 == c1)
            continue;
        if(c0 < c1)
            return -1;
        return 1;
    }
    return bias;
}

//------------------------------------------------

std::size_t
ci_digest(
    string_view s) noexcept
{
    // Only 4 and 8 byte sizes are supported
    static_assert(
        sizeof(std::size_t) == 4 ||
        sizeof(std::size_t) == 8, "");
    constexpr std::size_t prime = (
        sizeof(std::size_t) == 8) ?
            0x100000001B3ULL :
            0x01000193UL;
    constexpr std::size_t hash0 = (
        sizeof(std::size_t) == 8) ?
            0xcbf29ce484222325ULL :
            0x811C9DC5UL;
    auto hash = hash0;
    auto p = s.data();
    auto n = s.size();
    for(;n--;++p)
    {
        // VFALCO NOTE Consider using a lossy
        // to_lower which works 4 or 8 chars at a time.
        hash = (to_lower(*p) ^ hash) * prime;
    }
    return hash;
}

} // grammar
} // urls
} // boost

#endif
