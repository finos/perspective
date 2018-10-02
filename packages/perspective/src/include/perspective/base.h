/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#ifdef WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#endif
#include <perspective/first.h>
#include <perspective/raw_types.h>
#include <sstream>
#include <csignal>
#include <iostream>
#include <cstring>
#include <memory>
#include <functional>
#include <algorithm>
#include <iomanip>
#include <chrono>
#include <fstream>
#include <boost/unordered_map.hpp>
#include <perspective/portable.h>

namespace perspective {

const t_int32 PSP_VERSION = 67;
const t_float64 PSP_TABLE_GROW_RATIO = 1.3;

#ifdef WIN32
#define PSP_RESTRICT __restrict
#define PSP_ABORT() DebugBreak()
#define PSP_THR_LOCAL __declspec(thread)
#else
#define PSP_RESTRICT __restrict__
#define PSP_ABORT() std::raise(SIGINT);
#define PSP_THR_LOCAL __thread
#endif

#define PSP_PFOR tbb::parallel_for

const t_index INVALID_INDEX = -1;

#ifdef PSP_PARALLEL_FOR
#define PSP_PSORT tbb::parallel_sort
#else
#define PSP_PSORT std::sort
#endif
#define DEFAULT_CAPACITY 4000
#define DEFAULT_CHUNK_SIZE 4000
#define DEFAULT_EMPTY_CAPACITY 8
#define ROOT_AGGIDX 0
#ifndef CHAR_BIT
#define CHAR_BIT 8
#endif
//#define PSP_TRACE_SENTINEL() t_trace _psp_trace_sentinel;
#define PSP_TRACE_SENTINEL()
#ifdef PSP_DEBUG
#define PSP_VERBOSE_ASSERT(COND, MSG)                                                          \
    {                                                                                          \
        if (!(COND)) {                                                                         \
            std::stringstream ss;                                                              \
            ss << __FILE__ << ":" << __LINE__ << ": " << MSG << " : "                          \
               << perspective::get_error_str();                                                \
            perror(ss.str().c_str());                                                          \
            PSP_ABORT();                                                                       \
        }                                                                                      \
    }

#define PSP_COMPLAIN_AND_ABORT(X)                                                              \
    {                                                                                          \
        std::stringstream ss;                                                                  \
        ss << __FILE__ << ":" << __LINE__ << ": " << X;                                        \
        perror(ss.str().c_str());                                                              \
        PSP_ABORT();                                                                           \
    }

#define PSP_ASSERT_SIMPLE_TYPE(X)                                                              \
static_assert(                                               \
std::is_pod<X>::value && std::is_standard_layout<X>::value , \
" Unsuitable type found. "

//#define LOG_LIFETIMES 1

#ifdef LOG_LIFETIMES
#define LOG_CONSTRUCTOR(X)                                                                     \
    std::cout << "constructing L: " << __LINE__ << " " << (X) << " <" << this << ">"           \
              << std::endl;

#define LOG_DESTRUCTOR(X)                                                                      \
    std::cout << "destroying L: " << __LINE__ << " " << (X) << " <" << this << ">" << std::endl;

#define LOG_INIT(X)                                                                            \
    std::cout << "initing L: " << __LINE__ << " " << (X) << " <" << this << ">" << std::endl;
#else
#define LOG_CONSTRUCTOR(X)
#define LOG_DESTRUCTOR(X)
#define LOG_INIT(X)
#endif
#else
#define PSP_VERBOSE_ASSERT(COND, MSG)
#define PSP_COMPLAIN_AND_ABORT(X)
#define PSP_ASSERT_SIMPLE_TYPE(X)
#define LOG_CONSTRUCTOR(X)
#define LOG_DESTRUCTOR(X)
#define LOG_INIT(X)
#endif

// Currently only supporting single ports
enum t_gnode_processing_mode { NODE_PROCESSING_SIMPLE_DATAFLOW, NODE_PROCESSING_KERNEL };

enum t_pivot_mode {
    PIVOT_MODE_NORMAL,
    PIVOT_MODE_KERNEL,
    PIVOT_MODE_CONCATENATE,
    PIVOT_MODE_TIME_BUCKET_MIN,
    PIVOT_MODE_TIME_BUCKET_HOUR,
    PIVOT_MODE_TIME_BUCKET_DAY,
    PIVOT_MODE_TIME_BUCKET_WEEK,
    PIVOT_MODE_TIME_BUCKET_MONTH,
    PIVOT_MODE_TIME_BUCKET_YEAR
};

enum t_select_mode {
    SELECT_MODE_ALL,
    SELECT_MODE_RANGE,
    SELECT_MODE_MASK,
    SELECT_MODE_PKEY,
    SELECT_MODE_KERNEL
};

enum t_backing_store { BACKING_STORE_MEMORY, BACKING_STORE_DISK };

enum t_filter_op {
    FILTER_OP_LT,
    FILTER_OP_LTEQ,
    FILTER_OP_GT,
    FILTER_OP_GTEQ,
    FILTER_OP_EQ,
    FILTER_OP_NE,
    FILTER_OP_BEGINS_WITH,
    FILTER_OP_ENDS_WITH,
    FILTER_OP_CONTAINS,
    FILTER_OP_OR,
    FILTER_OP_IN,
    FILTER_OP_NOT_IN,
    FILTER_OP_AND,
    FILTER_OP_IS_NAN,
    FILTER_OP_IS_NOT_NAN,
    FILTER_OP_IS_VALID,
    FILTER_OP_IS_NOT_VALID
};

PERSPECTIVE_EXPORT t_str filter_op_to_str(t_filter_op op);

enum t_compression_scheme { COMPRESSION_SCHEME_NONE, COMPRESSION_SCHEME_GZIP };

enum t_data_format {
    DATA_FORMAT_PANDAS,
    DATA_FORMAT_CSV,
    DATA_FORMAT_LOL,
    DATA_FORMAT_LOL_VALID,
    DATA_FORMAT_EXCEL,
    DATA_FORMAT_PROTO
};

enum t_header { HEADER_ROW, HEADER_COLUMN };

enum t_sorttype {
    SORTTYPE_ASCENDING,
    SORTTYPE_DESCENDING,
    SORTTYPE_NONE,
    SORTTYPE_ASCENDING_ABS,
    SORTTYPE_DESCENDING_ABS
};

enum t_aggtype {
    AGGTYPE_SUM,
    AGGTYPE_MUL,
    AGGTYPE_COUNT,
    AGGTYPE_MEAN,
    AGGTYPE_WEIGHTED_MEAN,
    AGGTYPE_UNIQUE,
    AGGTYPE_ANY,
    AGGTYPE_MEDIAN,
    AGGTYPE_JOIN,
    AGGTYPE_SCALED_DIV,
    AGGTYPE_SCALED_ADD,
    AGGTYPE_SCALED_MUL,
    AGGTYPE_DOMINANT,
    AGGTYPE_FIRST,
    AGGTYPE_LAST,
    AGGTYPE_PY_AGG,
    AGGTYPE_AND,
    AGGTYPE_OR,
    AGGTYPE_LAST_VALUE,
    AGGTYPE_HIGH_WATER_MARK,
    AGGTYPE_LOW_WATER_MARK,
    AGGTYPE_UDF_COMBINER,
    AGGTYPE_UDF_REDUCER,
    AGGTYPE_SUM_ABS,
    AGGTYPE_SUM_NOT_NULL,
    AGGTYPE_MEAN_BY_COUNT,
    AGGTYPE_IDENTITY,
    AGGTYPE_DISTINCT_COUNT,
    AGGTYPE_DISTINCT_LEAF,
    AGGTYPE_PCT_SUM_PARENT,
    AGGTYPE_PCT_SUM_GRAND_TOTAL
};

enum t_totals { TOTALS_BEFORE, TOTALS_HIDDEN, TOTALS_AFTER };

enum t_ctx_type {
    ZERO_SIDED_CONTEXT,
    ONE_SIDED_CONTEXT,
    TWO_SIDED_CONTEXT,
    GROUPED_ZERO_SIDED_CONTEXT,
    GROUPED_PKEY_CONTEXT,
    GROUPED_COLUMNS_CONTEXT
};

enum t_strand_op { STRAND_INSERT, STRAND_DELETE };

enum t_op { OP_INSERT, OP_DELETE, OP_CLEAR };

enum t_value_transition {
    VALUE_TRANSITION_EQ_FF,
    // VALUE_TRANSITION_EQ_FT nonsensical
    // VALUE_TRANSITION_EQ_TF nonsensical
    VALUE_TRANSITION_EQ_TT,
    // VALUE_TRANSITION_NEQ_FF nonsensical
    VALUE_TRANSITION_NEQ_FT,
    VALUE_TRANSITION_NEQ_TF,
    VALUE_TRANSITION_NEQ_TT,
    // VALUE_TRANSITION_EQ_FDF, nonsensical
    // VALUE_TRANSITION_EQ_FDT, nonsensical
    // VALUE_TRANSITION_EQ_TDF, nonsensical
    // VALUE_TRANSITION_EQ_TDT, nonsensical
    // VALUE_TRANSITION_NEQ_FDF, nonsensical
    // VALUE_TRANSITION_NEQ_FDT, nonsensical
    VALUE_TRANSITION_NEQ_TDF,
    VALUE_TRANSITION_NEQ_TDT,
    VALUE_TRANSITION_NVEQ_FT
};

enum t_gnode_port {
    PSP_PORT_FLATTENED,   // same schema as iport (pkey,op)
    PSP_PORT_DELTA,       // same schema as state
    PSP_PORT_PREV,        // same schema as state
    PSP_PORT_CURRENT,     // same schema as state
    PSP_PORT_TRANSITIONS, // same schema as state
    PSP_PORT_EXISTED      // same schema as state
};

enum t_ctx_feature {
    CTX_FEAT_PROCESS,
    CTX_FEAT_MINMAX,
    CTX_FEAT_DELTA,
    CTX_FEAT_ALERT,
    CTX_FEAT_ENABLED,
    CTX_FEAT_LAST_FEATURE
};

enum t_deptype { DEPTYPE_COLUMN, DEPTYPE_AGG, DEPTYPE_SCALAR };

enum t_cmp_op {
    CMP_OP_LT,
    CMP_OP_LTEQ,
    CMP_OP_GT,
    CMP_OP_GTEQ,
    CMP_OP_EQ,
    CMP_OP_NE,
    CMP_OP_BEGINS_WITH,
    CMP_OP_ENDS_WITH,
    CMP_OP_CONTAINS,
    CMP_OP_OR,
    CMP_OP_IN,
    CMP_OP_AND
};

enum t_invmode {
    INV_SUBST_CANONICAL, // Substitute canonical data with canonical
                         // forms
    INV_EXCLUDE,         // Exclude invalid data from calculations
    INV_PROPAGATE        // Propagate invalid virally
};

enum t_pool_trace {
    PTRACE_REGISTER_GNODE,
    PTRACE_UNREGISTER_GNODE,
    PTRACE_SEND,
    PTRACE_INIT,
    PTRACE_STOP,
    PTRACE_SET_SLEEP,
    PTRACE_SET_UPDATE_DELEGATE,
    PTRACE_REGISTER_CONTEXT,
    PTRACE_UNREGISTER_CONTEXT,
    PTRACE_INSTANCE,
    PTRACE_POOL_CREATE,
    PTRACE_LOG_DATAFRAGS
};

enum t_access_mode { ACCESS_MODE_NONE, ACCESS_MODE_READ, ACCESS_MODE_READ_WRITE };

enum t_range_mode {
    RANGE_ROW,
    RANGE_ROW_COLUMN,
    RANGE_ROW_PATH,
    RANGE_ROW_COLUMN_PATH,
    RANGE_ALL,
    RANGE_EXPR
};

enum t_fetch {
    FETCH_RANGE,
    FETCH_ROW_PATHS,
    FETCH_COLUMN_PATHS,
    FETCH_ROW_INDICES,
    FETCH_COLUMN_INDICES,
    FETCH_ROW_DATA_SLICE,
    FETCH_COLUMN_DATA_SLICE,
    FETCH_STYLE_SLICE,
    FETCH_USER_DATA_SLICE,
    FETCH_ROW_DEPTH,
    FETCH_COLUMN_DEPTH,
    FETCH_IS_ROW_EXPANDED,
    FETCH_IS_COLUMN_EXPANDED,
    FETCH_IS_ROOT,
    FETCH_COLUMN_NAMES,
    FETCH_CONFIG
};

enum t_fmode { FMODE_SIMPLE_CLAUSES, FMODE_JIT_EXPR };

typedef std::vector<t_fetch> t_fetchvec;

typedef std::vector<t_sorttype> t_sorttvec;

#ifdef WIN32
#define PSP_NON_COPYABLE(X)
#else
#define PSP_NON_COPYABLE(X)                                                                    \
    X(const X&) = delete;                                                                      \
    X& operator=(const X&) = delete
#endif

PERSPECTIVE_EXPORT t_str get_error_str();
PERSPECTIVE_EXPORT bool is_numeric_type(t_dtype dtype);
PERSPECTIVE_EXPORT bool is_linear_order_type(t_dtype dtype);
PERSPECTIVE_EXPORT t_str get_dtype_descr(t_dtype dtype);
PERSPECTIVE_EXPORT t_uindex get_dtype_size(t_dtype dtype);
PERSPECTIVE_EXPORT t_bool is_vlen_dtype(t_dtype dtype);
PERSPECTIVE_EXPORT t_bool is_neq_transition(t_value_transition t);

template <typename T>
inline std::ostream&
operator<<(std::ostream& os, const std::vector<T>& row) {
    for (int i = 0, loop_end = row.size(); i < loop_end; ++i) {
        os << row[i] << ", ";
    }

    return os;
}

template <typename FIRST_T, typename SECOND_T>
inline std::ostream&
operator<<(std::ostream& os, const std::pair<FIRST_T, SECOND_T>& p) {
    os << "<" << p.first << ", " << p.second << ">";
    return os;
}

void check_init(t_bool init, const char* file, t_int32 line);

t_uindex root_pidx();

struct PERSPECTIVE_EXPORT t_cmp_charptr {
    bool
    operator()(const char* a, const char* b) const {
        return std::strcmp(a, b) < 0;
    }
};

struct t_cchar_umap_cmp : public std::binary_function<const char*, const char*, bool> {
    inline bool
    operator()(const char* x, const char* y) const {
        return strcmp(x, y) == 0;
    }
};

struct t_cchar_umap_hash {
    inline t_uindex
    operator()(const char* s) const {
        return boost::hash_range(s, s + std::strlen(s));
    }
};

t_bool is_internal_colname(const t_str& c);

t_bool is_deterministic_sized(t_dtype dtype);

template <typename DATA_T>
t_str
psp_to_str(const DATA_T& s) {
    std::stringstream ss;
    ss << s;
    return ss.str();
}

} // end namespace perspective

namespace std {
template <>
struct hash<perspective::t_uidxpair> {
    typedef perspective::t_uidxpair argument_type;
    typedef std::size_t result_type;

    result_type
    operator()(argument_type const& s) const {
        result_type const h1(std::hash<perspective::t_uindex>()(s.first));
        result_type const h2(std::hash<perspective::t_uindex>()(s.second));
        return h1 ^ (h2 << 1);
    }
};

} // end namespace std
