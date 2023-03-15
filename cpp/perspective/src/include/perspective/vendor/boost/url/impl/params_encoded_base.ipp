//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_PARAMS_ENCODED_BASE_IPP
#define BOOST_URL_IMPL_PARAMS_ENCODED_BASE_IPP

#include <boost/url/params_encoded_base.hpp>
#include <ostream>

namespace boost {
namespace urls {

params_encoded_base::
iterator::
iterator(
    detail::query_ref const& ref) noexcept
    : it_(ref)
{
}

params_encoded_base::
iterator::
iterator(
    detail::query_ref const& ref, int) noexcept
    : it_(ref, 0)
{
}

//------------------------------------------------
//
// params_encoded_base
//
//------------------------------------------------

params_encoded_base::
params_encoded_base(
    detail::query_ref const& ref) noexcept
    : ref_(ref)
{
}

//------------------------------------------------
//
// Observers
//
//------------------------------------------------

pct_string_view
params_encoded_base::
buffer() const noexcept
{
    return ref_.buffer();
}

bool
params_encoded_base::
empty() const noexcept
{
    return ref_.nparam() == 0;
}

std::size_t
params_encoded_base::
size() const noexcept
{
    return ref_.nparam();
}

auto
params_encoded_base::
begin() const noexcept ->
    iterator
{
    return { ref_ };
}

auto
params_encoded_base::
end() const noexcept ->
    iterator
{
    return { ref_, 0 };
}

//------------------------------------------------

std::size_t
params_encoded_base::
count(
    pct_string_view key,
    ignore_case_param ic) const noexcept
{
    std::size_t n = 0;
    auto it = find(key, ic);
    auto const end_ = end();
    while(it != end_)
    {
        ++n;
        ++it;
        it = find(it, key, ic);
    }
    return n;
}

//------------------------------------------------
//
// (implementation)
//
//------------------------------------------------

detail::params_iter_impl
params_encoded_base::
find_impl(
    detail::params_iter_impl it,
    pct_string_view key,
    ignore_case_param ic) const noexcept
{
    detail::params_iter_impl end_(ref_, 0);
    if(! ic)
    {
        for(;;)
        {
            if(it.equal(end_))
                return it;
            if(*it.key() == *key)
                return it;
            it.increment();
        }
    }
    for(;;)
    {
        if(it.equal(end_))
            return it;
        if( grammar::ci_is_equal(
                *it.key(), *key))
            return it;
        it.increment();
    }
}

detail::params_iter_impl
params_encoded_base::
find_last_impl(
    detail::params_iter_impl it,
    pct_string_view key,
    ignore_case_param ic) const noexcept
{
    detail::params_iter_impl begin_(ref_);
    if(! ic)
    {
        for(;;)
        {
            if(it.equal(begin_))
                return { ref_, 0 };
            it.decrement();
            if(*it.key() == *key)
                return it;
        }
    }
    for(;;)
    {
        if(it.equal(begin_))
            return { ref_, 0 };
        it.decrement();
        if(grammar::ci_is_equal(
                *it.key(), *key))
            return it;
    }
}

//------------------------------------------------

std::ostream&
operator<<(
    std::ostream& os,
    params_encoded_base const& qp)
{
    os << qp.buffer();
    return os;
}

} // urls
} // boost

#endif
