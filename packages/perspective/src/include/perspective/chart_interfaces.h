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
#include <perspective/scalar.h>
#include <perspective/exports.h>
#include <perspective/shared_ptrs.h>
#include <perspective/sparse_tree_node.h>
#include <deque>

namespace perspective
{

class t_ctx0;
class t_ctx1;
class t_ctx2;
class t_ctx_grouped_pkey;
class t_config;

class t_leaf_data_iter_base
{
  public:
    t_leaf_data_iter_base();
    t_bool valid() const;
    const t_tscalvec& operator*() const;
    const t_tscalvec* operator->() const;

  protected:
    inline t_str make_row_label(const t_svec& plabels, t_str& value);
    void increment();

  protected:
    t_tscalvec m_current_row;
    t_bool m_valid;
};

template <typename CONTEXT_T>
class t_leaf_data_iter : public t_leaf_data_iter_base
{
  public:
    t_leaf_data_iter();
    t_leaf_data_iter& operator++();
};

template <>
class t_leaf_data_iter<t_ctx0> : public t_leaf_data_iter_base
{
  public:
    t_leaf_data_iter(t_ftrav_csptr traversal,
                     t_gstate_csptr ds,
                     const t_idxvec& idx_map,
                     t_uindex start_row_idx = 0);

    t_leaf_data_iter<t_ctx0>& operator++();

  private:
    void fetch_row(t_uindex row_idx);
    void increment();

    t_tscalvec m_current_row_raw;
    t_index m_current_row_idx;

    t_ftrav_csptr m_traversal;
    t_gstate_csptr m_ds;
    t_idxvec m_idx_map;
};

template <>
class t_leaf_data_iter<t_ctx1> : public t_leaf_data_iter_base
{
  public:
    t_leaf_data_iter(t_stree_csptr tree,
                     const t_idxvec& idx_map,
                     t_depth row_depth);
    t_leaf_data_iter<t_ctx1>& operator++();

  private:
    void increment();

    t_stree_csptr m_tree;
    std::deque<t_stnode> m_dft;

    t_idxvec m_idx_map;

    t_depth m_row_depth;
    t_depth m_last_depth;
};

template <>
class t_leaf_data_iter<t_ctx_grouped_pkey>
    : public t_leaf_data_iter_base
{
  public:
    t_leaf_data_iter(t_stree_csptr tree,
                     const t_idxvec& idx_map,
                     t_depth row_depth);
    t_leaf_data_iter<t_ctx_grouped_pkey>& operator++();

  private:
    void increment();
};

template <>
class t_leaf_data_iter<t_ctx2> : public t_leaf_data_iter_base
{
  public:
    t_leaf_data_iter(const t_config& config,
                     const t_stree_csptr_vec& trees,
                     const t_idxvec& idx_map,
                     t_depth row_depth,
                     t_depth col_depth);

    t_leaf_data_iter<t_ctx2>& operator++();

  private:
    void setup_context_info(const t_config& config);
    void increment();

    t_stree_csptr_vec m_trees;
    std::deque<t_stnode> m_dft;
    std::vector<t_tscalvec> m_col_paths;

    t_idxvec m_idx_map;
    t_tscalvec m_r_path;

    t_depth m_row_depth;
    t_depth m_col_depth;
    t_depth m_last_depth;
    t_uindex m_n_cols;
    t_uindex m_n_aggs;
    t_tscalar m_empty_cell_value;
};

template <typename CONTEXT_T>
t_leaf_data_iter<CONTEXT_T>::t_leaf_data_iter()
{
}

template <typename CONTEXT_T>
t_leaf_data_iter<CONTEXT_T>& t_leaf_data_iter<CONTEXT_T>::operator++()
{
    increment();
    return *this;
}

#ifdef PSP_ENABLE_PYTHON
template <typename ITER_T>
PyObject* iter_into_numpy_arrays(PyObject* py_iterable,
                                 ITER_T& iter,
                                 t_float64 xlimit,
                                 const t_idxvec& idxs,
                                 const t_idxvec& types);

PERSPECTIVE_EXPORT PyObject* context_minmax_idx_0s(
    t_ctx0* ctx, t_index column_idx, t_uindex column_type);

PERSPECTIVE_EXPORT PyObject*
context_into_numpy_arrays_0s(PyObject* py_iterable,
                             t_ctx0* ctx,
                             t_float64 xlimit,
                             const t_idxvec& idxs,
                             const t_idxvec& types,
                             t_float64 xlo,
                             t_float64 xhi);

PERSPECTIVE_EXPORT PyObject*
context_into_numpy_arrays_1s(PyObject* py_iterable,
                             t_ctx1* ctx,
                             t_uindex rlevel,
                             const t_idxvec& idxs,
                             const t_idxvec& types);

PERSPECTIVE_EXPORT PyObject*
context_into_numpy_arrays_2s(PyObject* py_iterable,
                             t_ctx2* ctx,
                             t_uindex rlevel,
                             t_uindex clevel,
                             const t_idxvec& idxs,
                             const t_idxvec& types);
#endif

} // end namespace perspective
