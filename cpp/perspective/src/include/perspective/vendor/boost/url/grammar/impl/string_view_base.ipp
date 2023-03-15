//
// Copyright (c) 2022 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_STRING_VIEW_BASE_IPP
#define BOOST_URL_IMPL_STRING_VIEW_BASE_IPP

#include <boost/url/grammar/string_view_base.hpp>
#include <ostream>

namespace boost {
namespace urls {
namespace grammar {

std::ostream&
operator<<(
    std::ostream& os,
    string_view_base const& s)
{
    return os << string_view(s);
}

} // grammar
} // urls
} // boost

#endif

