//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/beast
//

#ifndef BOOST_BEAST_STRING_TYPE_HPP
#define BOOST_BEAST_STRING_TYPE_HPP

#include <boost/beast/core/detail/config.hpp>

#include <boost/core/detail/string_view.hpp>
#if defined(BOOST_BEAST_USE_STD_STRING_VIEW)
#include <boost/config/pragma_message.hpp>
BOOST_PRAGMA_MESSAGE("BOOST_BEAST_USE_STD_STRING_VIEW is deprecated, use BOOST_NO_CXX17_HDR_STRING_VIEW instead");
#endif

namespace boost {
namespace beast {

/// The type of string view used by the library
using string_view = boost::core::string_view;

/// The type of `basic_string_view` used by the library
template<class CharT>
using basic_string_view =
    boost::core::basic_string_view<CharT>;

template<class S>
inline string_view
to_string_view(const S& s)
{
    return string_view(s.data(), s.size());
}

} // beast
} // boost

#endif
