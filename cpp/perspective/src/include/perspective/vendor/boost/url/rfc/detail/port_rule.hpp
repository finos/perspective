//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_DETAIL_PORT_RULE_HPP
#define BOOST_URL_RFC_DETAIL_PORT_RULE_HPP

#include <boost/url/detail/config.hpp>
#include <boost/url/error_types.hpp>
#include <boost/url/string_view.hpp>
#include <cstdint>

namespace boost {
namespace urls {
namespace detail {

/** Rule for port

    @par BNF
    @code
    port          = *DIGIT
    @endcode

    @par Specification
    @li <a href="https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.2"
        >3.2.2. Host (rfc3986)</a>

    @see
        @ref port_part_rule.
*/
struct port_rule
{
    struct value_type
    {
        string_view str;
        std::uint16_t number = 0;
        bool has_number = false;
    };

    result<value_type>
    parse(
        char const*& it,
        char const* end) const noexcept;
};

//------------------------------------------------

/** Rule for port-part

    @par BNF
    @code
    port-part       = [ ":" port ]

    port            = *DIGIT
    @endcode

    @par Specification
    @li <a href="https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.2"
        >3.2.2. Host (rfc3986)</a>

    @see
        @ref port_rule.
*/
struct port_part_rule_t
{
    struct value_type
    {
        bool has_port = false;
        string_view port;
        bool has_number = false;
        std::uint16_t port_number = 0;
    };

    auto
    parse(
        char const*& it,
        char const* end
            ) const noexcept ->
        result<value_type>;    
};

constexpr port_part_rule_t port_part_rule{};

} // detail
} // urls
} // boost

#endif
