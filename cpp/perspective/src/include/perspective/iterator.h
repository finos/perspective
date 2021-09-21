/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <cstddef>
#include <iterator>

namespace perspective {

template <typename DATA_T>
class t_iter : public std::iterator<std::random_access_iterator_tag, DATA_T,
                   std::ptrdiff_t, DATA_T*, DATA_T&> {
public:
    t_iter(DATA_T* ptr = nullptr) { m_ptr = ptr; }

#ifndef WIN32
    t_iter(const t_iter<DATA_T>& other) = default;
    t_iter<DATA_T>& operator=(const t_iter<DATA_T>& other) = default;
#endif

    ~t_iter() {}

    t_iter<DATA_T>&
    operator=(DATA_T* ptr) {
        m_ptr = ptr;
        return (*this);
    }

    operator bool() const {
        if (m_ptr)
            return true;
        else
            return false;
    }

    bool
    operator==(const t_iter<DATA_T>& other) const {
        return (m_ptr == other.get_cptr());
    }

    bool
    operator!=(const t_iter<DATA_T>& other) const {
        return (m_ptr != other.get_cptr());
    }

    t_iter<DATA_T>&
    operator+=(const std::ptrdiff_t& movement) {
        m_ptr += movement;
        return (*this);
    }

    t_iter<DATA_T>&
    operator-=(const std::ptrdiff_t& movement) {
        m_ptr -= movement;
        return (*this);
    }

    t_iter<DATA_T>&
    operator++() {
        ++m_ptr;
        return (*this);
    }

    t_iter<DATA_T>&
    operator--() {
        --m_ptr;
        return (*this);
    }

    t_iter<DATA_T>
    operator++(int) {
        auto temp(*this);
        ++m_ptr;
        return temp;
    }

    t_iter<DATA_T>
    operator--(int) {
        auto temp(*this);
        --m_ptr;
        return temp;
    }

    t_iter<DATA_T>
    operator+(const std::ptrdiff_t& movement) {
        auto oldPtr = m_ptr;
        m_ptr += movement;
        auto temp(*this);
        m_ptr = oldPtr;
        return temp;
    }

    t_iter<DATA_T>
    operator-(const std::ptrdiff_t& movement) {
        auto oldPtr = m_ptr;
        m_ptr -= movement;
        auto temp(*this);
        m_ptr = oldPtr;
        return temp;
    }

    std::ptrdiff_t
    operator-(const t_iter<DATA_T>& other) {
        return std::distance(other.get_ptr(), this->get_ptr());
    }

    DATA_T&
    operator*() {
        return *m_ptr;
    }

    const DATA_T&
    operator*() const {
        return *m_ptr;
    }

    DATA_T*
    operator->() {
        return m_ptr;
    }

    DATA_T*
    get_ptr() const {
        return m_ptr;
    }

    const DATA_T*
    get_cptr() const {
        return m_ptr;
    }

protected:
    DATA_T* m_ptr;
};
} // namespace perspective
