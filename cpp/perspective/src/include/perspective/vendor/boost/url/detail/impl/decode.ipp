//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_IMPL_DECODE_IPP
#define BOOST_URL_DETAIL_IMPL_DECODE_IPP

#include <boost/url/detail/decode.hpp>
#include <boost/url/grammar/charset.hpp>
#include <memory>

namespace boost {
namespace urls {
namespace detail {

char
decode_one(
    char const* const it) noexcept
{
    auto d0 = grammar::hexdig_value(it[0]);
    auto d1 = grammar::hexdig_value(it[1]);
    return static_cast<char>(
        ((static_cast<
            unsigned char>(d0) << 4) +
        (static_cast<
            unsigned char>(d1))));
}

std::size_t
decode_bytes_unsafe(
    string_view s) noexcept
{
    auto p = s.begin();
    auto const end = s.end();
    std::size_t dn = 0;
    if(s.size() >= 3)
    {
        auto const safe_end = end - 2;
        while(p < safe_end)
        {
            if(*p != '%')
                p += 1;
            else
                p += 3;
            ++dn;
        }
    }
    dn += end - p;
    return dn;
}

std::size_t
decode_unsafe(
    char* const dest0,
    char const* end,
    string_view s,
    encoding_opts opt) noexcept
{
    auto it = s.data();
    auto const last = it + s.size();
    auto dest = dest0;

    if(opt.space_as_plus)
    {
        while(it != last)
        {
            if(dest == end)
            {
                // dest too small
                return dest - dest0;
            }
            if(*it == '+')
            {
                // plus to space
                *dest++ = ' ';
                ++it;
                continue;
            }
            if(*it == '%')
            {
                // escaped
                ++it;
                if(last - it < 2)
                {
                    // missing input,
                    // initialize output
                    std::memset(dest,
                        0, end - dest);
                    return dest - dest0;
                }
                *dest++ = decode_one(it);
                it += 2;
                continue;
            }
            // unescaped
            *dest++ = *it++;
        }
        return dest - dest0;
    }

    while(it != last)
    {
        if(dest == end)
        {
            // dest too small
            return dest - dest0;
        }
        if(*it == '%')
        {
            // escaped
            ++it;
            if(last - it < 2)
            {
                // missing input,
                // initialize output
                std::memset(dest,
                    0, end - dest);
                return dest - dest0;
            }
            *dest++ = decode_one(it);
            it += 2;
            continue;
        }
        // unescaped
        *dest++ = *it++;
    }
    return dest - dest0;
}

} // detail
} // urls
} // boost

#endif
