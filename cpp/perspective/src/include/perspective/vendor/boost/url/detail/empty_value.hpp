/*
Copyright 2018 Glen Joseph Fernandes
(glenjofe@gmail.com)

Copyright 2022 Vinnie Falco
(vinnie dot falco at gmail dot com)
* Added constexpr
* removed pre-C++11 support

Distributed under the Boost Software License, Version 1.0.
(http://www.boost.org/LICENSE_1_0.txt)
*/
#ifndef BOOST_URL_DETAIL_EMPTY_VALUE_HPP
#define BOOST_URL_DETAIL_EMPTY_VALUE_HPP

#include <boost/config.hpp>
#if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
#include <utility>
#endif

#if defined(BOOST_GCC_VERSION) && (BOOST_GCC_VERSION >= 40700)
#define BOOST_DETAIL_EMPTY_VALUE_BASE
#elif defined(BOOST_INTEL) && defined(_MSC_VER) && (_MSC_VER >= 1800)
#define BOOST_DETAIL_EMPTY_VALUE_BASE
#elif defined(BOOST_MSVC) && (BOOST_MSVC >= 1800)
#define BOOST_DETAIL_EMPTY_VALUE_BASE
#elif defined(BOOST_CLANG) && !defined(__CUDACC__)
#if __has_feature(is_empty) && __has_feature(is_final)
#define BOOST_DETAIL_EMPTY_VALUE_BASE
#endif
#endif

#if defined(_MSC_VER)
#pragma warning(push)
#pragma warning(disable:4510)
#endif

namespace boost {
namespace urls {
namespace detail {

template<class T>
struct use_empty_value_base {
    enum {
#if defined(BOOST_DETAIL_EMPTY_VALUE_BASE)
        value = __is_empty(T) && !__is_final(T)
#else
        value = false
#endif
    };
};

struct empty_init_t { };

namespace empty_ {

template<
    class T,
    unsigned N = 0,
    bool E = use_empty_value_base<T>::value>
class empty_value
{
    T value_;

public:
    typedef T type;

    constexpr
    empty_value() = default;

    constexpr
    empty_value(
        empty_init_t) noexcept
        : value_()
    {
    }

    template<
        class U, class... Args>
    constexpr
    empty_value(
        empty_init_t,
        U&& value,
        Args&&... args) noexcept
        : value_(
            std::forward<U>(value),
            std::forward<Args>(args)...)
    {
    }

    T const&
    get() const noexcept
    {
        return value_;
    }

    T&
    get() noexcept
    {
        return value_;
    }
};

//------------------------------------------------

template<class T, unsigned N>
class empty_value<T, N, true>
    : T
{
public:
    typedef T type;

    constexpr
    empty_value() noexcept = default;

    constexpr
    empty_value(
        empty_init_t) noexcept
        : T()
    {
    }

    template<
        class U, class... Args>
    constexpr
    empty_value(
        empty_init_t,
        U&& value,
        Args&&... args) noexcept
        : T(std::forward<U>(value),
            std::forward<Args>(args)...)
    {
    }

    T const&
    get() const noexcept
    {
        return *this;
    }

    T&
    get() noexcept
    {
        return *this;
    }
};

} /* empty_ */

using empty_::empty_value;

constexpr empty_init_t empty_init{};

} // detail
} // urls
} // boost

#if defined(_MSC_VER)
#pragma warning(pop)
#endif

#endif
