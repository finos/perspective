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
#include <perspective/column.h>
#include <hdf5.h>

namespace perspective
{

struct t_hdfgroup
{
    static void
    release(hid_t handle)
    {
        H5Gclose(handle);
    }
};

struct t_hdfdset
{
    static void
    release(hid_t handle)
    {
        H5Dclose(handle);
    }
};

struct t_hdfdspace
{
    static void
    release(hid_t handle)
    {
        H5Sclose(handle);
    }
};

struct t_hdfdtype
{
    static void
    release(hid_t handle)
    {
        H5Tclose(handle);
    }
};

template <typename T>
class t_hdfres
{
  public:
    t_hdfres(hid_t handle) : m_handle(handle)
    {
    }

    ~t_hdfres()
    {
        T::release(m_handle);
    }

    hid_t
    get_handle()
    {
        return m_handle;
    }

  private:
    hid_t m_handle;
};

t_uindex get_hdf5_colsize(hid_t dst_col);

template <typename DATA_T>
void read(hid_t g, t_str& colname, t_column& out);

template <typename DATA_T>
void read(hid_t g,
          t_str& colname,
          t_uindex bidx,
          t_uindex eidx,
          t_column& out);

template <typename DATA_T>
void read(hid_t g, t_str& colname, t_column& mask, t_column& out);

} // end namespace perspective
