//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2020 Krystian Stasiowski (sdkrystian@gmail.com)
// Copyright (c) 2021 Dmitry Arkhipov (grisumbras@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_DETAIL_VALUE_TO_HPP
#define BOOST_JSON_DETAIL_VALUE_TO_HPP

#include <boost/json/value.hpp>
#include <boost/json/conversion.hpp>
#include <boost/describe/enum_from_string.hpp>

#ifndef BOOST_NO_CXX17_HDR_OPTIONAL
# include <optional>
#endif

BOOST_JSON_NS_BEGIN

template<class T, class U,
    typename std::enable_if<
        ! std::is_reference<T>::value &&
    std::is_same<U, value>::value>::type>
T value_to(U const&);

template<class T>
typename result_for<T, value>::type
try_value_to(const value& jv);

namespace detail {

template<class T>
using has_reserve_member_helper = decltype(std::declval<T&>().reserve(0));
template<class T>
using has_reserve_member = mp11::mp_valid<has_reserve_member_helper, T>;
template<class T>
using reserve_implementation = mp11::mp_cond<
    is_tuple_like<T>,      mp11::mp_int<2>,
    has_reserve_member<T>, mp11::mp_int<1>,
    mp11::mp_true,         mp11::mp_int<0>>;

template<class T>
error_code
try_reserve(
    T&,
    std::size_t size,
    mp11::mp_int<2>)
{
    error_code ec;
    constexpr std::size_t N = std::tuple_size<remove_cvref<T>>::value;
    if ( N != size )
    {
        BOOST_JSON_FAIL(ec, error::size_mismatch);
    }
    return ec;
}

template<typename T>
error_code
try_reserve(
    T& cont,
    std::size_t size,
    mp11::mp_int<1>)
{
    cont.reserve(size);
    return error_code();
}

template<typename T>
error_code
try_reserve(
    T&,
    std::size_t,
    mp11::mp_int<0>)
{
    return error_code();
}


template<class T>
using has_push_back_helper
    = decltype(std::declval<T&>().push_back(std::declval<value_type<T>>()));
template<class T>
using has_push_back = mp11::mp_valid<has_push_back_helper, T>;
template<class T>
using inserter_implementation = mp11::mp_cond<
    is_tuple_like<T>, mp11::mp_int<2>,
    has_push_back<T>, mp11::mp_int<1>,
    mp11::mp_true,    mp11::mp_int<0>>;

template<class T>
iterator_type<T>
inserter(
    T& target,
    mp11::mp_int<2>)
{
    return target.begin();
}

template<class T>
std::back_insert_iterator<T>
inserter(
    T& target,
    mp11::mp_int<1>)
{
    return std::back_inserter(target);
}

template<class T>
std::insert_iterator<T>
inserter(
    T& target,
    mp11::mp_int<0>)
{
    return std::inserter(target, end(target));
}

// identity conversion
inline
result<value>
value_to_impl(
    try_value_to_tag<value>,
    value const& jv,
    value_conversion_tag)
{
    return jv;
}

inline
value
value_to_impl(
    value_to_tag<value>,
    value const& jv,
    value_conversion_tag)
{
    return jv;
}

// object
inline
result<object>
value_to_impl(
    try_value_to_tag<object>,
    value const& jv,
    object_conversion_tag)
{
    object const* obj = jv.if_object();
    if( obj )
        return *obj;
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_object);
    return ec;
}

// array
inline
result<array>
value_to_impl(
    try_value_to_tag<array>,
    value const& jv,
    array_conversion_tag)
{
    array const* arr = jv.if_array();
    if( arr )
        return *arr;
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_array);
    return ec;
}

// string
inline
result<string>
value_to_impl(
    try_value_to_tag<string>,
    value const& jv,
    string_conversion_tag)
{
    string const* str = jv.if_string();
    if( str )
        return *str;
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_string);
    return ec;
}

// bool
inline
result<bool>
value_to_impl(
    try_value_to_tag<bool>,
    value const& jv,
    bool_conversion_tag)
{
    auto b = jv.if_bool();
    if( b )
        return *b;
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_bool);
    return {boost::system::in_place_error, ec};
}

// integral and floating point
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    number_conversion_tag)
{
    error_code ec;
    auto const n = jv.to_number<T>(ec);
    if( ec.failed() )
        return {boost::system::in_place_error, ec};
    return {boost::system::in_place_value, n};
}

// null-like conversion
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    null_like_conversion_tag)
{
    if( jv.is_null() )
        return {boost::system::in_place_value, T{}};
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_null);
    return {boost::system::in_place_error, ec};
}

// string-like types
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    string_like_conversion_tag)
{
    auto str = jv.if_string();
    if( str )
        return {boost::system::in_place_value, T(str->subview())};
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_string);
    return {boost::system::in_place_error, ec};
}

// map-like containers
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    map_like_conversion_tag)
{
    error_code ec;

    object const* obj = jv.if_object();
    if( !obj )
    {
        BOOST_JSON_FAIL(ec, error::not_object);
        return {boost::system::in_place_error, ec};
    }

    T res;
    ec = detail::try_reserve(res, obj->size(), reserve_implementation<T>());
    if( ec.failed() )
        return {boost::system::in_place_error, ec};

    auto ins = detail::inserter(res, inserter_implementation<T>());
    for( key_value_pair const& kv: *obj )
    {
        auto elem_res = try_value_to<mapped_type<T>>(kv.value());
        if( elem_res.has_error() )
            return {boost::system::in_place_error, elem_res.error()};
        *ins++ = value_type<T>{
            key_type<T>(kv.key()),
            std::move(*elem_res)};
    }
    return res;
}

template<class T>
T
value_to_impl(
    value_to_tag<T>,
    value const& jv,
    map_like_conversion_tag)
{
    error_code ec;

    object const* obj = jv.if_object();
    if( !obj )
    {
        BOOST_JSON_FAIL(ec, error::not_object);
        throw_system_error(ec, BOOST_CURRENT_LOCATION);
    }

    T result;
    ec = detail::try_reserve(result, obj->size(), reserve_implementation<T>());
    if( ec.failed() )
        throw_system_error(ec, BOOST_CURRENT_LOCATION);

    auto ins = detail::inserter(result, inserter_implementation<T>());
    for( key_value_pair const& kv: *obj )
        *ins++ = value_type<T>{
            key_type<T>(kv.key()),
            value_to<mapped_type<T>>(kv.value())};
    return result;
}

// all other containers
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    sequence_conversion_tag)
{
    error_code ec;

    array const* arr = jv.if_array();
    if( !arr )
    {
        BOOST_JSON_FAIL(ec, error::not_array);
        return {boost::system::in_place_error, ec};
    }

    T result;
    ec = detail::try_reserve(result, arr->size(), reserve_implementation<T>());
    if( ec.failed() )
        return {boost::system::in_place_error, ec};

    auto ins = detail::inserter(result, inserter_implementation<T>());
    for( value const& val: *arr )
    {
        auto elem_res = try_value_to<value_type<T>>(val);
        if( elem_res.has_error() )
            return {boost::system::in_place_error, elem_res.error()};
        *ins++ = std::move(*elem_res);
    }
    return result;
}

template<class T>
T
value_to_impl(
    value_to_tag<T>,
    value const& jv,
    sequence_conversion_tag)
{
    error_code ec;

    array const* arr = jv.if_array();
    if( !arr )
    {
        BOOST_JSON_FAIL(ec, error::not_array);
        throw_system_error(ec, BOOST_CURRENT_LOCATION);
    }

    T result;
    ec = detail::try_reserve(result, arr->size(), reserve_implementation<T>());
    if( ec.failed() )
        throw_system_error(ec, BOOST_CURRENT_LOCATION);

    auto ins = detail::inserter(result, inserter_implementation<T>());
    for( value const& val: *arr )
        *ins++ = value_to<value_type<T>>(val);
    return result;
}

// tuple-like types
template <class T>
result<T>
try_make_tuple_elem(value const& jv, error_code& ec)
{
    if( ec.failed() )
        return {boost::system::in_place_error, ec};

    auto result = try_value_to<T>(jv);
    ec = result.error();
    return result;
}

template <class T, std::size_t... Is>
result<T>
try_make_tuple_like(array const& arr, boost::mp11::index_sequence<Is...>)
{
    error_code ec;
    auto items = std::make_tuple(
        try_make_tuple_elem<tuple_element_t<Is, T>>(
            arr[Is], ec)
        ...);
    if( ec.failed() )
        return {boost::system::in_place_error, ec};

    return {
        boost::system::in_place_value, T(std::move(*std::get<Is>(items))...)};
}

template <class T, std::size_t... Is>
T
make_tuple_like(array const& arr, boost::mp11::index_sequence<Is...>)
{
    return T(value_to<tuple_element_t<Is, T>>(arr[Is])...);
}

template <class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    tuple_conversion_tag)
{
    error_code ec;

    array const* arr = jv.if_array();
    if( !arr )
    {
        BOOST_JSON_FAIL(ec, error::not_array);
        return {boost::system::in_place_error, ec};
    }

    constexpr std::size_t N = std::tuple_size<remove_cvref<T>>::value;
    if( N != arr->size() )
    {
        BOOST_JSON_FAIL(ec, error::size_mismatch);
        return {boost::system::in_place_error, ec};
    }

    return try_make_tuple_like<T>(
        *arr, boost::mp11::make_index_sequence<N>());
}

template <class T>
T
value_to_impl(
    value_to_tag<T>,
    value const& jv,
    tuple_conversion_tag)
{
    error_code ec;

    array const* arr = jv.if_array();
    if( !arr )
    {
        BOOST_JSON_FAIL(ec, error::not_array);
        throw_system_error(ec, BOOST_CURRENT_LOCATION);
    }

    constexpr std::size_t N = std::tuple_size<remove_cvref<T>>::value;
    if( N != arr->size() )
    {
        BOOST_JSON_FAIL(ec, error::size_mismatch);
        throw_system_error(ec, BOOST_CURRENT_LOCATION);
    }

    return make_tuple_like<T>(
        *arr, boost::mp11::make_index_sequence<N>());
}

template< class T >
struct to_described_member
{
    using Ds = describe::describe_members<
        T, describe::mod_public | describe::mod_inherited>;

    template< class D >
    using described_member_t = remove_cvref<decltype(
        std::declval<T&>().* D::pointer )>;

    result<T>& res;
    object const& obj;

    template< class I >
    void
    operator()(I) const
    {
        if( !res )
            return;

        using D = mp11::mp_at<Ds, I>;
        auto const found = obj.find(D::name);
        if( found == obj.end() )
        {
            error_code ec;
            BOOST_JSON_FAIL(ec, error::unknown_name);
            res = {boost::system::in_place_error, ec};
            return;
        }

        using M = described_member_t<D>;
        auto member_res = try_value_to<M>(found->value());
        if( member_res )
            (*res).* D::pointer = std::move(*member_res);
        else
            res = {boost::system::in_place_error, member_res.error()};
    }
};

// described classes
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    described_class_conversion_tag)
{
    result<T> res;

    auto* obj = jv.if_object();
    if( !obj )
    {
        error_code ec;
        BOOST_JSON_FAIL(ec, error::not_object);
        res = {boost::system::in_place_error, ec};
        return res;
    }

    to_described_member<T> member_converter{res, *obj};
    using Ds = typename decltype(member_converter)::Ds;

    constexpr std::size_t N = mp11::mp_size<Ds>::value;
    if( obj->size() != N )
    {
        error_code ec;
        BOOST_JSON_FAIL(ec, error::size_mismatch);
        res = {boost::system::in_place_error, ec};
        return res;
    }

    mp11::mp_for_each< mp11::mp_iota_c<N> >(member_converter);
    return res;
}

// described enums
template<class T>
result<T>
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    described_enum_conversion_tag)
{
    T val = {};
    (void)jv;
#ifdef BOOST_DESCRIBE_CXX14
    error_code ec;

    auto str = jv.if_string();
    if( !str )
    {
        BOOST_JSON_FAIL(ec, error::not_string);
        return {system::in_place_error, ec};
    }

    if( !describe::enum_from_string(str->data(), val) )
    {
        BOOST_JSON_FAIL(ec, error::unknown_name);
        return {system::in_place_error, ec};
    }
#endif

    return {system::in_place_value, val};
}

//----------------------------------------------------------
// User-provided conversion
template<class T>
typename std::enable_if<
    mp11::mp_valid<has_user_conversion_to_impl, T>::value,
    T>::type
value_to_impl(
    value_to_tag<T> tag,
    value const& jv,
    user_conversion_tag)
{
    return tag_invoke(tag, jv);
}

template<class T>
typename std::enable_if<
    !mp11::mp_valid<has_user_conversion_to_impl, T>::value,
    T>::type
value_to_impl(
    value_to_tag<T>,
    value const& jv,
    user_conversion_tag)
{
    auto res = tag_invoke(try_value_to_tag<T>(), jv);
    if( res.has_error() )
        throw_system_error(res.error(), BOOST_CURRENT_LOCATION);
    return std::move(*res);
}

template<class T>
typename std::enable_if<
    mp11::mp_valid<has_nonthrowing_user_conversion_to_impl, T>::value,
    result<T>>::type
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    user_conversion_tag)
{
    return tag_invoke(try_value_to_tag<T>(), jv);
}

template<class T>
typename std::enable_if<
    !mp11::mp_valid<has_nonthrowing_user_conversion_to_impl, T>::value,
    result<T>>::type
value_to_impl(
    try_value_to_tag<T>,
    value const& jv,
    user_conversion_tag)
{
    try
    {
        return {
            boost::system::in_place_value, tag_invoke(value_to_tag<T>(), jv)};
    }
    catch( std::bad_alloc const&)
    {
        throw;
    }
    catch( system_error const& e)
    {
        return {boost::system::in_place_error, e.code()};
    }
    catch( ... )
    {
        error_code ec;
        BOOST_JSON_FAIL(ec, error::exception);
        return {boost::system::in_place_error, ec};
    }
}

// no suitable conversion implementation
template<class T>
T
value_to_impl(
    value_to_tag<T>,
    value const&,
    no_conversion_tag)
{
    static_assert(
        !std::is_same<T, T>::value,
        "No suitable tag_invoke overload found for the type");
}

// generic wrapper over non-throwing implementations
template<class T, class Impl>
T
value_to_impl(
    value_to_tag<T>,
    value const& jv,
    Impl impl)
{
    return value_to_impl(try_value_to_tag<T>(), jv, impl).value();
}

template<class T>
using value_to_implementation
    = conversion_implementation<T, value_to_conversion>;

} // detail

// std::optional
#ifndef BOOST_NO_CXX17_HDR_OPTIONAL
template<class T>
result<std::optional<T>>
tag_invoke(
    try_value_to_tag<std::optional<T>>,
    value const& jv)
{
    if( jv.is_null() )
        return std::optional<T>();
    else
        return try_value_to<T>(jv);
}

inline
result<std::nullopt_t>
tag_invoke(
    try_value_to_tag<std::nullopt_t>,
    value const& jv)
{
    if( jv.is_null() )
        return std::nullopt;
    error_code ec;
    BOOST_JSON_FAIL(ec, error::not_null);
    return ec;
}
#endif

// std::variant
#ifndef BOOST_NO_CXX17_HDR_VARIANT
template<class... Ts>
result< std::variant<Ts...> >
tag_invoke(
    try_value_to_tag< std::variant<Ts...> >,
    value const& jv)
{
    error_code ec;
    BOOST_JSON_FAIL(ec, error::exhausted_variants);

    using Variant = std::variant<Ts...>;
    result<Variant> res = {system::in_place_error, ec};
    mp11::mp_for_each< mp11::mp_iota_c<sizeof...(Ts)> >([&](auto I) {
        if( res )
            return;

        using T = std::variant_alternative_t<I.value, Variant>;
        auto attempt = try_value_to<T>(jv);
        if( attempt )
            res.emplace(std::in_place_index_t<I>(), std::move(*attempt));
    });

    if( res.has_error() )
    {
        res = {system::in_place_error, ec};
    }
    return res;
}
#endif // BOOST_NO_CXX17_HDR_VARIANT

BOOST_JSON_NS_END

#endif
