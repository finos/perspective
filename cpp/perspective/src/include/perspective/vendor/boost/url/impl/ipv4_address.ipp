//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_IPV4_ADDRESS_IPP
#define BOOST_URL_IMPL_IPV4_ADDRESS_IPP

#include <boost/url/ipv4_address.hpp>
#include <boost/url/detail/except.hpp>
#include <boost/url/rfc/ipv4_address_rule.hpp>
#include <cstring>

namespace boost {
namespace urls {

ipv4_address::
ipv4_address(
    uint_type addr) noexcept
    : addr_(addr)
{
}

ipv4_address::
ipv4_address(
    bytes_type const& bytes) noexcept
{
    addr_ =
(static_cast<unsigned long>(bytes[0]) << 24) |
(static_cast<unsigned long>(bytes[1]) << 16) |
(static_cast<unsigned long>(bytes[2]) <<  8) |
(static_cast<unsigned long>(bytes[3]));
}

ipv4_address::
ipv4_address(
    string_view s)
    : ipv4_address(
        parse_ipv4_address(s
            ).value(BOOST_URL_POS))
{
}

auto
ipv4_address::
to_bytes() const noexcept ->
    bytes_type
{
    bytes_type bytes;
    bytes[0] = (addr_ >> 24) & 0xff;
    bytes[1] = (addr_ >> 16) & 0xff;
    bytes[2] = (addr_ >>  8) & 0xff;
    bytes[3] =  addr_        & 0xff;
    return bytes;
}

auto
ipv4_address::
to_uint() const noexcept ->
    uint_type
{
    return addr_;
}

string_view
ipv4_address::
to_buffer(
    char* dest,
    std::size_t dest_size) const
{
    if(dest_size < max_str_len)
        detail::throw_length_error();
    auto n = print_impl(dest);
    return string_view(dest, n);
}

bool
ipv4_address::
is_loopback() const noexcept
{
    return (to_uint() & 0xFF000000) ==
        0x7F000000;
}

bool
ipv4_address::
is_unspecified() const noexcept
{
    return to_uint() == 0;
}

bool
ipv4_address::
is_multicast() const noexcept
{
    return (to_uint() & 0xF0000000) ==
        0xE0000000;
}

std::size_t
ipv4_address::
print_impl(
    char* dest) const noexcept
{
    auto const start = dest;
    auto const write =
        []( char*& dest,
            unsigned char v)
        {
            if(v >= 100)
            {
                *dest++ = '0' +
                    v / 100;
                v %= 100;
                *dest++ = '0' +
                    v / 10;
                v %= 10;
            }
            else if(v >= 10)
            {
                *dest++ = '0' +
                    v / 10;
                v %= 10;
            }
            *dest++ = '0' + v;
        };
    auto const v = to_uint();
    write(dest, (v >> 24) & 0xff);
    *dest++ = '.';
    write(dest, (v >> 16) & 0xff);
    *dest++ = '.';
    write(dest, (v >>  8) & 0xff);
    *dest++ = '.';
    write(dest, (v      ) & 0xff);
    return dest - start;
}

void
ipv4_address::
to_string_impl(
    string_token::arg& t) const
{
    char buf[max_str_len];
    auto const n = print_impl(buf);
    char* dest = t.prepare(n);
    std::memcpy(dest, buf, n);
}

//------------------------------------------------

auto
parse_ipv4_address(
    string_view s) noexcept ->
        result<ipv4_address>
{
    return grammar::parse(
        s, ipv4_address_rule);
}

} // urls
} // boost

#endif
