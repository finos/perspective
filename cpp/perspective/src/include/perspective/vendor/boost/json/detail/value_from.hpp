//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2020 Krystian Stasiowski (sdkrystian@gmail.com)
// Copyright (c) 2022 Dmitry Arkhipov (grisumbras@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_DETAIL_VALUE_FROM_HPP
#define BOOST_JSON_DETAIL_VALUE_FROM_HPP

#include <boost/json/conversion.hpp>
#include <boost/describe/enum_to_string.hpp>
#include <boost/mp11/algorithm.hpp>

#ifndef BOOST_NO_CXX17_HDR_OPTIONAL
# include <optional>
#endif

BOOST_JSON_NS_BEGIN

namespace detail {

template <class T>
struct append_tuple_element {
    array& arr;
    T&& t;

    template<std::size_t I>
    void
    operator()(mp11::mp_size_t<I>) const
    {
        using std::get;
        arr.emplace_back(value_from(
            get<I>(std::forward<T>(t)), arr.storage()));
    }
};

//----------------------------------------------------------
// User-provided conversion

template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    user_conversion_tag)
{
    tag_invoke(value_from_tag(), jv, std::forward<T>(from));
}


//----------------------------------------------------------
// Native conversion

template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    native_conversion_tag)
{
    jv = std::forward<T>(from);
}

// null-like types
template<class T>
void
value_from_helper(
    value& jv,
    T&&,
    null_like_conversion_tag)
{
    // do nothing
    BOOST_ASSERT(jv.is_null());
    (void)jv;
}

// string-like types
template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    string_like_conversion_tag)
{
    auto sv = static_cast<string_view>(from);
    jv.emplace_string().assign(sv);
}

// map-like types
template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    map_like_conversion_tag)
{
    using std::get;
    object& obj = jv.emplace_object();
    obj.reserve(detail::try_size(from, size_implementation<T>()));
    for (auto&& elem : from)
        obj.emplace(get<0>(elem), value_from(
            get<1>(elem), obj.storage()));
}

// ranges
template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    sequence_conversion_tag)
{
    array& result = jv.emplace_array();
    result.reserve(detail::try_size(from, size_implementation<T>()));
    for (auto&& elem : from)
        result.emplace_back(
            value_from(
                static_cast< forwarded_value<T&&> >(elem),
                result.storage() ));
}

// tuple-like types
template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    tuple_conversion_tag)
{
    constexpr std::size_t n =
        std::tuple_size<remove_cvref<T>>::value;
    array& arr = jv.emplace_array();
    arr.reserve(n);
    mp11::mp_for_each<mp11::mp_iota_c<n>>(
        append_tuple_element<T>{arr, std::forward<T>(from)});
}

// no suitable conversion implementation
template<class T>
void
value_from_helper(
    value&,
    T&&,
    no_conversion_tag)
{
    static_assert(
        !std::is_same<T, T>::value,
        "No suitable tag_invoke overload found for the type");
}

#ifndef BOOST_NO_CXX17_HDR_VARIANT
struct value_from_visitor
{
    value& jv;

    template<class T>
    void
    operator()(T&& t)
    {
        value_from(static_cast<T&&>(t), jv);
    }
};
#endif // BOOST_NO_CXX17_HDR_VARIANT

template< class T >
struct from_described_member
{
    using Ds = describe::describe_members<
        remove_cvref<T>, describe::mod_public | describe::mod_inherited>;

    object& obj;
    T&& from;

    template< class I >
    void
    operator()(I) const
    {
        using D = mp11::mp_at<Ds, I>;
        obj.emplace(
            D::name,
            value_from(
                static_cast<T&&>(from).* D::pointer,
                obj.storage()));
    }
};

// described classes
template<class T>
void
value_from_helper(
    value& jv,
    T&& from,
    described_class_conversion_tag)
{
    object& obj = jv.emplace_object();
    from_described_member<T> member_converter{obj, static_cast<T&&>(from)};

    using Ds = typename decltype(member_converter)::Ds;
    constexpr std::size_t N = mp11::mp_size<Ds>::value;
    obj.reserve(N);
    mp11::mp_for_each< mp11::mp_iota_c<N> >(member_converter);
}

// described enums
template<class T>
void
value_from_helper(
    value& jv,
    T from,
    described_enum_conversion_tag)
{
    (void)jv;
    (void)from;
#ifdef BOOST_DESCRIBE_CXX14
    char const* const name = describe::enum_to_string(from, nullptr);
    if( name )
    {
        string& str = jv.emplace_string();
        str.assign(name);
    }
    else
    {
        using Integer = typename std::underlying_type< remove_cvref<T> >::type;
        jv = static_cast<Integer>(from);
    }
#endif
}

} // detail

#ifndef BOOST_NO_CXX17_HDR_OPTIONAL
template<class T>
void
tag_invoke(
    value_from_tag,
    value& jv,
    std::optional<T> const& from)
{
    if( from )
        value_from(*from, jv);
    else
        jv = nullptr;
}

template<class T>
void
tag_invoke(
    value_from_tag,
    value& jv,
    std::optional<T>&& from)
{
    if( from )
        value_from(std::move(*from), jv);
    else
        jv = nullptr;
}

inline
void
tag_invoke(
    value_from_tag,
    value& jv,
    std::nullopt_t)
{
    // do nothing
    BOOST_ASSERT(jv.is_null());
    (void)jv;
}
#endif

#ifndef BOOST_NO_CXX17_HDR_VARIANT
// std::variant
template<class... Ts>
void
tag_invoke(
    value_from_tag,
    value& jv,
    std::variant<Ts...>&& from)
{
    std::visit(detail::value_from_visitor{jv}, std::move(from));
}

template<class... Ts>
void
tag_invoke(
    value_from_tag,
    value& jv,
    std::variant<Ts...> const& from)
{
    std::visit(detail::value_from_visitor{jv}, from);
}
#endif // BOOST_NO_CXX17_HDR_VARIANT

BOOST_JSON_NS_END

#endif
