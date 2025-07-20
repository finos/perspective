// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

#pragma once

#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>

namespace perspective {

/**
 * @brief `t_val` acts as an interface layer between value types in the binding
 * language and functionality in the core C++ library which acts on those value
 * types. The implementation of `t_val` differs based on the build:
 *
 * WASM builds using Emscripten treat `t_val` as an alias for `emscripten::val`.
 *
 * Python builds implement `t_val` on top of `py::object`.
 *
 * Regardless of the language, the public API presented by `t_val` is
 * symmetrical and is based on Emscripten's `val` API.
 *
 */
template <typename T>
class t_val {
public:
    /**
     * A `t_val` can be constructed from another `t_val` or from instances of
     * the underlying
     * `_val` type.
     */
    t_val(t_val&& v);

    t_val(const t_val& v);

    t_val(T&& v);

    t_val(const T& v);

    /**
     * @brief construct a `t_val` from an object of any type.
     *
     */
    template <typename F>
    explicit t_val(F&& value);

    explicit t_val(const char* v);

    t_val& operator=(T&& v);

    t_val& operator=(const T& v);

    t_val& operator=(t_val&& v);

    t_val& operator=(const t_val& v);

    // Never construct an empty `t_val`.
    t_val() = delete;

    ~t_val() {}

    static t_val array();

    template <typename F>
    static t_val array(const std::vector<F> vec);

    static t_val object();

    static t_val undefined();

    static t_val null();

    static t_val global(const char* name = 0);

    static t_val module_property(const char* name);

    template <typename K>
    t_val operator[](const K& key) const;

    template <typename... Args>
    t_val operator()(Args&&... args) const;

    /**
     * @brief Call a method on a `t_val` object by key, passing in a variable
     * number of arguments.
     *
     * @tparam ReturnType
     * @tparam Args
     * @param methodName
     * @param args
     * @return ReturnType
     */
    template <typename ReturnType, typename... Args>
    ReturnType call(const char* methodName, Args&&... args) const;

    template <typename ReturnType, typename... Args>
    ReturnType call(T handle, const char* methodName, Args&&... args) const;

    template <typename ReturnType, typename... Args>
    ReturnType call(t_val handle, const char* methodName, Args&&... args) const;

    template <typename ReturnType, typename... Policies>
    ReturnType as(Policies... policies) const;

    bool hasOwnProperty(const char* key) const;

    bool isNull() const;

    bool isUndefined() const;

    bool isTrue() const;

    bool isFalse() const;

    bool isNumber() const;

    bool isString() const;

    bool isArray() const;

    /**
     * A `t_val` can be compared to another `t_val` instance or an instance of
     * its underlying
     * `_val` type.
     */
    bool equals(const T& v) const;

    bool equals(const t_val& v) const;

    bool operator==(const T& v) const;

    bool operator==(const t_val& v) const;

    bool operator!=(const T& v) const;

    bool operator!=(const t_val& v) const;

    bool strictlyEquals(const T& v) const;

    bool strictlyEquals(const t_val& v) const;

    bool operator>(const T& v) const;

    bool operator>(const t_val& v) const;

    bool operator>=(const T& v) const;

    bool operator>=(const t_val& v) const;

    bool operator<(const T& v) const;

    bool operator<(const t_val& v) const;

    bool operator<=(const T& v) const;

    bool operator<=(const t_val& v) const;

    template <typename... Args>
    t_val new_(Args&&... args) const;

    template <typename K>
    void set(const K& key, const t_val& v);

    template <typename K>
    void set(const K& key, const T& v);

    template <typename K, typename V>
    void set(const K& key, const V& value);

    t_val typeOf() const;

    bool instanceof (const T& v) const;

    bool instanceof (const t_val& v) const;

    bool in(const T& v) const;

    bool in(const t_val& v) const;

    template <typename F>
    bool delete_(const F& property) const;

private:
    T _val;
};
} // namespace perspective

#endif