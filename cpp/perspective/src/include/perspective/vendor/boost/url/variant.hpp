//
// Copyright (c) 2022 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_VARIANT_HPP
#define BOOST_URL_VARIANT_HPP

#include <boost/url/detail/config.hpp>
#include <boost/variant2/variant.hpp>

namespace boost {
namespace urls {

/** The type of variant used by the library
*/
template<class... Ts>
using variant =
    boost::variant2::variant<Ts...>;

} // urls
} // boost

#endif
