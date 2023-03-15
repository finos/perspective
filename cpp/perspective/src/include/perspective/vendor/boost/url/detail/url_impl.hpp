//
// Copyright (c) 2022 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_URL_IMPL_HPP
#define BOOST_URL_DETAIL_URL_IMPL_HPP

#include <boost/url/host_type.hpp>
#include <boost/url/pct_string_view.hpp>
#include <boost/url/scheme.hpp>
#include <boost/url/string_view.hpp>
#include <boost/url/detail/parts_base.hpp>
#include <boost/assert.hpp>
#include <cstdint>

namespace boost {
namespace urls {

class url_view;
class authority_view;

namespace detail {

constexpr char const* const empty_c_str_ = "";

// This is the private 'guts' of a
// url_view, exposed so different parts
// of the implementation can work on it.
struct url_impl : parts_base
{
    static
    constexpr
    pos_t const zero_ = 0;

    // never nullptr
    char const* cs_ = empty_c_str_;

    pos_t offset_[id_end + 1] = {};
    pos_t decoded_[id_end] = {};
    pos_t nseg_ = 0;
    pos_t nparam_ = 0;
    unsigned char ip_addr_[16] = {};
    // VFALCO don't we need a bool?
    std::uint16_t port_number_ = 0;
    host_type host_type_ =
        urls::host_type::none;
    scheme scheme_ =
        urls::scheme::none;

    from from_ = from::string;

    url_impl(
        from b) noexcept
        : from_(b)
    {
    }

    // in url_view.ipp
    url_view construct() const noexcept;

    // in authority_view.ipp
    authority_view
    construct_authority() const noexcept;

    pos_t len(int, int) const noexcept;
    pos_t len(int) const noexcept;
    pos_t offset(int) const noexcept;
    string_view get(int) const noexcept;
    string_view get(int, int) const noexcept;
    pct_string_view pct_get(int) const noexcept;
    pct_string_view pct_get(int, int) const noexcept;
    void set_size(int, pos_t) noexcept;
    void split(int, std::size_t) noexcept;
    void adjust(int, int, std::size_t) noexcept;
    void collapse(int, int, std::size_t) noexcept;

    void apply_scheme(string_view) noexcept;
    void apply_userinfo(pct_string_view const&,
        pct_string_view const*) noexcept;
    void apply_host(host_type, pct_string_view,
        unsigned char const*) noexcept;
    void apply_port(string_view, unsigned short) noexcept;
    void apply_authority(authority_view const&) noexcept;
    void apply_path(pct_string_view, std::size_t) noexcept;
    void apply_query(pct_string_view, std::size_t) noexcept;
    void apply_frag(pct_string_view) noexcept;
};

//------------------------------------------------

// this allows a path to come from a
// url_impl or a separate string_view
class path_ref
    : private parts_base
{
    url_impl const* impl_ = nullptr;
    char const* data_ = nullptr;
    std::size_t size_ = 0;
    std::size_t nseg_ = 0;
    std::size_t dn_ = 0;

public:
    path_ref() = default;
    path_ref(url_impl const& impl) noexcept;
    path_ref(string_view,
        std::size_t, std::size_t) noexcept;
    pct_string_view buffer() const noexcept;
    std::size_t size() const noexcept;
    char const* data() const noexcept;
    char const* end() const noexcept;
    std::size_t nseg() const noexcept;

    bool
    alias_of(
        url_impl const& impl) const noexcept
    {
        return impl_ == &impl;
    }

    bool
    alias_of(
        path_ref const& ref) const noexcept
    {
        if(impl_)
            return impl_ == ref.impl_;
        BOOST_ASSERT(data_ != ref.data_ || (
            size_ == ref.size_ &&
            nseg_ == ref.nseg_ &&
            dn_ == ref.dn_));
        return data_ == ref.data_;
    }
};

//------------------------------------------------

// this allows a params to come from a
// url_impl or a separate string_view
class query_ref
    : private parts_base
{
    url_impl const* impl_ = nullptr;
    char const* data_ = nullptr;
    std::size_t size_ = 0;
    std::size_t nparam_ = 0;
    std::size_t dn_ = 0;
    bool question_mark_ = false;

public:
    query_ref(
        string_view s,      // buffer, no '?'
        std::size_t dn,     // decoded size
        std::size_t nparam
            ) noexcept;
    query_ref() = default;
    BOOST_URL_DECL
    query_ref(url_impl const& impl) noexcept;
    pct_string_view buffer() const noexcept;
    std::size_t size() const noexcept; // with '?'
    char const* begin() const noexcept; // no '?'
    char const* end() const noexcept;
    std::size_t nparam() const noexcept;

    bool
    alias_of(
        url_impl const& impl) const noexcept
    {
        return impl_ == &impl;
    }

    bool
    alias_of(
        query_ref const& ref) const noexcept
    {
        if(impl_)
            return impl_ == ref.impl_;
        BOOST_ASSERT(data_ != ref.data_ || (
            size_ == ref.size_ &&
            nparam_ == ref.nparam_ &&
            dn_ == ref.dn_));
        return data_ == ref.data_;
    }
};

//------------------------------------------------

// return length of [first, last)
inline
auto
url_impl::
len(
    int first,
    int last) const noexcept ->
        pos_t
{
    BOOST_ASSERT(first <= last);
    BOOST_ASSERT(last <= id_end);
    return offset(last) - offset(first);
}

// return length of part
inline
auto
url_impl::
len(int id) const noexcept ->
    pos_t
{
    return id == id_end
        ? zero_
        : ( offset(id + 1) -
            offset(id) );
}

// return offset of id
inline
auto
url_impl::
offset(int id) const noexcept ->
    pos_t
{
    return
        id == id_scheme
        ? zero_
        : offset_[id];
}

// return id as string
inline
string_view
url_impl::
get(int id) const noexcept
{
    return {
        cs_ + offset(id), len(id) };
}

// return [first, last) as string
inline
string_view
url_impl::
get(int first,
    int last) const noexcept
{
    return { cs_ + offset(first),
        offset(last) - offset(first) };
}

// return id as pct-string
inline
pct_string_view
url_impl::
pct_get(
    int id) const noexcept
{
    return make_pct_string_view_unsafe(
        cs_ + offset(id),
        len(id),
        decoded_[id]);
}

// return [first, last) as pct-string
inline
pct_string_view
url_impl::
pct_get(
    int first,
    int last) const noexcept
{
    auto const pos = offset(first);
    std::size_t n = 0;
    for(auto i = first; i < last;)
        n += decoded_[i++];
    return make_pct_string_view_unsafe(
        cs_ + pos,
        offset(last) - pos,
        n);
}

//------------------------------------------------

// change id to size n
inline
void
url_impl::
set_size(
    int id,
    pos_t n) noexcept
{
    auto d = n - len(id);
    for(auto i = id + 1;
        i <= id_end; ++i)
        offset_[i] += d;
}

// trim id to size n,
// moving excess into id+1
inline
void
url_impl::
split(
    int id,
    std::size_t n) noexcept
{
    BOOST_ASSERT(id < id_end - 1);
    //BOOST_ASSERT(n <= len(id));
    offset_[id + 1] = offset(id) + n;
}

// add n to [first, last]
inline
void
url_impl::
adjust(
    int first,
    int last,
    std::size_t n) noexcept
{
    for(int i = first;
            i <= last; ++i)
        offset_[i] += n;
}

// set [first, last) offset
inline
void
url_impl::
collapse(
    int first,
    int last,
    std::size_t n) noexcept
{
    for(int i = first + 1;
            i < last; ++i)
        offset_[i] = n;
}

} // detail

} // urls
} // boost

#endif
