/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once

#if defined(PSP_ENABLE_WASM) || defined(PSP_ENABLE_PYTHON)

#include <typeinfo>
#include <perspective/base.h>
#include <emscripten/val.h>

namespace perspective {

class t_val {
public:
    /**
     * A `t_val` can be constructed from another `t_val` or from instances of the underlying
     * `_val` type.
     */
    template <typename T>
    explicit t_val(T&& value)
        : _val(std::move(value)) {}

    explicit t_val(const char* v)
        : _val(emscripten::val(v)) {}

    t_val(emscripten::val&& v)
        : _val(std::move(v)) {}

    t_val(const emscripten::val& v)
        : _val(v) {}

    t_val(t_val&& v)
        : _val(std::move(v._val)) {}

    t_val(const t_val& v)
        : _val(v._val) {}

    t_val&
    operator=(emscripten::val&& v) {
        _val = std::move(v);
        return *this;
    }

    t_val&
    operator=(const emscripten::val& v) {
        _val = v;
        return *this;
    }

    t_val&
    operator=(t_val&& v) {
        std::cout << "MOVE T =" << std::endl;
        _val = std::move(v._val);
        return *this;
    }

    t_val&
    operator=(const t_val& v) {
        std::cout << "COPY T =" << std::endl;
        _val = v._val;
        return *this;
    }

    // Never construct an empty `t_val`.
    t_val() = delete;

    ~t_val() {}

    /**
     * Getters
     */
    emscripten::val
    get_internal_val() {
        return _val;
    }

    /**
     * Static methods
     */
    static t_val
    array() {
        return t_val(emscripten::val::array());
    }

    template <typename T>
    static t_val
    array(const std::vector<T> vec) {
        return t_val(emscripten::val::array(vec));
    }

    static t_val
    object() {
        return t_val(emscripten::val::object());
    }

    static t_val
    undefined() {
        return t_val(emscripten::val::undefined());
    }

    static t_val
    null() {
        return t_val(emscripten::val::null());
    }

    static t_val
    global(const char* name = 0) {
        return t_val(emscripten::val::global(name));
    }

    static t_val
    module_property(const char* name) {
        return t_val(emscripten::val::module_property(name));
    }

    template <typename T>
    t_val operator[](const T& key) const {
        return t_val(_val[key]);
    }

    template <typename... Args>
    t_val
    operator()(Args&&... args) const {
        emscripten::val rval = _val(std::forward<Args>(args)...);
        return t_val(rval);
    }

    /**
     * Class methods
     */
    template <typename ReturnType, typename... Args>
    ReturnType
    call(const char* methodName, Args&&... args) const {
        return _val.call<ReturnType>(methodName, std::forward<Args>(args)...);
    }

    template <typename ReturnType, typename... Args>
    ReturnType
    call(emscripten::val handle, const char* methodName, Args&&... args) const {
        return _val.call<ReturnType>(handle, methodName, std::forward<Args>(args)...);
    }

    template <typename ReturnType, typename... Args>
    ReturnType
    call(t_val handle, const char* methodName, Args&&... args) const {
        return _val.call<ReturnType>(handle._val, methodName, std::forward<Args>(args)...);
    }

    template <typename T, typename... Policies>
    T
    as(Policies... policies) const {
        return _val.as<T>(std::forward<Policies>(policies)...);
    }

    bool
    hasOwnProperty(const char* key) const {
        return _val.hasOwnProperty(key);
    }

    bool
    isNull() const {
        return _val.isNull();
    }

    bool
    isUndefined() const {
        return _val.isUndefined();
    }

    bool
    isTrue() const {
        return _val.isTrue();
    }

    bool
    isFalse() const {
        return _val.isFalse();
    }

    bool
    isNumber() const {
        return _val.isNumber();
    }

    bool
    isString() const {
        return _val.isString();
    }

    bool
    isArray() const {
        return _val.isArray();
    }

    /**
     * A `t_val` can be compared to another `t_val` instance or an instance of its underlying
     * `_val` type.
     */
    bool
    equals(const emscripten::val& v) const {
        return _val.equals(v);
    }

    bool
    equals(const t_val& v) const {
        return equals(v._val);
    }

    bool
    operator==(const emscripten::val& v) const {
        return _val == v;
    }

    bool
    operator==(const t_val& v) const {
        return v == v._val;
    }

    bool
    operator!=(const emscripten::val& v) const {
        return _val != v;
    }

    bool
    operator!=(const t_val& v) const {
        return _val != v._val;
    }

    bool
    strictlyEquals(const emscripten::val& v) const {
        return _val.strictlyEquals(v);
    }

    bool
    strictlyEquals(const t_val& v) const {
        return strictlyEquals(v._val);
    }

    bool
    operator>(const emscripten::val& v) const {
        return _val > v;
    }

    bool
    operator>(const t_val& v) const {
        return _val > v._val;
    }

    bool
    operator>=(const emscripten::val& v) const {
        return _val >= v;
    }

    bool
    operator>=(const t_val& v) const {
        return _val >= v._val;
    }

    bool
    operator<(const emscripten::val& v) const {
        return _val < v;
    }

    bool
    operator<(const t_val& v) const {
        return _val < v._val;
    }

    bool
    operator<=(const emscripten::val& v) const {
        return _val <= v;
    }

    bool
    operator<=(const t_val& v) const {
        return _val < v._val;
    }

    template <typename... Args>
    t_val
    new_(Args&&... args) const {
        emscripten::val rval = _val.new_(std::forward<Args>(args)...);
        return t_val(rval);
    }

    template <typename K>
    void
    set(const K& key, const emscripten::val& v) {
        _val.set(key, v);
    }

    template <typename K>
    void
    set(const K& key, const t_val& v) {
        _val.set(key, v._val);
    }

    template <typename K, typename V>
    void
    set(const K& key, const V& value) {
        _val.set(key, value);
    }

    t_val
    typeOf() const {
        return t_val(_val.typeOf());
    }

    bool instanceof (const emscripten::val& v) const { return _val.instanceof (v); }

    bool instanceof (const t_val& v) const { return _val.instanceof (v._val); }

    bool
    in(const emscripten::val& v) const {
        return _val.in(v);
    }

    bool
    in(const t_val& v) const {
        return _val.in(v._val);
    }

    template <typename T>
    bool
    delete_(const T& property) const {
        return _val.delete_(property);
    }

private:
    emscripten::val _val;
};

template <typename T>
std::vector<T>
vecFromJSArray(emscripten::val v) {
    return emscripten::vecFromJSArray<T>(v);
};

template <typename T>
std::vector<T>
vecFromJSArray(t_val v) {
    return emscripten::vecFromJSArray<T>(v.get_internal_val());
};
} // namespace perspective

#endif