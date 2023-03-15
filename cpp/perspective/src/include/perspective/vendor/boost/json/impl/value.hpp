//
// Copyright (c) 2022 Dmitry Arkhipov (grisumbras@yandex.ru)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_IMPL_VALUE_HPP
#define BOOST_JSON_IMPL_VALUE_HPP

BOOST_JSON_NS_BEGIN

value&
value::at_pointer(string_view ptr) &
{
    auto const& self = *this;
    return const_cast<value&>( self.at_pointer(ptr) );
}

value&&
value::at_pointer(string_view ptr) &&
{
    return std::move( this->at_pointer(ptr) );
}

BOOST_JSON_NS_END

#endif // BOOST_JSON_IMPL_VALUE_HPP
