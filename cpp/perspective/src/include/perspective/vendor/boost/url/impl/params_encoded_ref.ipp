//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_PARAMS_ENCODED_REF_IPP
#define BOOST_URL_IMPL_PARAMS_ENCODED_REF_IPP

#include <boost/url/params_encoded_ref.hpp>
#include <boost/url/params_encoded_view.hpp>
#include <boost/url/url_base.hpp>
#include <boost/url/grammar/ci_string.hpp>
#include <boost/assert.hpp>
#include <utility>

namespace boost {
namespace urls {

//------------------------------------------------
//
// Special Members
//
//------------------------------------------------

params_encoded_ref::
params_encoded_ref(
    url_base& u) noexcept
    : params_encoded_base(u.impl_)
    , u_(&u)
{
}

params_encoded_ref&
params_encoded_ref::
operator=(
    params_encoded_ref const& other)
{
    if (!ref_.alias_of( other.ref_ ))
        assign(other.begin(), other.end());
    return *this;
}

params_encoded_ref&
params_encoded_ref::
operator=(std::initializer_list<
    param_pct_view> init)
{
    assign(init.begin(), init.end());
    return *this;
}

params_encoded_ref::
operator
params_encoded_view() const noexcept
{
    return {ref_};
}

//------------------------------------------------
//
// Modifiers
//
//------------------------------------------------

void
params_encoded_ref::
assign(
    std::initializer_list<
        param_pct_view> init)
{
    assign(init.begin(), init.end());
}

auto
params_encoded_ref::
insert(
    iterator before,
    param_pct_view const& p) ->
        iterator
{
    return u_->edit_params(
        before.it_,
        before.it_,
        detail::param_encoded_iter(p));
}

auto
params_encoded_ref::
insert(
    iterator before,
    std::initializer_list<
        param_pct_view> init) ->
    iterator
{
    return insert(
        before,
        init.begin(),
        init.end());
}

std::size_t
params_encoded_ref::
erase(
    pct_string_view key,
    ignore_case_param ic) noexcept
{
    // end() can't be fully cached,
    // since erase invalidates it.
    iterator it;
    {
        auto const end_ = end();
        it = find_last(end_, key, ic);
        if(it == end_)
            return 0;
    }
    std::size_t n = 0;
    for(;;)
    {
        ++n;
        // Use it->key instead of key,
        // to handle self-intersection
        auto prev = find_last(it, it->key, ic);
        if(prev == end())
            break;
        erase(it);
        it = prev;
    }
    erase(it);
    return n;
}

auto
params_encoded_ref::
replace(
    iterator pos,
    param_pct_view const& p) ->
        iterator
{
    return u_->edit_params(
        pos.it_,
        std::next(pos).it_,
        detail::param_encoded_iter(p));
}

auto
params_encoded_ref::
replace(
    iterator from,
    iterator to,
    std::initializer_list<
        param_pct_view> init) ->
    iterator
{
    return replace(
        from,
        to,
        init.begin(),
        init.end());
}

auto
params_encoded_ref::
unset(
    iterator pos) noexcept ->
        iterator
{
    BOOST_ASSERT(pos.it_.nk > 0);
    pct_string_view s;
    return u_->edit_params(
        pos.it_, pos.it_.next(),
        detail::param_encoded_value_iter(
            pos.it_.nk - 1, s, false));
}

auto
params_encoded_ref::
set(
    iterator pos,
    pct_string_view value) ->
        iterator
{
    BOOST_ASSERT(pos.it_.nk > 0);
    return u_->edit_params(
        pos.it_,
        pos.it_.next(),
        detail::param_encoded_value_iter(
            pos.it_.nk - 1, value, true));
}

auto
params_encoded_ref::
set(
    pct_string_view key,
    pct_string_view value,
    ignore_case_param ic) ->
        iterator
{
    // VFALCO we can't cache end() here
    // because it is invalidated
    // every time we set or erase.
    auto it0 = find(key, ic);
    if(it0 == end())
        return append({key, value});
    it0 = set(it0, value);
    auto it = end();
    for(;;)
    {
        it = find_last(it, key, ic);
        if(it == it0)
            return it0;
        it = erase(it);
    }
}

//------------------------------------------------
//
// (implementation)
//
//------------------------------------------------

detail::params_iter_impl
params_encoded_ref::
find_impl(
    detail::params_iter_impl it,
    pct_string_view key,
    ignore_case_param ic) const noexcept
{
    detail::params_iter_impl end_(u_->impl_, 0);
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
params_encoded_ref::
find_last_impl(
    detail::params_iter_impl it,
    pct_string_view key,
    ignore_case_param ic) const noexcept
{
    detail::params_iter_impl begin_(u_->impl_);
    if(! ic)
    {
        for(;;)
        {
            if(it.equal(begin_))
                return { u_->impl_, 0 };
            it.decrement();
            if(*it.key() == *key)
                return it;
        }
    }
    for(;;)
    {
        if(it.equal(begin_))
            return { u_->impl_, 0 };
        it.decrement();
        if(grammar::ci_is_equal(
                *it.key(), *key))
            return it;
    }
}

} // urls
} // boost

#endif
