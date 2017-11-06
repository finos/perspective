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
#include <perspective/column.h>
#include <perspective/exports.h>
#include <vector>

namespace perspective
{

enum t_column_chunk_mode
{
    COLUMN_CHUNK_COPY,
    COLUMN_CHUNK_BORROW
};

enum t_column_chunk_density
{
    COLUMN_CHUNK_DENSITY_DENSE,
    COLUMN_CHUNK_DENSITY_SPARSE
};

class PERSPECTIVE_EXPORT t_column_chunk
{
  public:
    t_column_chunk();
    t_column_chunk(t_col_sptr& column,
                   t_column_chunk_density density,
                   t_uidxvec* indices);

#ifndef WIN32
    t_column_chunk(t_column_chunk&& other) = default;
    t_column_chunk& operator=(t_column_chunk&& other) = default;
#endif

    ~t_column_chunk();

    void init();
    void commit();
    void commit_fixed();
    void commit_vlen();
    void commit_missing_dense();
    void commit_missing_sparse();

    t_uindex bfill() const;
    t_uindex efill() const;

    // used when density is dense
    // bidx and eidx are in column index space
    void fill(t_uindex bidx, t_uindex eidx);

    // used when density is sparse
    // bidx and eidx are in mask set bit count space
    void fill(const t_uidxvec& indices, t_uindex bidx, t_uindex eidx);

    PyObject* data();
    PyObject* valid();

  protected:
    void fill_missing(t_uindex bidx, t_uindex eidx);
    void fill_fixed(t_uindex bidx, t_uindex eidx);
    void fill_vlen(t_uindex bidx, t_uindex eidx);
    void fill_missing(const t_uidxvec& indices,
                      t_uindex bidx,
                      t_uindex eidx);
    void fill_fixed(const t_uidxvec& indices,
                    t_uindex bidx,
                    t_uindex eidx);
    void
    fill_vlen(const t_uidxvec& indices, t_uindex bidx, t_uindex eidx);
    void update_dims(t_uindex bidx, t_uindex eidx);
    void release_strings();

  private:
    PyObject* m_darr;
    PyObject* m_varr;
    t_col_sptr m_column;
    void* m_base;

    // Nan support
    t_bool* m_valid;

    t_uindex m_version;

    // View into the buffer
    t_uindex m_bidx;
    t_uindex m_eidx;

    // Extents for filled part of the buffer
    // Userspace will find it futile to
    // examine parts of the buffer
    // outside these extents.
    t_uindex m_bfill;
    t_uindex m_efill;

    bool m_init;
    t_column_chunk_mode m_mode;
    t_dtype m_dtype;
    t_uindex m_elemsize;
    t_column_chunk_density m_density;

    // borrowed reference
    t_uidxvec* m_indices;

    PSP_NON_COPYABLE(t_column_chunk);
};

typedef std::shared_ptr<t_column_chunk> t_colchunksptr;
typedef std::vector<t_colchunksptr> t_colchunksptrvec;

} // end namespace perspective
