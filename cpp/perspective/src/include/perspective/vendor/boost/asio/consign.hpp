//
// consign.hpp
// ~~~~~~~~~~
//
// Copyright (c) 2003-2022 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_CONSIGN_HPP
#define BOOST_ASIO_CONSIGN_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>

#if (defined(BOOST_ASIO_HAS_STD_TUPLE) \
    && defined(BOOST_ASIO_HAS_VARIADIC_TEMPLATES)) \
  || defined(GENERATING_DOCUMENTATION)

#include <tuple>
#include <boost/asio/detail/type_traits.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {

/// Completion token type used to specify that the completion handler should
/// carry additional values along with it.
/**
 * This completion token adapter is typically used to keep at least one copy of
 * an object, such as a smart pointer, alive until the completion handler is
 * called.
 */
template <typename CompletionToken, typename... Values>
class consign_t
{
public:
  /// Constructor.
  template <typename T, typename... V>
  BOOST_ASIO_CONSTEXPR explicit consign_t(
      BOOST_ASIO_MOVE_ARG(T) completion_token,
      BOOST_ASIO_MOVE_ARG(V)... values)
    : token_(BOOST_ASIO_MOVE_CAST(T)(completion_token)),
      values_(BOOST_ASIO_MOVE_CAST(V)(values)...)
  {
  }

#if defined(GENERATING_DOCUMENTATION)
private:
#endif // defined(GENERATING_DOCUMENTATION)
  CompletionToken token_;
  std::tuple<Values...> values_;
};

/// Completion token adapter used to specify that the completion handler should
/// carry additional values along with it.
/**
 * This completion token adapter is typically used to keep at least one copy of
 * an object, such as a smart pointer, alive until the completion handler is
 * called.
 */
template <typename CompletionToken, typename... Values>
BOOST_ASIO_NODISCARD inline BOOST_ASIO_CONSTEXPR consign_t<
  typename decay<CompletionToken>::type, typename decay<Values>::type...>
consign(BOOST_ASIO_MOVE_ARG(CompletionToken) completion_token,
    BOOST_ASIO_MOVE_ARG(Values)... values)
{
  return consign_t<
    typename decay<CompletionToken>::type, typename decay<Values>::type...>(
      BOOST_ASIO_MOVE_CAST(CompletionToken)(completion_token),
      BOOST_ASIO_MOVE_CAST(Values)(values)...);
}

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#include <boost/asio/impl/consign.hpp>

#endif // (defined(BOOST_ASIO_HAS_STD_TUPLE)
       //     && defined(BOOST_ASIO_HAS_VARIADIC_TEMPLATES))
       //   || defined(GENERATING_DOCUMENTATION)

#endif // BOOST_ASIO_CONSIGN_HPP
