//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_IMPL_SEGMENTS_ITER_IMPL_IPP
#define BOOST_URL_DETAIL_IMPL_SEGMENTS_ITER_IMPL_IPP

#include <boost/url/detail/segments_iter_impl.hpp>
#include <boost/url/rfc/detail/path_rules.hpp>
#include <boost/assert.hpp>

namespace boost {
namespace urls {
namespace detail {

// begin
segments_iter_impl::
segments_iter_impl(
    detail::path_ref const& ref_) noexcept
    : ref(ref_)
{
    pos = path_prefix(ref.buffer());
    update();
}

// end
segments_iter_impl::
segments_iter_impl(
    detail::path_ref const& ref_,
    int) noexcept
    : ref(ref_)
    , pos(ref.size())
    , next(ref.size())
    , index(ref.nseg())
{
}

segments_iter_impl::
segments_iter_impl(
    url_impl const& u_,
    std::size_t pos_,
    std::size_t index_) noexcept
    : ref(u_)
    , pos(pos_)
    , index(index_)
{
    if(index == 0)
    {
        pos = path_prefix(ref.buffer());
    }
    else if(pos != ref.size())
    {
        BOOST_ASSERT(
            ref.data()[pos] == '/');
        ++pos; // skip '/'
    }
    update();
}

void
segments_iter_impl::
update() noexcept
{
    auto const end = ref.end();
    char const* const p0 =
        ref.data() + pos;
    dn = 0;
    auto p = p0;
    while(p != end)
    {
        if(*p == '/')
            break;
        if(*p != '%')
        {
            ++p;
            continue;
        }
        p += 3;
        dn += 2;
    }
    next = p - ref.data();
    dn = p - p0 - dn;
    s_ = make_pct_string_view_unsafe(
        p0, p - p0, dn);
}

void
segments_iter_impl::
increment() noexcept
{
    BOOST_ASSERT(
        index != ref.nseg());
    ++index;
    pos = next;
    if(index == ref.nseg())
        return;
    // "/" segment
    auto const end = ref.end();
    auto p = ref.data() + pos;
    BOOST_ASSERT(p != end);
    BOOST_ASSERT(*p == '/');
    dn = 0;
    ++p; // skip '/'
    auto const p0 = p;
    while(p != end)
    {
        if(*p == '/')
            break;
        if(*p != '%')
        {
            ++p;
            continue;
        }
        p += 3;
        dn += 2;
    }
    next = p - ref.data();
    dn = p - p0 - dn;
    s_ = make_pct_string_view_unsafe(
        p0, p - p0, dn);
}

void
segments_iter_impl::
decrement() noexcept
{
    BOOST_ASSERT(index != 0);
    --index;
    if(index == 0)
    {
        next = pos;
        pos = path_prefix(ref.buffer());
        s_ = string_view(
            ref.data() + pos,
            next - pos);
        BOOST_ASSERT(! s_.ends_with('/'));
        return;
    }
    auto const begin = ref.data() +
        path_prefix(ref.buffer());
    next = pos;
    auto p = ref.data() + next;
    auto const p1 = p;
    BOOST_ASSERT(p != begin);
    dn = 0;
    while(p != begin)
    {
        --p;
        if(*p == '/')
        {
            ++dn;
            break;
        }
        if(*p == '%')
            dn += 2;
    }
    dn = p1 - p - dn;
    pos = p - ref.data();
    s_ = make_pct_string_view_unsafe(
        p + 1, p1 - p - 1, dn);
}

} // detail
} // url
} // boost

#endif
