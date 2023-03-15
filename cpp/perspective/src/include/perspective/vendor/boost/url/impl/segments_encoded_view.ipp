//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_SEGMENTS_ENCODED_VIEW_IPP
#define BOOST_URL_IMPL_SEGMENTS_ENCODED_VIEW_IPP

#include <boost/url/segments_encoded_view.hpp>
#include <boost/url/parse_path.hpp>

namespace boost {
namespace urls {

segments_encoded_view::
segments_encoded_view(
    detail::path_ref const& ref) noexcept
    : segments_encoded_base(ref)
{
}

segments_encoded_view::
segments_encoded_view(
    string_view s)
    : segments_encoded_view(
        parse_path(s).value(
            BOOST_URL_POS))
{
}

segments_encoded_view::
operator
segments_view() const noexcept
{
    return { ref_ };
}

} // urls
} // boost

#endif
