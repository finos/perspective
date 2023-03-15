//
// process/exit_code.hpp
// ~~~~~~~~~~~~~~
//
// Copyright (c) 2022 Klemens D. Morgenstern (klemens dot morgenstern at gmx dot net)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_PROCESS_V2_EXIT_CODE_HPP
#define BOOST_PROCESS_V2_EXIT_CODE_HPP

#include <boost/process/v2/detail/config.hpp>
#include <boost/process/v2/error.hpp>

#if defined(BOOST_PROCESS_V2_STANDALONE)
#include <asio/associator.hpp>
#include <asio/async_result.hpp>
#else
#include <boost/asio/associator.hpp>
#include <boost/asio/async_result.hpp>
#endif 

#if defined(BOOST_PROCESS_V2_POSIX)
#include <sys/wait.h>
#endif

BOOST_PROCESS_V2_BEGIN_NAMESPACE

#if defined(GENERATING_DOCUMENTATION)

/// The native exit-code type, usually an integral value
/** The OS may have a value different from `int` to represent 
 * the exit codes of subprocesses. It might also 
 * contain additional information.
 */ 
typedef implementation_defined native_exit_code_type;


/// Check if the native exit code indicates the process is still running
bool process_is_running(native_exit_code_type code);

/// Obtain the portable part of the exit code, i.e. what the subprocess has returned from main.
int evaluate_exit_code(native_exit_code_type code);


#else

#if defined(BOOST_PROCESS_V2_WINDOWS)

typedef unsigned long native_exit_code_type;

namespace detail
{
constexpr native_exit_code_type still_active = 259u;
}

inline bool process_is_running(native_exit_code_type code)
{
  return code == detail::still_active;
}

inline int evaluate_exit_code(native_exit_code_type code)
{
  return static_cast<int>(code);
}

#else

typedef int native_exit_code_type;

namespace detail
{
constexpr native_exit_code_type still_active = 0x7f;
}

inline bool process_is_running(int code)
{
    return !WIFEXITED(code) && !WIFSIGNALED(code);
}

inline int evaluate_exit_code(int code)
{
  if (WIFEXITED(code))
    return WEXITSTATUS(code);
  else if (WIFSIGNALED(code))
    return WTERMSIG(code);
  else
    return code;
}

#endif

#endif


/** Convert the exit-code in a completion into an error if the actual error isn't set.
 * @code {.cpp}
 * process proc{ctx, "exit", {"1"}};
 * 
 * proc.async_wait(code_as_error(
 *    [](error_code ec)
 *    {
 *      assert(ec.value() == 10);
 *      assert(ec.category() == error::get_exit_code_category());
 *    }));
 * 
 * @endcode
 */ 
template<typename CompletionToken>
struct code_as_error_t
{
    CompletionToken token_;
    const error_category & category;

    template<typename Token_>
    code_as_error_t(Token_ && token, const error_category & category)
        : token_(std::forward<Token_>(token)), category(category)
    {
    }
};

/// Deduction function for code_as_error_t.
template<typename CompletionToken>
code_as_error_t<CompletionToken> code_as_error(
        CompletionToken && token, 
        const error_category & category = error::get_exit_code_category())
{
  return code_as_error_t<typename std::decay<CompletionToken>::type>(
      std::forward<CompletionToken>(token), category);
};

namespace detail
{

template<typename Handler>
struct code_as_error_handler
{
  typedef void result_type;

  template<typename H>
  code_as_error_handler(H && h, const error_category & category) 
      : handler_(std::forward<H>(h)), category(category) 
  {
  }

  void operator()(error_code ec, native_exit_code_type code)
  {
    if (!ec)
      ec.assign(code, category);
    std::move(handler_)(ec);
  }


  Handler handler_;
  const error_category & category;
};

}


BOOST_PROCESS_V2_END_NAMESPACE


#if !defined(BOOST_PROCESS_V2_STANDALONE)
namespace boost
{
#endif
namespace asio
{

template <typename CompletionToken>
struct async_result<
    BOOST_PROCESS_V2_NAMESPACE::code_as_error_t<CompletionToken>,
      void(BOOST_PROCESS_V2_NAMESPACE::error_code,
           BOOST_PROCESS_V2_NAMESPACE::native_exit_code_type)>
{
  using signature = void(BOOST_PROCESS_V2_NAMESPACE::error_code);
  using return_type = typename async_result<CompletionToken, void(BOOST_PROCESS_V2_NAMESPACE::error_code)>::return_type;
  

  template <typename Initiation>
  struct init_wrapper
  {
    init_wrapper(Initiation init)
      : initiation_(std::move(init))
    {
    }

    template <typename Handler, typename... Args>
    void operator()(
        Handler && handler,
        const BOOST_PROCESS_V2_NAMESPACE::error_category & cat,
        Args && ... args)
    {
          std::move(initiation_)(
            BOOST_PROCESS_V2_NAMESPACE::detail::code_as_error_handler<typename decay<Handler>::type>(
              std::forward<Handler>(handler), cat),
              std::forward<Args>(args)...);
    }

    Initiation initiation_;

  };

  template <typename Initiation, typename RawCompletionToken, typename... Args>
  static BOOST_PROCESS_V2_INITFN_DEDUCED_RESULT_TYPE(CompletionToken, signature,
      (async_initiate<CompletionToken, signature>(
        declval<init_wrapper<typename decay<Initiation>::type> >(),
        declval<CompletionToken&>(),
        declval<BOOST_ASIO_MOVE_ARG(Args)>()...)))
  initiate(
      Initiation && initiation,
      RawCompletionToken && token,
      Args &&... args)
  {
    return async_initiate<CompletionToken, signature>(
        init_wrapper<typename decay<Initiation>::type>(
          std::forward<Initiation>(initiation)),
          token.token_,
          token.category,
          std::forward<Args>(args)...);
  }
};




template<template <typename, typename> class Associator, typename Handler, typename DefaultCandidate>
struct associator<Associator,
    BOOST_PROCESS_V2_NAMESPACE::detail::code_as_error_handler<Handler>, DefaultCandidate>
  : Associator<Handler, DefaultCandidate>
{
  static typename Associator<Handler, DefaultCandidate>::type get(
      const BOOST_PROCESS_V2_NAMESPACE::detail::code_as_error_handler<Handler> & h,
      const DefaultCandidate& c = DefaultCandidate()) noexcept
  {
    return Associator<Handler, DefaultCandidate>::get(h.handler_, c);
  }
};


}
#if !defined(BOOST_PROCESS_V2_STANDALONE)
} // boost
#endif


#endif //BOOST_PROCESS_V2_EXIT_CODE_HPP