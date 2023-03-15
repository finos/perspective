#ifndef BOOST_LEAF_RESULT_HPP_INCLUDED
#define BOOST_LEAF_RESULT_HPP_INCLUDED

// Copyright 2018-2022 Emil Dotchevski and Reverge Studios, Inc.

// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

#include <boost/leaf/config.hpp>
#include <boost/leaf/exception.hpp>

#include <climits>
#include <functional>

namespace boost { namespace leaf {

class bad_result:
    public std::exception,
    public error_id
{
    char const * what() const noexcept final override
    {
        return "boost::leaf::bad_result";
    }

public:

    explicit bad_result( error_id id ) noexcept:
        error_id(id)
    {
        BOOST_LEAF_ASSERT(value());
    }
};

////////////////////////////////////////

namespace leaf_detail
{
    template <class T>
    struct stored
    {
        using type = T;
        using value_type = T;
        using value_type_const = T const;
        using value_cref = T const &;
        using value_ref = T &;
        using value_rv_cref = T const &&;
        using value_rv_ref = T &&;

        static value_type_const * cptr( type const & v ) noexcept
        {
            return &v;
        }

        static value_type * ptr( type & v ) noexcept
        {
            return &v;
        }
    };

    template <class T>
    struct stored<T &>
    {
        using type = std::reference_wrapper<T>;
        using value_type_const = T;
        using value_type = T;
        using value_ref = T &;
        using value_cref = T &;
        using value_rv_ref = T &;
        using value_rv_cref = T &;

        static value_type_const * cptr( type const & v ) noexcept
        {
            return &v.get();
        }

        static value_type * ptr( type const & v ) noexcept
        {
            return &v.get();
        }
    };

    class result_discriminant
    {
        unsigned state_;

    public:

        enum kind_t
        {
            no_error = 0,
            err_id = 1,
            ctx_ptr = 2,
            val = 3
        };

        explicit result_discriminant( error_id id ) noexcept:
            state_(unsigned(id.value()))
        {
            BOOST_LEAF_ASSERT(state_==0 || (state_&3)==1);
        }

        struct kind_val { };
        explicit result_discriminant( kind_val ) noexcept:
            state_(val)
        {
        }

#if BOOST_LEAF_CFG_CAPTURE
        struct kind_ctx_ptr { };
        explicit result_discriminant( kind_ctx_ptr ) noexcept:
            state_(ctx_ptr)
        {
        }
#endif

        kind_t kind() const noexcept
        {
            return kind_t(state_&3);
        }

        error_id get_error_id() const noexcept
        {
            BOOST_LEAF_ASSERT(kind()==no_error || kind()==err_id);
            return make_error_id(int(state_));
        }
    };
}

////////////////////////////////////////

template <class T>
class result
{
    template <class U>
    friend class result;

    using result_discriminant = leaf_detail::result_discriminant;

    struct error_result
    {
        error_result( error_result && ) = default;
        error_result( error_result const & ) = delete;
        error_result & operator=( error_result const & ) = delete;

        result & r_;

        error_result( result & r ) noexcept:
            r_(r)
        {
        }

        template <class U>
        operator result<U>() noexcept
        {
            switch(r_.what_.kind())
            {
            case result_discriminant::val:
                return result<U>(error_id());
            case result_discriminant::ctx_ptr:
#if BOOST_LEAF_CFG_CAPTURE
                return result<U>(std::move(r_.ctx_));
#else
                BOOST_LEAF_ASSERT(0); // Possible ODR violation.
#endif
            default:
                return result<U>(std::move(r_.what_));
            }
        }

        operator error_id() noexcept
        {
            switch(r_.what_.kind())
            {
            case result_discriminant::val:
                return error_id();
            case result_discriminant::ctx_ptr:
#if BOOST_LEAF_CFG_CAPTURE
                {
                    error_id captured_id = r_.ctx_->propagate_captured_errors();
                    tls::write_uint<leaf_detail::tls_tag_id_factory_current_id>(unsigned(captured_id.value()));
                    return captured_id;
                }
#else
                BOOST_LEAF_ASSERT(0); // Possible ODR violation.
#endif
            default:
                return r_.what_.get_error_id();
            }
        }
    };

    using stored_type = typename leaf_detail::stored<T>::type;
    using value_type = typename leaf_detail::stored<T>::value_type;
    using value_type_const = typename leaf_detail::stored<T>::value_type_const;
    using value_ref = typename leaf_detail::stored<T>::value_ref;
    using value_cref = typename leaf_detail::stored<T>::value_cref;
    using value_rv_ref = typename leaf_detail::stored<T>::value_rv_ref;
    using value_rv_cref = typename leaf_detail::stored<T>::value_rv_cref;

    union
    {
        stored_type stored_;
#if BOOST_LEAF_CFG_CAPTURE
        context_ptr ctx_;
#endif
    };

    result_discriminant what_;

    void destroy() const noexcept
    {
        switch(this->what_.kind())
        {
        case result_discriminant::val:
            stored_.~stored_type();
            break;
        case result_discriminant::ctx_ptr:
#if BOOST_LEAF_CFG_CAPTURE
            BOOST_LEAF_ASSERT(!ctx_ || ctx_->captured_id_);
            ctx_.~context_ptr();
#else
            BOOST_LEAF_ASSERT(0); // Possible ODR violation.
#endif
        default:
            break;
        }
    }

    template <class U>
    result_discriminant move_from( result<U> && x ) noexcept
    {
        auto x_what = x.what_;
        switch(x_what.kind())
        {
        case result_discriminant::val:
            (void) new(&stored_) stored_type(std::move(x.stored_));
            break;
        case result_discriminant::ctx_ptr:
#if BOOST_LEAF_CFG_CAPTURE
            BOOST_LEAF_ASSERT(!x.ctx_ || x.ctx_->captured_id_);
            (void) new(&ctx_) context_ptr(std::move(x.ctx_));
#else
            BOOST_LEAF_ASSERT(0); // Possible ODR violation.
#endif
        default:
            break;
        }
        return x_what;
    }

    result( result_discriminant && what ) noexcept:
        what_(std::move(what))
    {
        BOOST_LEAF_ASSERT(what_.kind()==result_discriminant::err_id || what_.kind()==result_discriminant::no_error);
    }

    error_id get_error_id() const noexcept
    {
        BOOST_LEAF_ASSERT(what_.kind()!=result_discriminant::val);
#if BOOST_LEAF_CFG_CAPTURE
        return what_.kind()==result_discriminant::ctx_ptr ? ctx_->captured_id_ : what_.get_error_id();
#else
        BOOST_LEAF_ASSERT(what_.kind()!=result_discriminant::ctx_ptr); // Possible ODR violation.
        return what_.get_error_id();
#endif
    }

    stored_type const * get() const noexcept
    {
        return has_value() ? &stored_ : nullptr;
    }

    stored_type * get() noexcept
    {
        return has_value() ? &stored_ : nullptr;
    }

protected:

    void enforce_value_state() const
    {
        if( !has_value() )
            ::boost::leaf::leaf_detail::throw_exception_impl(bad_result(get_error_id()));
    }

public:

    result( result && x ) noexcept:
        what_(move_from(std::move(x)))
    {
    }

    template <class U, class = typename std::enable_if<std::is_convertible<U, T>::value>::type>
    result( result<U> && x ) noexcept:
        what_(move_from(std::move(x)))
    {
    }

    result():
        stored_(stored_type()),
        what_(result_discriminant::kind_val{})
    {
    }

    result( value_type && v ) noexcept:
        stored_(std::forward<value_type>(v)),
        what_(result_discriminant::kind_val{})
    {
    }

    result( value_type const & v ):
        stored_(v),
        what_(result_discriminant::kind_val{})
    {
    }

    result( error_id err ) noexcept:
        what_(err)
    {
    }

#if defined(BOOST_STRICT_CONFIG) || !defined(__clang__)

    // This should be the default implementation, but std::is_convertible
    // breaks under COMPILER=/usr/bin/clang++ CXXSTD=11 clang 3.3.
    // On the other hand, the workaround exposes a rather severe bug in
    //__GNUC__ under 11: https://github.com/boostorg/leaf/issues/25.

    // SFINAE: T can be initialized with a U, e.g. result<std::string>("literal").
    template <class U, class = typename std::enable_if<std::is_convertible<U, T>::value>::type>
    result( U && u ):
        stored_(std::forward<U>(u)),
        what_(result_discriminant::kind_val{})
    {
    }

#else

private:
    static int init_T_with_U( T && );
public:

    // SFINAE: T can be initialized with a U, e.g. result<std::string>("literal").
    template <class U>
    result( U && u, decltype(init_T_with_U(std::forward<U>(u))) * = nullptr ):
        stored_(std::forward<U>(u)),
        what_(result_discriminant::kind_val{})
    {
    }

#endif

#if BOOST_LEAF_CFG_STD_SYSTEM_ERROR
    result( std::error_code const & ec ) noexcept:
        what_(error_id(ec))
    {
    }

    template <class Enum>
    result( Enum e, typename std::enable_if<std::is_error_code_enum<Enum>::value, int>::type * = nullptr ) noexcept:
        what_(error_id(e))
    {
    }
#endif

#if BOOST_LEAF_CFG_CAPTURE
    result( context_ptr && ctx ) noexcept:
        ctx_(std::move(ctx)),
        what_(result_discriminant::kind_ctx_ptr{})
    {
    }
#endif

    ~result() noexcept
    {
        destroy();
    }

    result & operator=( result && x ) noexcept
    {
        destroy();
        what_ = move_from(std::move(x));
        return *this;
    }

    template <class U>
    result & operator=( result<U> && x ) noexcept
    {
        destroy();
        what_ = move_from(std::move(x));
        return *this;
    }

    bool has_value() const noexcept
    {
        return what_.kind() == result_discriminant::val;
    }

    bool has_error() const noexcept
    {
        return !has_value();
    }

    explicit operator bool() const noexcept
    {
        return has_value();
    }

#ifdef BOOST_LEAF_NO_CXX11_REF_QUALIFIERS

    value_cref value() const
    {
        enforce_value_state();
        return stored_;
    }

    value_ref value()
    {
        enforce_value_state();
        return stored_;
    }

#else

    value_cref value() const &
    {
        enforce_value_state();
        return stored_;
    }

    value_ref value() &
    {
        enforce_value_state();
        return stored_;
    }

    value_rv_cref value() const &&
    {
        enforce_value_state();
        return std::move(stored_);
    }

    value_rv_ref value() &&
    {
        enforce_value_state();
        return std::move(stored_);
    }

#endif

    value_type_const * operator->() const noexcept
    {
        return has_value() ? leaf_detail::stored<T>::cptr(stored_) : nullptr;
    }

    value_type * operator->() noexcept
    {
        return has_value() ? leaf_detail::stored<T>::ptr(stored_) : nullptr;
    }

#ifdef BOOST_LEAF_NO_CXX11_REF_QUALIFIERS

    value_cref operator*() const noexcept
    {
        auto p = get();
        BOOST_LEAF_ASSERT(p != nullptr);
        return *p;
    }

    value_ref operator*() noexcept
    {
        auto p = get();
        BOOST_LEAF_ASSERT(p != nullptr);
        return *p;
    }

#else

    value_cref operator*() const & noexcept
    {
        auto p = get();
        BOOST_LEAF_ASSERT(p != nullptr);
        return *p;
    }

    value_ref operator*() & noexcept
    {
        auto p = get();
        BOOST_LEAF_ASSERT(p != nullptr);
        return *p;
    }

    value_rv_cref operator*() const && noexcept
    {
        auto p = get();
        BOOST_LEAF_ASSERT(p != nullptr);
        return std::move(*p);
    }

    value_rv_ref operator*() && noexcept
    {
        auto p = get();
        BOOST_LEAF_ASSERT(p != nullptr);
        return std::move(*p);
    }

#endif

    error_result error() noexcept
    {
        return error_result{*this};
    }

    template <class... Item>
    error_id load( Item && ... item ) noexcept
    {
        return error_id(error()).load(std::forward<Item>(item)...);
    }
};

////////////////////////////////////////

namespace leaf_detail
{
    struct void_ { };
}

template <>
class result<void>:
    result<leaf_detail::void_>
{
    using result_discriminant = leaf_detail::result_discriminant;
    using void_ = leaf_detail::void_;
    using base = result<void_>;

    template <class U>
    friend class result;

    result( result_discriminant && what ) noexcept:
        base(std::move(what))
    {
    }

public:

    using value_type = void;

    result( result && x ) noexcept:
        base(std::move(x))
    {
    }

    result() noexcept
    {
    }

    result( error_id err ) noexcept:
        base(err)
    {
    }

#if BOOST_LEAF_CFG_STD_SYSTEM_ERROR
    result( std::error_code const & ec ) noexcept:
        base(ec)
    {
    }

    template <class Enum>
    result( Enum e, typename std::enable_if<std::is_error_code_enum<Enum>::value, Enum>::type * = nullptr ) noexcept:
        base(e)
    {
    }
#endif

#if BOOST_LEAF_CFG_CAPTURE
    result( context_ptr && ctx ) noexcept:
        base(std::move(ctx))
    {
    }
#endif

    ~result() noexcept
    {
    }

    void value() const
    {
        base::enforce_value_state();
    }

    void const * operator->() const noexcept
    {
        return base::operator->();
    }

    void * operator->() noexcept
    {
        return base::operator->();
    }

    void operator*() const noexcept
    {
        BOOST_LEAF_ASSERT(has_value());
    }

    using base::operator=;
    using base::operator bool;
    using base::get_error_id;
    using base::error;
    using base::load;
};

////////////////////////////////////////

template <class R>
struct is_result_type;

template <class T>
struct is_result_type<result<T>>: std::true_type
{
};

} }

#endif
