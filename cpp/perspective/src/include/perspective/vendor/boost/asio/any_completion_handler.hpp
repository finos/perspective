//
// any_completion_handler.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2022 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_ANY_COMPLETION_HANDLER_HPP
#define BOOST_ASIO_ANY_COMPLETION_HANDLER_HPP

#include <boost/asio/detail/config.hpp>

#if (defined(BOOST_ASIO_HAS_STD_TUPLE) \
    && defined(BOOST_ASIO_HAS_MOVE) \
    && defined(BOOST_ASIO_HAS_VARIADIC_TEMPLATES)) \
  || defined(GENERATING_DOCUMENTATION)

#include <cstring>
#include <functional>
#include <memory>
#include <utility>
#include <boost/asio/any_completion_executor.hpp>
#include <boost/asio/associated_allocator.hpp>
#include <boost/asio/associated_cancellation_slot.hpp>
#include <boost/asio/associated_executor.hpp>
#include <boost/asio/cancellation_state.hpp>
#include <boost/asio/recycling_allocator.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace detail {

class any_completion_handler_impl_base
{
public:
  template <typename S>
  explicit any_completion_handler_impl_base(S&& slot)
    : cancel_state_(BOOST_ASIO_MOVE_CAST(S)(slot), enable_total_cancellation())
  {
  }

  cancellation_slot get_cancellation_slot() const BOOST_ASIO_NOEXCEPT
  {
    return cancel_state_.slot();
  }

private:
  cancellation_state cancel_state_;
};

template <typename Handler>
class any_completion_handler_impl :
  public any_completion_handler_impl_base
{
public:
  template <typename S, typename H>
  any_completion_handler_impl(S&& slot, H&& h)
    : any_completion_handler_impl_base(BOOST_ASIO_MOVE_CAST(S)(slot)),
      handler_(BOOST_ASIO_MOVE_CAST(H)(h))
  {
  }

  struct uninit_deleter
  {
    typename std::allocator_traits<
      associated_allocator_t<Handler,
        boost::asio::recycling_allocator<void>>>::template
          rebind_alloc<any_completion_handler_impl> alloc;

    void operator()(any_completion_handler_impl* ptr)
    {
      std::allocator_traits<decltype(alloc)>::deallocate(alloc, ptr, 1);
    }
  };

  struct deleter
  {
    typename std::allocator_traits<
      associated_allocator_t<Handler,
        boost::asio::recycling_allocator<void>>>::template
          rebind_alloc<any_completion_handler_impl> alloc;

    void operator()(any_completion_handler_impl* ptr)
    {
      std::allocator_traits<decltype(alloc)>::destroy(alloc, ptr);
      std::allocator_traits<decltype(alloc)>::deallocate(alloc, ptr, 1);
    }
  };

  template <typename S, typename H>
  static any_completion_handler_impl* create(S&& slot, H&& h)
  {
    uninit_deleter d{
        (get_associated_allocator)(h,
          boost::asio::recycling_allocator<void>())};

    std::unique_ptr<any_completion_handler_impl, uninit_deleter> uninit_ptr(
        std::allocator_traits<decltype(d.alloc)>::allocate(d.alloc, 1), d);

    any_completion_handler_impl* ptr =
      new (uninit_ptr.get()) any_completion_handler_impl(
        BOOST_ASIO_MOVE_CAST(S)(slot), BOOST_ASIO_MOVE_CAST(H)(h));

    uninit_ptr.release();
    return ptr;
  }

  void destroy()
  {
    deleter d{
        (get_associated_allocator)(handler_,
          boost::asio::recycling_allocator<void>())};

    d(this);
  }

  any_completion_executor executor(
      const any_completion_executor& candidate) const BOOST_ASIO_NOEXCEPT
  {
    return any_completion_executor(std::nothrow,
        (get_associated_executor)(handler_, candidate));
  }

  void* allocate(std::size_t size, std::size_t align) const
  {
    typename std::allocator_traits<
      associated_allocator_t<Handler,
        boost::asio::recycling_allocator<void>>>::template
          rebind_alloc<unsigned char> alloc(
            (get_associated_allocator)(handler_,
              boost::asio::recycling_allocator<void>()));

    std::size_t space = size + align - 1;
    unsigned char* base =
      std::allocator_traits<decltype(alloc)>::allocate(
        alloc, space + sizeof(std::ptrdiff_t));

    void* p = base;
    if (detail::align(align, size, p, space))
    {
      std::ptrdiff_t off = static_cast<unsigned char*>(p) - base;
      std::memcpy(static_cast<unsigned char*>(p) + size, &off, sizeof(off));
      return p;
    }

    std::bad_alloc ex;
    boost::asio::detail::throw_exception(ex);
    return nullptr;
  }

  void deallocate(void* p, std::size_t size, std::size_t align) const
  {
    if (p)
    {
      typename std::allocator_traits<
        associated_allocator_t<Handler,
          boost::asio::recycling_allocator<void>>>::template
            rebind_alloc<unsigned char> alloc(
              (get_associated_allocator)(handler_,
                boost::asio::recycling_allocator<void>()));

      std::ptrdiff_t off;
      std::memcpy(&off, static_cast<unsigned char*>(p) + size, sizeof(off));
      unsigned char* base = static_cast<unsigned char*>(p) - off;

      std::allocator_traits<decltype(alloc)>::deallocate(
          alloc, base, size + align -1 + sizeof(std::ptrdiff_t));
    }
  }

  template <typename... Args>
  void call(Args&&... args)
  {
    deleter d{
        (get_associated_allocator)(handler_,
          boost::asio::recycling_allocator<void>())};

    std::unique_ptr<any_completion_handler_impl, deleter> ptr(this, d);
    Handler handler(BOOST_ASIO_MOVE_CAST(Handler)(handler_));
    ptr.reset();

    BOOST_ASIO_MOVE_CAST(Handler)(handler)(
        BOOST_ASIO_MOVE_CAST(Args)(args)...);
  }

private:
  Handler handler_;
};

template <typename Signature>
class any_completion_handler_call_fn;

template <typename R, typename... Args>
class any_completion_handler_call_fn<R(Args...)>
{
public:
  using type = void(*)(any_completion_handler_impl_base*, Args...);

  constexpr any_completion_handler_call_fn(type fn)
    : call_fn_(fn)
  {
  }

  void call(any_completion_handler_impl_base* impl, Args... args) const
  {
    call_fn_(impl, BOOST_ASIO_MOVE_CAST(Args)(args)...);
  }

  template <typename Handler>
  static void impl(any_completion_handler_impl_base* impl, Args... args)
  {
    static_cast<any_completion_handler_impl<Handler>*>(impl)->call(
        BOOST_ASIO_MOVE_CAST(Args)(args)...);
  }

private:
  type call_fn_;
};

template <typename... Signatures>
class any_completion_handler_call_fns;

template <typename Signature>
class any_completion_handler_call_fns<Signature> :
  public any_completion_handler_call_fn<Signature>
{
public:
  using any_completion_handler_call_fn<
    Signature>::any_completion_handler_call_fn;
  using any_completion_handler_call_fn<Signature>::call;
};

template <typename Signature, typename... Signatures>
class any_completion_handler_call_fns<Signature, Signatures...> :
  public any_completion_handler_call_fn<Signature>,
  public any_completion_handler_call_fns<Signatures...>
{
public:
  template <typename CallFn, typename... CallFns>
  constexpr any_completion_handler_call_fns(CallFn fn, CallFns... fns)
    : any_completion_handler_call_fn<Signature>(fn),
      any_completion_handler_call_fns<Signatures...>(fns...)
  {
  }

  using any_completion_handler_call_fn<Signature>::call;
  using any_completion_handler_call_fns<Signatures...>::call;
};

class any_completion_handler_destroy_fn
{
public:
  using type = void(*)(any_completion_handler_impl_base*);

  constexpr any_completion_handler_destroy_fn(type fn)
    : destroy_fn_(fn)
  {
  }

  void destroy(any_completion_handler_impl_base* impl) const
  {
    destroy_fn_(impl);
  }

  template <typename Handler>
  static void impl(any_completion_handler_impl_base* impl)
  {
    static_cast<any_completion_handler_impl<Handler>*>(impl)->destroy();
  }

private:
  type destroy_fn_;
};

class any_completion_handler_executor_fn
{
public:
  using type = any_completion_executor(*)(
      any_completion_handler_impl_base*, const any_completion_executor&);

  constexpr any_completion_handler_executor_fn(type fn)
    : executor_fn_(fn)
  {
  }

  any_completion_executor executor(any_completion_handler_impl_base* impl,
      const any_completion_executor& candidate) const
  {
    return executor_fn_(impl, candidate);
  }

  template <typename Handler>
  static any_completion_executor impl(any_completion_handler_impl_base* impl,
      const any_completion_executor& candidate)
  {
    return static_cast<any_completion_handler_impl<Handler>*>(impl)->executor(
        candidate);
  }

private:
  type executor_fn_;
};

class any_completion_handler_allocate_fn
{
public:
  using type = void*(*)(any_completion_handler_impl_base*,
      std::size_t, std::size_t);

  constexpr any_completion_handler_allocate_fn(type fn)
    : allocate_fn_(fn)
  {
  }

  void* allocate(any_completion_handler_impl_base* impl,
      std::size_t size, std::size_t align) const
  {
    return allocate_fn_(impl, size, align);
  }

  template <typename Handler>
  static void* impl(any_completion_handler_impl_base* impl,
      std::size_t size, std::size_t align)
  {
    return static_cast<any_completion_handler_impl<Handler>*>(impl)->allocate(
        size, align);
  }

private:
  type allocate_fn_;
};

class any_completion_handler_deallocate_fn
{
public:
  using type = void(*)(any_completion_handler_impl_base*,
      void*, std::size_t, std::size_t);

  constexpr any_completion_handler_deallocate_fn(type fn)
    : deallocate_fn_(fn)
  {
  }

  void deallocate(any_completion_handler_impl_base* impl,
      void* p, std::size_t size, std::size_t align) const
  {
    deallocate_fn_(impl, p, size, align);
  }

  template <typename Handler>
  static void impl(any_completion_handler_impl_base* impl,
      void* p, std::size_t size, std::size_t align)
  {
    static_cast<any_completion_handler_impl<Handler>*>(impl)->deallocate(
        p, size, align);
  }

private:
  type deallocate_fn_;
};

template <typename... Signatures>
class any_completion_handler_fn_table
  : private any_completion_handler_destroy_fn,
    private any_completion_handler_executor_fn,
    private any_completion_handler_allocate_fn,
    private any_completion_handler_deallocate_fn,
    private any_completion_handler_call_fns<Signatures...>
{
public:
  template <typename... CallFns>
  constexpr any_completion_handler_fn_table(
      any_completion_handler_destroy_fn::type destroy_fn,
      any_completion_handler_executor_fn::type executor_fn,
      any_completion_handler_allocate_fn::type allocate_fn,
      any_completion_handler_deallocate_fn::type deallocate_fn,
      CallFns... call_fns)
    : any_completion_handler_destroy_fn(destroy_fn),
      any_completion_handler_executor_fn(executor_fn),
      any_completion_handler_allocate_fn(allocate_fn),
      any_completion_handler_deallocate_fn(deallocate_fn),
      any_completion_handler_call_fns<Signatures...>(call_fns...)
  {
  }

  using any_completion_handler_destroy_fn::destroy;
  using any_completion_handler_executor_fn::executor;
  using any_completion_handler_allocate_fn::allocate;
  using any_completion_handler_deallocate_fn::deallocate;
  using any_completion_handler_call_fns<Signatures...>::call;
};

template <typename Handler, typename... Signatures>
struct any_completion_handler_fn_table_instance
{
  static constexpr any_completion_handler_fn_table<Signatures...>
    value = any_completion_handler_fn_table<Signatures...>(
        &any_completion_handler_destroy_fn::impl<Handler>,
        &any_completion_handler_executor_fn::impl<Handler>,
        &any_completion_handler_allocate_fn::impl<Handler>,
        &any_completion_handler_deallocate_fn::impl<Handler>,
        &any_completion_handler_call_fn<Signatures>::template impl<Handler>...);
};

template <typename Handler, typename... Signatures>
constexpr any_completion_handler_fn_table<Signatures...>
any_completion_handler_fn_table_instance<Handler, Signatures...>::value;

} // namespace detail

template <typename... Signatures>
class any_completion_handler;

template <typename T, typename... Signatures>
class any_completion_handler_allocator
{
private:
  template <typename...>
  friend class any_completion_handler;

  template <typename, typename...>
  friend class any_completion_handler_allocator;

  const detail::any_completion_handler_fn_table<Signatures...>* fn_table_;
  detail::any_completion_handler_impl_base* impl_;

  constexpr any_completion_handler_allocator(int,
      const any_completion_handler<Signatures...>& h) BOOST_ASIO_NOEXCEPT
    : fn_table_(h.fn_table_),
      impl_(h.impl_)
  {
  }

public:
  typedef T value_type;

  template <typename U>
  struct rebind
  {
    typedef any_completion_handler_allocator<U, Signatures...> other;
  };

  template <typename U>
  constexpr any_completion_handler_allocator(
      const any_completion_handler_allocator<U, Signatures...>& a)
    BOOST_ASIO_NOEXCEPT
    : fn_table_(a.fn_table_),
      impl_(a.impl_)
  {
  }

  constexpr bool operator==(
      const any_completion_handler_allocator& other) const BOOST_ASIO_NOEXCEPT
  {
    return fn_table_ == other.fn_table_ && impl_ == other.impl_;
  }

  constexpr bool operator!=(
      const any_completion_handler_allocator& other) const BOOST_ASIO_NOEXCEPT
  {
    return fn_table_ != other.fn_table_ || impl_ != other.impl_;
  }

  T* allocate(std::size_t n) const
  {
    return static_cast<T*>(
        fn_table_->allocate(
          impl_, sizeof(T) * n, alignof(T)));
  }

  void deallocate(T* p, std::size_t n) const
  {
    fn_table_->deallocate(impl_, p, sizeof(T) * n, alignof(T));
  }
};

template <typename... Signatures>
class any_completion_handler_allocator<void, Signatures...>
{
private:
  template <typename...>
  friend class any_completion_handler;

  template <typename, typename...>
  friend class any_completion_handler_allocator;

  const detail::any_completion_handler_fn_table<Signatures...>* fn_table_;
  detail::any_completion_handler_impl_base* impl_;

  constexpr any_completion_handler_allocator(int,
      const any_completion_handler<Signatures...>& h) BOOST_ASIO_NOEXCEPT
    : fn_table_(h.fn_table_),
      impl_(h.impl_)
  {
  }

public:
  typedef void value_type;

  template <typename U>
  struct rebind
  {
    typedef any_completion_handler_allocator<U, Signatures...> other;
  };

  template <typename U>
  constexpr any_completion_handler_allocator(
      const any_completion_handler_allocator<U, Signatures...>& a)
    BOOST_ASIO_NOEXCEPT
    : fn_table_(a.fn_table_),
      impl_(a.impl_)
  {
  }

  constexpr bool operator==(
      const any_completion_handler_allocator& other) const BOOST_ASIO_NOEXCEPT
  {
    return fn_table_ == other.fn_table_ && impl_ == other.impl_;
  }

  constexpr bool operator!=(
      const any_completion_handler_allocator& other) const BOOST_ASIO_NOEXCEPT
  {
    return fn_table_ != other.fn_table_ || impl_ != other.impl_;
  }
};

template <typename... Signatures>
class any_completion_handler
{
private:
  template <typename, typename...>
  friend class any_completion_handler_allocator;

  template <typename, typename>
  friend struct associated_executor;

  const detail::any_completion_handler_fn_table<Signatures...>* fn_table_;
  detail::any_completion_handler_impl_base* impl_;

public:
  using allocator_type = any_completion_handler_allocator<void, Signatures...>;
  using cancellation_slot_type = cancellation_slot;

  constexpr any_completion_handler()
    : fn_table_(nullptr),
      impl_(nullptr)
  {
  }

  constexpr any_completion_handler(nullptr_t)
    : fn_table_(nullptr),
      impl_(nullptr)
  {
  }

  template <typename H, typename Handler = typename decay<H>::type>
  any_completion_handler(H&& h)
    : fn_table_(
        &detail::any_completion_handler_fn_table_instance<
          Handler, Signatures...>::value),
      impl_(detail::any_completion_handler_impl<Handler>::create(
            (get_associated_cancellation_slot)(h), BOOST_ASIO_MOVE_CAST(H)(h)))
  {
  }

  any_completion_handler(any_completion_handler&& other) BOOST_ASIO_NOEXCEPT
    : fn_table_(other.fn_table_),
      impl_(other.impl_)
  {
    other.fn_table_ = nullptr;
    other.impl_ = nullptr;
  }

  any_completion_handler& operator=(
      any_completion_handler&& other) BOOST_ASIO_NOEXCEPT
  {
    any_completion_handler(other).swap(*this);
    return *this;
  }

  any_completion_handler& operator=(nullptr_t) BOOST_ASIO_NOEXCEPT
  {
    any_completion_handler().swap(*this);
    return *this;
  }

  ~any_completion_handler()
  {
    if (impl_)
      fn_table_->destroy(impl_);
  }

  constexpr explicit operator bool() const BOOST_ASIO_NOEXCEPT
  {
    return impl_ != nullptr;
  }

  constexpr bool operator!() const BOOST_ASIO_NOEXCEPT
  {
    return impl_ == nullptr;
  }

  void swap(any_completion_handler& other) BOOST_ASIO_NOEXCEPT
  {
    std::swap(fn_table_, other.fn_table_);
    std::swap(impl_, other.impl_);
  }

  allocator_type get_allocator() const BOOST_ASIO_NOEXCEPT
  {
    return allocator_type(0, *this);
  }

  cancellation_slot_type get_cancellation_slot() const BOOST_ASIO_NOEXCEPT
  {
    return impl_->get_cancellation_slot();
  }

  template <typename... Args>
  auto operator()(Args&&... args)
    -> decltype(fn_table_->call(impl_, BOOST_ASIO_MOVE_CAST(Args)(args)...))
  {
    if (detail::any_completion_handler_impl_base* impl = impl_)
    {
      impl_ = nullptr;
      return fn_table_->call(impl, BOOST_ASIO_MOVE_CAST(Args)(args)...);
    }
    std::bad_function_call ex;
    boost::asio::detail::throw_exception(ex);
  }

  friend constexpr bool operator==(
      const any_completion_handler& a, nullptr_t) BOOST_ASIO_NOEXCEPT
  {
    return a.impl_ == nullptr;
  }

  friend constexpr bool operator==(
      nullptr_t, const any_completion_handler& b) BOOST_ASIO_NOEXCEPT
  {
    return nullptr == b.impl_;
  }

  friend constexpr bool operator!=(
      const any_completion_handler& a, nullptr_t) BOOST_ASIO_NOEXCEPT
  {
    return a.impl_ != nullptr;
  }

  friend constexpr bool operator!=(
      nullptr_t, const any_completion_handler& b) BOOST_ASIO_NOEXCEPT
  {
    return nullptr != b.impl_;
  }
};

template <typename... Signatures, typename Candidate>
struct associated_executor<any_completion_handler<Signatures...>, Candidate>
{
  using type = any_completion_executor;

  static type get(const any_completion_handler<Signatures...>& handler,
      const Candidate& candidate = Candidate()) BOOST_ASIO_NOEXCEPT
  {
    return handler.fn_table_->executor(handler.impl_,
        any_completion_executor(std::nothrow, candidate));
  }
};

} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // (defined(BOOST_ASIO_HAS_STD_TUPLE)
       //     && defined(BOOST_ASIO_HAS_MOVE)
       //     && defined(BOOST_ASIO_HAS_VARIADIC_TEMPLATES))
       //   || defined(GENERATING_DOCUMENTATION)

#endif // BOOST_ASIO_ANY_COMPLETION_HANDLER_HPP
