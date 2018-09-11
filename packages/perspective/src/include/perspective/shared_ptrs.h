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

namespace perspective
{
class t_ftrav;
typedef std::shared_ptr<t_ftrav> t_ftrav_sptr;
typedef std::shared_ptr<const t_ftrav> t_ftrav_csptr;

class t_gstate;
typedef std::shared_ptr<t_gstate> t_gstate_sptr;
typedef std::shared_ptr<const t_gstate> t_gstate_csptr;

class t_stree;
typedef std::shared_ptr<t_stree> t_stree_sptr;
typedef std::shared_ptr<const t_stree> t_stree_csptr;
typedef std::vector<t_stree_csptr> t_stree_csptr_vec;
typedef std::vector<t_stree*> t_streeptr_vec;
typedef std::vector<t_stree_csptr> t_stree_csptr_vec;

class t_dtree;
class t_traversal;
typedef std::shared_ptr<t_traversal> t_trav_sptr;
typedef std::shared_ptr<const t_traversal> t_trav_csptr;

class t_table;
typedef std::shared_ptr<t_table> t_table_sptr;
typedef std::shared_ptr<const t_table> t_table_csptr;

class t_column;
typedef std::vector<t_column*> t_colptrvec;
typedef std::vector<const t_column*> t_colcptrvec;
} // namespace perspective