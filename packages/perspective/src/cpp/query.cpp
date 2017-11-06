/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/query.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>

namespace perspective
{

t_bool
t_query::has_filter() const
{
    std::cout << "Query has_filter not supported" << std::endl;
    return false;
}

t_uindex
t_query::size() const
{
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return 0;
}
}
