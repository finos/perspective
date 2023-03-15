//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_DECODE_HPP
#define BOOST_URL_DETAIL_DECODE_HPP

#include <boost/url/encoding_opts.hpp>
#include <boost/url/string_view.hpp>
#include <cstdlib>

namespace boost {
namespace urls {
namespace detail {

BOOST_URL_DECL
char
decode_one(
    char const* it) noexcept;

BOOST_URL_DECL
std::size_t
decode_bytes_unsafe(
    string_view s) noexcept;

BOOST_URL_DECL
std::size_t
decode_unsafe(
    char* dest,
    char const* end,
    string_view s,
    encoding_opts opt = {}) noexcept;

} // detail
} // urls
} // boost

#endif
