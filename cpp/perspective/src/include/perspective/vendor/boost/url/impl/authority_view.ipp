//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_AUTHORITY_VIEW_IPP
#define BOOST_URL_IMPL_AUTHORITY_VIEW_IPP

#include <boost/url/authority_view.hpp>
#include <boost/url/grammar/parse.hpp>
#include <boost/url/rfc/authority_rule.hpp>
#include <boost/url/rfc/pct_encoded_rule.hpp>
#include <array>
#include <ostream>

namespace boost {
namespace urls {

//------------------------------------------------

namespace detail {

authority_view
url_impl::
construct_authority() const noexcept
{
    return authority_view(*this);
}

} // detail

//------------------------------------------------

authority_view::
authority_view(
    detail::url_impl const& u) noexcept
    : u_(u)
{
}

//------------------------------------------------

authority_view::
~authority_view()
{
}

authority_view::
authority_view() noexcept
    : u_(from::authority)
{
}

authority_view::
authority_view(
    string_view s)
    : authority_view(
        parse_authority(s
            ).value(BOOST_URL_POS))
{
}

authority_view::
authority_view(
    authority_view const&) noexcept = default;

authority_view&
authority_view::
operator=(
    authority_view const&) noexcept = default;

//------------------------------------------------
//
// Userinfo
//
//------------------------------------------------

bool
authority_view::
has_userinfo() const noexcept
{
    auto n = u_.len(id_pass);
    if(n == 0)
        return false;
    BOOST_ASSERT(u_.get(
        id_pass).ends_with('@'));
    return true;
}

pct_string_view
authority_view::
encoded_userinfo() const noexcept
{
    auto s = u_.get(
        id_user, id_host);
    if(s.empty())
        return s;
    BOOST_ASSERT(
        s.ends_with('@'));
    s.remove_suffix(1);
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        u_.decoded_[id_user] +
            u_.decoded_[id_pass] +
            has_password());
}

pct_string_view
authority_view::
encoded_user() const noexcept
{
    auto s = u_.get(id_user);
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        u_.decoded_[id_user]);
}

bool
authority_view::
has_password() const noexcept
{
    auto const n = u_.len(id_pass);
    if(n > 1)
    {
        BOOST_ASSERT(u_.get(id_pass
            ).starts_with(':'));
        BOOST_ASSERT(u_.get(id_pass
            ).ends_with('@'));
        return true;
    }
    BOOST_ASSERT(n == 0 || u_.get(
        id_pass).ends_with('@'));
    return false;
}

pct_string_view
authority_view::
encoded_password() const noexcept
{
    auto s = u_.get(id_pass);
    switch(s.size())
    {
    case 1:
        BOOST_ASSERT(
            s.starts_with('@'));
        s.remove_prefix(1);
        BOOST_FALLTHROUGH;
    case 0:
        return make_pct_string_view_unsafe(
            s.data(), s.size(), 0);
    default:
        break;
    }
    BOOST_ASSERT(s.ends_with('@'));
    BOOST_ASSERT(s.starts_with(':'));
    return make_pct_string_view_unsafe(
        s.data() + 1,
        s.size() - 2,
        u_.decoded_[id_pass]);
}

//------------------------------------------------
//
// Host
//
//------------------------------------------------
/*
host_type       host_type()                 // ipv4, ipv6, ipvfuture, name

std::string     host()                      // return encoded_host().decode()
pct_string_view encoded_host()              // return host part, as-is
std::string     host_address()              // return encoded_host_address().decode()
pct_string_view encoded_host_address()      // ipv4, ipv6, ipvfut, or encoded name, no brackets

ipv4_address    host_ipv4_address()         // return ipv4_address or {}
ipv6_address    host_ipv6_address()         // return ipv6_address or {}
string_view     host_ipvfuture()            // return ipvfuture or {}
std::string     host_name()                 // return decoded name or ""
pct_string_view encoded_host_name()         // return encoded host name or ""
*/

pct_string_view
authority_view::
encoded_host() const noexcept
{
    return u_.pct_get(id_host);
}

pct_string_view
authority_view::
encoded_host_address() const noexcept
{
    string_view s = u_.get(id_host);
    std::size_t n;
    switch(u_.host_type_)
    {
    default:
    case urls::host_type::none:
        BOOST_ASSERT(s.empty());
        n = 0;
        break;

    case urls::host_type::name:
    case urls::host_type::ipv4:
        n = u_.decoded_[id_host];
        break;

    case urls::host_type::ipv6:
    case urls::host_type::ipvfuture:
    {
        BOOST_ASSERT(
            u_.decoded_[id_host] ==
                s.size());
        BOOST_ASSERT(s.size() >= 2);
        BOOST_ASSERT(s.front() == '[');
        BOOST_ASSERT(s.back() == ']');
        s = s.substr(1, s.size() - 2);
        n = u_.decoded_[id_host] - 2;
        break;
    }
    }
    return make_pct_string_view_unsafe(
        s.data(), s.size(), n);
}

urls::ipv4_address
authority_view::
host_ipv4_address() const noexcept
{
    if(u_.host_type_ !=
            urls::host_type::ipv4)
        return {};
    ipv4_address::bytes_type b{{}};
    std::memcpy(
        &b[0], &u_.ip_addr_[0], b.size());
    return urls::ipv4_address(b);
}

urls::ipv6_address
authority_view::
host_ipv6_address() const noexcept
{
    if(u_.host_type_ !=
            urls::host_type::ipv6)
        return {};
    ipv6_address::bytes_type b{{}};
    std::memcpy(
        &b[0], &u_.ip_addr_[0], b.size());
    return urls::ipv6_address(b);
}

string_view
authority_view::
host_ipvfuture() const noexcept
{
    if(u_.host_type_ !=
            urls::host_type::ipvfuture)
        return {};
    string_view s = u_.get(id_host);
    BOOST_ASSERT(s.size() >= 6);
    BOOST_ASSERT(s.front() == '[');
    BOOST_ASSERT(s.back() == ']');
    s = s.substr(1, s.size() - 2);
    return s;
}

pct_string_view
authority_view::
encoded_host_name() const noexcept
{
    if(u_.host_type_ !=
            urls::host_type::name)
        return {};
    return u_.pct_get(id_host);
}

//------------------------------------------------
//
// Port
//
//------------------------------------------------

bool
authority_view::
has_port() const noexcept
{
    auto const n = u_.len(id_port);
    if(n == 0)
        return false;
    BOOST_ASSERT(
        u_.get(id_port).starts_with(':'));
    return true;
}

string_view
authority_view::
port() const noexcept
{
    auto s = u_.get(id_port);
    if(s.empty())
        return s;
    BOOST_ASSERT(has_port());
    return s.substr(1);
}

std::uint16_t
authority_view::
port_number() const noexcept
{
    BOOST_ASSERT(
        has_port() ||
        u_.port_number_ == 0);
    return u_.port_number_;
}

pct_string_view
authority_view::
encoded_host_and_port() const noexcept
{
    return u_.get(id_host, id_end);
}

//------------------------------------------------
//
// Parsing
//
//------------------------------------------------

result<authority_view>
parse_authority(
    string_view s) noexcept
{
    return grammar::parse(s, authority_rule);
}

} // urls
} // boost

#endif
