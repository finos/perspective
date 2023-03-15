//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_URL_IPP
#define BOOST_URL_IMPL_URL_IPP

#include <boost/url/url.hpp>
#include <boost/assert.hpp>

namespace boost {
namespace urls {

//------------------------------------------------

url::
~url()
{
    if(s_)
    {
        BOOST_ASSERT(
            cap_ != 0);
        deallocate(s_);
    }
}

// construct empty
url::
url() noexcept = default;

url::
url(string_view s)
    : url(parse_uri_reference(s
        ).value(BOOST_URL_POS))
{
}

url::
url(url&& u) noexcept
    : url_base(u.impl_)
{
    s_ = u.s_;
    cap_ = u.cap_;
    u.s_ = nullptr;
    u.cap_ = 0;
    u.impl_ = {from::url};
}

url&
url::
operator=(url&& u) noexcept
{
    if(s_)
        deallocate(s_);
    impl_ = u.impl_;
    s_ = u.s_;
    cap_ = u.cap_;
    u.s_ = nullptr;
    u.cap_ = 0;
    u.impl_ = {from::url};
    return *this;
}

//------------------------------------------------

char*
url::
allocate(std::size_t n)
{
    auto s = new char[n + 1];
    cap_ = n;
    return s;
}

void
url::
deallocate(char* s)
{
    delete[] s;
}

void
url::
clear_impl() noexcept
{
    if(s_)
    {
        // preserve capacity
        impl_ = {from::url};
        s_[0] = '\0';
        impl_.cs_ = s_;
    }
    else
    {
        BOOST_ASSERT(impl_.cs_ ==
            detail::empty_c_str_);
    }
}

void
url::
reserve_impl(
    std::size_t n,
    op_t& op)
{
    if(n > max_size())
        detail::throw_length_error();
    if(n <= cap_)
        return;
    char* s;
    if(s_ != nullptr)
    {
        // 50% growth policy
        auto const h = cap_ / 2;
        std::size_t new_cap;
        if(cap_ <= max_size() - h)
            new_cap = cap_ + h;
        else
            new_cap = max_size();
        if( new_cap < n)
            new_cap = n;
        s = allocate(new_cap);
        std::memcpy(s, s_, size() + 1);
        BOOST_ASSERT(! op.old);
        op.old = s_;
        s_ = s;
    }
    else
    {
        s_ = allocate(n);
        s_[0] = '\0';
    }
    impl_.cs_ = s_;
}

void
url::
cleanup(
    op_t& op)
{
    if(op.old)
        deallocate(op.old);
}

//------------------------------------------------

void
url::
swap(url& other) noexcept
{
    if (this == &other)
        return;
    std::swap(s_, other.s_);
    std::swap(cap_, other.cap_);
    std::swap(impl_, other.impl_);
    std::swap(pi_, other.pi_);
    if (pi_ == &other.impl_)
        pi_ = &impl_;
    if (other.pi_ == &impl_)
        other.pi_ = &other.impl_;
}

} // urls
} // boost

#endif
