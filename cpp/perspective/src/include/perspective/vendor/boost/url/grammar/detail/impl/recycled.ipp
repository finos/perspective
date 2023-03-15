//
// Copyright (c) 2022 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_GRAMMAR_DETAIL_IMPL_RECYCLED_IPP
#define BOOST_URL_GRAMMAR_DETAIL_IMPL_RECYCLED_IPP

#include <cstdlib>
#include <mutex>
#include <utility>

#ifdef _MSC_VER
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <debugapi.h>
#endif

namespace boost {
namespace urls {
namespace grammar {
namespace detail {

struct all_reports
{
    std::mutex m;

    // current count
    std::size_t count = 0;

    // current bytes
    std::size_t bytes = 0;

    // highest total ptr count
    std::size_t count_max = 0;

    // highest total bytes
    std::size_t bytes_max = 0;

    // largest single allocation
    std::size_t alloc_max = 0;

    ~all_reports()
    {
        // breakpoint here to view report
#ifdef BOOST_URL_REPORT
    #ifdef _MSC_VER
        if(count_max > 0)
            ::DebugBreak();
    #endif
#endif
    }
};

static all_reports all_reports_;

void
recycled_add_impl(
    std::size_t n) noexcept
{
    std::lock_guard<
        std::mutex> m(all_reports_.m);

    auto& a = all_reports_;

    a.count++;
    if( a.count_max < a.count)
        a.count_max = a.count;

    a.bytes += n;
    if( a.bytes_max < a.bytes)
        a.bytes_max = a.bytes;

    if( a.alloc_max < n)
        a.alloc_max = n;
}

void
recycled_remove_impl(
    std::size_t n) noexcept
{
    std::lock_guard<
        std::mutex> m(all_reports_.m);

    all_reports_.count--;
    all_reports_.bytes-=n;
}

} // detail
} // grammar
} // urls
} // boost

#endif
