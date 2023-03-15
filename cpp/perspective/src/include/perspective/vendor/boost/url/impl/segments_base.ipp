//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_SEGMENTS_BASE_IPP
#define BOOST_URL_IMPL_SEGMENTS_BASE_IPP

#include <boost/url/segments_base.hpp>
#include <ostream>

namespace boost {
namespace urls {

auto
segments_base::
iterator::
operator*() const ->
    reference
{
    encoding_opts opt;
    opt.space_as_plus = false;
    return it_.dereference().decode(opt);
}

segments_base::
iterator::
iterator(
    detail::path_ref const& ref) noexcept
    : it_(ref)
{
}

segments_base::
iterator::
iterator(
    detail::path_ref const& ref,
    int) noexcept
    : it_(ref, 0)
{
}

//------------------------------------------------
//
// segments_base
//
//------------------------------------------------

segments_base::
segments_base(
    detail::path_ref const& ref) noexcept
    : ref_(ref)
{
}

pct_string_view
segments_base::
buffer() const noexcept
{
    return ref_.buffer();
}

bool
segments_base::
is_absolute() const noexcept
{
    return ref_.buffer().starts_with('/');
}

bool
segments_base::
empty() const noexcept
{
    return ref_.nseg() == 0;
}

std::size_t
segments_base::
size() const noexcept
{
    return ref_.nseg();
}

auto
segments_base::
begin() const noexcept ->
    iterator
{
    return iterator(ref_);
}

auto
segments_base::
end() const noexcept ->
    iterator
{
    return iterator(ref_, 0);
}

//------------------------------------------------

std::ostream&
operator<<(
    std::ostream& os,
    segments_base const& ps)
{
    os << ps.buffer();
    return os;
}

} // urls
} // boost

#endif
