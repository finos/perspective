//
// Copyright (c) 2020 Krystian Stasiowski (sdkrystian@gmail.com)
// Copyright (c) 2022 Dmitry Arkhipov (grisumbras@yandex.ru)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_IMPL_CONVERSION_HPP
#define BOOST_JSON_IMPL_CONVERSION_HPP

#include <boost/json/fwd.hpp>
#include <boost/json/value.hpp>
#include <boost/json/string_view.hpp>
#include <boost/describe/enumerators.hpp>
#include <boost/describe/members.hpp>
#include <boost/describe/bases.hpp>
#include <boost/mp11/algorithm.hpp>
#include <boost/mp11/utility.hpp>

#include <iterator>
#include <utility>
#ifndef BOOST_NO_CXX17_HDR_VARIANT
# include <variant>
#endif // BOOST_NO_CXX17_HDR_VARIANT

BOOST_JSON_NS_BEGIN
namespace detail {

#ifdef __cpp_lib_nonmember_container_access
using std::size;
#endif

template<std::size_t I, class T>
using tuple_element_t = typename std::tuple_element<I, T>::type;

template<class T>
using iterator_type = decltype(std::begin(std::declval<T&>()));
template<class T>
using iterator_traits = std::iterator_traits< iterator_type<T> >;

template<class T>
using value_type = typename iterator_traits<T>::value_type;
template<class T>
using mapped_type = tuple_element_t< 1, value_type<T> >;

// had to make the metafunction always succeeding in order to make it work
// with msvc 14.0
template<class T>
using key_type_helper = tuple_element_t< 0, value_type<T> >;
template<class T>
using key_type = mp11::mp_eval_or<
    void,
    key_type_helper,
    T>;

template<class T>
using are_begin_and_end_same = std::is_same<
    iterator_type<T>,
    decltype(std::end(std::declval<T&>()))>;

template<class T>
using begin_iterator_category = typename std::iterator_traits<
    iterator_type<T>>::iterator_category;

template<class T>
using has_positive_tuple_size = mp11::mp_bool<
    (std::tuple_size<T>::value > 0) >;

template<class T>
using has_unique_keys = has_positive_tuple_size<decltype(
    std::declval<T&>().emplace(
        std::declval<value_type<T>>()))>;

template<class T>
struct is_value_type_pair_helper : std::false_type
{ };
template<class T1, class T2>
struct is_value_type_pair_helper<std::pair<T1, T2>> : std::true_type
{ };
template<class T>
using is_value_type_pair = is_value_type_pair_helper<value_type<T>>;

template<class T>
using has_size_member_helper
    = std::is_convertible<decltype(std::declval<T&>().size()), std::size_t>;
template<class T>
using has_size_member = mp11::mp_valid_and_true<has_size_member_helper, T>;
template<class T>
using has_free_size_helper
    = std::is_convertible<
        decltype(size(std::declval<T const&>())),
        std::size_t>;
template<class T>
using has_free_size = mp11::mp_valid_and_true<has_free_size_helper, T>;
template<class T>
using size_implementation = mp11::mp_cond<
    has_size_member<T>, mp11::mp_int<3>,
    has_free_size<T>,   mp11::mp_int<2>,
    std::is_array<T>,   mp11::mp_int<1>,
    mp11::mp_true,      mp11::mp_int<0>>;

template<class T>
std::size_t
try_size(T&& cont, mp11::mp_int<3>)
{
    return cont.size();
}

template<class T>
std::size_t
try_size(T& cont, mp11::mp_int<2>)
{
    return size(cont);
}

template<class T, std::size_t N>
std::size_t
try_size(T(&)[N], mp11::mp_int<1>)
{
    return N;
}

template<class T>
std::size_t
try_size(T&, mp11::mp_int<0>)
{
    return 0;
}

using value_from_conversion = mp11::mp_true;
using value_to_conversion = mp11::mp_false;

struct user_conversion_tag { };
struct native_conversion_tag { };
struct value_conversion_tag : native_conversion_tag { };
struct object_conversion_tag : native_conversion_tag { };
struct array_conversion_tag : native_conversion_tag { };
struct string_conversion_tag : native_conversion_tag { };
struct bool_conversion_tag : native_conversion_tag { };
struct number_conversion_tag : native_conversion_tag { };
struct null_like_conversion_tag { };
struct string_like_conversion_tag { };
struct map_like_conversion_tag { };
struct sequence_conversion_tag { };
struct tuple_conversion_tag { };
struct described_class_conversion_tag { };
struct described_enum_conversion_tag { };
struct no_conversion_tag { };

template<class T>
using has_user_conversion_from_impl
    = decltype(tag_invoke(
        value_from_tag(), std::declval<value&>(), std::declval<T&&>()));
template<class T>
using has_user_conversion_to_impl
    = decltype(tag_invoke(value_to_tag<T>(), std::declval<value const &>()));
template<class T>
using has_nonthrowing_user_conversion_to_impl
    = decltype(tag_invoke(
        try_value_to_tag<T>(), std::declval<value const&>() ));
template<class T, class Dir>
using has_user_conversion = mp11::mp_if<
    std::is_same<Dir, value_from_conversion>,
    mp11::mp_valid<has_user_conversion_from_impl, T>,
    mp11::mp_or<
        mp11::mp_valid<has_user_conversion_to_impl, T>,
        mp11::mp_valid<has_nonthrowing_user_conversion_to_impl, T>>>;

template< class T >
using described_non_public_members = describe::describe_members<
    T, describe::mod_private | describe::mod_protected>;
template< class T >
using described_bases = describe::describe_bases<
    T, describe::mod_any_access>;

template<class T, class Dir>
using conversion_implementation = mp11::mp_cond<
    // user conversion (via tag_invoke)
    has_user_conversion<T, Dir>, user_conversion_tag,
    // native conversions (constructors and member functions of value)
    std::is_same<T, value>,      value_conversion_tag,
    std::is_same<T, array>,      array_conversion_tag,
    std::is_same<T, object>,     object_conversion_tag,
    std::is_same<T, string>,     string_conversion_tag,
    std::is_same<T, bool>,       bool_conversion_tag,
    std::is_arithmetic<T>,       number_conversion_tag,
    // generic conversions
    is_null_like<T>,             null_like_conversion_tag,
    is_string_like<T>,           string_like_conversion_tag,
    is_map_like<T>,              map_like_conversion_tag,
    is_sequence_like<T>,         sequence_conversion_tag,
    is_tuple_like<T>,            tuple_conversion_tag,
    is_described_class<T>,       described_class_conversion_tag,
    is_described_enum<T>,        described_enum_conversion_tag,
    // failed to find a suitable implementation
    mp11::mp_true,                   no_conversion_tag>;

template <class T, class Dir>
using can_convert = mp11::mp_not<
    std::is_same<
        detail::conversion_implementation<T, Dir>,
        detail::no_conversion_tag>>;

template<class T>
using value_from_implementation
    = conversion_implementation<T, value_from_conversion>;

template<class T>
using value_to_implementation
    = conversion_implementation<T, value_to_conversion>;

template<class Impl1, class Impl2>
using conversion_round_trips_helper = mp11::mp_or<
    std::is_same<Impl1, Impl2>,
    std::is_same<user_conversion_tag, Impl1>,
    std::is_same<user_conversion_tag, Impl2>>;
template<class T, class Dir>
using conversion_round_trips  = conversion_round_trips_helper<
    conversion_implementation<T, Dir>,
    conversion_implementation<T, mp11::mp_not<Dir>>>;

template< class T1, class T2 >
struct copy_cref_helper
{
    using type = remove_cvref<T2>;
};
template< class T1, class T2 >
using copy_cref = typename copy_cref_helper< T1, T2 >::type;

template< class T1, class T2 >
struct copy_cref_helper<T1 const, T2>
{
    using type = remove_cvref<T2> const;
};
template< class T1, class T2 >
struct copy_cref_helper<T1&, T2>
{
    using type = copy_cref<T1, T2>&;
};
template< class T1, class T2 >
struct copy_cref_helper<T1&&, T2>
{
    using type = copy_cref<T1, T2>&&;
};

template< class Rng, class Traits >
using forwarded_value_helper = mp11::mp_if<
    std::is_convertible<
        typename Traits::reference,
        copy_cref<Rng, typename Traits::value_type> >,
    copy_cref<Rng, typename Traits::value_type>,
    typename Traits::value_type >;

template< class Rng >
using forwarded_value = forwarded_value_helper<
    Rng, iterator_traits< Rng > >;

} // namespace detail

template <class T>
struct result_for<T, value>
{
    using type = result< detail::remove_cvref<T> >;
};

template<class T>
struct is_string_like
    : std::is_convertible<T, string_view>
{ };

template<class T>
struct is_sequence_like
    : mp11::mp_all<
        mp11::mp_valid_and_true<detail::are_begin_and_end_same, T>,
        mp11::mp_valid<detail::begin_iterator_category, T>>
{ };

template<class T>
struct is_map_like
    : mp11::mp_all<
        is_sequence_like<T>,
        mp11::mp_valid_and_true<detail::is_value_type_pair, T>,
        is_string_like<detail::key_type<T>>,
        mp11::mp_valid_and_true<detail::has_unique_keys, T>>
{ };

template<class T>
struct is_tuple_like
    : mp11::mp_valid_and_true<detail::has_positive_tuple_size, T>
{ };

template<>
struct is_null_like<std::nullptr_t>
    : std::true_type
{ };

#ifndef BOOST_NO_CXX17_HDR_VARIANT
template<>
struct is_null_like<std::monostate>
    : std::true_type
{ };
#endif // BOOST_NO_CXX17_HDR_VARIANT

template<class T>
struct is_described_class
    : mp11::mp_and<
        describe::has_describe_members<T>,
        mp11::mp_not< std::is_union<T> >,
        mp11::mp_empty<
            mp11::mp_eval_or<
                mp11::mp_list<>, detail::described_non_public_members, T>>,
        mp11::mp_empty<
            mp11::mp_eval_or<mp11::mp_list<>, detail::described_bases, T>>>
{ };

template<class T>
struct is_described_enum
    : describe::has_describe_enumerators<T>
{ };

BOOST_JSON_NS_END

#endif // BOOST_JSON_IMPL_CONVERSION_HPP
