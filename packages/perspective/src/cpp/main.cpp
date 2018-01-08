/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/base.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <random>
#include <cmath>
#include <sstream>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <perspective/sym_table.h>

using namespace perspective;
using namespace emscripten;


/******************************************************************************
 *
 * Data Loading
 */

t_sortsvec
_get_sort(val j_sortby)
{
    t_sortsvec svec{};
    std::vector<val> sortbys = vecFromJSArray<val>(j_sortby);
    for(auto idx = 0; idx < sortbys.size(); ++idx)
    {
        std::vector<t_int32> sortby = vecFromJSArray<t_int32>(sortbys[idx]);
        t_sorttype sorttype;
        switch (sortby[1])
        {
            case 0: sorttype = SORTTYPE_ASCENDING; break;
            case 1: sorttype = SORTTYPE_DESCENDING; break;
            case 2: sorttype = SORTTYPE_NONE; break;
            case 3: sorttype = SORTTYPE_ASCENDING_ABS; break;
            case 4: sorttype = SORTTYPE_DESCENDING_ABS; break;
        }
        svec.push_back(t_sortspec(sortby[0], sorttype));
    }
    return svec;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
t_ftermvec
_get_fterms(t_schema schema, val j_filters)
{
    t_ftermvec fvec{};
    std::vector<val> filters = vecFromJSArray<val>(j_filters);
    for (auto fidx = 0; fidx < filters.size(); ++fidx)
    {
        std::vector<val> filter = vecFromJSArray<val>(filters[fidx]);
        std::string coln = filter[0].as<std::string>();

        t_tscalar term;
        switch (schema.get_dtype(coln))
        {
            case DTYPE_INT32:
                term = mktscalar(filter[2].as<t_int32>());
                break;
            case DTYPE_FLOAT64:
                term = mktscalar(filter[2].as<t_float64>());
                break;
            case DTYPE_BOOL:
                term = mktscalar(filter[2].as<bool>());
                break;
			case DTYPE_TIME:
			{
				std::cout << "Date filters not handled yet" << std::endl;
			}
			break;
            default:
            {
                //std::cout << filter[2].as<std::string>().c_str() << std::endl;
                term = mktscalar(get_interned_cstr(filter[2].as<std::string>().c_str()));
            }
        }

        t_filter_op comp = filter[1].as<t_filter_op>();
        fvec.push_back(t_fterm(coln, comp, term, t_tscalvec()));
    }
    return fvec;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
t_aggspecvec
_get_aggspecs(val j_aggs)
{
    std::vector<val> aggs = vecFromJSArray<val>(j_aggs);
    t_aggspecvec aggspecs;
    for (auto cidx = 0; cidx < aggs.size(); ++cidx)
    {
        std::vector<val> agg_row = vecFromJSArray<val>(aggs[cidx]);
        std::string name = agg_row[0].as<std::string>();
        t_aggtype aggtype = agg_row[1].as<t_aggtype>();
        aggspecs.push_back(t_aggspec(name, aggtype, name));
    }
    return aggspecs;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
template<typename T>
void
_fill_col(val dcol, t_col_sptr col, t_col_sptr key_col, bool fill_index)
{
    t_uint32 size = dcol["length"].as<t_uint32>();
    for (auto i = 0; i < size; ++i)
    {
        auto elem = dcol[i].as<T>();
        col->set_nth(i, elem);
        if (fill_index)
        {
            key_col->set_nth(i, elem);
        }
    }
}

template<>
void
_fill_col<t_int64>(val dcol, t_col_sptr col, t_col_sptr key_col, bool fill_index)
{
    t_uint32 size = dcol["length"].as<t_uint32>();
    for (auto i = 0; i < size; ++i)
    {
        auto elem = static_cast<t_int64>(dcol[i].as<t_float64>());
        col->set_nth(i, elem);
        if (fill_index)
        {
            key_col->set_nth(i, elem);
        }
    }
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
void
_fill_data(t_table_sptr tbl,
           t_svec ocolnames,
           val j_data,
           std::vector<t_dtype> odt,
           t_uint32 offset,
           t_str index)
{
    std::vector<val> data_cols = vecFromJSArray<val>(j_data);
    auto op_col = tbl->get_column("psp_op");
    auto key_col = tbl->get_column("psp_pkey");
    for (auto cidx = 0; cidx < ocolnames.size(); ++cidx)
    {
        auto name = ocolnames[cidx];
        auto col = tbl->get_column(name);
        auto col_type = odt[cidx];
        auto fill_index = name == index;                
        switch (col_type)
        {
            case DTYPE_INT32:
            {
                _fill_col<t_int32>(data_cols[cidx], col, key_col, fill_index);
            }
            break;
            case DTYPE_BOOL:
            {
                _fill_col<bool>(data_cols[cidx], col, key_col, fill_index);
            }
            break;
            case DTYPE_FLOAT64:
            {
                _fill_col<t_float64>(data_cols[cidx], col, key_col, fill_index);
            }
            break;
			case DTYPE_TIME:
			{
                _fill_col<t_int64>(data_cols[cidx], col, key_col, fill_index);
			}
			break;
            default:
            {
                _fill_col<std::string>(data_cols[cidx], col, key_col, fill_index);
            }
        }
    }
    for (auto ridx = 0; ridx < tbl->size(); ++ridx)
    {
        op_col->set_nth<t_uint8>(ridx, OP_INSERT);
        if (index == "")
        {
            key_col->set_nth<t_uint32>(ridx, ridx + offset);
        }
    }
}

/******************************************************************************
 *
 * Public
 */

/**
 * Create a populated table.
 *
 * Params
 * ------
 * j_colnames - a JS Array of column names.
 * j_dtypes - a JS Array of column types.
 * j_data - a JS Array of JS Array columns.
 *
 * Returns
 * -------
 * a populated table.
 */
t_table_sptr
make_table(
    t_uint32 size,
    val j_colnames,
    val j_dtypes,
    val j_data,
    t_uint32 offset,
    t_str index,
    t_dtype tindex
) {
    // Create the input and port schemas
    t_svec ocolnames = vecFromJSArray<std::string>(j_colnames);
    t_svec icolnames = ocolnames;
    icolnames.push_back("psp_op");
    icolnames.push_back("psp_pkey");

    t_dtypevec idt = vecFromJSArray<t_dtype>(j_dtypes);
    t_dtypevec odt = idt;
    idt.push_back(DTYPE_UINT8);
    idt.push_back(tindex);

    t_schema iscm(icolnames, idt);
    t_schema oscm(ocolnames, odt);

    // Create the table
    // TODO assert size > 0
    auto tbl = std::make_shared<t_table>(iscm);
    tbl->init();
    tbl->extend(size);

    _fill_data(tbl, ocolnames, j_data, odt, offset, index);

    return tbl;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
void
fill(val j_id, t_table_sptr table, t_gnode_sptr gnode, t_pool* pool)
{
    t_uint32 id = j_id.as<t_uint32>();
    pool->send(id, 0, *table);
    pool->_process();
}

/**
 * Create a default gnode.
 *
 * Params
 * ------
 * j_colnames - a JS Array of column names.
 * j_dtypes - a JS Array of column types.
 *
 * Returns
 * -------
 * A gnode.
 */
t_gnode_sptr
make_gnode(val j_colnames, val j_dtypes, t_dtype tindex)
{
    // Create the input and port schemas
    t_svec ocolnames = vecFromJSArray<std::string>(j_colnames);
    t_svec icolnames = ocolnames;
    icolnames.push_back("psp_op");
    icolnames.push_back("psp_pkey");

    t_dtypevec idt = vecFromJSArray<t_dtype>(j_dtypes);
    t_dtypevec odt = idt;
    idt.push_back(DTYPE_UINT8);
    idt.push_back(tindex);

    t_schema iscm(icolnames, idt);
    t_schema oscm(ocolnames, odt);

    // Create a gnode
    auto gnode = std::make_shared<t_gnode>(oscm, iscm);
    gnode->init();

    return gnode;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
t_ctx0_sptr
make_context_zero(t_gnode_sptr gnode,
                  t_filter_op combiner,
                  val j_filters,
                  val j_columns,
                  val j_sortby)
{
    auto schema = gnode->get_tblschema();
    auto columns = vecFromJSArray<std::string>(j_columns);
    auto fvec = _get_fterms(schema, j_filters);
    auto svec = _get_sort(j_sortby);
    auto cfg = t_config(columns, combiner, fvec);
    auto ctx0 = std::make_shared<t_ctx0>(schema, cfg);
    ctx0->init();
    ctx0->sort_by(svec);
    return ctx0;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
t_ctx1_sptr
make_context_one(t_gnode_sptr gnode,
                 val j_pivots,
                 t_filter_op combiner,
                 val j_filters,
                 val j_aggs,
                 val j_sortby)
{
    auto schema = gnode->get_tblschema();
    auto fvec = _get_fterms(schema, j_filters);
    auto aggspecs = _get_aggspecs(j_aggs);
    auto pivots = vecFromJSArray<std::string>(j_pivots);
    auto svec = _get_sort(j_sortby);


    auto cfg = t_config(pivots, aggspecs, combiner, fvec);
    auto ctx1 = std::make_shared<t_ctx1>(schema, cfg);

    ctx1->init();
    ctx1->sort_by(svec);
    return ctx1;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
t_ctx2_sptr
make_context_two(t_gnode_sptr gnode,
                 val j_rpivots,
                 val j_cpivots,
                 t_filter_op combiner,
                 val j_filters,
                 val j_aggs,
                 val j_sortby)
{
    auto schema = gnode->get_tblschema();
    auto fvec = _get_fterms(schema, j_filters);
    auto aggspecs = _get_aggspecs(j_aggs);
    auto rpivots = vecFromJSArray<std::string>(j_rpivots);
    auto cpivots = vecFromJSArray<std::string>(j_cpivots);
    auto svec = _get_sort(j_sortby);

    auto cfg = t_config(rpivots, cpivots, aggspecs, TOTALS_HIDDEN, combiner, fvec);
    auto ctx2 = std::make_shared<t_ctx2>(schema, cfg);

    ctx2->init();
    if (svec.size() > 0) {
        ctx2->sort_by(svec);
    }
    return ctx2;
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
val
scalar_to_val(const t_tscalvec& scalars, t_uint32 idx)
{
    auto scalar = scalars[idx];
    switch (scalar.get_dtype())
    {
        case DTYPE_BOOL:
        {
            if (scalar)
            {
                return val(true);
            }
            else
            {
                return val(false);
            }
        }
        case DTYPE_FLOAT64:
        case DTYPE_FLOAT32:
        {
            return val(scalar.to_double());
        }
		case DTYPE_TIME:
		{
			return val(scalar.to_double());
		}
        case DTYPE_UINT32:
        case DTYPE_UINT64:
        case DTYPE_INT64:
        case DTYPE_INT32:
        {
            return val(static_cast<t_int32>(scalar.to_int64()));
        }
        case DTYPE_NONE:
        {
            return val::undefined();
        }
        case DTYPE_STR:
        default:
        {
            return val(scalar.to_string());
        }
    }
}

/**
 *
 *
 * Params
 * ------
 *
 *
 * Returns
 * -------
 *
 */
template<typename T>
val
get_data(T ctx, t_uint32 start_row, t_uint32 end_row, t_uint32 start_col, t_uint32 end_col)
{
    auto slice = ctx->get_data(start_row, end_row, start_col, end_col);
    val arr = val::array();
    for (auto idx = 0; idx < slice.size(); ++idx)
    {
        arr.set(idx, scalar_to_val(slice, idx));
    }
    return arr;
}

/**
 * Main
 */
int
main(int argc, char** argv)
{
    std::cout << "Perspective initialized successfully." << std::endl;
    EM_ASM({

        if (global.dispatchEvent && !global._perspective_initialized && global.document) {
            global._perspective_initialized = true;
            var event = global.document.createEvent("Event");
            event.initEvent("perspective-ready", false, true);
            global.dispatchEvent(event);
        } else if (!global.document && typeof self !== "undefined") {
            self.postMessage({});
        }

    });
}

/******************************************************************************
 *
 * Embind
 */

EMSCRIPTEN_BINDINGS(perspective)
{

    class_<t_table>("t_table")
        .constructor<t_schema, t_uindex>()
        .smart_ptr<std::shared_ptr<t_table>>("shared_ptr<t_table>")
        .function<void>("pprint", &t_table::pprint)
        .function<unsigned long>(
            "size",
            reinterpret_cast<unsigned long (t_table::*)() const>(
                &t_table::size));

    class_<t_schema>("t_schema")
        .function<const t_svec&>("columns", &t_schema::columns, allow_raw_pointers())
        .function<const t_dtypevec>("types", &t_schema::types, allow_raw_pointers());

    class_<t_gnode>("t_gnode")
        .constructor<t_gnode_processing_mode,
                     const t_schema&,
                     const t_schemavec&,
                     const t_schemavec&,
                     const t_ccol_vec&>()
        .smart_ptr<std::shared_ptr<t_gnode>>("shared_ptr<t_gnode>")
        .function<t_schema>("get_tblschema", &t_gnode::get_tblschema)
        .function<t_table*>(
            "get_table", &t_gnode::get_table, allow_raw_pointers());

    class_<t_ctx0>("t_ctx0")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx0>>("shared_ptr<t_ctx0>")
        .function<unsigned long>("get_row_count", reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_row_count))
        .function<unsigned long>("get_column_count", reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_column_count))
        .function<t_tscalvec>("get_data", &t_ctx0::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx0::get_step_delta)
        .function<t_cellupdvec>("get_cell_delta", &t_ctx0::get_cell_delta)
        .function<t_svec>("get_column_names", &t_ctx0::get_column_names)
        // .function<t_minmaxvec>("get_min_max", &t_ctx0::get_min_max)
        // .function<void>("set_minmax_enabled", &t_ctx0::set_minmax_enabled)
        .function<t_tscalvec>("unity_get_row_data", &t_ctx0::unity_get_row_data)
        .function<t_tscalvec>("unity_get_column_data", &t_ctx0::unity_get_column_data)
        .function<t_tscalvec>("unity_get_row_path", &t_ctx0::unity_get_row_path)
        .function<t_tscalvec>("unity_get_column_path", &t_ctx0::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx0::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx0::unity_get_column_depth)
        .function<t_str>("unity_get_column_name", &t_ctx0::unity_get_column_name)
        .function<t_str>("unity_get_column_display_name", &t_ctx0::unity_get_column_display_name)
        .function<t_svec>("unity_get_column_names", &t_ctx0::unity_get_column_names)
        .function<t_svec>("unity_get_column_display_names", &t_ctx0::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx0::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx0::unity_get_row_count)
        .function<t_bool>("unity_get_row_expanded", &t_ctx0::unity_get_row_expanded)
        .function<t_bool>("unity_get_column_expanded", &t_ctx0::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx0::unity_init_load_step_end);

    class_<t_ctx1>("t_ctx1")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx1>>("shared_ptr<t_ctx1>")
        .function<unsigned long>("get_row_count",reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_row_count))
        .function<unsigned long>("get_column_count", reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_column_count))
        .function<t_tscalvec>("get_data", &t_ctx1::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx1::get_step_delta)
        .function<t_cellupdvec>("get_cell_delta", &t_ctx1::get_cell_delta)
        .function<void>("expand_to_depth", &t_ctx1::expand_to_depth)
        .function<t_depth>("get_trav_depth", &t_ctx1::get_trav_depth)
        .function<t_aggspecvec>("get_column_names", &t_ctx1::get_aggregates)
        .function<t_tscalvec>("unity_get_row_data", &t_ctx1::unity_get_row_data)
        .function<t_tscalvec>("unity_get_column_data", &t_ctx1::unity_get_column_data)
        .function<t_tscalvec>("unity_get_row_path", &t_ctx1::unity_get_row_path)
        .function<t_tscalvec>("unity_get_column_path", &t_ctx1::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx1::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx1::unity_get_column_depth)
        .function<t_str>("unity_get_column_name", &t_ctx1::unity_get_column_name)
        .function<t_str>("unity_get_column_display_name", &t_ctx1::unity_get_column_display_name)
        .function<t_svec>("unity_get_column_names", &t_ctx1::unity_get_column_names)
        .function<t_svec>("unity_get_column_display_names", &t_ctx1::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx1::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx1::unity_get_row_count)
        .function<t_bool>("unity_get_row_expanded", &t_ctx1::unity_get_row_expanded)
        .function<t_bool>("unity_get_column_expanded", &t_ctx1::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx1::unity_init_load_step_end);

    class_<t_ctx2>("t_ctx2")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx2>>("shared_ptr<t_ctx2>")
        .function<unsigned long>("get_row_count",reinterpret_cast<unsigned long (t_ctx2::*)() const>(select_overload<t_index() const>(&t_ctx2::get_row_count)))
        .function<unsigned long>("get_column_count", reinterpret_cast<unsigned long (t_ctx2::*)() const>(&t_ctx2::get_column_count))
        .function<t_tscalvec>("get_data", &t_ctx2::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx2::get_step_delta)
        //.function<t_cellupdvec>("get_cell_delta", &t_ctx2::get_cell_delta)
        .function<void>("expand_to_depth", &t_ctx2::expand_to_depth)
        .function<t_aggspecvec>("get_column_names", &t_ctx2::get_aggregates)
        .function<t_tscalvec>("unity_get_row_data", &t_ctx2::unity_get_row_data)
        .function<t_tscalvec>("unity_get_column_data", &t_ctx2::unity_get_column_data)
        .function<t_tscalvec>("unity_get_row_path", &t_ctx2::unity_get_row_path)
        .function<t_tscalvec>("unity_get_column_path", &t_ctx2::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx2::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx2::unity_get_column_depth)
        .function<t_str>("unity_get_column_name", &t_ctx2::unity_get_column_name)
        .function<t_str>("unity_get_column_display_name", &t_ctx2::unity_get_column_display_name)
        .function<t_svec>("unity_get_column_names", &t_ctx2::unity_get_column_names)
        .function<t_svec>("unity_get_column_display_names", &t_ctx2::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx2::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx2::unity_get_row_count)
        .function<t_bool>("unity_get_row_expanded", &t_ctx2::unity_get_row_expanded)
        .function<t_bool>("unity_get_column_expanded", &t_ctx2::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx2::unity_init_load_step_end)
		.function<t_totals>("get_totals", &t_ctx2::get_totals)
		.function<t_tscalvec>("get_column_path_userspace", &t_ctx2::get_column_path_userspace)
        .function<void>("unity_init_load_step_end", &t_ctx2::unity_init_load_step_end);

    class_<t_pool>("t_pool")
        .constructor<emscripten::val>()
        .smart_ptr<std::shared_ptr<t_pool>>("shared_ptr<t_pool>")
        .function<unsigned int>("register_gnode",
                                &t_pool::register_gnode,
                                allow_raw_pointers())
        .function<void>("unregister_gnode", &t_pool::unregister_gnode)
        .function<void>("set_update_delegate",
                        &t_pool::set_update_delegate)
        .function<void>("register_context",
                        &t_pool::register_context)
        .function<void>("unregister_context",
                        &t_pool::unregister_context);

    class_<t_aggspec>("t_aggspec")
        .function<std::string>("name", &t_aggspec::name);

    class_<t_tscalar>("t_tscalar");

    value_object<t_cellupd>("t_cellupd")
        .field("row", &t_cellupd::row)
        .field("column", &t_cellupd::column)
        .field("old_value", &t_cellupd::old_value)
        .field("new_value", &t_cellupd::new_value);

    value_object<t_stepdelta>("t_stepdelta")
        .field("cells", &t_stepdelta::cells);

    register_vector<t_dtype>("t_dtypevec");
    register_vector<t_cellupd>("t_cellupdvec");
    register_vector<t_aggspec>("t_aggspecvec");
    register_vector<t_tscalar>("t_tscalvec");
    register_vector<std::string>("std::vector<std::string>");

    enum_<t_header>("t_header")
        .value("HEADER_ROW", HEADER_ROW)
        .value("HEADER_COLUMN", HEADER_COLUMN);

    enum_<t_ctx_type>("t_ctx_type")
        .value("ZERO_SIDED_CONTEXT", ZERO_SIDED_CONTEXT)
        .value("ONE_SIDED_CONTEXT", ONE_SIDED_CONTEXT)
        .value("TWO_SIDED_CONTEXT", TWO_SIDED_CONTEXT)
        .value("GROUPED_ZERO_SIDED_CONTEXT", GROUPED_ZERO_SIDED_CONTEXT)
        .value("GROUPED_PKEY_CONTEXT", GROUPED_PKEY_CONTEXT)
        .value("GROUPED_COLUMNS_CONTEXT", GROUPED_COLUMNS_CONTEXT);

    enum_<t_filter_op>("t_filter_op")
        .value("FILTER_OP_LT", FILTER_OP_LT)
        .value("FILTER_OP_LTEQ", FILTER_OP_LTEQ)
        .value("FILTER_OP_GT", FILTER_OP_GT)
        .value("FILTER_OP_GTEQ", FILTER_OP_GTEQ)
        .value("FILTER_OP_EQ", FILTER_OP_EQ)
        .value("FILTER_OP_NE", FILTER_OP_NE)
        .value("FILTER_OP_BEGINS_WITH", FILTER_OP_BEGINS_WITH)
        .value("FILTER_OP_ENDS_WITH", FILTER_OP_ENDS_WITH)
        .value("FILTER_OP_CONTAINS", FILTER_OP_CONTAINS)
        .value("FILTER_OP_OR", FILTER_OP_OR)
        .value("FILTER_OP_IN", FILTER_OP_IN)
        .value("FILTER_OP_AND", FILTER_OP_AND)
        .value("FILTER_OP_IS_NAN", FILTER_OP_IS_NAN)
        .value("FILTER_OP_IS_NOT_NAN", FILTER_OP_IS_NOT_NAN)
        .value("FILTER_OP_IS_VALID", FILTER_OP_IS_VALID)
        .value("FILTER_OP_IS_NOT_VALID", FILTER_OP_IS_NOT_VALID);

    enum_<t_dtype>("t_dtype")
        .value("DTYPE_NONE", DTYPE_NONE)
        .value("DTYPE_INT64", DTYPE_INT64)
        .value("DTYPE_INT32", DTYPE_INT32)
        .value("DTYPE_INT16", DTYPE_INT16)
        .value("DTYPE_INT8", DTYPE_INT8)
        .value("DTYPE_UINT64", DTYPE_UINT64)
        .value("DTYPE_UINT32", DTYPE_UINT32)
        .value("DTYPE_UINT16", DTYPE_UINT16)
        .value("DTYPE_UINT8", DTYPE_UINT8)
        .value("DTYPE_FLOAT64", DTYPE_FLOAT64)
        .value("DTYPE_FLOAT32", DTYPE_FLOAT32)
        .value("DTYPE_BOOL", DTYPE_BOOL)
        .value("DTYPE_TIME", DTYPE_TIME)
        .value("DTYPE_DATE", DTYPE_DATE)
        .value("DTYPE_ENUM", DTYPE_ENUM)
        .value("DTYPE_OID", DTYPE_OID)
        .value("DTYPE_PTR", DTYPE_PTR)
        .value("DTYPE_F64PAIR", DTYPE_F64PAIR)
        .value("DTYPE_USER_FIXED", DTYPE_USER_FIXED)
        .value("DTYPE_STR", DTYPE_STR)
        .value("DTYPE_USER_VLEN", DTYPE_USER_VLEN)
        .value("DTYPE_LAST_VLEN", DTYPE_LAST_VLEN)
        .value("DTYPE_LAST", DTYPE_LAST);

    enum_<t_aggtype>("t_aggtype")
        .value("AGGTYPE_SUM", AGGTYPE_SUM)
        .value("AGGTYPE_MUL", AGGTYPE_MUL)
        .value("AGGTYPE_COUNT", AGGTYPE_COUNT)
        .value("AGGTYPE_MEAN", AGGTYPE_MEAN)
        .value("AGGTYPE_WEIGHTED_MEAN", AGGTYPE_WEIGHTED_MEAN)
        .value("AGGTYPE_UNIQUE", AGGTYPE_UNIQUE)
        .value("AGGTYPE_ANY", AGGTYPE_ANY)
        .value("AGGTYPE_MEDIAN", AGGTYPE_MEDIAN)
        .value("AGGTYPE_JOIN", AGGTYPE_JOIN)
        .value("AGGTYPE_SCALED_DIV", AGGTYPE_SCALED_DIV)
        .value("AGGTYPE_SCALED_ADD", AGGTYPE_SCALED_ADD)
        .value("AGGTYPE_SCALED_MUL", AGGTYPE_SCALED_MUL)
        .value("AGGTYPE_DOMINANT", AGGTYPE_DOMINANT)
        .value("AGGTYPE_FIRST", AGGTYPE_FIRST)
        .value("AGGTYPE_LAST", AGGTYPE_LAST)
        .value("AGGTYPE_PY_AGG", AGGTYPE_PY_AGG)
        .value("AGGTYPE_AND", AGGTYPE_AND)
        .value("AGGTYPE_OR", AGGTYPE_OR)
        .value("AGGTYPE_LAST_VALUE", AGGTYPE_LAST_VALUE)
        .value("AGGTYPE_HIGH_WATER_MARK", AGGTYPE_HIGH_WATER_MARK)
        .value("AGGTYPE_LOW_WATER_MARK", AGGTYPE_LOW_WATER_MARK)
        .value("AGGTYPE_UDF_COMBINER", AGGTYPE_UDF_COMBINER)
        .value("AGGTYPE_UDF_REDUCER", AGGTYPE_UDF_REDUCER)
        .value("AGGTYPE_SUM_ABS", AGGTYPE_SUM_ABS)
        .value("AGGTYPE_SUM_NOT_NULL", AGGTYPE_SUM_NOT_NULL)
        .value("AGGTYPE_MEAN_BY_COUNT", AGGTYPE_MEAN_BY_COUNT)
        .value("AGGTYPE_IDENTITY", AGGTYPE_IDENTITY)
        .value("AGGTYPE_DISTINCT_COUNT", AGGTYPE_DISTINCT_COUNT)
        .value("AGGTYPE_DISTINCT_LEAF", AGGTYPE_DISTINCT_LEAF)
        .value("AGGTYPE_PCT_SUM_PARENT", AGGTYPE_PCT_SUM_PARENT)
        .value("AGGTYPE_PCT_SUM_GRAND_TOTAL",
               AGGTYPE_PCT_SUM_GRAND_TOTAL);

	enum_<t_totals>("t_totals")
		.value("TOTALS_BEFORE", TOTALS_BEFORE)
		.value("TOTALS_HIDDEN", TOTALS_HIDDEN)
		.value("TOTALS_AFTER", TOTALS_AFTER);

    function("make_table", &make_table);
    function("make_gnode", &make_gnode);
    function("fill", &fill, allow_raw_pointers());
    function("make_context_zero", &make_context_zero);
    function("make_context_one", &make_context_one);
    function("make_context_two", &make_context_two);
    function("scalar_to_val", &scalar_to_val);
    function("get_data_zero", &get_data<t_ctx0_sptr>);
    function("get_data_one", &get_data<t_ctx1_sptr>);
    function("get_data_two", &get_data<t_ctx2_sptr>);
}
