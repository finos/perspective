//
// Copyright (c) 2022 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_RFC_IMPL_IPV4_ADDRESS_RULE_IPP
#define BOOST_URL_RFC_IMPL_IPV4_ADDRESS_RULE_IPP

#include <boost/url/rfc/ipv4_address_rule.hpp>
#include <boost/url/grammar/delim_rule.hpp>
#include <boost/url/grammar/dec_octet_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/grammar/tuple_rule.hpp>

namespace boost {
namespace urls {

auto
ipv4_address_rule_t::
parse(
    char const*& it,
    char const* end
        ) const noexcept ->
    result<value_type>
{
    using namespace grammar;
    auto rv = grammar::parse(
        it, end, tuple_rule(
            dec_octet_rule, squelch(delim_rule('.')),
            dec_octet_rule, squelch(delim_rule('.')),
            dec_octet_rule, squelch(delim_rule('.')),
            dec_octet_rule));
    if(! rv)
        return rv.error();
    std::array<unsigned char, 4> v;
    v[0] = std::get<0>(*rv);
    v[1] = std::get<1>(*rv);
    v[2] = std::get<2>(*rv);
    v[3] = std::get<3>(*rv);
    return ipv4_address(v);
}

} // urls
} // boost

#endif
