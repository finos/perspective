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
#include <perspective/base.h>
#include <cstdlib>
#include <cstring>

namespace perspective
{

class t_simple_bitmask
{
public:
    t_simple_bitmask(t_uindex nentries)
        : m_nentries(nentries)
        , m_ptr(0)
    {
        if (!nentries)
            return;

        m_ptr = calloc(1, static_cast<size_t>(calc_capacity(nentries)));
    }

    ~t_simple_bitmask() { free(m_ptr); }

    inline t_bool
    is_set(t_uindex idx) const
    {
        if (!m_ptr || idx >= m_nentries)
            return false;

        t_uindex byte_idx = get_byte_idx(idx);
        t_uindex bit_idx = get_bit_idx(idx);
        auto bv = get_block(byte_idx);
        return (bv & (1 << bit_idx)) != 0;
    }

    inline void
    set(t_uindex idx)
    {
        if (!m_ptr || idx >= m_nentries)
            return;
        t_uindex byte_idx = get_byte_idx(idx);
        t_uint8& bv = get_block(byte_idx);
        bv |= 1 << get_bit_idx(idx);
    }

    inline void
    clear(t_uindex idx)
    {
        if (!m_ptr || idx >= m_nentries)
            return;
        t_uindex byte_idx = get_byte_idx(idx);
        t_uint8& bv = get_block(byte_idx);
        bv &= ~t_uint8(1 << get_bit_idx(idx));
    }

    void*
    get_ptr()
    {
        return m_ptr;
    }

    t_uindex
    size() const
    {
        return m_nentries;
    }

private:
    static t_uindex
    calc_capacity(t_uindex nentries)
    {
        return (nentries + CHAR_BIT - 1) / CHAR_BIT;
    }

    static t_uindex
    get_byte_idx(t_uindex idx)
    {
        return idx / CHAR_BIT;
    }

    static t_uindex
    get_bit_idx(t_uindex idx)
    {
        return idx % CHAR_BIT;
    }

    t_uint8&
    get_block(t_uindex bidx)
    {
        return reinterpret_cast<t_uint8*>(m_ptr)[bidx];
    }

    const t_uint8&
    get_block(t_uindex bidx) const
    {
        return reinterpret_cast<const t_uint8*>(m_ptr)[bidx];
    }

    t_uindex m_nentries;
    void* m_ptr;
};
} // end namespace perspective
