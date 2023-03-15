//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_SEGMENTS_ENCODED_REF_IPP
#define BOOST_URL_IMPL_SEGMENTS_ENCODED_REF_IPP

#include <boost/url/segments_encoded_ref.hpp>
#include <boost/url/url.hpp>
#include <boost/url/detail/path.hpp>

namespace boost {
namespace urls {

//------------------------------------------------
//
// Special Members
//
//------------------------------------------------

segments_encoded_ref::
segments_encoded_ref(
    url_base& u) noexcept
    : segments_encoded_base(
        detail::path_ref(u.impl_))
    , u_(&u)
{
}

segments_encoded_ref::
operator
segments_encoded_view() const noexcept
{
    return segments_encoded_view(ref_);
}

segments_encoded_ref&
segments_encoded_ref::
operator=(
    segments_encoded_ref const& other)
{
    if (!ref_.alias_of(other.ref_))
        assign(other.begin(), other.end());
    return *this;
}

segments_encoded_ref&
segments_encoded_ref::
operator=(
    segments_encoded_view const& other)
{
    assign(other.begin(), other.end());
    return *this;
}

segments_encoded_ref&
segments_encoded_ref::
operator=(std::initializer_list<
    pct_string_view> init)
{
    assign(init.begin(), init.end());
    return *this;
}

//------------------------------------------------
//
// Modifiers
//
//------------------------------------------------

void
segments_encoded_ref::
assign(
    std::initializer_list<
        pct_string_view> init)
{
    assign(init.begin(), init.end());
}

auto
segments_encoded_ref::
insert(
    iterator before,
    pct_string_view s) ->
        iterator
{
    return u_->edit_segments(
        before.it_,
        before.it_,
        detail::segment_encoded_iter(s));
}

auto
segments_encoded_ref::
insert(
    iterator before,
    std::initializer_list<
            pct_string_view> init) ->
        iterator
{
    return insert(
        before,
        init.begin(),
        init.end());
}

auto
segments_encoded_ref::
erase(
    iterator first,
    iterator last) noexcept ->
        iterator
{
    string_view s;
    return u_->edit_segments(
        first.it_,
        last.it_,
        detail::make_segments_encoded_iter(
            &s, &s));
}

auto
segments_encoded_ref::
replace(
    iterator pos,
    pct_string_view s) ->
        iterator
{
    return u_->edit_segments(
        pos.it_,
        std::next(pos).it_,
        detail::segment_encoded_iter(s));
}

auto
segments_encoded_ref::
replace(
    iterator from,
    iterator to,
    pct_string_view s) ->
        iterator
{
    return u_->edit_segments(
        from.it_,
        to.it_,
        detail::segment_encoded_iter(s));
}

auto
segments_encoded_ref::
replace(
    iterator from,
    iterator to,
    std::initializer_list<
        pct_string_view> init) ->
    iterator
{
    return replace(
        from,
        to,
        init.begin(),
        init.end());
}

} // urls
} // boost

#endif
