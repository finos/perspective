// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>
#include <perspective/python/context.h>

namespace perspective {
namespace binding {

    /******************************************************************************
     *
     * Context API
     */

    template <>
    std::shared_ptr<t_ctxunit>
    make_context(
        std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config,
        const std::string& name
    ) {
        auto columns = view_config->get_columns();

        auto cfg = t_config(columns);
        auto ctx_unit = std::make_shared<t_ctxunit>(*(schema.get()), cfg);
        ctx_unit->init();

        auto pool = table->get_pool();
        auto gnode = table->get_gnode();

        pool->register_context(
            gnode->get_id(),
            name,
            UNIT_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx_unit.get())
        );

        return ctx_unit;
    }

    template <>
    std::shared_ptr<t_ctx0>
    make_context(
        std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config,
        const std::string& name
    ) {
        auto columns = view_config->get_columns();
        auto filter_op = view_config->get_filter_op();
        auto fterm = view_config->get_fterm();
        auto sortspec = view_config->get_sortspec();
        auto expressions = view_config->get_used_expressions();

        auto cfg = t_config(columns, fterm, filter_op, expressions);
        auto ctx0 = std::make_shared<t_ctx0>(*(schema.get()), cfg);
        ctx0->init();
        ctx0->sort_by(sortspec);

        auto pool = table->get_pool();
        auto gnode = table->get_gnode();
        pool->register_context(
            gnode->get_id(),
            name,
            ZERO_SIDED_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx0.get())
        );

        return ctx0;
    }

    template <>
    std::shared_ptr<t_ctx1>
    make_context(
        std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config,
        const std::string& name
    ) {
        auto row_pivots = view_config->get_row_pivots();
        auto aggspecs = view_config->get_aggspecs();
        auto filter_op = view_config->get_filter_op();
        auto fterm = view_config->get_fterm();
        auto sortspec = view_config->get_sortspec();
        auto row_pivot_depth = view_config->get_row_pivot_depth();
        auto expressions = view_config->get_used_expressions();

        auto cfg =
            t_config(row_pivots, aggspecs, fterm, filter_op, expressions);
        auto ctx1 = std::make_shared<t_ctx1>(*(schema.get()), cfg);

        ctx1->init();
        ctx1->sort_by(sortspec);

        auto pool = table->get_pool();
        auto gnode = table->get_gnode();
        pool->register_context(
            gnode->get_id(),
            name,
            ONE_SIDED_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx1.get())
        );

        if (row_pivot_depth > -1) {
            ctx1->set_depth(row_pivot_depth - 1);
        } else {
            ctx1->set_depth(row_pivots.size());
        }

        return ctx1;
    }

    template <>
    std::shared_ptr<t_ctx2>
    make_context(
        std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config,
        const std::string& name
    ) {
        bool column_only = view_config->is_column_only();
        auto row_pivots = view_config->get_row_pivots();
        auto column_pivots = view_config->get_column_pivots();
        auto aggspecs = view_config->get_aggspecs();
        auto filter_op = view_config->get_filter_op();
        auto fterm = view_config->get_fterm();
        auto sortspec = view_config->get_sortspec();
        auto col_sortspec = view_config->get_col_sortspec();
        auto row_pivot_depth = view_config->get_row_pivot_depth();
        auto column_pivot_depth = view_config->get_column_pivot_depth();
        auto expressions = view_config->get_used_expressions();

        t_totals total = sortspec.size() > 0 ? TOTALS_BEFORE : TOTALS_HIDDEN;

        auto cfg = t_config(
            row_pivots,
            column_pivots,
            aggspecs,
            total,
            fterm,
            filter_op,
            expressions,
            column_only
        );
        auto ctx2 = std::make_shared<t_ctx2>(*(schema.get()), cfg);

        ctx2->init();

        auto pool = table->get_pool();
        auto gnode = table->get_gnode();
        pool->register_context(
            gnode->get_id(),
            name,
            TWO_SIDED_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx2.get())
        );

        if (row_pivot_depth > -1) {
            ctx2->set_depth(t_header::HEADER_ROW, row_pivot_depth - 1);
        } else {
            ctx2->set_depth(t_header::HEADER_ROW, row_pivots.size());
        }

        if (column_pivot_depth > -1) {
            ctx2->set_depth(t_header::HEADER_COLUMN, column_pivot_depth - 1);
        } else {
            ctx2->set_depth(t_header::HEADER_COLUMN, column_pivots.size());
        }

        if (sortspec.size() > 0) {
            ctx2->sort_by(sortspec);
        }

        if (col_sortspec.size() > 0) {
            ctx2->column_sort_by(col_sortspec);
        }

        return ctx2;
    }

} // namespace binding
} // namespace perspective

#endif