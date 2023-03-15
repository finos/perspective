//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_URL_VIEW_BASE_IPP
#define BOOST_URL_IMPL_URL_VIEW_BASE_IPP

#include <boost/url/url_view_base.hpp>
#include <boost/url/detail/except.hpp>
#include <boost/url/detail/over_allocator.hpp>

namespace boost {
namespace urls {

// construct empty view
url_view_base::
url_view_base() noexcept
    : impl_(from::url)
    , pi_(&impl_)
{
}

// construct reference
url_view_base::
url_view_base(
    detail::url_impl const& impl) noexcept
    : impl_(impl)
    , pi_(&impl_)
{
}

//------------------------------------------------

std::size_t
url_view_base::
digest(std::size_t salt) const noexcept
{
    detail::fnv_1a h(salt);
    detail::ci_digest(pi_->get(id_scheme), h);
    detail::digest_encoded(pi_->get(id_user), h);
    detail::digest_encoded(pi_->get(id_pass), h);
    detail::ci_digest_encoded(pi_->get(id_host), h);
    h.put(pi_->get(id_port));
    detail::normalized_path_digest(
        pi_->get(id_path), is_path_absolute(), h);
    detail::digest_encoded(pi_->get(id_query), h);
    detail::digest_encoded(pi_->get(id_frag), h);
    return h.digest();
}

//------------------------------------------------
//
// Observers
//
//------------------------------------------------

struct url_view_base::shared_impl
    : url_view
{
    virtual
    ~shared_impl()
    {
    }

    shared_impl(
        url_view const& u) noexcept
        : url_view(u)
    {
        impl_.cs_ = reinterpret_cast<
            char const*>(this + 1);
    }
};

std::shared_ptr<url_view const>
url_view_base::
persist() const
{
    using T = shared_impl;
    using Alloc = std::allocator<char>;
    Alloc a;
    auto p = std::allocate_shared<T>(
        detail::over_allocator<T, Alloc>(
            size(), a), url_view(*pi_));
    std::memcpy(
        reinterpret_cast<char*>(
            p.get() + 1), data(), size());
    return p;
}

//------------------------------------------------
//
// Scheme
//
//------------------------------------------------

bool
url_view_base::
has_scheme() const noexcept
{
    auto const n = pi_->len(
        id_scheme);
    if(n == 0)
        return false;
    BOOST_ASSERT(n > 1);
    BOOST_ASSERT(
        pi_->get(id_scheme
            ).ends_with(':'));
    return true;
}

string_view
url_view_base::
scheme() const noexcept
{
    auto s = pi_->get(id_scheme);
    if(! s.empty())
    {
        BOOST_ASSERT(s.size() > 1);
        BOOST_ASSERT(s.ends_with(':'));
        s.remove_suffix(1);
    }
    return s;
}

urls::scheme
url_view_base::
scheme_id() const noexcept
{
    return pi_->scheme_;
}

//------------------------------------------------
//
// Authority
//
//------------------------------------------------

authority_view
url_view_base::
authority() const noexcept
{
    detail::url_impl u(from::authority);
    u.cs_ = encoded_authority().data();
    if(has_authority())
    {
        u.set_size(id_user, pi_->len(id_user) - 2);
        u.set_size(id_pass, pi_->len(id_pass));
        u.set_size(id_host, pi_->len(id_host));
        u.set_size(id_port, pi_->len(id_port));
    }
    else
    {
        u.set_size(id_user, pi_->len(id_user));
        BOOST_ASSERT(pi_->len(id_pass) == 0);
        BOOST_ASSERT(pi_->len(id_host) == 0);
        BOOST_ASSERT(pi_->len(id_port) == 0);
    }
    u.decoded_[id_user] = pi_->decoded_[id_user];
    u.decoded_[id_pass] = pi_->decoded_[id_pass];
    u.decoded_[id_host] = pi_->decoded_[id_host];
    for (int i = 0; i < 16; ++i)
        u.ip_addr_[i] = pi_->ip_addr_[i];
    u.port_number_ = pi_->port_number_;
    u.host_type_ = pi_->host_type_;
    return u.construct_authority();
}

pct_string_view
url_view_base::
encoded_authority() const noexcept
{
    auto s = pi_->get(id_user, id_path);
    if(! s.empty())
    {
        BOOST_ASSERT(has_authority());
        s.remove_prefix(2);
    }
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        pi_->decoded_[id_user] +
            pi_->decoded_[id_pass] +
            pi_->decoded_[id_host] +
            pi_->decoded_[id_port] +
            has_password());
}

//------------------------------------------------
//
// Userinfo
//
//------------------------------------------------

bool
url_view_base::
has_userinfo() const noexcept
{
    auto n = pi_->len(id_pass);
    if(n == 0)
        return false;
    BOOST_ASSERT(has_authority());
    BOOST_ASSERT(pi_->get(
        id_pass).ends_with('@'));
    return true;
}

bool
url_view_base::
has_password() const noexcept
{
    auto const n = pi_->len(id_pass);
    if(n > 1)
    {
        BOOST_ASSERT(pi_->get(id_pass
            ).starts_with(':'));
        BOOST_ASSERT(pi_->get(id_pass
            ).ends_with('@'));
        return true;
    }
    BOOST_ASSERT(n == 0 || pi_->get(
        id_pass).ends_with('@'));
    return false;
}

pct_string_view
url_view_base::
encoded_userinfo() const noexcept
{
    auto s = pi_->get(
        id_user, id_host);
    if(s.empty())
        return s;
    BOOST_ASSERT(
        has_authority());
    s.remove_prefix(2);
    if(s.empty())
        return s;
    BOOST_ASSERT(
        s.ends_with('@'));
    s.remove_suffix(1);
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        pi_->decoded_[id_user] +
            pi_->decoded_[id_pass] +
            has_password());
}

pct_string_view
url_view_base::
encoded_user() const noexcept
{
    auto s = pi_->get(id_user);
    if(! s.empty())
    {
        BOOST_ASSERT(
            has_authority());
        s.remove_prefix(2);
    }
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        pi_->decoded_[id_user]);
}

pct_string_view
url_view_base::
encoded_password() const noexcept
{
    auto s = pi_->get(id_pass);
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
        pi_->decoded_[id_pass]);
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
url_view_base::
encoded_host() const noexcept
{
    return pi_->pct_get(id_host);
}

pct_string_view
url_view_base::
encoded_host_address() const noexcept
{
    string_view s = pi_->get(id_host);
    std::size_t n;
    switch(pi_->host_type_)
    {
    default:
    case urls::host_type::none:
        BOOST_ASSERT(s.empty());
        n = 0;
        break;

    case urls::host_type::name:
    case urls::host_type::ipv4:
        n = pi_->decoded_[id_host];
        break;

    case urls::host_type::ipv6:
    case urls::host_type::ipvfuture:
    {
        BOOST_ASSERT(
            pi_->decoded_[id_host] ==
                s.size());
        BOOST_ASSERT(s.size() >= 2);
        BOOST_ASSERT(s.front() == '[');
        BOOST_ASSERT(s.back() == ']');
        s = s.substr(1, s.size() - 2);
        n = pi_->decoded_[id_host] - 2;
        break;
    }
    }
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        n);
}

urls::ipv4_address
url_view_base::
host_ipv4_address() const noexcept
{
    if(pi_->host_type_ !=
            urls::host_type::ipv4)
        return {};
    ipv4_address::bytes_type b{{}};
    std::memcpy(
        &b[0], &pi_->ip_addr_[0], b.size());
    return urls::ipv4_address(b);
}

urls::ipv6_address
url_view_base::
host_ipv6_address() const noexcept
{
    if(pi_->host_type_ !=
            urls::host_type::ipv6)
        return {};
    ipv6_address::bytes_type b{{}};
    std::memcpy(
        &b[0], &pi_->ip_addr_[0], b.size());
    return urls::ipv6_address(b);
}

string_view
url_view_base::
host_ipvfuture() const noexcept
{
    if(pi_->host_type_ !=
            urls::host_type::ipvfuture)
        return {};
    string_view s = pi_->get(id_host);
    BOOST_ASSERT(s.size() >= 6);
    BOOST_ASSERT(s.front() == '[');
    BOOST_ASSERT(s.back() == ']');
    s = s.substr(1, s.size() - 2);
    return s;
}

pct_string_view
url_view_base::
encoded_host_name() const noexcept
{
    if(pi_->host_type_ !=
            urls::host_type::name)
        return {};
    string_view s = pi_->get(id_host);
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        pi_->decoded_[id_host]);
}

//------------------------------------------------

bool
url_view_base::
has_port() const noexcept
{
    auto const n = pi_->len(id_port);
    if(n == 0)
        return false;
    BOOST_ASSERT(
        pi_->get(id_port).starts_with(':'));
    return true;
}

string_view
url_view_base::
port() const noexcept
{
    auto s = pi_->get(id_port);
    if(s.empty())
        return s;
    BOOST_ASSERT(has_port());
    return s.substr(1);
}

std::uint16_t
url_view_base::
port_number() const noexcept
{
    BOOST_ASSERT(
        has_port() ||
        pi_->port_number_ == 0);
    return pi_->port_number_;
}

//------------------------------------------------
//
// Path
//
//------------------------------------------------

pct_string_view
url_view_base::
encoded_path() const noexcept
{
    return pi_->pct_get(id_path);
}

segments_view
url_view_base::
segments() const noexcept
{
    return {detail::path_ref(*pi_)};
}

segments_encoded_view
url_view_base::
encoded_segments() const noexcept
{
    return segments_encoded_view(
        detail::path_ref(*pi_));
}

//------------------------------------------------
//
// Query
//
//------------------------------------------------

bool
url_view_base::
has_query() const noexcept
{
    auto const n = pi_->len(
        id_query);
    if(n == 0)
        return false;
    BOOST_ASSERT(
        pi_->get(id_query).
            starts_with('?'));
    return true;
}

pct_string_view
url_view_base::
encoded_query() const noexcept
{
    auto s = pi_->get(id_query);
    if(s.empty())
        return s;
    BOOST_ASSERT(
        s.starts_with('?'));
    return s.substr(1);
}

params_encoded_view
url_view_base::
encoded_params() const noexcept
{
    return params_encoded_view(*pi_);
}

params_view
url_view_base::
params() const noexcept
{
    return params_view(
        *pi_,
        encoding_opts{
            true,false,false});
}

params_view
url_view_base::
params(encoding_opts opt) const noexcept
{
    return params_view(*pi_, opt);
}

//------------------------------------------------
//
// Fragment
//
//------------------------------------------------

bool
url_view_base::
has_fragment() const noexcept
{
    auto const n = pi_->len(id_frag);
    if(n == 0)
        return false;
    BOOST_ASSERT(
        pi_->get(id_frag).
            starts_with('#'));
    return true;
}

pct_string_view
url_view_base::
encoded_fragment() const noexcept
{
    auto s = pi_->get(id_frag);
    if(! s.empty())
    {
        BOOST_ASSERT(
            s.starts_with('#'));
        s.remove_prefix(1);
    }
    return make_pct_string_view_unsafe(
        s.data(),
        s.size(),
        pi_->decoded_[id_frag]);
}

//------------------------------------------------
//
// Compound Fields
//
//------------------------------------------------

pct_string_view
url_view_base::
encoded_host_and_port() const noexcept
{
    return pi_->pct_get(id_host, id_path);
}

pct_string_view
url_view_base::
encoded_origin() const noexcept
{
    if(pi_->len(id_user) < 2)
        return {};
    return pi_->get(id_scheme, id_path);
}

pct_string_view
url_view_base::
encoded_resource() const noexcept
{
    auto n =
        pi_->decoded_[id_path] +
        pi_->decoded_[id_query] +
        pi_->decoded_[id_frag];
    if(has_query())
        ++n;
    if(has_fragment())
        ++n;
    BOOST_ASSERT(pct_string_view(
        pi_->get(id_path, id_end)
            ).decoded_size() == n);
    auto s = pi_->get(id_path, id_end);
    return make_pct_string_view_unsafe(
        s.data(), s.size(), n);
}

pct_string_view
url_view_base::
encoded_target() const noexcept
{
    auto n =
        pi_->decoded_[id_path] +
        pi_->decoded_[id_query];
    if(has_query())
        ++n;
    BOOST_ASSERT(pct_string_view(
        pi_->get(id_path, id_frag)
            ).decoded_size() == n);
    auto s = pi_->get(id_path, id_frag);
    return make_pct_string_view_unsafe(
        s.data(), s.size(), n);
}

//------------------------------------------------
//
// Comparisons
//
//------------------------------------------------

int
url_view_base::
compare(const url_view_base& other) const noexcept
{
    int comp = detail::ci_compare(
        scheme(),
        other.scheme());
    if ( comp != 0 )
        return comp;

    comp = detail::compare_encoded(
        encoded_user(),
        other.encoded_user());
    if ( comp != 0 )
        return comp;

    comp = detail::compare_encoded(
        encoded_password(),
        other.encoded_password());
    if ( comp != 0 )
        return comp;

    comp = detail::ci_compare_encoded(
        encoded_host(),
        other.encoded_host());
    if ( comp != 0 )
        return comp;

    comp = detail::compare(
        port(),
        other.port());
    if ( comp != 0 )
        return comp;

    comp = detail::segments_compare(
        encoded_segments(),
        other.encoded_segments());
    if ( comp != 0 )
        return comp;

    comp = detail::compare_encoded(
        encoded_query(),
        other.encoded_query());
    if ( comp != 0 )
        return comp;

    comp = detail::compare_encoded(
        encoded_fragment(),
        other.encoded_fragment());
    if ( comp != 0 )
        return comp;

    return 0;
}

} // urls
} // boost

#endif
