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
#include <perspective/raw_types.h>
#include <perspective/exports.h>
#include <cstdint>

namespace perspective {

enum t_trace_type {
    TRACE_TYPE_DURATION_ONE_SIDED_END,
    TRACE_TYPE_DURATION_ONE_SIDED_BEGIN,
    TRACE_TYPE_DURATION_TWO_SIDED,
    TRACE_TYPE_INSTANT
};

#pragma pack(push)
#pragma pack(1)
struct t_instrec {
    int64_t m_time;
    uint64_t m_id : 48;
    uint8_t m_trace_type;

    union {
        struct {
            char m_payload[23];
        } t_fixed_len;

        struct {
            uint64_t m_duration;
            uint16_t m_depth;
            char m_payload[13];

        } t_fntrace;
    };
};
#pragma pack(pop)

struct t_trace {
    t_trace();
    ~t_trace();
    void write_record(t_trace_type ttype) const;
};

} // end namespace perspective
