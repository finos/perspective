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

#include <perspective/first.h>
#include <perspective/aggregate.h>

namespace perspective {

t_aggregate::t_aggregate(const t_dtree& tree, t_aggtype aggtype,
    std::vector<std::shared_ptr<const t_column>> icolumns,
    std::shared_ptr<t_column> ocolumn)
    : m_tree(tree)
    , m_aggtype(aggtype)
    , m_icolumns(icolumns)
    , m_ocolumn(ocolumn) {}

constexpr t_aggregate::DTYPE_ACTIONS_T t_aggregate::gen_sum_actions() {
    DTYPE_ACTIONS_T a = {};
    a[DTYPE_INT64] = &build_aggregate<t_aggimpl_sum<std::int64_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT32] = &build_aggregate<t_aggimpl_sum<std::int32_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT16] = &build_aggregate<t_aggimpl_sum<std::int16_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT8] = &build_aggregate<t_aggimpl_sum<std::int8_t, std::int64_t,std::int64_t>>;
    a[DTYPE_UINT64] = &build_aggregate<t_aggimpl_sum<std::uint64_t, std::int64_t,std::int64_t>>;
    a[DTYPE_UINT32] = &build_aggregate<t_aggimpl_sum<std::uint32_t, std::int64_t,std::int64_t>>;
    a[DTYPE_UINT16] = &build_aggregate<t_aggimpl_sum<std::uint16_t, std::int64_t,std::int64_t>>;
    a[DTYPE_UINT8] = &build_aggregate<t_aggimpl_sum<std::uint8_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_FLOAT64] = &build_aggregate<t_aggimpl_sum<double, double, double>>;
    a[DTYPE_FLOAT32] = &build_aggregate<t_aggimpl_sum<float, double, double>>;
    a[DTYPE_BOOL] = a[DTYPE_UINT8];
    return a;
}

constexpr t_aggregate::DTYPE_ACTIONS_T t_aggregate::gen_mul_actions() {
    DTYPE_ACTIONS_T a = {};
    a[DTYPE_INT64] = &build_aggregate<t_aggimpl_mul<std::int64_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT32] = &build_aggregate<t_aggimpl_mul<std::int32_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT16] = &build_aggregate<t_aggimpl_mul<std::int16_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT8] = &build_aggregate<t_aggimpl_mul<std::int8_t, std::int64_t,std::int64_t>>;
    a[DTYPE_UINT64] = &build_aggregate<t_aggimpl_mul<std::uint64_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT32] = &build_aggregate<t_aggimpl_mul<std::uint32_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT16] = &build_aggregate<t_aggimpl_mul<std::uint16_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT8] = &build_aggregate<t_aggimpl_mul<std::uint8_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_FLOAT64] = &build_aggregate<t_aggimpl_mul<double, double, double>>;
    a[DTYPE_FLOAT32] = &build_aggregate<t_aggimpl_mul<float, double, double>>;
    a[DTYPE_BOOL] = a[DTYPE_UINT8];
    return a;
}

constexpr t_aggregate::DTYPE_ACTIONS_T t_aggregate::gen_count_actions() {
    DTYPE_ACTIONS_T a = {};
    a[DTYPE_INT64] = &build_aggregate<t_aggimpl_count<std::int64_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT32] = &build_aggregate<t_aggimpl_count<std::int32_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT16] = &build_aggregate<t_aggimpl_count<std::int16_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT8] = &build_aggregate<t_aggimpl_count<std::int8_t, std::int64_t,std::int64_t>>;
    a[DTYPE_UINT64] = &build_aggregate<t_aggimpl_count<std::uint64_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT32] = &build_aggregate<t_aggimpl_count<std::uint32_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT16] = &build_aggregate<t_aggimpl_count<std::uint16_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT8] = &build_aggregate<t_aggimpl_count<std::uint8_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_FLOAT64] = &build_aggregate<t_aggimpl_count<double, double, double>>;
    a[DTYPE_FLOAT32] = &build_aggregate<t_aggimpl_count<float, double, double>>;
    a[DTYPE_BOOL] = a[DTYPE_UINT8];
    a[DTYPE_STR] = a[DTYPE_UINT64];
    a[DTYPE_DATE] = a[DTYPE_UINT32];
    a[DTYPE_TIME] = a[DTYPE_INT64];
    return a;
}

constexpr t_aggregate::DTYPE_ACTIONS_T t_aggregate::gen_mean_actions() {
    DTYPE_ACTIONS_T a = {};
    a[DTYPE_INT64] = &build_aggregate<t_aggimpl_mean<std::int64_t,std::pair<double, double>, double>>;
    a[DTYPE_INT32] = &build_aggregate<t_aggimpl_mean<std::int32_t,std::pair<double, double>, double>>;
    a[DTYPE_INT16] = &build_aggregate<t_aggimpl_mean<std::int16_t,std::pair<double, double>, double>>;
    a[DTYPE_INT8] = &build_aggregate<t_aggimpl_mean<std::int8_t,std::pair<double, double>, double>>;
    a[DTYPE_UINT64] = &build_aggregate<t_aggimpl_mean<std::uint64_t,std::pair<double, double>, double>>;
    a[DTYPE_UINT32] = &build_aggregate<t_aggimpl_mean<std::uint32_t,std::pair<double, double>, double>>;
    a[DTYPE_UINT16] = &build_aggregate<t_aggimpl_mean<std::uint16_t,std::pair<double, double>, double>>;
    a[DTYPE_UINT8] = &build_aggregate<t_aggimpl_mean<std::uint8_t,std::pair<double, double>, double>>;
    a[DTYPE_FLOAT64] = &build_aggregate<t_aggimpl_mean<double,std::pair<double, double>, double>>;
    a[DTYPE_FLOAT32] = &build_aggregate<t_aggimpl_mean<float,std::pair<double, double>, double>>;
    a[DTYPE_BOOL] = a[DTYPE_UINT8];
    return a;
}

constexpr t_aggregate::DTYPE_ACTIONS_T t_aggregate::gen_hwm_actions() {
    DTYPE_ACTIONS_T a = {};
    a[DTYPE_INT64] = &build_aggregate<t_aggimpl_hwm<std::int64_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT32] = &build_aggregate<t_aggimpl_hwm<std::int32_t, std::int32_t,std::int32_t>>;
    a[DTYPE_INT16] = &build_aggregate<t_aggimpl_hwm<std::int16_t, std::int16_t,std::int16_t>>;
    a[DTYPE_INT8] = &build_aggregate<t_aggimpl_hwm<std::int8_t, std::int8_t, std::int8_t>>;
    a[DTYPE_UINT64] = &build_aggregate<t_aggimpl_hwm<std::uint64_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT32] = &build_aggregate<t_aggimpl_hwm<std::uint32_t, std::uint32_t,std::uint32_t>>;
    a[DTYPE_UINT16] = &build_aggregate<t_aggimpl_hwm<std::uint16_t, std::uint16_t,std::uint16_t>>;
    a[DTYPE_UINT8] = &build_aggregate<t_aggimpl_hwm<std::uint8_t, std::uint8_t,std::uint8_t>>;
    a[DTYPE_FLOAT64] = &build_aggregate<t_aggimpl_hwm<double, double, double>>;
    a[DTYPE_FLOAT32] = &build_aggregate<t_aggimpl_hwm<float, float, float>>;
    a[DTYPE_BOOL] = a[DTYPE_UINT8];
    a[DTYPE_TIME] = a[DTYPE_INT64];
    a[DTYPE_DATE] = a[DTYPE_UINT32];
    a[DTYPE_STR] = &build_aggregate<t_aggimpl_hwm<const char*, const char*, const char*>>;
    return a;
}

constexpr t_aggregate::DTYPE_ACTIONS_T t_aggregate::gen_lwm_actions() {
    DTYPE_ACTIONS_T a = {};
    a[DTYPE_INT64] = &build_aggregate<t_aggimpl_lwm<std::int64_t, std::int64_t,std::int64_t>>;
    a[DTYPE_INT32] = &build_aggregate<t_aggimpl_lwm<std::int32_t, std::int32_t,std::int32_t>>;
    a[DTYPE_INT16] = &build_aggregate<t_aggimpl_lwm<std::int16_t, std::int16_t,std::int16_t>>;
    a[DTYPE_INT8] = &build_aggregate<t_aggimpl_lwm<std::int8_t, std::int8_t, std::int8_t>>;
    a[DTYPE_UINT64] = &build_aggregate<t_aggimpl_lwm<std::uint64_t, std::uint64_t,std::uint64_t>>;
    a[DTYPE_UINT32] = &build_aggregate<t_aggimpl_lwm<std::uint32_t, std::uint32_t,std::uint32_t>>;
    a[DTYPE_UINT16] = &build_aggregate<t_aggimpl_lwm<std::uint16_t, std::uint16_t,std::uint16_t>>;
    a[DTYPE_UINT8] = &build_aggregate<t_aggimpl_lwm<std::uint8_t, std::uint8_t,std::uint8_t>>;
    a[DTYPE_FLOAT64] = &build_aggregate<t_aggimpl_lwm<double, double, double>>;
    a[DTYPE_FLOAT32] = &build_aggregate<t_aggimpl_lwm<float, float, float>>;
    a[DTYPE_BOOL] = a[DTYPE_UINT8];
    a[DTYPE_TIME] = a[DTYPE_INT64];
    a[DTYPE_DATE] = a[DTYPE_UINT32];
    a[DTYPE_STR] = &build_aggregate<t_aggimpl_lwm<const char*, const char*, const char*>>;
    return a;
}

constexpr t_aggregate::AGGTYPE_ACTIONS_T t_aggregate::gen_aggtype_actions() {
    AGGTYPE_ACTIONS_T a = {};
    a[AGGTYPE_SUM] = gen_sum_actions();
    a[AGGTYPE_PCT_SUM_PARENT] = a[AGGTYPE_SUM];
    a[AGGTYPE_PCT_SUM_GRAND_TOTAL] = a[AGGTYPE_SUM];
    a[AGGTYPE_MUL] = gen_mul_actions();
    a[AGGTYPE_COUNT] = gen_count_actions();
    a[AGGTYPE_MEAN] = gen_mean_actions();
    a[AGGTYPE_HIGH_WATER_MARK] = gen_hwm_actions();
    a[AGGTYPE_LOW_WATER_MARK] = gen_lwm_actions();
    return a;
}

const t_aggregate::AGGTYPE_ACTIONS_T t_aggregate::AGGTYPE_ACTIONS = gen_aggtype_actions();

void
t_aggregate::init() {
    const std::optional<DTYPE_ACTIONS_T>& dtype_actions = AGGTYPE_ACTIONS[m_aggtype];
    if(!dtype_actions.has_value()) { // Other aggregates will be filled in later
        return;
    }
    DTYPE_ACTIONS_T actions = dtype_actions.value();
    const t_dtype dtype = m_icolumns[0]->get_dtype();
    const DTYPE_ACTION_T dtype_action = actions[dtype];
    if(!dtype_action){
        PSP_COMPLAIN_AND_ABORT("Unexpected dtype");
        return;
    }
    dtype_action(this);
}
} // end namespace perspective
