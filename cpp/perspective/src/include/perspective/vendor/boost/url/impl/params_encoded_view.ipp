//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/CPPAlliance/url
//

#ifndef BOOST_URL_IMPL_PARAMS_ENCODED_VIEW_IPP
#define BOOST_URL_IMPL_PARAMS_ENCODED_VIEW_IPP

#include <boost/url/params_encoded_view.hpp>
#include <boost/url/parse_query.hpp>

namespace boost {
namespace urls {

params_encoded_view::
params_encoded_view(
    detail::query_ref const& ref) noexcept
    : params_encoded_base(ref)
{
}

params_encoded_view::
params_encoded_view(
    string_view s)
    : params_encoded_view(
        parse_query(s).value(
            BOOST_URL_POS))
{
}

params_encoded_view::
operator
params_view() const noexcept
{
    return { ref_, encoding_opts{} };
}

} // urls
} // boost

#endif
