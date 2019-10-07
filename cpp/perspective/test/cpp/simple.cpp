/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#include <perspective/base.h>
#include <perspective/config.h>
#include <perspective/data_table.h>
#include <perspective/date.h>
#include <perspective/time.h>
#include <perspective/test_utils.h>
#include <perspective/simple.h>
#include <perspective/context_base.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/context_zero.h>
#include <perspective/context_grouped_pkey.h>
#include <perspective/node_processor.h>
#include <perspective/storage.h>
#include <perspective/none.h>
#include <perspective/gnode.h>
#include <perspective/sym_table.h>
#include <gtest/gtest.h>
#include <random>
#include <limits>
#include <cmath>
#include <cstdint>
#include <sstream>

using namespace perspective;

TEST(TABLE, simplest_test)
{
    t_data_table tbl(t_schema({"a", "b"}, {DTYPE_INT64, DTYPE_FLOAT64}), 5);
    tbl.init();
    tbl.reserve(5);
}

TEST(GNODE, explicit_pkey)
{
    t_gnode_options options;
    options.m_gnode_type = GNODE_TYPE_PKEYED;
    options.m_port_schema = t_schema{{"x"}, {DTYPE_INT64}};
#ifndef WIN32
    EXPECT_EXIT(t_gnode::build(options), ::testing::KilledBySignal(SIGINT), "");
#endif
}


TEST(SCALAR, scalar_literal_test)
{
    auto s1 = 1_ts;
    auto s2 = "hello"_ts;
    auto s3 = 42.0_ts;
    ASSERT_EQ(s1, mktscalar<std::int64_t>(1));
    ASSERT_EQ(s2, mktscalar<const char*>("hello"));
    ASSERT_EQ(s3, mktscalar<double>(42.0));
}

TEST(CONTEXT_ONE, null_pivot_test_1)
{
    t_schema sch{{"p", "a"}, {DTYPE_INT64, DTYPE_INT64}};
    t_data_table tbl(sch, {{1_ns, 1_ts}, {1_ts, 1_ts}});
    t_config cfg{{"p"}, {"sum_a", AGGTYPE_SUM, "a"}};
    auto ctx = do_pivot<t_ctx1, std::int32_t, DTYPE_INT32>(
        t_do_pivot::PIVOT_NON_PKEYED, tbl, cfg);
    auto ctx_tbl = ctx->get_table();
    auto got = ctx_tbl->get_scalvec();
    std::vector<t_tscalar> expected{2_ts, 1_ns, 1_ts, 1_ts, 1_ts, 1_ns};
    ASSERT_EQ(expected, got);
}

TEST(STORAGE, constructor)
{
    t_lstore s;
    ASSERT_EQ(s.get_init(), false);
    ASSERT_TRUE(s.empty());
}

TEST(STORAGE, extend_1)
{
    t_lstore s;
    s.init();
    s.extend<std::int64_t>(10);
    ASSERT_EQ(s.size(), sizeof(std::int64_t) * 10);
}

// TODO add assert eqs here
TEST(CONTEXT_ONE, pivot_1)
{
    t_schema sch{{"b", "s", "i"}, {DTYPE_BOOL, DTYPE_STR, DTYPE_INT64}};
    auto t = mktscalar<bool>(true);
    auto f = mktscalar<bool>(false);
    t_data_table tbl(sch,
        {{t, "a"_ts, 1_ts}, {f, "b"_ts, 2_ts}, {t, "c"_ts, 3_ts},
            {f, "d"_ts, 4_ts}});
    t_config cfg{{"b", "s"}, {"sum_i", AGGTYPE_SUM, "i"}};
    auto ctx = do_pivot<t_ctx1, std::int32_t, DTYPE_INT32>(
        t_do_pivot::PIVOT_NON_PKEYED, tbl, cfg);
    auto ctx_tbl = ctx->get_table();
    auto got = ctx_tbl->get_scalvec();
    std::vector<t_tscalar> expected{10_ts, bnull, snull, 4_ts, s_true, snull, 3_ts, bnull,
        "c"_ts, 1_ts, bnull, "a"_ts, 6_ts, s_false, snull, 4_ts, bnull, "d"_ts,
        2_ts, bnull, "b"_ts};
    // ASSERT_EQ(expected, got);
}

TEST(CONTEXT_ONE, pivot_2)
{
    t_schema sch{{"i", "s", "b"}, {DTYPE_BOOL, DTYPE_STR, DTYPE_INT64}};
    auto t = mktscalar<bool>(true);
    auto f = mktscalar<bool>(false);
    t_data_table tbl(sch,
        {{t, "a"_ts, 1_ts}, {f, "b"_ts, 2_ts}, {t, "c"_ts, 3_ts},
            {f, "d"_ts, 4_ts}});
    t_config cfg{{"b", "b", "i", "s"}, {"sum_i", AGGTYPE_SUM, "i"}};
    auto ctx = do_pivot<t_ctx1, std::int32_t, DTYPE_INT32>(
        t_do_pivot::PIVOT_NON_PKEYED, tbl, cfg);
    auto ctx_tbl = ctx->get_table();
    // auto got =  ctx_tbl->get_scalvec();
    // std::vector<t_tscalar> expected{2_ts, 1_ns, 1_ts, 1_ts, 1_ts, 1_ns};
    // ASSERT_EQ(expected, got);
}

TEST(CONTEXT_ONE, pivot_3)
{
    t_schema sch{{"b", "s", "i"}, {DTYPE_BOOL, DTYPE_STR, DTYPE_INT64}};
    auto t = mktscalar<bool>(true);
    auto f = mktscalar<bool>(false);
    t_data_table tbl(sch,
        {{t, "a"_ts, 1_ts}, {f, "b"_ts, 2_ts}, {t, "c"_ts, 3_ts},
            {f, "d"_ts, 4_ts}});
    t_config cfg{{"b", "i"}, {"sum_i", AGGTYPE_SUM, "i"}};
    auto ctx = do_pivot<t_ctx1, std::int32_t, DTYPE_INT32>(
        t_do_pivot::PIVOT_NON_PKEYED, tbl, cfg);
    auto ctx_tbl = ctx->get_table();
    // auto got =  ctx_tbl->get_scalvec();
    // std::vector<t_tscalar> expected{2_ts, 1_ns, 1_ts, 1_ts, 1_ts, 1_ns};
    // ASSERT_EQ(expected, got);
}

TEST(CONTEXT_ONE, pivot_4)
{
    t_schema sch{{"b", "s", "i"}, {DTYPE_BOOL, DTYPE_STR, DTYPE_INT64}};
    auto t = mktscalar<bool>(true);
    auto f = mktscalar<bool>(false);
    t_data_table tbl(sch,
        {{t, "a"_ts, 1_ts}, {f, "b"_ts, 2_ts}, {t, "c"_ts, 3_ts},
            {f, "d"_ts, 4_ts}});
    t_config cfg{{"i", "s"}, {"sum_i", AGGTYPE_SUM, "i"}};
    auto ctx = do_pivot<t_ctx1, std::int32_t, DTYPE_INT32>(
        t_do_pivot::PIVOT_NON_PKEYED, tbl, cfg);
    auto ctx_tbl = ctx->get_table();
    // auto got =  ctx_tbl->get_scalvec();
    // std::vector<t_tscalar> expected{2_ts, 1_ns, 1_ts, 1_ts, 1_ts, 1_ns};
    // ASSERT_EQ(expected, got);
}

TEST(SCALAR, map_test_1)
{
#define TEST_BODY(DTYPE, CTYPE)                                                \
    {                                                                          \
        typedef std::map<t_tscalar, t_uindex,                                  \
            t_comparator<t_tscalar, (DTYPE)>>                                  \
            map;                                                               \
        auto zero = mktscalar<CTYPE>(0);                                       \
        auto one = mktscalar<CTYPE>(1);                                        \
        const int num_zeros = 45;                                              \
        const int num_ones = 55;                                               \
        map m((t_comparator<t_tscalar, DTYPE>()));                             \
        m[zero] = 1;                                                           \
        m[one] = 1;                                                            \
        for (int idx = 0; idx < num_zeros - 1; ++idx)                          \
        {                                                                      \
            m[zero] = m[zero] + 1;                                             \
        }                                                                      \
        for (int idx = 0; idx < num_ones - 1; ++idx)                           \
        {                                                                      \
            m[one] = m[one] + 1;                                               \
        }                                                                      \
        ASSERT_EQ(m[zero], num_zeros);                                         \
        ASSERT_EQ(m[one], num_ones);                                           \
    }

    TEST_BODY(DTYPE_INT64, std::int64_t);
    TEST_BODY(DTYPE_INT32, std::int32_t);
    TEST_BODY(DTYPE_INT16, std::int16_t);
    TEST_BODY(DTYPE_INT8, std::int8_t);
    TEST_BODY(DTYPE_UINT64, std::uint64_t);
    TEST_BODY(DTYPE_UINT32, std::uint32_t);
    TEST_BODY(DTYPE_UINT16, std::uint16_t);
    TEST_BODY(DTYPE_UINT8, std::uint8_t);
    TEST_BODY(DTYPE_FLOAT64, double);
    TEST_BODY(DTYPE_FLOAT32, float);
    TEST_BODY(DTYPE_BOOL, bool);
#undef TEST_BODY
}

TEST(SCALAR, map_test_2)
{
    typedef std::map<t_tscalar, t_uindex, t_comparator<t_tscalar, DTYPE_STR>>
        map;
    auto zero = mktscalar("a");
    auto one = mktscalar("c");
    const int num_zeros = 45;
    const int num_ones = 55;
    map m((t_comparator<t_tscalar, DTYPE_STR>()));
    m[zero] = 1;
    m[one] = 1;
    for (int idx = 0; idx < num_zeros - 1; ++idx)
    {
        m[zero] = m[zero] + 1;
    }
    for (int idx = 0; idx < num_ones - 1; ++idx)
    {
        m[one] = m[one] + 1;
    }
    ASSERT_EQ(m[zero], num_zeros);
    ASSERT_EQ(m[one], num_ones);
}

TEST(SCALAR, map_test_3)
{
    typedef t_comparator<t_tscalar, DTYPE_STR> t_cmp;
    typedef std::map<t_tscalar, t_uindex, t_cmp> t_map;
    t_map mmap((t_cmp()));
    mmap[""_ns] = 1;
    mmap["x"_ts] = 2;
    mmap["y"_ts] = 3;
    ASSERT_EQ(mmap.size(), 3);
}

TEST(SCALAR, scalar_repr)
{
    EXPECT_EQ(s_none.repr(), "none:v:");
    EXPECT_EQ(mktscalar<std::int64_t>(0).repr(), "i64:v:0");
    EXPECT_EQ(mktscalar<std::int32_t>(0).repr(), "i32:v:0");
    EXPECT_EQ(mktscalar<std::int16_t>(0).repr(), "i16:v:0");
    EXPECT_EQ(mktscalar<std::int8_t>(0).repr(), "i8:v:0");
    EXPECT_EQ(mktscalar<std::uint64_t>(0).repr(), "u64:v:0");
    EXPECT_EQ(mktscalar<std::uint32_t>(0).repr(), "u32:v:0");
    EXPECT_EQ(mktscalar<std::uint16_t>(0).repr(), "u16:v:0");
    EXPECT_EQ(mktscalar<std::uint8_t>(0).repr(), "u8:v:0");
    EXPECT_EQ(mktscalar<double>(0).repr(), "f64:v:0");
    EXPECT_EQ(mktscalar<float>(0).repr(), "f32:v:0");
    EXPECT_EQ(mktscalar<t_date>(t_date(0)).repr(), "date:v:0-00-00");
    EXPECT_EQ(
        mktscalar<t_time>(t_time(0)).repr(), "time:v:1970-01-01 00:00:00.000 UTC");
    EXPECT_EQ(mktscalar<const char*>("").repr(), "str:v:");

    EXPECT_EQ(mknull(DTYPE_NONE).repr(), "none:i:null");
    EXPECT_EQ(mknull(DTYPE_INT64).repr(), "i64:i:null");
    EXPECT_EQ(mknull(DTYPE_INT32).repr(), "i32:i:null");
    EXPECT_EQ(mknull(DTYPE_INT16).repr(), "i16:i:null");
    EXPECT_EQ(mknull(DTYPE_INT8).repr(), "i8:i:null");
    EXPECT_EQ(mknull(DTYPE_UINT64).repr(), "u64:i:null");
    EXPECT_EQ(mknull(DTYPE_UINT32).repr(), "u32:i:null");
    EXPECT_EQ(mknull(DTYPE_UINT16).repr(), "u16:i:null");
    EXPECT_EQ(mknull(DTYPE_UINT8).repr(), "u8:i:null");
    EXPECT_EQ(mknull(DTYPE_FLOAT64).repr(), "f64:i:null");
    EXPECT_EQ(mknull(DTYPE_FLOAT32).repr(), "f32:i:null");
    EXPECT_EQ(mknull(DTYPE_DATE).repr(), "date:i:null");
    EXPECT_EQ(mknull(DTYPE_TIME).repr(), "time:i:null");
    EXPECT_EQ(mknull(DTYPE_STR).repr(), "str:i:null");
}

TEST(SCALAR, scalar_str)
{
    EXPECT_TRUE(mktscalar("a") < mktscalar("b"));
    EXPECT_TRUE(mktscalar("a") == mktscalar("a"));
}

TEST(SCALAR, nan_test)
{
    EXPECT_TRUE(
        mktscalar<double>(std::numeric_limits<double>::quiet_NaN())
            .is_nan());
    EXPECT_TRUE(
        mktscalar<float>(std::numeric_limits<double>::quiet_NaN())
            .is_nan());
}

TEST(SCALAR, difference)
{
    EXPECT_EQ(
        mktscalar<double>(42).difference(mknull(DTYPE_FLOAT64)).to_double(),
        42.0);
    EXPECT_EQ(
        mknull(DTYPE_FLOAT64).difference(mktscalar<double>(42)).to_double(),
        -42.0);
}

TEST(SCALAR, none_test)
{
    EXPECT_TRUE(mknone().is_none());
    EXPECT_TRUE(std::all_of(common_dtypes.begin(), common_dtypes.end(),
        [](t_dtype t) { return t == DTYPE_NONE || !mknull(t).is_none(); }));
    EXPECT_TRUE(std::all_of(common_dtypes.begin(), common_dtypes.end(),
        [](t_dtype t) { return t == DTYPE_NONE || !mkclear(t).is_none(); }));
}

TEST(SCALAR, gt_test)
{
    EXPECT_TRUE(mktscalar<std::int64_t>(2) > mktscalar<std::int64_t>(1));
    EXPECT_TRUE(mktscalar<double>(2) > mktscalar<double>(1));
    EXPECT_TRUE(mktscalar<const char*>("b") > mktscalar<const char*>("a"));
}

TEST(SCALAR, gteq_test)
{
    EXPECT_TRUE(mktscalar<std::int64_t>(2) >= mktscalar<std::int64_t>(1));
    EXPECT_TRUE(mktscalar<double>(2) >= mktscalar<double>(1));
    EXPECT_TRUE(mktscalar<const char*>("b") >= mktscalar<const char*>("a"));

    EXPECT_TRUE(mktscalar<std::int64_t>(2) >= mktscalar<std::int64_t>(2));
    EXPECT_TRUE(mktscalar<double>(2) >= mktscalar<double>(2));
    EXPECT_TRUE(mktscalar<const char*>("b") >= mktscalar<const char*>("b"));
}

TEST(SCALAR, lteq_test)
{
    EXPECT_TRUE(mktscalar<std::int64_t>(1) <= mktscalar<std::int64_t>(2));
    EXPECT_TRUE(mktscalar<double>(1) <= mktscalar<double>(2));
    EXPECT_TRUE(mktscalar<const char*>("a") <= mktscalar<const char*>("b"));

    EXPECT_TRUE(mktscalar<std::int64_t>(2) <= mktscalar<std::int64_t>(2));
    EXPECT_TRUE(mktscalar<double>(2) <= mktscalar<double>(2));
    EXPECT_TRUE(mktscalar<const char*>("b") <= mktscalar<const char*>("b"));
}

TEST(SCALAR, is_numeric)
{
    EXPECT_TRUE(std::all_of(numeric_dtypes.begin(), numeric_dtypes.end(),
        [](t_dtype t) { return mknull(t).is_numeric(); }));
    EXPECT_FALSE(mktscalar<const char*>("hello").is_numeric());
    EXPECT_FALSE(s_none.is_numeric());
}

TEST(SCALAR, canonical_test)
{
    EXPECT_TRUE(std::all_of(numeric_dtypes.begin(), numeric_dtypes.end(),
        [](t_dtype t) { return t_tscalar::canonical(t).to_double() == 0; }));
    // TODO
    // EXPECT_EQ(mktscalar<const char*>(""), t_tscalar::canonical(DTYPE_STR));
}

TEST(SCALAR, abs_test)
{
    EXPECT_EQ(mktscalar<std::int64_t>(5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int64_t>(-5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int32_t>(5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int32_t>(-5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int16_t>(5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int16_t>(-5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int8_t>(5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int8_t>(-5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<double>(5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<double>(-5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<float>(5).abs().to_double(), 5);
    EXPECT_EQ(mktscalar<float>(-5).abs().to_double(), 5);
}

TEST(SCALAR, negate)
{
    EXPECT_EQ(mktscalar<std::int64_t>(5).negate().to_double(), -5);
    EXPECT_EQ(mktscalar<std::int64_t>(-5).negate().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int32_t>(5).negate().to_double(), -5);
    EXPECT_EQ(mktscalar<std::int32_t>(-5).negate().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int16_t>(5).negate().to_double(), -5);
    EXPECT_EQ(mktscalar<std::int16_t>(-5).negate().to_double(), 5);
    EXPECT_EQ(mktscalar<std::int8_t>(5).negate().to_double(), -5);
    EXPECT_EQ(mktscalar<std::int8_t>(-5).negate().to_double(), 5);
    EXPECT_EQ(mktscalar<double>(5).negate().to_double(), -5);
    EXPECT_EQ(mktscalar<double>(-5).negate().to_double(), 5);
    EXPECT_EQ(mktscalar<float>(5).negate().to_double(), -5);
    EXPECT_EQ(mktscalar<float>(-5).negate().to_double(), 5);
}

TEST(SCALAR, begins_with)
{
    EXPECT_TRUE(
        mktscalar<const char*>("").begins_with(mktscalar<const char*>("")));
    EXPECT_TRUE(mktscalar<const char*>("abc").begins_with(
        mktscalar<const char*>("ab")));
    EXPECT_FALSE(mktscalar<const char*>("ab").begins_with(
        mktscalar<const char*>("abc")));
    EXPECT_TRUE(mktscalar<const char*>("aBc").begins_with(
        mktscalar<const char*>("Ab")));
    EXPECT_FALSE(s_none.begins_with(mktscalar<const char*>("aBc")));
    EXPECT_FALSE(mktscalar<const char*>("aBc").begins_with(s_none));
}

TEST(SCALAR, ends_with)
{
    EXPECT_TRUE(
        mktscalar<const char*>("").ends_with(mktscalar<const char*>("")));
    EXPECT_TRUE(
        mktscalar<const char*>("abc").ends_with(mktscalar<const char*>("bc")));
    EXPECT_FALSE(
        mktscalar<const char*>("bc").ends_with(mktscalar<const char*>("abc")));
    EXPECT_TRUE(
        mktscalar<const char*>("aBc").ends_with(mktscalar<const char*>("bC")));
    EXPECT_FALSE(s_none.ends_with(mktscalar<const char*>("aBc")));
    EXPECT_FALSE(mktscalar<const char*>("aBc").ends_with(s_none));
}

TEST(SCALAR, contains)
{
    EXPECT_TRUE(
        mktscalar<const char*>("").contains(mktscalar<const char*>("")));
    EXPECT_TRUE(
        mktscalar<const char*>("abc").contains(mktscalar<const char*>("ab")));
    EXPECT_FALSE(
        mktscalar<const char*>("ab").contains(mktscalar<const char*>("abc")));
    EXPECT_TRUE(
        mktscalar<const char*>("aBc").contains(mktscalar<const char*>("Ab")));
    EXPECT_FALSE(s_none.contains(mktscalar<const char*>("aBc")));
    EXPECT_FALSE(mktscalar<const char*>("aBc").contains(s_none));
    EXPECT_TRUE(
        mktscalar<const char*>("aBcd").contains(mktscalar<const char*>("bc")));
}

class BaseTest : public ::testing::Test
{
public:
    using t_tbldata = std::vector<std::vector<t_tscalar>>;
    using t_stepdata = std::pair<t_tbldata, t_tbldata>;
    using t_testdata = std::vector<t_stepdata>;

protected:
    virtual std::shared_ptr<t_data_table> get_step_otable() = 0;

    void
    run(const t_testdata& d)
    {
        for (const auto& sd : d)
        {
            t_data_table itbl(m_ischema, sd.first);
            t_data_table expected_otbl(m_oschema, sd.second);
            m_g->_send_and_process(itbl);
            auto otbl = get_step_otable();
            EXPECT_EQ(*otbl, expected_otbl);
        }
    }

    std::shared_ptr<t_gnode> m_g;
    t_schema m_ischema;
    t_schema m_oschema;
};

template <t_dtype DTYPE_T>
class GNodeTest : public BaseTest
{

public:
    GNodeTest()
    {
        m_ischema = t_schema{
            {"psp_op", "psp_pkey", "x"}, {DTYPE_UINT8, DTYPE_INT64, DTYPE_T}};
        m_oschema = {{"psp_pkey", "x"}, {DTYPE_INT64, DTYPE_T}};
        t_gnode_options options;
        options.m_gnode_type = GNODE_TYPE_PKEYED;
        options.m_port_schema = m_ischema;
        m_g = t_gnode::build(options);
        null = mknull(DTYPE_T);
        clear = mkclear(DTYPE_T);
    }

    virtual std::shared_ptr<t_data_table>
    get_step_otable()
    {
        return m_g->get_sorted_pkeyed_table();
    }

protected:
    t_tscalar null;
    t_tscalar clear;
};

typedef GNodeTest<DTYPE_INT64> I64GnodeTest;

// clang-format off
TEST_F(I64GnodeTest, test_1) {

    t_testdata data{
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{iop, 1_ts, clear}},
            {{1_ts, null}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_2) {

    t_testdata data{
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{dop, 1_ts, null}},
            {}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_3) {

    t_testdata data{
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{iop, 1_ts, null}},
            {{1_ts, 1_ts}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_4) {

    t_testdata data{
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{dop, 1_ts, null},
            {iop, 1_ts, 2_ts}},
            {{1_ts, 2_ts}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_5) {

    t_testdata data{
        {
            {{iop, 1_ts, null}},
            {{1_ts, null}}
        },
        {
            {{iop, 1_ts, null}},
            {{1_ts, null}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_6) {

    t_testdata data{
        {
            {{iop, 1_ts, null}},
            {{1_ts, null}}
        },
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_7) {

    t_testdata data{
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{iop, 1_ts, null}},
            {{1_ts, 1_ts}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_8) {

    t_testdata data{
        {
            {{iop, 1_ts, 1_ts}},
            {{1_ts, 1_ts}}
        },
        {
            {{iop, 1_ts, 2_ts}},
            {{1_ts, 2_ts}}
        }
    };

    run(data);
}

TEST_F(I64GnodeTest, test_9) {

    t_testdata data{
        {
            {{dop, 1_ts, null}},
            {}
        }
    };

    run(data);
}

// clang-format on

#define SELF static_cast<T*>(this)

template <typename T, typename CTX_T>
class CtxTest : public ::testing::Test
{

public:
    using t_tbldata = std::vector<std::vector<t_tscalar>>;
    using t_stepdata = std::pair<t_tbldata, std::vector<t_tscalar>>;
    using t_testdata = std::vector<t_stepdata>;
    CtxTest()
    {
        this->m_ischema = SELF->get_ischema();
        t_gnode_options options;
        options.m_gnode_type = GNODE_TYPE_PKEYED;
        options.m_port_schema = this->m_ischema;
        this->m_g = t_gnode::build(options);
        m_ctx = CTX_T::build(this->m_ischema, SELF->get_config());
        this->m_g->register_context("ctx", m_ctx);
    }

    std::vector<t_tscalar>
    get_data()
    {
        return m_ctx->get_table();
    }

    void
    run(const t_testdata& d)
    {
        for (const auto& sd : d)
        {
            t_data_table itbl(m_ischema, sd.first);
            this->m_g->_send_and_process(itbl);
            EXPECT_EQ(this->m_ctx->get_data(), sd.second);
        }
    }

protected:
    std::shared_ptr<CTX_T> m_ctx;
    t_schema m_ischema;
    std::shared_ptr<t_gnode> m_g;
};

template <typename T>
class Ctx1SumTest : public CtxTest<Ctx1SumTest<T>, t_ctx1>
{
public:
    using t_tbldata = typename CtxTest<Ctx1SumTest<T>, t_ctx1>::t_tbldata;
    using t_stepdata = typename CtxTest<Ctx1SumTest<T>, t_ctx1>::t_stepdata;
    using t_testdata = typename CtxTest<Ctx1SumTest<T>, t_ctx1>::t_testdata;
    t_schema
    get_ischema()
    {
        return t_schema{
            {"psp_op", "psp_pkey", "x"}, {DTYPE_UINT8, DTYPE_INT64, T::dtype}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"sum_x", AGGTYPE_SUM, "x"}};
    }
};

TYPED_TEST_CASE(Ctx1SumTest, tl_numeric_types);

// clang-formant off
TYPED_TEST(Ctx1SumTest, test_1)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{iop, 1_ts, T::clear}},
            {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}} // TODO: correct
    };

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_2)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_0 = T::acc_s(0);
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{dop, 1_ts, T::null}}, {"Grand Aggregate"_ts, acc_0}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_3)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{iop, 1_ts, T::null}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_4)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{dop, 1_ts, T::null}, {iop, 1_ts, T::v2}},
            {"Grand Aggregate"_ts, T::acc_s(2), T::v2, T::acc_s(2)}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_5)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_0 = T::acc_s(0);
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::null}}, {"Grand Aggregate"_ts, acc_0, T::null, acc_0}},
        {{{iop, 2_ts, T::v1}},
            {"Grand Aggregate"_ts, acc_1, T::null, acc_0, T::v1, acc_1}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_6)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_0 = T::acc_s(0);
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::null}}, {"Grand Aggregate"_ts, acc_0, T::null, acc_0}},
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_7)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_1 = T::acc_s(1);

    t_testdata data{
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{iop, 1_ts, T::null}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_8)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_1 = T::acc_s(1);
    auto acc_2 = T::acc_s(2);

    t_testdata data{
        {{{iop, 1_ts, T::v1}}, {"Grand Aggregate"_ts, acc_1, T::v1, acc_1}},
        {{{iop, 1_ts, T::v2}}, {"Grand Aggregate"_ts, acc_2, T::v2, acc_2}}};

    this->run(data);
}

TYPED_TEST(Ctx1SumTest, test_9)
{
    using t_testdata = typename Ctx1SumTest<TypeParam>::t_testdata;
    using T = TypeParam;
    auto acc_1 = T::acc_s(1);

    t_testdata data{{{{dop, 1_ts, i64_null}}, {"Grand Aggregate"_ts, s_none}}};

    this->run(data);
}

// clang-format on

class I64Ctx1CountTest : public CtxTest<I64Ctx1CountTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"sum_x", AGGTYPE_SUM, "x"}};
    }
};

// clang-formant off
TEST_F(I64Ctx1CountTest, test_1)
{

    t_testdata data{
        {{{iop, 1_ts, 1_ts, 1_ts}}, {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts}},
        {{{iop, 1_ts, 1_ts, 1_ts}}, {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts}},
        {{{iop, 2_ts, 1_ts, 1_ts}}, {"Grand Aggregate"_ts, 2_ts, 1_ts, 2_ts}},
        {{{dop, 2_ts, 1_ts, 1_ts}}, {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts}},
        {{{dop, 1_ts, 1_ts, 1_ts}}, {"Grand Aggregate"_ts, 0_ts}}};

    run(data);
}

class F64Ctx1MeanTest : public CtxTest<F64Ctx1MeanTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"mean_x", AGGTYPE_MEAN, "y"}};
    }
};

TEST_F(F64Ctx1MeanTest, test_1)
{
    t_testdata data{{{},
        {"Grand Aggregate"_ts, s_none}}};

    run(data);
}

TEST_F(F64Ctx1MeanTest, test_2)
{
    t_testdata data{{{{iop, 1_ts, 1_ts, 3_ts}, {iop, 2_ts, 1_ts, 5_ts},
                         {iop, 3_ts, 1_ts, 4_ts}},
        // TODO Fix
        {"Grand Aggregate"_ts, 4._ts, 1_ts, 4._ts}}};

    run(data);
}

TEST_F(F64Ctx1MeanTest, test_3)
{
    t_testdata data{{{{iop, 1_ts, 1_ts, 3_ts}, {iop, 2_ts, 1_ts, i64_null},
                         {iop, 3_ts, 1_ts, 4_ts}},
        // TODO Fix
        {"Grand Aggregate"_ts, 3.5_ts, 1_ts, 3.5_ts}}};

    run(data);
}
// clang-format on

class F64Ctx1UniqueTest : public CtxTest<F64Ctx1UniqueTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"mean_x", AGGTYPE_UNIQUE, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1UniqueTest, test_1) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 3_ts},
            {iop, 2_ts, 1_ts, i64_null},
            {iop, 3_ts, 1_ts, 4_ts}},
            {"Grand Aggregate"_ts, "-"_ts, 1_ts, "-"_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1UniqueTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1UniqueTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 1_ts, 1_ts, i64_null}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts}
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1AnyTest : public CtxTest<F64Ctx1AnyTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"any_y", AGGTYPE_ANY, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1AnyTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1AnyTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1AnyTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}
// clang-format on

class F64Ctx1MedianTest : public CtxTest<F64Ctx1MedianTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"median_y", AGGTYPE_MEDIAN, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1MedianTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1MedianTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1MedianTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 2_ts},
            {iop, 3_ts, 1_ts, 3_ts},
            {iop, 4_ts, 1_ts, 4_ts},
            {iop, 5_ts, 1_ts, 5_ts}},
            {"Grand Aggregate"_ts, 3_ts, 1_ts, 3_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1MedianTest, test_4) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 2_ts}
        },
            {"Grand Aggregate"_ts, 2_ts, 1_ts, 2_ts }
        }
    };

    run(data);
}
// clang-format on

class F64Ctx1JoinTest : public CtxTest<F64Ctx1JoinTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"join_y", AGGTYPE_JOIN, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1JoinTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1JoinTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, "1, 2, "_ts, 1_ts, "1, 2, "_ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1DominantTest : public CtxTest<F64Ctx1DominantTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"dominant_y", AGGTYPE_DOMINANT, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1DominantTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1DominantTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 1_ts},
            {iop, 3_ts, 1_ts, 2_ts},
            {iop, 4_ts, 1_ts, 3_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1DistinctCountTest
    : public CtxTest<F64Ctx1DistinctCountTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{
            {"x"}, {"distinct_count_y", AGGTYPE_DISTINCT_COUNT, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1DistinctCountTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1DistinctCountTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 1_ts},
            {iop, 3_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, mktscalar<std::uint32_t>(2), 1_ts, mktscalar<std::uint32_t>(2) }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1DistinctLeafTest : public CtxTest<F64Ctx1DistinctLeafTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"distinct_leaf_y", AGGTYPE_DISTINCT_LEAF, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1DistinctLeafTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1DistinctLeafTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, s_none, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1DistinctLeafTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, s_none, 1_ts, s_none }
        }
    };

    run(data);
}
// clang-format on

class F64Ctx1PctSumParentTest : public CtxTest<F64Ctx1PctSumParentTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{
            {"x"}, {"pct_sum_parent_test_y", AGGTYPE_PCT_SUM_PARENT, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1PctSumParentTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, 100._ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1PctSumParentTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 100._ts, 1_ts, 100._ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1PctSumParentTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 3_ts, 3_ts, 3_ts}},
            {"Grand Aggregate"_ts, 100._ts, 1_ts, 25._ts, 3_ts, 75._ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1PctSumGrandTotalTest
    : public CtxTest<F64Ctx1PctSumGrandTotalTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{
            {"x"}, {"pct_sum_grand_total_y", AGGTYPE_PCT_SUM_GRAND_TOTAL, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1PctSumGrandTotalTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1PctSumGrandTotalTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 100._ts, 1_ts, 100._ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1PctSumGrandTotalTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 3_ts, 3_ts, 3_ts}},
            {"Grand Aggregate"_ts, 100._ts, 1_ts, 25._ts, 3_ts, 75._ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1WMeanTest : public CtxTest<F64Ctx1WMeanTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"},
            {"wmean_y", AGGTYPE_WEIGHTED_MEAN,
                {{"y", DEPTYPE_COLUMN}, {"x", DEPTYPE_COLUMN}}}};
    }
};

// clang-format off

TEST_F(F64Ctx1WMeanTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1WMeanTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1._ts, 1_ts, 1._ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1WMeanTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 3_ts},
            {iop, 2_ts, 1_ts, 2_ts},
            {iop, 3_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 2._ts, 1_ts, 2._ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1WMeanTest, test_4) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 3_ts},
            {iop, 2_ts, i64_null, 1_ts},
            {iop, 3_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 2._ts, i64_null, s_none, 1_ts, 2._ts }
        }
    };

    run(data);
}

// TODO fix
// https://github.com/deepankarsharma/perspective/issues/20
// TEST_F(F64Ctx1WMeanTest, test_5) {
//     t_testdata data{
//         {
//             {{iop, 1_ts, 1_ts, 3_ts},
//             {iop, 2_ts, 1_ts, i64_null},
//             {iop, 3_ts, 1_ts, 1_ts}},
//             {"Grand Aggregate"_ts, 2._ts, 1_ts, 2._ts }
//         }
//     };

//     run(data);
// }

// clang-format on

class F64Ctx1FirstTest : public CtxTest<F64Ctx1FirstTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y", "z"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"},
            {"first_y", "first_y", AGGTYPE_FIRST,
                {{"y", DEPTYPE_COLUMN}, {"z", DEPTYPE_COLUMN}},
                SORTTYPE_DESCENDING}};
    }
};

// clang-format off

TEST_F(F64Ctx1FirstTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1FirstTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts, 4_ts},
            {iop, 2_ts, 1_ts, 2_ts, 3_ts},
            {iop, 3_ts, 1_ts, 3_ts, 2_ts},
            {iop, 4_ts, 1_ts, 4_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1LastTest : public CtxTest<F64Ctx1LastTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y", "z"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"},
            {"first_y", "first_y", AGGTYPE_LAST,
                {{"y", DEPTYPE_COLUMN}, {"z", DEPTYPE_COLUMN}},
                SORTTYPE_DESCENDING}};
    }
};

// clang-format off

TEST_F(F64Ctx1LastTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1LastTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts, 4_ts},
            {iop, 2_ts, 1_ts, 2_ts, 3_ts},
            {iop, 3_ts, 1_ts, 3_ts, 2_ts},
            {iop, 4_ts, 1_ts, 4_ts, 1_ts}},
            {"Grand Aggregate"_ts, 4_ts, 1_ts, 4_ts }
        }
    };

    run(data);
}
// clang-format on

class F64Ctx1HWMTest : public CtxTest<F64Ctx1HWMTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"hwm_y", AGGTYPE_HIGH_WATER_MARK, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1HWMTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1HWMTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1HWMTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        },
        {
            {{iop, 2_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, 2_ts, 1_ts, 2_ts }
        },
        {
            {{iop, 2_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 2_ts, 1_ts, 2_ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1LWMTest : public CtxTest<F64Ctx1LWMTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"lwm_y", AGGTYPE_LOW_WATER_MARK, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1LWMTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1LWMTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1LWMTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 5_ts}},
            {"Grand Aggregate"_ts, 5_ts, 1_ts, 5_ts }
        },
        {
            {{iop, 2_ts, 1_ts, 3_ts}},
            {"Grand Aggregate"_ts, 3_ts, 1_ts, 3_ts }
        },
        {
            {{iop, 3_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}
// clang-format on

class F64Ctx1AndTest : public CtxTest<F64Ctx1AndTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"and_y", AGGTYPE_AND, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1AndTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none}
        }
    };

    run(data);
}

TEST_F(F64Ctx1AndTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, s_true, 1_ts, s_true }
        }
    };

    run(data);
}

TEST_F(F64Ctx1AndTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 0_ts}},
            {"Grand Aggregate"_ts, s_false, 1_ts, s_false }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1OrTest : public CtxTest<F64Ctx1OrTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"or_y", AGGTYPE_OR, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1OrTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none}
        }
    };

    run(data);
}

TEST_F(F64Ctx1OrTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1OrTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, 1_ts, 0_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1OrTest, test_4) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 0_ts},
            {iop, 2_ts, 1_ts, 0_ts}},
            {"Grand Aggregate"_ts, 0_ts, 1_ts, 0_ts }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1LastValueTest : public CtxTest<F64Ctx1LastValueTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"last_value_y", AGGTYPE_LAST_VALUE, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1LastValueTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1LastValueTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1LastValueTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, 1_ts }
        },
        {
            {{iop, 2_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, 2_ts, 1_ts, 2_ts }
        },
        {
            {{iop, 3_ts, 1_ts, 3_ts}},
            {"Grand Aggregate"_ts, 3_ts, 1_ts, 3_ts }
        },
        {
            {{iop, 2_ts, 1_ts, 2_ts}},
            {"Grand Aggregate"_ts, 2_ts, 1_ts, 2_ts }
        },

    };

    run(data);
}
// clang-format on

class F64Ctx1AbsTest : public CtxTest<F64Ctx1AbsTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"sum_abs_y", AGGTYPE_SUM_ABS, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1AbsTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none }
        }
    };

    run(data);
}

TEST_F(F64Ctx1AbsTest, test_2) {
    auto minus_2 = mktscalar<std::int64_t>(-2);
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1_ts},
            {iop, 2_ts, minus_2, minus_2}},
            {"Grand Aggregate"_ts, 3_ts, minus_2, 2_ts, 1_ts, 1_ts  }
        }
    };

    run(data);
}

// clang-format on

class F64Ctx1SumNotNullTest : public CtxTest<F64Ctx1SumNotNullTest, t_ctx1>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "x", "y"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_INT64, DTYPE_FLOAT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"x"}, {"sum_not_null_y", AGGTYPE_SUM_NOT_NULL, "y"}};
    }
};

// clang-format off

TEST_F(F64Ctx1SumNotNullTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts, s_none}
        }
    };

    run(data);
}

TEST_F(F64Ctx1SumNotNullTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1._ts}},
            {"Grand Aggregate"_ts, 1._ts, 1_ts, 1._ts }
        }
    };

    run(data);
}

TEST_F(F64Ctx1SumNotNullTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, 1_ts, 1._ts},
            {iop, 2_ts, 1_ts, s_nan64}},
            {"Grand Aggregate"_ts, 1._ts, 1_ts, 1._ts }
        }
    };

    run(data);
}

// clang-format on

class I64Ctx2SumTest : public CtxTest<I64Ctx2SumTest, t_ctx2>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "a", "b", "x"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_STR, DTYPE_STR, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"a"}, {"b"}, {{"sum_x", AGGTYPE_SUM, "x"}},
            TOTALS_HIDDEN, FILTER_OP_AND, {}};
    }
};

// clang-format off
TEST_F(I64Ctx2SumTest, test_1) {
    t_testdata data{
        {
            {},
            {"Grand Aggregate"_ts}
        }
    };

    run(data);
}

TEST_F(I64Ctx2SumTest, test_2) {
    t_testdata data{
        {
            {{iop, 1_ts, "0"_ts, "0"_ts, 0_ts},
            {iop, 2_ts, "0"_ts, "1"_ts, 0_ts},
            {iop, 3_ts, "1"_ts, "0"_ts, 0_ts},
            {iop, 4_ts, "1"_ts, "1"_ts, 1_ts}},
            {"Grand Aggregate"_ts, 0_ts, 1_ts, "0"_ts, 0_ts, 0_ts, "1"_ts, 0_ts, 1_ts}
        }
    };

    run(data);
}

TEST_F(I64Ctx2SumTest, test_3) {
    t_testdata data{
        {
            {{iop, 1_ts, "0"_ts, "0"_ts, 0_ts},
            {iop, 2_ts, "0"_ts, "1"_ts, 0_ts},
            {iop, 3_ts, "1"_ts, "0"_ts, 0_ts},
            {iop, 4_ts, "1"_ts, "1"_ts, 1_ts}},
            {"Grand Aggregate"_ts, 0_ts, 1_ts, "0"_ts, 0_ts, 0_ts, "1"_ts, 0_ts, 1_ts}
        },
        {
            {{iop, 1_ts, "0"_ts, "0"_ts, 0_ts},
            {iop, 2_ts, "0"_ts, "1"_ts, 1_ts},
            {iop, 3_ts, "1"_ts, "0"_ts, 1_ts},
            {iop, 4_ts, "1"_ts, "1"_ts, 0_ts}},
            {"Grand Aggregate"_ts, 1_ts, 1_ts, "0"_ts, 0_ts, 1_ts, "1"_ts, 1_ts, 0_ts}
        }
    };

    run(data);
}

// clang-format on

class Ctx0Test : public CtxTest<Ctx0Test, t_ctx0>
{
public:
    t_schema
    get_ischema()
    {
        return t_schema{{"psp_op", "psp_pkey", "a", "b", "c"},
            {DTYPE_UINT8, DTYPE_INT64, DTYPE_STR, DTYPE_STR, DTYPE_INT64}};
    }

    t_config
    get_config()
    {
        return t_config{{"a", "b", "c"}, FILTER_OP_AND, {}};
    }
};

// clang-format off

TEST_F(Ctx0Test, test_1) {
    t_testdata data{
        {
            {},
            {}
        }
    };

    run(data);
}

TEST_F(Ctx0Test, test_2) {
    t_testdata data{
        {
            {{iop, 0_ts, "0"_ts, "0"_ts, 0_ts},
            {iop, 1_ts, "1"_ts, "1"_ts, 1_ts},
            {iop, 2_ts, "2"_ts, "2"_ts, 2_ts},
            {iop, 3_ts, "3"_ts, "3"_ts, 3_ts}},
            {
                "0"_ts, "0"_ts, 0_ts,
                "1"_ts, "1"_ts, 1_ts,
                "2"_ts, "2"_ts, 2_ts,
                "3"_ts, "3"_ts, 3_ts
            }
        }
    };

    run(data);
}

TEST_F(Ctx0Test, test_3) {
    t_testdata data{
        {
            {{iop, 0_ts, "0"_ts, "0"_ts, 0_ts},
            {iop, 1_ts, "1"_ts, "1"_ts, 1_ts}},
            {
                "0"_ts, "0"_ts, 0_ts,
                "1"_ts, "1"_ts, 1_ts,
            }
        },
        {
            {{iop, 2_ts, "2"_ts, "2"_ts, 2_ts},
            {iop, 3_ts, "3"_ts, "3"_ts, 3_ts}},
            {
                "0"_ts, "0"_ts, 0_ts,
                "1"_ts, "1"_ts, 1_ts,
                "2"_ts, "2"_ts, 2_ts,
                "3"_ts, "3"_ts, 3_ts
            }
        }
    };

    run(data);
}
// clang-format on

TEST(IS_FLOATING_POINT, test_1)
{
    EXPECT_TRUE(perspective::is_floating_point(DTYPE_FLOAT64));
    EXPECT_TRUE(perspective::is_floating_point(DTYPE_FLOAT32));
    EXPECT_FALSE(perspective::is_floating_point(DTYPE_INT64));
    EXPECT_FALSE(perspective::is_floating_point(DTYPE_INT32));
    EXPECT_FALSE(perspective::is_floating_point(DTYPE_INT16));
    EXPECT_FALSE(perspective::is_floating_point(DTYPE_INT8));
}

TEST(TYPE_TO_DTYPE, test_time)
{
    EXPECT_EQ(type_to_dtype<t_time>(), DTYPE_TIME);
    EXPECT_EQ(type_to_dtype<t_date>(), DTYPE_DATE);
    EXPECT_EQ(type_to_dtype<std::string>(), DTYPE_STR);
}

TEST(GNODE_TEST, get_registered_contexts)
{
    t_schema sch{{"psp_op", "psp_pkey", "s", "i"},
        {DTYPE_UINT8, DTYPE_INT64, DTYPE_STR, DTYPE_INT64}};
    t_gnode_options options;
    options.m_gnode_type = GNODE_TYPE_PKEYED;
    options.m_port_schema = sch;
    auto gn = t_gnode::build(options);

    auto ctx0 = t_ctx0::build(sch, t_config{{"s"}});
    auto ctx1 = t_ctx1::build(sch, t_config({"s"}, {AGGTYPE_SUM, "i"}));
    auto ctx2
        = t_ctx2::build(sch, t_config({"s"}, {"i"}, {{AGGTYPE_SUM, "i"}}));

    gn->register_context("ctx0", ctx0);
    gn->register_context("ctx1", ctx1);
    gn->register_context("ctx2", ctx2);

    auto step = [&gn, &sch](const std::vector<std::vector<t_tscalar>>& data) {
        t_data_table tbl(sch, data);
        gn->_send_and_process(tbl);
    };

    step({
        {iop, 1_ts, "a"_ts, 1_ts},
        {iop, 2_ts, "b"_ts, 2_ts},
    });

    EXPECT_EQ(gn->get_registered_contexts().size(), 3);
    EXPECT_EQ(gn->get_contexts_last_updated().size(), 3);

    auto recipe = gn->get_recipe();
    auto gn2 = t_gnode(recipe);

    EXPECT_TRUE(gn->was_updated());

    auto pkeys = gn->get_pkeys();
    std::sort(pkeys.begin(), pkeys.end());
    std::vector<t_tscalar> expected_pkeys{1_ts, 2_ts};
    EXPECT_EQ(pkeys, expected_pkeys);

    EXPECT_EQ(gn->get_table()->size(), 2);

    step({
        {iop, 1_ts, "a"_ts, 2_ts},
        {iop, 2_ts, "b"_ts, 4_ts},
    });

    auto ctx0_delta = ctx0->get_step_delta(0, ctx0->get_row_count());
    auto ctx1_delta = ctx1->get_step_delta(0, ctx1->get_row_count());
    auto ctx2_delta = ctx2->get_step_delta(0, ctx2->get_row_count());

    auto ctx0_pkeys = ctx0->get_pkeys({{0, 0}});
    std::vector<t_tscalar> expected_ctx0_pkeys{1_ts};
    EXPECT_EQ(ctx0_pkeys, expected_ctx0_pkeys);

    ctx0->sort_by(std::vector<t_sortspec>{{"i", 0, SORTTYPE_DESCENDING}});
    EXPECT_EQ(ctx0->get_cell_data({{0, 0}}), std::vector<t_tscalar>{"b"_ts});

    auto trees = gn->get_trees();
    std::shared_ptr<t_data_table> pkeyed_table(gn->_get_pkeyed_table());
    EXPECT_EQ(gn->get_custom_columns().size(), 0);
    gn->_unregister_context("ctx0");
    gn->_unregister_context("ctx1");
    gn->_unregister_context("ctx2");
    EXPECT_EQ(gn->get_registered_contexts().size(), 0);

    gn->reset();
}
