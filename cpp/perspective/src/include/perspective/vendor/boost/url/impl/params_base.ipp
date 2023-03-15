//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_PARAMS_BASE_IPP
#define BOOST_URL_IMPL_PARAMS_BASE_IPP

#include <boost/url/params_base.hpp>
#include <ostream>

namespace boost {
namespace urls {

params_base::
iterator::
iterator(
    detail::query_ref const& ref,
    encoding_opts opt) noexcept
    : it_(ref)
    , space_as_plus_(opt.space_as_plus)
{
}

params_base::
iterator::
iterator(
    detail::query_ref const& ref,
    encoding_opts opt,
    int) noexcept
    : it_(ref, 0)
    , space_as_plus_(opt.space_as_plus)
{
}

//------------------------------------------------

auto
params_base::
iterator::
operator*() const ->
    reference

{
    encoding_opts opt;
    opt.space_as_plus =
        space_as_plus_;
    param_pct_view p =
        it_.dereference();
    return reference(
        p.key.decode(opt),
        p.value.decode(opt),
        p.has_value);
}

//------------------------------------------------
//
// params_base
//
//------------------------------------------------

params_base::
params_base(
    detail::query_ref const& ref,
    encoding_opts opt) noexcept
    : ref_(ref)
    , opt_(opt)
{
}

pct_string_view
params_base::
buffer() const noexcept
{
    return ref_.buffer();
}

bool
params_base::
empty() const noexcept
{
    return ref_.nparam() == 0;
}

std::size_t
params_base::
size() const noexcept
{
    return ref_.nparam();
}

auto
params_base::
begin() const noexcept ->
    iterator
{
    return iterator(ref_, opt_);
}

auto
params_base::
end() const noexcept ->
    iterator
{
    return iterator(ref_, opt_, 0);
}

//------------------------------------------------

std::size_t
params_base::
count(
    string_view key,
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
params_base::
find_impl(
    detail::params_iter_impl it,
    string_view key,
    ignore_case_param ic) const noexcept
{
    detail::params_iter_impl end_(ref_, 0);
    if(! ic)
    {
        for(;;)
        {
            if(it.equal(end_))
                return it;
            if(*it.key() == key)
                return it;
            it.increment();
        }
    }
    for(;;)
    {
        if(it.equal(end_))
            return it;
        if( grammar::ci_is_equal(
                *it.key(), key))
            return it;
        it.increment();
    }
}

detail::params_iter_impl
params_base::
find_last_impl(
    detail::params_iter_impl it,
    string_view key,
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
            if(*it.key() == key)
                return it;
        }
    }
    for(;;)
    {
        if(it.equal(begin_))
            return { ref_, 0 };
        it.decrement();
        if(grammar::ci_is_equal(
                *it.key(), key))
            return it;
    }
}

//------------------------------------------------

std::ostream&
operator<<(
    std::ostream& os,
    params_base const& qp)
{
    os << qp.buffer();
    return os;
}

} // urls
} // boost

#endif
