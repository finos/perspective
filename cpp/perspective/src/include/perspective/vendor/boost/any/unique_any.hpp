// Copyright Antony Polukhin, 2020-2022.
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// See http://www.boost.org/libs/any for Documentation.

#ifndef BOOST_ANYS_UNIQUE_ANY_HPP_INCLUDED
#define BOOST_ANYS_UNIQUE_ANY_HPP_INCLUDED

#include <boost/config.hpp>
#ifdef BOOST_HAS_PRAGMA_ONCE
#   pragma once
#endif

#ifdef BOOST_NO_CXX11_RVALUE_REFERENCES
#error Header <boost/any/unique_any.hpp> requires C++11 compatible compiler with move semantics
#endif

#ifdef BOOST_NO_CXX11_DEFAULTED_FUNCTIONS
#error Header <boost/any/unique_any.hpp> requires C++11 compatible compiler with defaulted functions
#endif

#ifdef BOOST_NO_CXX11_SMART_PTR
#error Header <boost/any/unique_any.hpp> requires C++11 compatible standard library with std::unique_ptr
#endif
#include <memory>

#ifdef BOOST_NO_CXX11_HDR_INITIALIZER_LIST
#include <initializer_list>
#endif

#include <utility>

#include <boost/any/bad_any_cast.hpp>

#include <boost/core/addressof.hpp>
#include <boost/type_traits/decay.hpp>

namespace boost { namespace anys {

template <class T>
struct in_place_type_t
{
};

#if !defined(BOOST_NO_CXX14_VARIABLE_TEMPLATES)
template <class T>
constexpr in_place_type_t<T> in_place_type{};
#endif

class unique_any {
public:

    BOOST_CONSTEXPR unique_any() BOOST_NOEXCEPT = default;

    unique_any(unique_any&& other) BOOST_NOEXCEPT = default;

    // Perfect forwarding of T
    template<typename T>
    unique_any(T&& value
        , typename boost::disable_if<boost::is_same<unique_any&, T> >::type* = 0 // disable if value has type `unique_any&`
        , typename boost::disable_if<boost::is_const<T> >::type* = 0) // disable if value has type `const T&&`
      : content(new holder< typename boost::decay<T>::type >(std::forward<T>(value)))
    {
    }

    template<class T, class... Args>
    explicit unique_any(in_place_type_t<T>, Args&&... args)
      : content(new holder<typename boost::decay<T>::type>(std::forward<Args>(args)...))
    {
    }

#ifdef BOOST_NO_CXX11_HDR_INITIALIZER_LIST
    template <class T, class U, class... Args>
    explicit unique_any(in_place_type_t<T>, std::initializer_list<U> il, Args&&... args)
      : content(new holder<typename boost::decay<T>::type>(il, std::forward<Args>(args)...))
    {
    }
#endif

    ~unique_any() BOOST_NOEXCEPT = default;

    unique_any & operator=(unique_any&& rhs) BOOST_NOEXCEPT = default;

    template <class T>
    unique_any & operator=(T&& rhs)
    {
        unique_any(std::forward<T>(rhs)).swap(*this);
        return *this;
    }

    template<class T, class... Args>
    typename boost::decay<T>::type& emplace(Args&&... args) {
        content = std::unique_ptr<placeholder>(
            new holder<typename boost::decay<T>::type>(std::forward<Args>(args)...)
        );
    }

#ifdef BOOST_NO_CXX11_HDR_INITIALIZER_LIST
    template<class T, class U, class... Args>
    typename boost::decay<T>::type& emplace(initializer_list<U> il, Args&&... args) {
        content = std::unique_ptr<placeholder>(
            new holder<typename boost::decay<T>::type>(il, std::forward<Args>(args)...)
        );
    }
#endif

    void reset() BOOST_NOEXCEPT
    {
        content.reset();
    }

    unique_any& swap(unique_any& rhs) BOOST_NOEXCEPT
    {
        content.swap(rhs.content);
        return *this;
    }


    bool has_value() const BOOST_NOEXCEPT
    {
        return !content;
    }

    const boost::typeindex::type_info& type() const BOOST_NOEXCEPT
    {
        return content ? content->type() : boost::typeindex::type_id<void>().type_info();
    }

private: // types
    class BOOST_SYMBOL_VISIBLE placeholder
    {
        virtual ~placeholder()
        {
        }

        virtual const boost::typeindex::type_info& type() const BOOST_NOEXCEPT = 0;

    };

    template<typename T>
    class holder BOOST_FINAL: public placeholder
    {
    public: // structors

        template <class... Args>
        holder(Args&&... args)
          : held(std::forward<Args>(args)...)
        {
        }

#ifdef BOOST_NO_CXX11_HDR_INITIALIZER_LIST
        template <class U, class... Args>
        holder(std::initializer_list<U> il, Args&&... args)
          : held(il, std::forward<Args>(args)...)
        {
        }
#endif

        const boost::typeindex::type_info& type() const BOOST_NOEXCEPT BOOST_OVERRIDE
        {
            return boost::typeindex::type_id<T>().type_info();
        }

    public: // representation

        T held;
    };


private: // representation

    template<typename T>
    friend T * any_cast(unique_any *) BOOST_NOEXCEPT;

    template<typename T>
    friend T * unsafe_any_cast(unique_any *) BOOST_NOEXCEPT;

    std::unique_ptr<placeholder> content;
};

inline void swap(unique_any & lhs, unique_any & rhs) BOOST_NOEXCEPT
{
    lhs.swap(rhs);
}

template<typename T>
T * any_cast(unique_any * operand) BOOST_NOEXCEPT
{
    return operand && operand->type() == boost::typeindex::type_id<T>()
        ? boost::addressof(
            static_cast<unique_any::holder<BOOST_DEDUCED_TYPENAME remove_cv<T>::type>&>(*operand->content).held
          )
        : 0;
}

template<typename T>
inline const T * any_cast(const unique_any * operand) BOOST_NOEXCEPT
{
    return any_cast<T>(const_cast<unique_any *>(operand));
}

template<typename T>
T any_cast(unique_any & operand)
{
    typedef BOOST_DEDUCED_TYPENAME remove_reference<T>::type nonref;


    nonref * result = any_cast<nonref>(boost::addressof(operand));
    if(!result)
        boost::throw_exception(bad_any_cast());

    // Attempt to avoid construction of a temporary object in cases when
    // `T` is not a reference. Example:
    // `static_cast<std::string>(*result);`
    // which is equal to `std::string(*result);`
    typedef BOOST_DEDUCED_TYPENAME boost::conditional<
        boost::is_reference<T>::value,
        T,
        BOOST_DEDUCED_TYPENAME boost::add_reference<T>::type
    >::type ref_type;

#ifdef BOOST_MSVC
#   pragma warning(push)
#   pragma warning(disable: 4172) // "returning address of local variable or temporary" but *result is not local!
#endif
    return static_cast<ref_type>(*result);
#ifdef BOOST_MSVC
#   pragma warning(pop)
#endif
}

template<typename T>
inline T any_cast(const unique_any & operand)
{
    typedef BOOST_DEDUCED_TYPENAME remove_reference<T>::type nonref;
    return any_cast<const nonref &>(const_cast<unique_any &>(operand));
}

#ifndef BOOST_NO_CXX11_RVALUE_REFERENCES
template<typename T>
inline T any_cast(unique_any&& operand)
{
    BOOST_STATIC_ASSERT_MSG(
        boost::is_rvalue_reference<T&&>::value /*true if T is rvalue or just a value*/
        || boost::is_const< typename boost::remove_reference<T>::type >::value,
        "boost::any_cast shall not be used for getting nonconst references to temporary objects"
    );
    return any_cast<T>(operand);
}
#endif


// Note: The "unsafe" versions of any_cast are not part of the
// public interface and may be removed at any time. They are
// required where we know what type is stored in the any and can't
// use typeid() comparison, e.g., when our types may travel across
// different shared libraries.
template<typename T>
inline T * unsafe_any_cast(unique_any * operand) BOOST_NOEXCEPT
{
    return boost::addressof(
        static_cast<unique_any::holder<T>&>(*operand->content)->held
    );
}

template<typename T>
inline const T * unsafe_any_cast(const unique_any * operand) BOOST_NOEXCEPT
{
    return unsafe_any_cast<T>(const_cast<unique_any *>(operand));
}

} // namespace anys

using boost::anys::any_cast;
using boost::anys::unsafe_any_cast;

} // namespace boost


#endif // BOOST_ANYS_UNIQUE_ANY_HPP_INCLUDED
