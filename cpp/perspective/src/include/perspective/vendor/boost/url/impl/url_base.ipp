//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_URL_BASE_IPP
#define BOOST_URL_IMPL_URL_BASE_IPP

#include <boost/url/url_base.hpp>
#include <boost/url/error.hpp>
#include <boost/url/host_type.hpp>
#include <boost/url/scheme.hpp>
#include <boost/url/url_view.hpp>
#include <boost/url/detail/any_params_iter.hpp>
#include <boost/url/detail/any_segments_iter.hpp>
#include <boost/url/detail/encode.hpp>
#include <boost/url/detail/except.hpp>
#include <boost/url/detail/move_chars.hpp>
#include <boost/url/detail/print.hpp>
#include <boost/url/rfc/authority_rule.hpp>
#include <boost/url/rfc/query_rule.hpp>
#include <boost/url/rfc/detail/charsets.hpp>
#include <boost/url/rfc/detail/host_rule.hpp>
#include <boost/url/rfc/detail/ipvfuture_rule.hpp>
#include <boost/url/rfc/detail/path_rules.hpp>
#include <boost/url/rfc/detail/port_rule.hpp>
#include <boost/url/rfc/detail/scheme_rule.hpp>
#include <boost/url/rfc/detail/userinfo_rule.hpp>
#include <boost/url/grammar/parse.hpp>
#include <cstring>
#include <iostream>
#include <stdexcept>
#include <utility>

namespace boost {
namespace urls {

//------------------------------------------------

// these objects help handle the cases
// where the user passes in strings that
// come from inside the url buffer.

url_base::
op_t::
~op_t()
{
    if(old)
        u.cleanup(*this);
    u.check_invariants();
}

url_base::
op_t::
op_t(
    url_base& impl_,
    string_view* s0_,
    string_view* s1_) noexcept
    : u(impl_)
    , s0(s0_)
    , s1(s1_)
{
    u.check_invariants();
}

void
url_base::
op_t::
move(
    char* dest,
    char const* src,
    std::size_t n) noexcept
{
    if(! n)
        return;
    if(s0)
    {
        if(s1)
            return detail::move_chars(
             dest, src, n, *s0, *s1);
        return detail::move_chars(
            dest, src, n, *s0);
    }
    detail::move_chars(
        dest, src, n);
}

//------------------------------------------------

// construct reference
url_base::
url_base(
    detail::url_impl const& impl) noexcept
    : url_view_base(impl)
{
}

void
url_base::
reserve_impl(std::size_t n)
{
    op_t op(*this);
    reserve_impl(n, op);
    if(s_)
        s_[size()] = '\0';
}

// make a copy of u
void
url_base::
copy(url_view_base const& u)
{
    if (this == &u)
        return;
    op_t op(*this);
    if(u.size() == 0)
    {
        clear();
        return;
    }
    reserve_impl(
        u.size(), op);
    impl_ = u.impl_;
    impl_.cs_ = s_;
    impl_.from_ = {from::url};
    std::memcpy(s_,
        u.data(), u.size());
    s_[size()] = '\0';
}

//------------------------------------------------
//
// Scheme
//
//------------------------------------------------

url_base&
url_base::
set_scheme(string_view s)
{
    set_scheme_impl(
        s, string_to_scheme(s));
    return *this;
}

url_base&
url_base::
set_scheme_id(urls::scheme id)
{
    if(id == urls::scheme::unknown)
        detail::throw_invalid_argument();
    if(id == urls::scheme::none)
        return remove_scheme();
    set_scheme_impl(to_string(id), id);
    return *this;
}

url_base&
url_base::
remove_scheme()
{
    op_t op(*this);
    auto const sn = impl_.len(id_scheme);
    if(sn == 0)
        return *this;
    auto const po = impl_.offset(id_path);
    auto fseg = first_segment();
    bool const encode_colon =
        !has_authority() &&
        impl_.nseg_ > 0 &&
        s_[po] != '/' &&
        fseg.contains(':');
    if(!encode_colon)
    {
        // just remove the scheme
        resize_impl(id_scheme, 0, op);
        impl_.scheme_ = urls::scheme::none;
        check_invariants();
        return *this;
    }
    // encode any ":" in the first path segment
    BOOST_ASSERT(sn >= 2);
    auto pn = impl_.len(id_path);
    std::size_t cn = 0;
    for (char c: fseg)
        cn += c == ':';
    std::size_t new_size =
        size() - sn + 2 * cn;
    bool need_resize = new_size > size();
    if (need_resize)
    {
        resize_impl(
            id_path, pn + 2 * cn, op);
    }
    // move [id_scheme, id_path) left
    op.move(
        s_,
        s_ + sn,
        po - sn);
    // move [id_path, id_query) left
    auto qo = impl_.offset(id_query);
    op.move(
        s_ + po - sn,
        s_ + po,
        qo - po);
    // move [id_query, id_end) left
    op.move(
        s_ + qo - sn + 2 * cn,
        s_ + qo,
        impl_.offset(id_end) - qo);

    // adjust part offsets.
    // (po and qo are invalidated)
    if (need_resize)
    {
        impl_.adjust(id_user, id_end, 0 - sn);
    }
    else
    {
        impl_.adjust(id_user, id_path, 0 - sn);
        impl_.adjust(id_query, id_end, 0 - sn + 2 * cn);
    }
    if (encode_colon)
    {
        // move the 2nd, 3rd, ... segments
        auto begin = s_ + impl_.offset(id_path);
        auto it = begin;
        auto end = begin + pn;
        while (*it != '/' &&
               it != end)
            ++it;
        // we don't need op here because this is
        // an internal operation
        std::memmove(it + (2 * cn), it, end - it);

        // move 1st segment
        auto src = s_ + impl_.offset(id_path) + pn;
        auto dest = s_ + impl_.offset(id_query);
        src -= end - it;
        dest -= end - it;
        pn -= end - it;
        do {
            --src;
            --dest;
            if (*src != ':')
            {
                *dest = *src;
            }
            else
            {
                // use uppercase as required by
                // syntax-based normalization
                *dest-- = 'A';
                *dest-- = '3';
                *dest = '%';
            }
            --pn;
        } while (pn);
    }
    s_[size()] = '\0';
    impl_.scheme_ = urls::scheme::none;
    return *this;
}

//------------------------------------------------
//
// Authority
//
//------------------------------------------------

url_base&
url_base::
set_encoded_authority(
    pct_string_view s)
{
    op_t op(*this, &detail::ref(s));
    authority_view a = grammar::parse(
        s, authority_rule
            ).value(BOOST_URL_POS);
    auto n = s.size() + 2;
    auto const need_slash =
        ! is_path_absolute() &&
        impl_.len(id_path) > 0;
    if(need_slash)
        ++n;
    auto dest = resize_impl(
        id_user, id_path, n, op);
    dest[0] = '/';
    dest[1] = '/';
    std::memcpy(dest + 2,
        s.data(), s.size());
    if(need_slash)
        dest[n - 1] = '/';
    impl_.apply_authority(a);
    if(need_slash)
        impl_.adjust(
            id_query, id_end, 1);
    return *this;
}

url_base&
url_base::
remove_authority()
{
    if(! has_authority())
        return *this;

    op_t op(*this);
    auto path = impl_.get(id_path);
    bool const need_dot = path.starts_with("//");
    if(need_dot)
    {
        // prepend "/.", can't throw
        auto p = resize_impl(
            id_user, id_path, 2, op);
        p[0] = '/';
        p[1] = '.';
        impl_.split(id_user, 0);
        impl_.split(id_pass, 0);
        impl_.split(id_host, 0);
        impl_.split(id_port, 0);
    }
    else
    {
        resize_impl(
            id_user, id_path, 0, op);
    }
    impl_.host_type_ =
        urls::host_type::none;
    return *this;
}

//------------------------------------------------
//
// Userinfo
//
//------------------------------------------------

url_base&
url_base::
set_userinfo(
    string_view s)
{
    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s, detail::userinfo_chars, opt);
    auto dest = set_userinfo_impl(n, op);
    encode(
        dest,
        n,
        s,
        detail::userinfo_chars,
        opt);
    auto const pos = impl_.get(
        id_user, id_host
            ).find_first_of(':');
    if(pos != string_view::npos)
    {
        impl_.split(id_user, pos);
        // find ':' in plain string
        auto const pos2 =
            s.find_first_of(':');
        impl_.decoded_[id_user] =
            pos2 - 1;
        impl_.decoded_[id_pass] =
            s.size() - pos2;
    }
    else
    {
        impl_.decoded_[id_user] = s.size();
        impl_.decoded_[id_pass] = 0;
    }
    return *this;
}

url_base&
url_base::
set_encoded_userinfo(
    pct_string_view s)
{
    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const pos = s.find_first_of(':');
    if(pos != string_view::npos)
    {
        // user:pass
        auto const s0 = s.substr(0, pos);
        auto const s1 = s.substr(pos + 1);
        auto const n0 =
            detail::re_encoded_size_unsafe(
                s0,
                detail::user_chars,
                opt);
        auto const n1 =
            detail::re_encoded_size_unsafe(s1,
                detail::password_chars,
                opt);
        auto dest =
            set_userinfo_impl(n0 + n1 + 1, op);
        impl_.decoded_[id_user] =
            detail::re_encode_unsafe(
                dest,
                dest + n0,
                s0,
                detail::user_chars,
                opt);
        *dest++ = ':';
        impl_.decoded_[id_pass] =
            detail::re_encode_unsafe(
                dest,
                dest + n1,
                s1,
                detail::password_chars,
                opt);
        impl_.split(id_user, 2 + n0);
    }
    else
    {
        // user
        auto const n =
            detail::re_encoded_size_unsafe(
                s, detail::user_chars, opt);
        auto dest = set_userinfo_impl(n, op);
        impl_.decoded_[id_user] =
            detail::re_encode_unsafe(
                dest,
                dest + n,
                s,
                detail::user_chars,
                opt);
        impl_.split(id_user, 2 + n);
        impl_.decoded_[id_pass] = 0;
    }
    return *this;
}

url_base&
url_base::
remove_userinfo() noexcept
{
    if(impl_.len(id_pass) == 0)
        return *this; // no userinfo

    op_t op(*this);
    // keep authority '//'
    resize_impl(
        id_user, id_host, 2, op);
    impl_.decoded_[id_user] = 0;
    impl_.decoded_[id_pass] = 0;
    return *this;
}

//------------------------------------------------

url_base&
url_base::
set_user(string_view s)
{
    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s, detail::user_chars, opt);
    auto dest = set_user_impl(n, op);
    encode_unsafe(
        dest,
        n,
        s,
        detail::user_chars,
        opt);
    impl_.decoded_[id_user] = s.size();
    return *this;
}

url_base&
url_base::
set_encoded_user(
    pct_string_view s)
{
    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const n =
        detail::re_encoded_size_unsafe(
            s, detail::user_chars, opt);
    auto dest = set_user_impl(n, op);
    impl_.decoded_[id_user] =
        detail::re_encode_unsafe(
            dest,
            dest + n,
            s,
            detail::user_chars,
            opt);
    BOOST_ASSERT(
        impl_.decoded_[id_user] ==
            s.decoded_size());
    return *this;
}

//------------------------------------------------

url_base&
url_base::
set_password(string_view s)
{
    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s, detail::password_chars, opt);
    auto dest = set_password_impl(n, op);
    encode_unsafe(
        dest,
        n,
        s,
        detail::password_chars,
        opt);
    impl_.decoded_[id_pass] = s.size();
    return *this;
}

url_base&
url_base::
set_encoded_password(
    pct_string_view s)
{
    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const n =
        detail::re_encoded_size_unsafe(
            s,
            detail::password_chars,
            opt);
    auto dest = set_password_impl(n, op);
    impl_.decoded_[id_pass] =
        detail::re_encode_unsafe(
            dest,
            dest + n,
            s,
            detail::password_chars,
            opt);
    BOOST_ASSERT(
        impl_.decoded_[id_pass] ==
            s.decoded_size());
    return *this;
}

url_base&
url_base::
remove_password() noexcept
{
    auto const n = impl_.len(id_pass);
    if(n < 2)
        return *this; // no password

    op_t op(*this);
    // clear password, retain '@'
    auto dest =
        resize_impl(id_pass, 1, op);
    dest[0] = '@';
    impl_.decoded_[id_pass] = 0;
    return *this;
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

--------------------------------------------------

set_host( string_view )                     // set host part from plain text
set_encoded_host( pct_string_view )         // set host part from encoded text
set_host_address( string_view )             // set host from ipv4, ipv6, ipvfut, or plain reg-name string
set_encoded_host_address( pct_string_view ) // set host from ipv4, ipv6, ipvfut, or encoded reg-name string

set_host_ipv4( ipv4_address )               // set ipv4
set_host_ipv6( ipv6_address )               // set ipv6
set_host_ipvfuture( string_view )           // set ipvfuture
set_host_name( string_view )                // set name from plain
set_encoded_host_name( pct_string_view )    // set name from encoded
*/

// set host part from plain text
url_base&
url_base::
set_host(
    string_view s)
{
    if( s.size() > 2 &&
        s.front() == '[' &&
        s.back() == ']')
    {
        // IP-literal
        {
            // IPv6-address
            auto rv = parse_ipv6_address(
                s.substr(1, s.size() - 2));
            if(rv)
                return set_host_ipv6(*rv);
        }
        {
            // IPvFuture
            auto rv = grammar::parse(
                s.substr(1, s.size() - 2),
                    detail::ipvfuture_rule);
            if(rv)
                return set_host_ipvfuture(rv->str);
        }
    }
    else if(s.size() >= 7) // "0.0.0.0"
    {
        // IPv4-address
        auto rv = parse_ipv4_address(s);
        if(rv)
            return set_host_ipv4(*rv);
    }

    // reg-name
    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s, detail::host_chars, opt);
    auto dest = set_host_impl(n, op);
    encode(
        dest,
        impl_.get(id_path).data() - dest,
        s,
        detail::host_chars,
        opt);
    impl_.decoded_[id_host] = s.size();
    impl_.host_type_ =
        urls::host_type::name;
    return *this;
}

// set host part from encoded text
url_base&
url_base::
set_encoded_host(
    pct_string_view s)
{
    if( s.size() > 2 &&
        s.front() == '[' &&
        s.back() == ']')
    {
        // IP-literal
        {
            // IPv6-address
            auto rv = parse_ipv6_address(
                s.substr(1, s.size() - 2));
            if(rv)
                return set_host_ipv6(*rv);
        }
        {
            // IPvFuture
            auto rv = grammar::parse(
                s.substr(1, s.size() - 2),
                    detail::ipvfuture_rule);
            if(rv)
                return set_host_ipvfuture(rv->str);
        }
    }
    else if(s.size() >= 7) // "0.0.0.0"
    {
        // IPv4-address
        auto rv = parse_ipv4_address(s);
        if(rv)
            return set_host_ipv4(*rv);
    }

    // reg-name
    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const n = detail::re_encoded_size_unsafe(
        s, detail::host_chars, opt);
    auto dest = set_host_impl(n, op);
    impl_.decoded_[id_host] =
        detail::re_encode_unsafe(
            dest,
            impl_.get(id_path).data(),
            s,
            detail::host_chars,
            opt);
    BOOST_ASSERT(impl_.decoded_[id_host] ==
        s.decoded_size());
    impl_.host_type_ =
        urls::host_type::name;
    return *this;
}

url_base&
url_base::
set_host_address(
    string_view s)
{
    {
        // IPv6-address
        auto rv = parse_ipv6_address(s);
        if(rv)
            return set_host_ipv6(*rv);
    }
    {
        // IPvFuture
        auto rv = grammar::parse(
            s, detail::ipvfuture_rule);
        if(rv)
            return set_host_ipvfuture(rv->str);
    }
    if(s.size() >= 7) // "0.0.0.0"
    {
        // IPv4-address
        auto rv = parse_ipv4_address(s);
        if(rv)
            return set_host_ipv4(*rv);
    }

    // reg-name
    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s, detail::host_chars, opt);
    auto dest = set_host_impl(n, op);
    encode(
        dest,
        impl_.get(id_path).data() - dest,
        s,
        detail::host_chars,
        opt);
    impl_.decoded_[id_host] = s.size();
    impl_.host_type_ =
        urls::host_type::name;
    return *this;
}

url_base&
url_base::
set_encoded_host_address(
    pct_string_view s)
{
    {
        // IPv6-address
        auto rv = parse_ipv6_address(s);
        if(rv)
            return set_host_ipv6(*rv);
    }
    {
        // IPvFuture
        auto rv = grammar::parse(
            s, detail::ipvfuture_rule);
        if(rv)
            return set_host_ipvfuture(rv->str);
    }
    if(s.size() >= 7) // "0.0.0.0"
    {
        // IPv4-address
        auto rv = parse_ipv4_address(s);
        if(rv)
            return set_host_ipv4(*rv);
    }

    // reg-name
    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const n = detail::re_encoded_size_unsafe(
        s, detail::host_chars, opt);
    auto dest = set_host_impl(n, op);
    impl_.decoded_[id_host] =
        detail::re_encode_unsafe(
            dest,
            impl_.get(id_path).data(),
            s,
            detail::host_chars,
            opt);
    BOOST_ASSERT(impl_.decoded_[id_host] ==
        s.decoded_size());
    impl_.host_type_ =
        urls::host_type::name;
    return *this;
}

url_base&
url_base::
set_host_ipv4(
    ipv4_address const& addr)
{
    op_t op(*this);
    char buf[urls::ipv4_address::max_str_len];
    auto s = addr.to_buffer(buf, sizeof(buf));
    auto dest = set_host_impl(s.size(), op);
    std::memcpy(dest, s.data(), s.size());
    impl_.decoded_[id_host] = impl_.len(id_host);
    impl_.host_type_ = urls::host_type::ipv4;
    auto bytes = addr.to_bytes();
    std::memcpy(
        impl_.ip_addr_,
        bytes.data(),
        bytes.size());
    return *this;
}

url_base&
url_base::
set_host_ipv6(
    ipv6_address const& addr)
{
    op_t op(*this);
    char buf[2 +
        urls::ipv6_address::max_str_len];
    auto s = addr.to_buffer(
        buf + 1, sizeof(buf) - 2);
    buf[0] = '[';
    buf[s.size() + 1] = ']';
    auto const n = s.size() + 2;
    auto dest = set_host_impl(n, op);
    std::memcpy(dest, buf, n);
    impl_.decoded_[id_host] = n;
    impl_.host_type_ = urls::host_type::ipv6;
    auto bytes = addr.to_bytes();
    std::memcpy(
        impl_.ip_addr_,
        bytes.data(),
        bytes.size());
    return *this;
}

url_base&
url_base::
set_host_ipvfuture(
    string_view s)
{
    op_t op(*this, &s);
    // validate
    grammar::parse(s,
        detail::ipvfuture_rule
            ).value(BOOST_URL_POS);
    auto dest = set_host_impl(
        s.size() + 2, op);
    *dest++ = '[';
    dest += s.copy(dest, s.size());
    *dest = ']';
    impl_.host_type_ =
        urls::host_type::ipvfuture;
    impl_.decoded_[id_host] = s.size() + 2;
    return *this;
}

url_base&
url_base::
set_host_name(
    string_view s)
{
    bool is_ipv4 = false;
    if(s.size() >= 7) // "0.0.0.0"
    {
        // IPv4-address
        if(parse_ipv4_address(s).has_value())
            is_ipv4 = true;
    }
    auto allowed = detail::host_chars;
    if(is_ipv4)
        allowed = allowed - '.';

    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s, allowed, opt);
    auto dest = set_host_impl(n, op);
    encode_unsafe(
        dest,
        n,
        s,
        allowed,
        opt);
    impl_.host_type_ =
        urls::host_type::name;
    impl_.decoded_[id_host] = s.size();
    return *this;
}

url_base&
url_base::
set_encoded_host_name(
    pct_string_view s)
{
    bool is_ipv4 = false;
    if(s.size() >= 7) // "0.0.0.0"
    {
        // IPv4-address
        if(parse_ipv4_address(s).has_value())
            is_ipv4 = true;
    }
    auto allowed = detail::host_chars;
    if(is_ipv4)
        allowed = allowed - '.';

    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const n = detail::re_encoded_size_unsafe(
        s, allowed, opt);
    auto dest = set_host_impl(n, op);
    impl_.decoded_[id_host] =
        detail::re_encode_unsafe(
            dest,
            dest + n,
            s,
            allowed,
            opt);
    BOOST_ASSERT(
        impl_.decoded_[id_host] ==
            s.decoded_size());
    impl_.host_type_ =
        urls::host_type::name;
    return *this;
}

//------------------------------------------------

url_base&
url_base::
set_port_number(
    std::uint16_t n)
{
    op_t op(*this);
    auto s =
        detail::make_printed(n);
    auto dest = set_port_impl(
        s.string().size(), op);
    std::memcpy(
        dest, s.string().data(),
            s.string().size());
    impl_.port_number_ = n;
    return *this;
}

url_base&
url_base::
set_port(
    string_view s)
{
    op_t op(*this, &s);
    auto t = grammar::parse(s,
        detail::port_rule{}
            ).value(BOOST_URL_POS);
    auto dest =
        set_port_impl(t.str.size(), op);
    std::memcpy(dest,
        t.str.data(), t.str.size());
    if(t.has_number)
        impl_.port_number_ = t.number;
    else
        impl_.port_number_ = 0;
    return *this;
}

url_base&
url_base::
remove_port() noexcept
{
    op_t op(*this);
    resize_impl(id_port, 0, op);
    impl_.port_number_ = 0;
    return *this;
}

//------------------------------------------------
//
// Compound Fields
//
//------------------------------------------------

url_base&
url_base::
remove_origin()
{
    // these two calls perform 2 memmoves instead of 1
    remove_authority();
    remove_scheme();
    return *this;
}

//------------------------------------------------
//
// Path
//
//------------------------------------------------

bool
url_base::
set_path_absolute(
    bool absolute)
{
    op_t op(*this);

    // check if path empty
    if(impl_.len(id_path) == 0)
    {
        if(! absolute)
        {
            // already not absolute
            return true;
        }

        // add '/'
        auto dest = resize_impl(
            id_path, 1, op);
        *dest = '/';
        ++impl_.decoded_[id_path];
        return true;
    }

    // check if path absolute
    if(s_[impl_.offset(id_path)] == '/')
    {
        if(absolute)
        {
            // already absolute
            return true;
        }

        if( has_authority() &&
            impl_.len(id_path) > 1)
        {
            // can't do it, paths are always
            // absolute when authority present!
            return false;
        }

        auto p = encoded_path();
        auto pos = p.find_first_of(":/", 1);
        if (pos != string_view::npos &&
            p[pos] == ':')
        {
            // prepend with .
            auto n = impl_.len(id_path);
            resize_impl(id_path, n + 1, op);
            std::memmove(
                s_ + impl_.offset(id_path) + 1,
                s_ + impl_.offset(id_path), n);
            *(s_ + impl_.offset(id_path)) = '.';
            ++impl_.decoded_[id_path];
            return true;
        }

        // remove '/'
        auto n = impl_.len(id_port);
        impl_.split(id_port, n + 1);
        resize_impl(id_port, n, op);
        --impl_.decoded_[id_path];
        return true;
    }

    if(! absolute)
    {
        // already not absolute
        return true;
    }

    // add '/'
    auto n = impl_.len(id_port);
    auto dest = resize_impl(
        id_port, n + 1, op) + n;
    impl_.split(id_port, n);
    *dest = '/';
    ++impl_.decoded_[id_path];
    return true;
}

url_base&
url_base::
set_path(
    string_view s)
{
    edit_segments(
        detail::segments_iter_impl(
            detail::path_ref(impl_)),
        detail::segments_iter_impl(
            detail::path_ref(impl_), 0),
        detail::path_iter(s),
        s.starts_with('/'));
    return *this;
}

url_base&
url_base::
set_encoded_path(
    pct_string_view s)
{
    edit_segments(
        detail::segments_iter_impl(
            detail::path_ref(impl_)),
        detail::segments_iter_impl(
            detail::path_ref(impl_), 0),
        detail::path_encoded_iter(s),
        s.starts_with('/'));
    return *this;
}

segments_ref
url_base::
segments() noexcept
{
    return {*this};
}

segments_encoded_ref
url_base::
encoded_segments() noexcept
{
    return {*this};
}

//------------------------------------------------
//
// Query
//
//------------------------------------------------

url_base&
url_base::
set_query(
    string_view s)
{
    edit_params(
        detail::params_iter_impl(impl_),
        detail::params_iter_impl(impl_, 0),
        detail::query_iter(s, true));
    return *this;
}

url_base&
url_base::
set_encoded_query(
    pct_string_view s)
{
    op_t op(*this);
    encoding_opts opt;
    std::size_t n = 0;      // encoded size
    std::size_t nparam = 1; // param count
    auto const end = s.end();
    auto p = s.begin();

    // measure
    while(p != end)
    {
        if(*p == '&')
        {
            ++p;
            ++n;
            ++nparam;
        }
        else if(*p != '%')
        {
            if(detail::query_chars(*p))
                n += 1; // allowed
            else
                n += 3; // escaped
            ++p;
        }
        else
        {
            // escape
            n += 3;
            p += 3;
        }
    }

    // resize
    auto dest = resize_impl(
        id_query, n + 1, op);
    *dest++ = '?';

    // encode
    impl_.decoded_[id_query] =
        detail::re_encode_unsafe(
            dest,
            dest + n,
            s,
            detail::query_chars,
            opt);
    BOOST_ASSERT(
        impl_.decoded_[id_query] ==
            s.decoded_size());
    impl_.nparam_ = nparam;
    return *this;
}

params_ref
url_base::
params() noexcept
{
    return params_ref(
        *this,
        encoding_opts{
            true, false, false});
}

params_ref
url_base::
params(encoding_opts opt) noexcept
{
    return params_ref(*this, opt);
}

params_encoded_ref
url_base::
encoded_params() noexcept
{
    return {*this};
}

url_base&
url_base::
remove_query() noexcept
{
    op_t op(*this);
    resize_impl(id_query, 0, op);
    impl_.nparam_ = 0;
    impl_.decoded_[id_query] = 0;
    return *this;
}

//------------------------------------------------
//
// Fragment
//
//------------------------------------------------

url_base&
url_base::
remove_fragment() noexcept
{
    op_t op(*this);
    resize_impl(id_frag, 0, op);
    impl_.decoded_[id_frag] = 0;
    return *this;
}

url_base&
url_base::
set_fragment(string_view s)
{
    op_t op(*this, &s);
    encoding_opts opt;
    auto const n = encoded_size(
        s,
        detail::fragment_chars,
        opt);
    auto dest = resize_impl(
        id_frag, n + 1, op);
    *dest++ = '#';
    encode_unsafe(
        dest,
        n,
        s,
        detail::fragment_chars,
        opt);
    impl_.decoded_[id_frag] = s.size();
    return *this;
}

url_base&
url_base::
set_encoded_fragment(
    pct_string_view s)
{
    op_t op(*this, &detail::ref(s));
    encoding_opts opt;
    auto const n =
        detail::re_encoded_size_unsafe(
            s,
            detail::fragment_chars,
            opt);
    auto dest = resize_impl(
        id_frag, n + 1, op);
    *dest++ = '#';
    impl_.decoded_[id_frag] =
        detail::re_encode_unsafe(
            dest,
            dest + n,
            s,
            detail::fragment_chars,
            opt);
    BOOST_ASSERT(
        impl_.decoded_[id_frag] ==
            s.decoded_size());
    return *this;
}

//------------------------------------------------
//
// Resolution
//
//------------------------------------------------

result<void>
url_base::
resolve(
    url_view_base const& ref)
{
    if (this == &ref &&
        has_scheme())
    {
        normalize_path();
        return {};
    }

    if(! has_scheme())
    {
        BOOST_URL_RETURN_EC(error::not_a_base);
    }

    op_t op(*this);

    //
    // 5.2.2. Transform References
    // https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.2
    //

    if(ref.has_scheme())
    {
        reserve_impl(ref.size(), op);
        copy(ref);
        normalize_path();
        return {};
    }
    if(ref.has_authority())
    {
        reserve_impl(
            impl_.offset(id_user) + ref.size(), op);
        set_encoded_authority(
            ref.encoded_authority());
        set_encoded_path(
            ref.encoded_path());
        if (ref.encoded_path().empty())
            set_path_absolute(false);
        else
            normalize_path();
        if(ref.has_query())
            set_encoded_query(
                ref.encoded_query());
        else
            remove_query();
        if(ref.has_fragment())
            set_encoded_fragment(
                ref.encoded_fragment());
        else
            remove_fragment();
        return {};
    }
    if(ref.encoded_path().empty())
    {
        reserve_impl(
            impl_.offset(id_query) +
            ref.size(), op);
        normalize_path();
        if(ref.has_query())
        {
            set_encoded_query(
                ref.encoded_query());
        }
        if(ref.has_fragment())
            set_encoded_fragment(
                ref.encoded_fragment());
        return {};
    }
    if(ref.is_path_absolute())
    {
        reserve_impl(
            impl_.offset(id_path) +
                ref.size(), op);
        set_encoded_path(
            ref.encoded_path());
        normalize_path();
        if(ref.has_query())
            set_encoded_query(
                ref.encoded_query());
        else
            remove_query();
        if(ref.has_fragment())
            set_encoded_fragment(
                ref.encoded_fragment());
        else
            remove_fragment();
        return {};
    }
    // General case: ref is relative path
    reserve_impl(
        impl_.offset(id_query) +
        ref.size(), op);
    // 5.2.3. Merge Paths
    auto es = encoded_segments();
    if(es.size() > 0)
    {
        es.pop_back();
    }
    es.insert(es.end(),
        ref.encoded_segments().begin(),
        ref.encoded_segments().end());
    normalize_path();
    if(ref.has_query())
        set_encoded_query(
            ref.encoded_query());
    else
        remove_query();
    if(ref.has_fragment())
        set_encoded_fragment(
            ref.encoded_fragment());
    else
        remove_fragment();
    return {};
}

//------------------------------------------------
//
// Normalization
//
//------------------------------------------------

template <class Charset>
void
url_base::
normalize_octets_impl(
    int id,
    Charset const& allowed,
    op_t& op) noexcept
{
    char* it = s_ + impl_.offset(id);
    char* end = s_ + impl_.offset(id + 1);
    char d = 0;
    char* dest = it;
    while (it < end)
    {
        if (*it != '%')
        {
            *dest = *it;
            ++it;
            ++dest;
            continue;
        }
        BOOST_ASSERT(end - it >= 3);

        // decode unreserved octets
        d = detail::decode_one(it + 1);
        if (allowed(d))
        {
            *dest = d;
            it += 3;
            ++dest;
            continue;
        }

        // uppercase percent-encoding triplets
        *dest++ = '%';
        ++it;
        *dest++ = grammar::to_upper(*it++);
        *dest++ = grammar::to_upper(*it++);
    }
    if (it != dest)
    {
        auto diff = it - dest;
        auto n = impl_.len(id) - diff;
        shrink_impl(id, n, op);
        s_[size()] = '\0';
    }
}

url_base&
url_base::
normalize_scheme()
{
    to_lower_impl(id_scheme);
    return *this;
}

url_base&
url_base::
normalize_authority()
{
    op_t op(*this);

    // normalize host
    if (host_type() == urls::host_type::name)
    {
        normalize_octets_impl(
            id_host,
            detail::reg_name_chars, op);
    }
    decoded_to_lower_impl(id_host);

    // normalize password
    normalize_octets_impl(id_pass, detail::password_chars, op);

    // normalize user
    normalize_octets_impl(id_user, detail::user_chars, op);
    return *this;
}

url_base&
url_base::
normalize_path()
{
    op_t op(*this);
    normalize_octets_impl(id_path, detail::path_chars, op);
    string_view p = impl_.get(id_path);
    char* p_dest = s_ + impl_.offset(id_path);
    char* p_end = s_ + impl_.offset(id_path + 1);
    auto pn = p.size();
    auto skip_dot = 0;
    bool encode_colons = false;
    string_view first_seg;
    if (
        !has_authority() &&
        p.starts_with("/./"))
    {
        // check if removing the "/./" would result in "//"
        // ex: "/.//", "/././/", "/././/", ...
        skip_dot = 2;
        while (p.substr(skip_dot, 3).starts_with("/./"))
            skip_dot += 2;
        if (p.substr(skip_dot).starts_with("//"))
            skip_dot = 2;
        else
            skip_dot = 0;
    }
    else if (
        !has_scheme())
    {
        if (p.starts_with("./"))
        {
            // check if removing the "./" would result in "//"
            // ex: ".//", "././/", "././/", ...
            skip_dot = 1;
            while (p.substr(skip_dot, 3).starts_with("/./"))
                skip_dot += 2;
            if (p.substr(skip_dot).starts_with("//"))
                skip_dot = 2;
            else
                skip_dot = 0;

            if ( !skip_dot )
            {
                // check if removing "./"s would leave us
                // a first segment with an ambiguous ":"
                first_seg = p.substr(2);
                while (first_seg.starts_with("./"))
                    first_seg = first_seg.substr(2);
                auto i = first_seg.find('/');
                if (i != string_view::npos)
                    first_seg = first_seg.substr(0, i);
                encode_colons = first_seg.contains(':');
            }
        }
        else
        {
            // check if normalize_octets_impl
            // didn't already create a ":"
            // in the first segment
            first_seg = p;
            auto i = first_seg.find('/');
            if (i != string_view::npos)
                first_seg = p.substr(0, i);
            encode_colons = first_seg.contains(':');
        }
    }
    if (encode_colons)
    {
        // prepend with "./"
        // (resize_impl never throws)
        auto cn =
            std::count(
                first_seg.begin(),
                first_seg.end(),
                ':');
        resize_impl(
            id_path, pn + (2 * cn), op);
        // move the 2nd, 3rd, ... segments
        auto begin = s_ + impl_.offset(id_path);
        auto it = begin;
        auto end = begin + pn;
        while (string_view(it, 2) == "./")
            it += 2;
        while (*it != '/' &&
               it != end)
            ++it;
        // we don't need op here because this is
        // an internal operation
        std::memmove(it + (2 * cn), it, end - it);

        // move 1st segment
        auto src = s_ + impl_.offset(id_path) + pn;
        auto dest = s_ + impl_.offset(id_query);
        src -= end - it;
        dest -= end - it;
        pn -= end - it;
        do {
            --src;
            --dest;
            if (*src != ':')
            {
                *dest = *src;
            }
            else
            {
                // use uppercase as required by
                // syntax-based normalization
                *dest-- = 'A';
                *dest-- = '3';
                *dest = '%';
            }
            --pn;
        } while (pn);
        skip_dot = 0;
        p = impl_.get(id_path);
        pn = p.size();
        p_dest = s_ + impl_.offset(id_path);
        p_end = s_ + impl_.offset(id_path + 1);
    }
    p.remove_prefix(skip_dot);
    p_dest += skip_dot;
    auto n = detail::remove_dot_segments(
        p_dest, p_end, p);
    if (n != pn)
    {
        BOOST_ASSERT(n < pn);
        shrink_impl(id_path, n + skip_dot, op);
        p = encoded_path();
        if (!p.empty())
            impl_.nseg_ = std::count(
                p.begin() + 1, p.end(), '/') + 1;
        else
            impl_.nseg_ = 0;
    }
    return *this;
}

url_base&
url_base::
normalize_query()
{
    op_t op(*this);
    normalize_octets_impl(
        id_query, detail::query_chars, op);
    return *this;
}

url_base&
url_base::
normalize_fragment()
{
    op_t op(*this);
    normalize_octets_impl(
        id_frag, detail::fragment_chars, op);
    return *this;
}

url_base&
url_base::
normalize()
{
    normalize_fragment();
    normalize_query();
    normalize_path();
    normalize_authority();
    normalize_scheme();
    return *this;
}

//------------------------------------------------
//
// Implementation
//
//------------------------------------------------

void
url_base::
check_invariants() const noexcept
{
    BOOST_ASSERT(pi_);
    BOOST_ASSERT(
        impl_.len(id_scheme) == 0 ||
        impl_.get(id_scheme).ends_with(':'));
    BOOST_ASSERT(
        impl_.len(id_user) == 0 ||
        impl_.get(id_user).starts_with("//"));
    BOOST_ASSERT(
        impl_.len(id_pass) == 0 ||
        impl_.get(id_user).starts_with("//"));
    BOOST_ASSERT(
        impl_.len(id_pass) == 0 ||
        (impl_.len(id_pass) == 1 &&
            impl_.get(id_pass) == "@") ||
        (impl_.len(id_pass) > 1 &&
            impl_.get(id_pass).starts_with(':') &&
            impl_.get(id_pass).ends_with('@')));
    BOOST_ASSERT(
        impl_.len(id_user, id_path) == 0 ||
        impl_.get(id_user).starts_with("//"));
    BOOST_ASSERT(impl_.decoded_[id_path] >=
        ((impl_.len(id_path) + 2) / 3));
    BOOST_ASSERT(
        impl_.len(id_port) == 0 ||
        impl_.get(id_port).starts_with(':'));
    BOOST_ASSERT(
        impl_.len(id_query) == 0 ||
        impl_.get(id_query).starts_with('?'));
    BOOST_ASSERT(
        (impl_.len(id_query) == 0 && impl_.nparam_ == 0) ||
        (impl_.len(id_query) > 0 && impl_.nparam_ > 0));
    BOOST_ASSERT(
        impl_.len(id_frag) == 0 ||
        impl_.get(id_frag).starts_with('#'));
    BOOST_ASSERT(c_str()[size()] == '\0');
}

char*
url_base::
resize_impl(
    int id,
    std::size_t new_size,
    op_t& op)
{
    return resize_impl(
        id, id + 1, new_size, op);
}

char*
url_base::
resize_impl(
    int first,
    int last,
    std::size_t new_len,
    op_t& op)
{
    auto const n0 = impl_.len(first, last);
    if(new_len == 0 && n0 == 0)
        return s_ + impl_.offset(first);
    if(new_len <= n0)
        return shrink_impl(
            first, last, new_len, op);

    // growing
    std::size_t n = new_len - n0;
    reserve_impl(size() + n, op);
    auto const pos =
        impl_.offset(last);
    // adjust chars
    op.move(
        s_ + pos + n,
        s_ + pos,
        impl_.offset(id_end) -
            pos + 1);
    // collapse (first, last)
    impl_.collapse(first, last,
        impl_.offset(last) + n);
    // shift (last, end) right
    impl_.adjust(last, id_end, n);
    s_[size()] = '\0';
    return s_ + impl_.offset(first);
}

char*
url_base::
shrink_impl(
    int id,
    std::size_t new_size,
    op_t& op)
{
    return shrink_impl(
        id, id + 1, new_size, op);
}

char*
url_base::
shrink_impl(
    int first,
    int last,
    std::size_t new_len,
    op_t& op)
{
    // shrinking
    auto const n0 = impl_.len(first, last);
    BOOST_ASSERT(new_len <= n0);
    std::size_t n = n0 - new_len;
    auto const pos =
        impl_.offset(last);
    // adjust chars
    op.move(
        s_ + pos - n,
        s_ + pos,
        impl_.offset(
            id_end) - pos + 1);
    // collapse (first, last)
    impl_.collapse(first,  last,
        impl_.offset(last) - n);
    // shift (last, end) left
    impl_.adjust(
        last, id_end, 0 - n);
    s_[size()] = '\0';
    return s_ + impl_.offset(first);
}

//------------------------------------------------

void
url_base::
set_scheme_impl(
    string_view s,
    urls::scheme id)
{
    op_t op(*this, &s);
    check_invariants();
    grammar::parse(
        s, detail::scheme_rule()
            ).value(BOOST_URL_POS);
    auto const n = s.size();
    auto const p = impl_.offset(id_path);

    // check for "./" prefix
    bool const has_dot =
        [this, p]
    {
        if(impl_.nseg_ == 0)
            return false;
        if(first_segment().size() < 2)
            return false;
        auto const src = s_ + p;
        if(src[0] != '.')
            return false;
        if(src[1] != '/')
            return false;
        return true;
    }();

    // Remove "./"
    if(has_dot)
    {
        // do this first, for
        // strong exception safety
        reserve_impl(
            size() + n + 1 - 2, op);
        op.move(
            s_ + p,
            s_ + p + 2,
            size() + 1 -
                (p + 2));
        impl_.set_size(
            id_path,
            impl_.len(id_path) - 2);
        s_[size()] = '\0';
    }

    auto dest = resize_impl(
        id_scheme, n + 1, op);
    s.copy(dest, n);
    dest[n] = ':';
    impl_.scheme_ = id;
    check_invariants();
}

char*
url_base::
set_user_impl(
    std::size_t n,
    op_t& op)
{
    check_invariants();
    if(impl_.len(id_pass) != 0)
    {
        // keep "//"
        auto dest = resize_impl(
            id_user, 2 + n, op);
        check_invariants();
        return dest + 2;
    }
    // add authority
    auto dest = resize_impl(
        id_user, 2 + n + 1, op);
    impl_.split(id_user, 2 + n);
    dest[0] = '/';
    dest[1] = '/';
    dest[2 + n] = '@';
    check_invariants();
    return dest + 2;
}

char*
url_base::
set_password_impl(
    std::size_t n,
    op_t& op)
{
    check_invariants();
    if(impl_.len(id_user) != 0)
    {
        // already have authority
        auto const dest = resize_impl(
            id_pass, 1 + n + 1, op);
        dest[0] = ':';
        dest[n + 1] = '@';
        check_invariants();
        return dest + 1;
    }
    // add authority
    auto const dest =
        resize_impl(
        id_user, id_host,
        2 + 1 + n + 1, op);
    impl_.split(id_user, 2);
    dest[0] = '/';
    dest[1] = '/';
    dest[2] = ':';
    dest[2 + n + 1] = '@';
    check_invariants();
    return dest + 3;
}

char*
url_base::
set_userinfo_impl(
    std::size_t n,
    op_t& op)
{
    // "//" {dest} "@"
    check_invariants();
    auto dest = resize_impl(
        id_user, id_host, n + 3, op);
    impl_.split(id_user, n + 2);
    dest[0] = '/';
    dest[1] = '/';
    dest[n + 2] = '@';
    check_invariants();
    return dest + 2;
}

char*
url_base::
set_host_impl(
    std::size_t n,
    op_t& op)
{
    check_invariants();
    if(impl_.len(id_user) == 0)
    {
        // add authority
        auto dest = resize_impl(
            id_user, n + 2, op);
        impl_.split(id_user, 2);
        impl_.split(id_pass, 0);
        dest[0] = '/';
        dest[1] = '/';
        check_invariants();
        return dest + 2;
    }
    // already have authority
    auto const dest = resize_impl(
        id_host, n, op);
    check_invariants();
    return dest;
}

char*
url_base::
set_port_impl(
    std::size_t n,
    op_t& op)
{
    check_invariants();
    if(impl_.len(id_user) != 0)
    {
        // authority exists
        auto dest = resize_impl(
            id_port, n + 1, op);
        dest[0] = ':';
        check_invariants();
        return dest + 1;
    }
    auto dest = resize_impl(
        id_user, 3 + n, op);
    impl_.split(id_user, 2);
    impl_.split(id_pass, 0);
    impl_.split(id_host, 0);
    dest[0] = '/';
    dest[1] = '/';
    dest[2] = ':';
    check_invariants();
    return dest + 3;
}

//------------------------------------------------

// return the first segment of the path.
// this is needed for some algorithms.
string_view
url_base::
first_segment() const noexcept
{
    if(impl_.nseg_ == 0)
        return {};
    auto const p0 = impl_.cs_ +
        impl_.offset(id_path) +
            detail::path_prefix(
                impl_.get(id_path));
    auto const end = impl_.cs_ +
        impl_.offset(id_query);
    if(impl_.nseg_ == 1)
        return string_view(
            p0, end - p0);
    auto p = p0;
    while(*p != '/')
        ++p;
    BOOST_ASSERT(p < end);
    return string_view(p0, p - p0);
}

detail::segments_iter_impl
url_base::
edit_segments(
    detail::segments_iter_impl const& it0,
    detail::segments_iter_impl const& it1,
    detail::any_segments_iter&& src,
    // -1 = preserve
    //  0 = make relative (can fail)
    //  1 = make absolute
    int absolute)
{
    // Iterator doesn't belong to this url
    BOOST_ASSERT(it0.ref.alias_of(impl_));

    // Iterator doesn't belong to this url
    BOOST_ASSERT(it1.ref.alias_of(impl_));

    // Iterator is in the wrong order
    BOOST_ASSERT(it0.index <= it1.index);

    // Iterator is out of range
    BOOST_ASSERT(it0.index <= impl_.nseg_);
    BOOST_ASSERT(it0.pos <= impl_.len(id_path));

    // Iterator is out of range
    BOOST_ASSERT(it1.index <= impl_.nseg_);
    BOOST_ASSERT(it1.pos <= impl_.len(id_path));

//------------------------------------------------
//
//  Calculate output prefix
//
//  0 = ""
//  1 = "/"
//  2 = "./"
//  3 = "/./"
//
    bool const is_abs = is_path_absolute();
    if(has_authority())
    {
        // Check if the new
        // path would be empty
        if( src.fast_nseg == 0 &&
            it0.index == 0 &&
            it1.index == impl_.nseg_)
        {
            // VFALCO we don't have
            // access to nchar this early
            //
            //BOOST_ASSERT(nchar == 0);
            absolute = 0;
        }
        else
        {
            // prefix "/" required
            absolute = 1;
        }
    }
    else if(absolute < 0)
    {
        absolute = is_abs; // preserve
    }
    auto const path_pos = impl_.offset(id_path);

    std::size_t nchar = 0;
    std::size_t prefix = 0;
    bool encode_colons = false;
    if(it0.index > 0)
    {
        // first segment unchanged
        prefix = src.fast_nseg > 0;
    }
    else if(src.fast_nseg > 0)
    {
        // first segment from src
        if(! src.front.empty())
        {
            if( src.front == "." &&
                    src.fast_nseg > 1)
                prefix = 2 + absolute;
            else if(absolute)
                prefix = 1;
            else if(has_scheme() ||
                    ! src.front.contains(':'))
                prefix = 0;
            else
            {
                prefix = 0;
                encode_colons = true;
            }
        }
        else
        {
            prefix = 2 + absolute;
        }
    }
    else
    {
        // first segment from it1
        auto const p =
            impl_.cs_ + path_pos + it1.pos;
        switch(impl_.cs_ +
            impl_.offset(id_query) - p)
        {
        case 0:
            // points to end
            prefix = absolute;
            break;
        default:
            BOOST_ASSERT(*p == '/');
            if(p[1] != '/')
            {
                if(absolute)
                    prefix = 1;
                else if(has_scheme() ||
                        ! it1.dereference().contains(':'))
                    prefix = 0;
                else
                    prefix = 2;
                break;
            }
            // empty
            BOOST_FALLTHROUGH;
        case 1:
            // empty
            BOOST_ASSERT(*p == '/');
            prefix = 2 + absolute;
            break;
        }
    }

//  append '/' to new segs
//  if inserting at front.
    std::size_t const suffix =
        it1.index == 0 &&
        impl_.nseg_ > 0 &&
        src.fast_nseg > 0;

//------------------------------------------------
//
//  Measure the number of encoded characters
//  of output, and the number of inserted
//  segments including internal separators.
//
    src.encode_colons = encode_colons;
    std::size_t nseg = 0;
    if(src.measure(nchar))
    {
        src.encode_colons = false;
        for(;;)
        {
            ++nseg;
            if(! src.measure(nchar))
                break;
            ++nchar;
        }
    }

    switch(src.fast_nseg)
    {
    case 0:
        BOOST_ASSERT(nseg == 0);
        break;
    case 1:
        BOOST_ASSERT(nseg == 1);
        break;
    case 2:
        BOOST_ASSERT(nseg >= 2);
        break;
    }

//------------------------------------------------
//
//  Calculate [pos0, pos1) to remove
//
    auto pos0 = it0.pos;
    if(it0.index == 0)
    {
        // patch pos for prefix
        pos0 = 0;
    }
    auto pos1 = it1.pos;
    if(it1.index == 0)
    {
        // patch pos for prefix
        pos1 = detail::path_prefix(
            impl_.get(id_path));
    }
    else if(
        it0.index == 0 &&
        it1.index < impl_.nseg_ &&
        nseg == 0)
    {
        // Remove the slash from segment it1
        // if it is becoming the new first
        // segment.
        ++pos1;
    }
    // calc decoded size of old range
    auto const dn0 =
        detail::decode_bytes_unsafe(
            string_view(
                impl_.cs_ +
                    impl_.offset(id_path) +
                    pos0,
                pos1 - pos0));

//------------------------------------------------
//
//  Resize
//
    op_t op(*this, &src.s);
    char* dest;
    char const* end;
    {
        auto const nremove = pos1 - pos0;
        // check overflow
        if( nchar <= max_size() && (
            prefix + suffix <=
                max_size() - nchar))
        {
            nchar = prefix + nchar + suffix;
            if( nchar <= nremove ||
                nchar - nremove <=
                    max_size() - size())
                goto ok;
        }
        // too large
        detail::throw_length_error();
    ok:
        auto const new_size =
            size() + nchar - nremove;
        reserve_impl(new_size, op);
        dest = s_ + path_pos + pos0;
        op.move(
            dest + nchar,
            s_ + path_pos + pos1,
            size() - path_pos - pos1);
        impl_.set_size(
            id_path,
            impl_.len(id_path) + nchar - nremove);
        BOOST_ASSERT(size() == new_size);
        end = dest + nchar;
        impl_.nseg_ = impl_.nseg_ + nseg - (
            it1.index - it0.index);
        if(s_)
            s_[size()] = '\0';
    }

//------------------------------------------------
//
//  Output segments and internal separators:
//
//  prefix [ segment [ '/' segment ] ] suffix
//
    auto const dest0 = dest;
    switch(prefix)
    {
    case 3:
        *dest++ = '/';
        *dest++ = '.';
        *dest++ = '/';
        break;
    case 2:
        *dest++ = '.';
        BOOST_FALLTHROUGH;
    case 1:
        *dest++ = '/';
        break;
    default:
        break;
    }
    src.rewind();
    if(nseg > 0)
    {
        src.encode_colons = encode_colons;
        for(;;)
        {
            src.copy(dest, end);
            if(--nseg == 0)
                break;
            *dest++ = '/';
            src.encode_colons = false;
        }
        if(suffix)
            *dest++ = '/';
    }
    BOOST_ASSERT(dest == dest0 + nchar);

    // calc decoded size of new range,
    auto const dn =
        detail::decode_bytes_unsafe(
            string_view(dest0, dest - dest0));
    impl_.decoded_[id_path] += dn - dn0;

    return detail::segments_iter_impl(
        impl_, pos0, it0.index);
}

//------------------------------------------------

auto
url_base::
edit_params(
    detail::params_iter_impl const& it0,
    detail::params_iter_impl const& it1,
    detail::any_params_iter&& src) ->
        detail::params_iter_impl
{
    auto pos0 = impl_.offset(id_query);
    auto pos1 = pos0 + it1.pos;
    pos0 = pos0 + it0.pos;

    // Iterator doesn't belong to this url
    BOOST_ASSERT(it0.ref.alias_of(impl_));

    // Iterator doesn't belong to this url
    BOOST_ASSERT(it1.ref.alias_of(impl_));

    // Iterator is in the wrong order
    BOOST_ASSERT(it0.index <= it1.index);

    // Iterator is out of range
    BOOST_ASSERT(it0.index <= impl_.nparam_);
    BOOST_ASSERT(pos0 <= impl_.offset(id_frag));

    // Iterator is out of range
    BOOST_ASSERT(it1.index <= impl_.nparam_);
    BOOST_ASSERT(pos1 <= impl_.offset(id_frag));

    // calc decoded size of old range,
    // minus one if '?' or '&' prefixed
    auto const dn0 =
        detail::decode_bytes_unsafe(
            string_view(
                impl_.cs_ + pos0,
                pos1 - pos0)) - (
                    impl_.len(id_query) > 0);

//------------------------------------------------
//
//  Measure the number of encoded characters
//  of output, and the number of inserted
//  segments including internal separators.
//

    std::size_t nchar = 0;
    std::size_t nparam = 0;
    if(src.measure(nchar))
    {
        ++nchar; // for '?' or '&'
        for(;;)
        {
            ++nparam;
            if(! src.measure(nchar))
                break;
            ++nchar; // for '&'
        }
    }

//------------------------------------------------
//
//  Resize
//
    op_t op(*this, &src.s0, &src.s1);
    char* dest;
    char const* end;
    {
        auto const nremove = pos1 - pos0;
        // check overflow
        if( nchar > nremove &&
            nchar - nremove >
                max_size() - size())
        {
            // too large
            detail::throw_length_error();
        }
        auto const nparam1 =
            impl_.nparam_ + nparam - (
                it1.index - it0.index);
        reserve_impl(size() + nchar - nremove, op);
        dest = s_ + pos0;
        end = dest + nchar;
        if(impl_.nparam_ > 0)
        {
            // needed when we move
            // the beginning of the query
            s_[impl_.offset(id_query)] = '&';
        }
        op.move(
            dest + nchar,
            impl_.cs_ + pos1,
            size() - pos1);
        impl_.set_size(
            id_query,
            impl_.len(id_query) +
                nchar - nremove);
        impl_.nparam_ = nparam1;
        if(nparam1 > 0)
        {
            // needed when we erase
            // the beginning of the query
            s_[impl_.offset(id_query)] = '?';
        }
        if(s_)
            s_[size()] = '\0';
    }
    auto const dest0 = dest;

//------------------------------------------------
//
//  Output params and internal separators:
//
//  [ '?' param ] [ '&' param ]
//
    if(nparam > 0)
    {
        if(it0.index == 0)
            *dest++ = '?';
        else
            *dest++ = '&';
        src.rewind();
        for(;;)
        {
            src.copy(dest, end);
            if(--nparam == 0)
                break;
            *dest++ = '&';
        }
    }

    // calc decoded size of new range,
    // minus one if '?' or '&' prefixed
    auto const dn =
        detail::decode_bytes_unsafe(
            string_view(dest0, dest - dest0)) - (
                impl_.len(id_query) > 0);

    impl_.decoded_[id_query] += (dn - dn0);

    return detail::params_iter_impl(
        impl_,
        pos0 - impl_.offset_[id_query],
        it0.index);
}

//------------------------------------------------

void
url_base::
decoded_to_lower_impl(int id) noexcept
{
    char* it = s_ + impl_.offset(id);
    char const* const end = s_ + impl_.offset(id + 1);
    while(it < end)
    {
        if (*it != '%')
        {
            *it = grammar::to_lower(
                *it);
            ++it;
            continue;
        }
        it += 3;
    }
}

void
url_base::
to_lower_impl(int id) noexcept
{
    char* it = s_ + impl_.offset(id);
    char const* const end = s_ + impl_.offset(id + 1);
    while(it < end)
    {
        *it = grammar::to_lower(
            *it);
        ++it;
    }
}

} // urls
} // boost

#endif
