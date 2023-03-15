//
// Copyright (c) 2022 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_IMPL_URL_IMPL_IPP
#define BOOST_URL_DETAIL_IMPL_URL_IMPL_IPP

#include <boost/url/detail/url_impl.hpp>
#include <boost/url/authority_view.hpp>
#include <boost/assert.hpp>
#include <cstring>

namespace boost {
namespace urls {
namespace detail {

//------------------------------------------------
//
// url_impl
//
//------------------------------------------------

void
url_impl::
apply_scheme(
    string_view s) noexcept
{
    scheme_ = string_to_scheme(s);
    set_size(id_scheme, s.size() + 1);
}

void
url_impl::
apply_userinfo(
    pct_string_view const& user,
    pct_string_view const* pass) noexcept
{
    // this function is for
    // authority_view_rule only
    BOOST_ASSERT(from_ == from::authority);

    // userinfo
    set_size(id_user, user.size());
    decoded_[id_user] =
        user.decoded_size();
    if(pass)
    {
        set_size(id_pass,
            pass->size() + 2);
        decoded_[id_pass] =
            pass->decoded_size();
    }
    else
    {
        // trailing '@'
        set_size(id_pass, 1 );
    }
}

void
url_impl::
apply_host(
    host_type ht,
    pct_string_view s,
    unsigned char const* addr) noexcept
{
    // this function is for
    // authority_view_rule only
    BOOST_ASSERT(from_ == from::authority);

    // host, port
    host_type_ = ht;
    set_size(id_host, s.size());
    decoded_[id_host] =
        s.decoded_size();
    std::memcpy(
        ip_addr_,
        addr,
        sizeof(ip_addr_));
}

void
url_impl::
apply_port(
    string_view s,
    unsigned short pn) noexcept
{
    // this function is for
    // authority_view_rule only
    BOOST_ASSERT(from_ == from::authority);

    port_number_ = pn;
    set_size(id_port, 1 + s.size());
}

void
url_impl::
apply_authority(
    authority_view const& a) noexcept
{
    BOOST_ASSERT(from_ != from::authority);

    // userinfo
    set_size(id_user,
        a.u_.len(id_user) +
        (from_ == from::authority ? 0 : 2));
    set_size(id_pass, a.u_.len(id_pass));
    decoded_[id_user] = a.u_.decoded_[id_user];
    decoded_[id_pass] = a.u_.decoded_[id_pass];

    // host, port
    host_type_ = a.u_.host_type_;
    port_number_ = a.u_.port_number_;
    set_size(id_host, a.u_.len(id_host));
    set_size(id_port, a.u_.len(id_port));
    std::memcpy(
        ip_addr_,
        a.u_.ip_addr_,
        sizeof(ip_addr_));
    decoded_[id_host] = a.u_.decoded_[id_host];
}

void
url_impl::
apply_path(
    pct_string_view s,
    std::size_t nseg) noexcept
{
    set_size(id_path, s.size());
    decoded_[id_path] = s.decoded_size();
    nseg_ = detail::path_segments(s, nseg);
}

void
url_impl::
apply_query(
    pct_string_view s,
    std::size_t n) noexcept
{
    nparam_ = n;
    set_size(id_query, 1 + s.size());
    decoded_[id_query] = s.decoded_size();
}

void
url_impl::
apply_frag(
    pct_string_view s) noexcept
{
    set_size(id_frag, s.size() + 1);
    decoded_[id_frag] = s.decoded_size();
}

//------------------------------------------------
//
// path_ref
//
//------------------------------------------------

path_ref::
path_ref(
    url_impl const& impl) noexcept
{
    if(impl.from_ == url_impl::from::url)
    {
        impl_ = &impl;
    }
    else
    {
        string_view s = impl.get(id_path);
        data_ = s.data();
        size_ = s.size();
        nseg_ = impl.nseg_;
        dn_ = impl.decoded_[id_path];
    }
}

path_ref::
path_ref(
    string_view s,
    std::size_t dn,
    std::size_t nseg) noexcept
    : data_(s.data())
    , size_(s.size())
    , nseg_(nseg)
    , dn_(dn)
{
}

pct_string_view
path_ref::
buffer() const noexcept
{
    if(impl_)
        return make_pct_string_view_unsafe(
            impl_->cs_ +
                impl_->offset(id_path),
            impl_->len(id_path),
            impl_->decoded_[id_path]);
    return make_pct_string_view_unsafe(
        data_, size_, dn_);
}

std::size_t
path_ref::
size() const noexcept
{
    if(impl_)
        return impl_->len(id_path);
    return size_;
}

char const*
path_ref::
data() const noexcept
{
    if(impl_)
        return impl_->cs_ +
            impl_->offset(id_path);
    return data_;
}

char const*
path_ref::
end() const noexcept
{
    if(impl_)
        return impl_->cs_ +
            impl_->offset(id_query);
    return data_ + size_;
}

std::size_t
path_ref::
nseg() const noexcept
{
    if(impl_)
        return impl_->nseg_;
    return nseg_;
}

//------------------------------------------------
//
// query_ref
//
//------------------------------------------------

query_ref::
query_ref(
    string_view s,
    std::size_t dn,
    std::size_t nparam) noexcept
    : data_(s.data())
    , size_(s.size())
    , nparam_(nparam)
    , dn_(dn)
{
}

query_ref::
query_ref(
    url_impl const& impl) noexcept
{
    if(impl.from_ == url_impl::from::url)
    {
        impl_ = &impl;
    }
    else
    {
        string_view s = impl.get(id_query);
        if (!s.empty())
        {
            s.remove_prefix(1);
            question_mark_ = true;
        }
        data_ = s.data();
        size_ = s.size();
        nparam_ = impl.nparam_;
        dn_ = impl.decoded_[id_query];
    }
}

pct_string_view
query_ref::
buffer() const noexcept
{
    if(impl_)
    {
        auto pos = impl_->offset_[id_query];
        auto pos1 = impl_->offset_[id_frag];
        if(pos < pos1)
        {
            ++pos; // no '?'
            return make_pct_string_view_unsafe(
                impl_->cs_ + pos,
                pos1 - pos,
                impl_->decoded_[id_query]);
        }
        // empty
        return make_pct_string_view_unsafe(
            impl_->cs_ + pos,
            0,
            0);
    }
    // no '?'
    return make_pct_string_view_unsafe(
        data_, size_, dn_);
}

// with '?'
std::size_t
query_ref::
size() const noexcept
{
    if(impl_)
        return impl_->len(id_query);
    if(size_ > 0)
        return size_ + 1;
    return question_mark_;
}

// no '?'
char const*
query_ref::
begin() const noexcept
{
    if(impl_)
    {
        // using the offset array here
        auto pos = impl_->offset_[id_query];
        auto pos1 = impl_->offset_[id_frag];
        if(pos < pos1)
            return impl_->cs_ + pos + 1; // no '?'
        // empty
        return impl_->cs_ + pos;
    }
    return data_;

}

char const*
query_ref::
end() const noexcept
{
    if(impl_)
        return impl_->cs_ +
            impl_->offset(id_frag);
    return data_ + size_;
}

std::size_t
query_ref::
nparam() const noexcept
{
    if(impl_)
        return impl_->nparam_;
    return nparam_;
}

} // detail
} // urls
} // boost

#endif
