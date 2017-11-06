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
#include <perspective/kernel.h>
#include <perspective/filter.h>
#include <perspective/raw_types.h>

namespace perspective
{
class t_query
{
    // Needs to support following use cases
    // 1. Arbitrary masked reads
    // 2. Range reads
    // 3. All reads
  public:
    t_bool has_filter() const;
    t_uindex size() const;

  private:
    t_kernel m_kernel;
    t_select_mode m_smode;
    t_filter m_filter;
};

} // end namespace perspective
