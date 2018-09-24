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
#include <perspective/raw_types.h>
#include <perspective/exports.h>
#include <perspective/mask.h>
#include <perspective/compat.h>
#include <perspective/debug_helpers.h>
#include <cmath>

/*
TODO.

1. Add support for "temp" storage where the
file is deleted on exit.

2. Add support for compression.


*/

namespace perspective {

struct t_lstore_tmp_init_tag {};

struct PERSPECTIVE_EXPORT t_lstore_recipe {
    t_lstore_recipe();
    t_lstore_recipe(t_uindex capacity);

    t_lstore_recipe(const t_str& dirname, const t_str& colname, t_uindex capacity,
        t_backing_store backing_store);

    t_lstore_recipe(const t_str& dirname, const t_str& colname, t_uindex capacity,
        t_fflag fflags, t_fflag fmode, t_fflag creation_disposition, t_fflag mprot,
        t_fflag mflags, t_backing_store backing_store);

    t_lstore_recipe(const t_str& colname, t_uindex capacity, t_fflag mprot, t_fflag mflags,
        t_backing_store backing_store);

    t_str m_dirname;
    t_str m_colname;
    t_str m_fname; // use if from recipe
    t_uindex m_capacity;
    t_uindex m_size;
    t_uindex m_alignment;
    t_fflag m_fflags;
    t_fflag m_fmode;
    t_fflag m_creation_disposition;
    t_fflag m_mprot;
    t_fflag m_mflags;
    t_backing_store m_backing_store;
    t_bool m_from_recipe;
};

typedef std::vector<t_lstore_recipe> t_lstore_argvec;

#ifdef PSP_MPROTECT
#define MPROTECT_FREEZE_LSTORE() freeze_impl()
#define MPROTECT_UNFREEZE_LSTORE() unfreeze_impl()
#else
#define MPROTECT_FREEZE_LSTORE()
#define MPROTECT_UNFREEZE_LSTORE()
#endif

#ifdef PSP_STORAGE_VERIFY
#define STORAGE_CHECK_ACCESS_GET(idx)                                                          \
    PSP_VERBOSE_ASSERT(sizeof(T) * idx < (m_capacity + sizeof(T)), "Invalid access");
#define PSP_CHECK_CAPACITY()                                                                   \
    PSP_VERBOSE_ASSERT(m_size <= m_capacity,                                                   \
        "Size capacity "                                                                       \
        "mismatch")
#define STORAGE_CHECK_ACCESS(idx)                                                              \
    PSP_VERBOSE_ASSERT(sizeof(T) * idx < m_capacity, "Invalid access");
#else
#define STORAGE_CHECK_ACCESS(idx)
#define STORAGE_CHECK_ACCESS_GET(idx)
#define PSP_CHECK_CAPACITY()
#endif

class t_lstore;

struct t_unlock_store;

class t_lstore;
typedef std::shared_ptr<t_lstore> t_lstore_sptr;
typedef std::shared_ptr<const t_lstore> t_lstore_csptr;

class PERSPECTIVE_MPROTECT_EXPORT t_lstore : public t_debug_helper

{
    friend struct t_unlock_store;

public:
    PSP_NON_COPYABLE(t_lstore);

    t_lstore();
    t_lstore(const t_lstore_recipe& args);
    t_lstore(const t_lstore& s, t_lstore_tmp_init_tag t);
    ~t_lstore();

    t_lstore(t_lstore&& other);
    t_lstore& operator=(t_lstore&& other);
    void copy_helper(t_lstore& other);
    void copy_helper(const t_lstore& other);

    void init();

    t_szpair capacity_pair() const;

    // in bytes
    void set_size(t_uindex idx);

    // in bytes
    void reserve(t_uindex capacity);
    void shrink(t_uindex capacity);
    void copy(t_lstore& out);
    void load(const t_str& fname);
    void save(const t_str& fname);
    void warmup();

    t_uindex size() const;
    t_uindex capacity() const;

    template <typename T>
    void push_back(T value);
    void push_back(const void* ptr, t_uindex len);

    // idx is in bytes
    template <typename T>
    T* get(t_uindex idx);

    // idx is in bytes
    template <typename T>
    const T* get(t_uindex idx) const;

    // assumes fixed size T
    // index is in items
    template <typename T>
    T* get_nth(t_uindex idx);

    // assumes fixed size T
    // index is in items
    template <typename T>
    const T* get_nth(t_uindex idx) const;

    // assumes fixed size T
    // index is in items
    template <typename T>
    void set_nth(t_uindex idx, T v);

    // Extend increases both size
    // and capacity
    // assumed fixed size T
    template <typename T>
    T* extend();

    // assumed fixed size T
    template <typename T>
    T* extend(t_uindex idx);

    t_str get_fname() const;

    void* get_ptr(t_uindex offset);
    const void* get_ptr(t_uindex offset) const;

    t_str get_desc_fname() const;

    t_uindex get_version() const;

    void append(const t_lstore& other);

    void clear();

    t_lstore_recipe get_recipe() const;

    void fill(const t_lstore& other);

    void fill(const t_lstore& other, const t_mask& mask, t_uindex elem_size);

    template <typename DATA_T>
    void raw_fill(DATA_T v);

    t_str repr() const;

    void pprint() const;

    t_lstore_sptr clone() const;

protected:
    void copy_helper_(const t_lstore& other);
    void freeze_impl();
    void unfreeze_impl();

private:
    void reserve_impl(t_uindex capacity, bool allow_shrink);
    t_handle create_file();
    void* create_mapping();
    void resize_mapping(t_uindex cap_new);
    void destroy_mapping();

    void* m_base;
    t_str m_dirname;
    t_str m_fname;
    t_str m_colname;
    t_handle m_fd;
    t_handle m_winmapping_handle;
    t_uindex m_capacity;  // in bytes
    t_uindex m_size;      // in bytes
    t_uindex m_alignment; // in bytes, must be power of 2
    t_fflag m_fflags;
    t_fflag m_fmode;
    t_fflag m_creation_disposition;
    t_fflag m_mprot;
    t_fflag m_mflags;
    t_backing_store m_backing_store;
    t_bool m_init;
    t_float64 m_resize_factor;
    t_uindex m_version;
    t_bool m_from_recipe;

#ifdef PSP_MPROTECT
    // size of padding + size of fields above
    // ==
    // page_size. this invariant is checked in
    // the constructor if
    // mprotect is enabled
    char m_padding[3820];
#endif
};

#ifdef PSP_MPROTECT
struct t_unlock_store {
    inline t_unlock_store(t_lstore* store)
        : m_store(store) {
        m_store->unfreeze_impl();
    }

    inline ~t_unlock_store() { m_store->freeze_impl(); }

    PSP_NON_COPYABLE(t_unlock_store);

    t_lstore* m_store;
};
#else
struct t_unlock_store {
    t_unlock_store(t_lstore* store) {}
};
#endif

// typed uniform sized lstore

template <typename T>
void
t_lstore::push_back(T value) {
    if (m_size + sizeof(T) >= m_capacity)
        reserve(static_cast<t_uindex>(std::ceil(
            m_capacity + m_size + sizeof(T)))); // reserve will multiply by m_resize_factor

    PSP_VERBOSE_ASSERT(m_size + sizeof(T) < m_capacity, "Insufficient capacity.");
    T* ptr = reinterpret_cast<T*>(static_cast<t_uchar*>(m_base) + m_size);
    *ptr = value;
    {
        t_unlock_store tmp(this);
        m_size += sizeof(T);
    }

    PSP_CHECK_CAPACITY();
}

template <typename T>
T*
t_lstore::get(t_uindex idx) {
    STORAGE_CHECK_ACCESS_GET(idx);
    T* ptr = reinterpret_cast<T*>(static_cast<t_uchar*>(m_base) + idx);
    return ptr;
}

template <typename T>
const T*
t_lstore::get(t_uindex idx) const {
    STORAGE_CHECK_ACCESS_GET(idx);
    T* ptr = reinterpret_cast<T*>(static_cast<t_uchar*>(m_base) + idx);
    return ptr;
}

template <typename T>
T*
t_lstore::get_nth(t_uindex idx) {
    STORAGE_CHECK_ACCESS_GET(idx);
    return static_cast<T*>(m_base) + idx;
}

template <typename T>
const T*
t_lstore::get_nth(t_uindex idx) const {
    STORAGE_CHECK_ACCESS_GET(idx);
    return static_cast<T*>(m_base) + idx;
}

template <typename T>
void
t_lstore::set_nth(t_uindex idx, T v) {
    STORAGE_CHECK_ACCESS(idx);
    T* tgt = static_cast<T*>(m_base) + idx;
    *tgt = v;
}

template <typename T>
T*
t_lstore::extend(t_uindex idx) {
    t_uindex osize = m_size;
    t_uindex nsize = m_size + idx * sizeof(T);
    reserve(nsize);
    {
        t_unlock_store tmp(this);
        m_size = nsize;
    }
    T* rv = reinterpret_cast<T*>(static_cast<t_uchar*>(m_base) + osize);
    PSP_CHECK_CAPACITY();
    return rv;
}

template <typename T>
T*
t_lstore::extend() {
    return extend<T>(1);
}

template <typename DATA_T>
void
t_lstore::raw_fill(DATA_T v) {
    auto biter = static_cast<DATA_T*>(m_base);
    auto eiter = reinterpret_cast<DATA_T*>(static_cast<char*>(m_base) + size());
    std::fill(biter, eiter, v);
}

struct PERSPECTIVE_EXPORT t_column_recipe {
    t_column_recipe();
    t_dtype m_dtype;
    t_bool m_isvlen;
    t_lstore_recipe m_data;
    t_lstore_recipe m_vlendata;
    t_lstore_recipe m_extents;
    t_lstore_recipe m_status;
    t_uindex m_vlenidx;
    t_uindex m_size;
    t_bool m_status_enabled;
};

} // end namespace perspective
