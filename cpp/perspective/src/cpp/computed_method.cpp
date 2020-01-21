/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/computed_method.h>

namespace perspective {
namespace computed_method {

// Add

template <>
t_tscalar add_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint8_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint8_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint8_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint8_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint8_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint8_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint8_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint8_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint8_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint8_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint16_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint16_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint16_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint16_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint16_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint16_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint16_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint16_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint16_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint16_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint32_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint32_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint32_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint32_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint32_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint32_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint32_t>() + y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint32_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint32_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint32_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint64_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint64_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint64_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint64_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint64_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint64_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint64_t>() + y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint64_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint64_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint64_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int8_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int8_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int8_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int8_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int8_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int8_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int8_t>() + y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int8_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int8_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int8_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int16_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int16_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int16_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int16_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int16_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int16_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int16_t>() + y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int16_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int16_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int16_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int32_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int32_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int32_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int32_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int32_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int32_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int32_t>() + y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int32_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int32_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int32_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int64_t>() + y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int64_t>() + y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int64_t>() + y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int64_t>() + y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int64_t>() + y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int64_t>() + y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int64_t>() + y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int64_t>() + y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int64_t>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int64_t>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<float>() + y.get<std::uint8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<float>() + y.get<std::uint16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<float>() + y.get<std::uint32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<float>() + y.get<std::uint64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<float>() + y.get<std::int8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<float>() + y.get<std::int16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<float>() + y.get<std::int64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<float>() + y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<float>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<float>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
         default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar add_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<double>() + y.get<std::uint8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<double>() + y.get<std::uint16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<double>() + y.get<std::uint32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<double>() + y.get<std::uint64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<double>() + y.get<std::int8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<double>() + y.get<std::int16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<double>() + y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<double>() + y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<double>() + y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<double>() + y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

t_tscalar add(t_tscalar x, t_tscalar y) {
    t_dtype x_dtype = x.get_dtype();
    t_dtype y_dtype = y.get_dtype();

    switch (x_dtype) {
        case DTYPE_INT64: {
            return add_helper<DTYPE_INT64>(x, y);
        } break;
        case DTYPE_INT32: {
            return add_helper<DTYPE_INT32>(x, y);
        } break;
        case DTYPE_INT16: {
            return add_helper<DTYPE_INT16>(x, y);
        } break;
        case DTYPE_INT8: {
            return add_helper<DTYPE_INT8>(x, y);
        } break;
        case DTYPE_UINT64: {
            return add_helper<DTYPE_UINT64>(x, y);
        } break;
        case DTYPE_UINT32: {
            return add_helper<DTYPE_UINT32>(x, y);
        } break;
        case DTYPE_UINT16: {
            return add_helper<DTYPE_UINT16>(x, y);
        } break;
        case DTYPE_UINT8: {
            return add_helper<DTYPE_UINT8>(x, y);
        } break;
        case DTYPE_FLOAT64: {
            return add_helper<DTYPE_FLOAT64>(x, y);
        } break;
        case DTYPE_FLOAT32: {
            return add_helper<DTYPE_FLOAT32>(x, y);
        } break;
        default: {
            return mknone();
        } break;
    }

    return mknone();
}

// Subtract

template <>
t_tscalar subtract_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint8_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint8_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint8_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint8_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint8_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint8_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint8_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint8_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint8_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint8_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint16_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint16_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint16_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint16_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint16_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint16_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint16_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint16_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint16_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint16_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint32_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint32_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint32_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint32_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint32_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint32_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint32_t>() - y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint32_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint32_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint32_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint64_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint64_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint64_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint64_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint64_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint64_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint64_t>() - y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint64_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint64_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint64_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int8_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int8_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int8_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int8_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int8_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int8_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int8_t>() - y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int8_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int8_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int8_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int16_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int16_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int16_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int16_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int16_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int16_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int16_t>() - y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int16_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int16_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int16_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int32_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int32_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int32_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int32_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int32_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int32_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int32_t>() - y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int32_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int32_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int32_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int64_t>() - y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int64_t>() - y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int64_t>() - y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int64_t>() - y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int64_t>() - y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int64_t>() - y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int64_t>() - y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int64_t>() - y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int64_t>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int64_t>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<float>() - y.get<std::uint8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<float>() - y.get<std::uint16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<float>() - y.get<std::uint32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<float>() - y.get<std::uint64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<float>() - y.get<std::int8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<float>() - y.get<std::int16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<float>() - y.get<std::int64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<float>() - y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<float>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<float>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar subtract_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<double>() - y.get<std::uint8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<double>() - y.get<std::uint16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<double>() - y.get<std::uint32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<double>() - y.get<std::uint64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<double>() - y.get<std::int8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<double>() - y.get<std::int16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<double>() - y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<double>() - y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<double>() - y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<double>() - y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

t_tscalar subtract(t_tscalar x, t_tscalar y) {
    t_dtype x_dtype = x.get_dtype();
    t_dtype y_dtype = y.get_dtype();

    switch (x_dtype) {
        case DTYPE_INT64: {
            return subtract_helper<DTYPE_INT64>(x, y);
        } break;
        case DTYPE_INT32: {
            return subtract_helper<DTYPE_INT32>(x, y);
        } break;
        case DTYPE_INT16: {
            return subtract_helper<DTYPE_INT16>(x, y);
        } break;
        case DTYPE_INT8: {
            return subtract_helper<DTYPE_INT8>(x, y);
        } break;
        case DTYPE_UINT64: {
            return subtract_helper<DTYPE_UINT64>(x, y);
        } break;
        case DTYPE_UINT32: {
            return subtract_helper<DTYPE_UINT32>(x, y);
        } break;
        case DTYPE_UINT16: {
            return subtract_helper<DTYPE_UINT16>(x, y);
        } break;
        case DTYPE_UINT8: {
            return subtract_helper<DTYPE_UINT8>(x, y);
        } break;
        case DTYPE_FLOAT64: {
            return subtract_helper<DTYPE_FLOAT64>(x, y);
        } break;
        case DTYPE_FLOAT32: {
            return subtract_helper<DTYPE_FLOAT32>(x, y);
        } break;
        default: {
            return mknone();
        } break;
    }

    return mknone();
}

// Multiply

template <>
t_tscalar multiply_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint8_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint8_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint8_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint8_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint8_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint8_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint8_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint8_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint8_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint8_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint16_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint16_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint16_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint16_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint16_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint16_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint16_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint16_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint16_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint16_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint32_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint32_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint32_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint32_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint32_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint32_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint32_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint32_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint32_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint32_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::uint64_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::uint64_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::uint64_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::uint64_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::uint64_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::uint64_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::uint64_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::uint64_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::uint64_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::uint64_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int8_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int8_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int8_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int8_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int8_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int8_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int8_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int8_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int8_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int8_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int16_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int16_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int16_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int16_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int16_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int16_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int16_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int16_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int16_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int16_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int32_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int32_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int32_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int32_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int32_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int32_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int32_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int32_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int32_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int32_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<std::int64_t>() * y.get<std::uint8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<std::int64_t>() * y.get<std::uint16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<std::int64_t>() * y.get<std::uint32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<std::int64_t>() * y.get<std::uint64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<std::int64_t>() * y.get<std::int8_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<std::int64_t>() * y.get<std::int16_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<std::int64_t>() * y.get<std::int32_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<std::int64_t>() * y.get<std::int64_t>();
            rval.set(static_cast<std::int64_t>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<std::int64_t>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<std::int64_t>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<float>() * y.get<std::uint8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<float>() * y.get<std::uint16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<float>() * y.get<std::uint32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<float>() * y.get<std::uint64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<float>() * y.get<std::int8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<float>() * y.get<std::int16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<float>() * y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<float>() * y.get<std::int64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<float>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<float>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

template <>
t_tscalar multiply_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval;

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto r = x.get<double>() * y.get<std::uint8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT16: {
            auto r = x.get<double>() * y.get<std::uint16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT32: {
            auto r = x.get<double>() * y.get<std::uint32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_UINT64: {
            auto r = x.get<double>() * y.get<std::uint64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT8: {
            auto r = x.get<double>() * y.get<std::int8_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT16: {
            auto r = x.get<double>() * y.get<std::int16_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT32: {
            auto r = x.get<double>() * y.get<std::int32_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_INT64: {
            auto r = x.get<double>() * y.get<std::int64_t>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT32: {
            auto r = x.get<double>() * y.get<float>();
            rval.set(static_cast<double>(r));
        } break;
        case DTYPE_FLOAT64: {
            auto r = x.get<double>() * y.get<double>();
            rval.set(static_cast<double>(r));
        } break;
        default: {
            return mknone();
        } break;
    }

    return rval;
}

t_tscalar multiply(t_tscalar x, t_tscalar y) {
    t_dtype x_dtype = x.get_dtype();
    t_dtype y_dtype = y.get_dtype();

    switch (x_dtype) {
        case DTYPE_UINT8: {
            return multiply_helper<DTYPE_UINT8>(x, y);
        } break;
        case DTYPE_UINT16: {
            return multiply_helper<DTYPE_UINT16>(x, y);
        } break;
        case DTYPE_UINT32: {
            return multiply_helper<DTYPE_UINT32>(x, y);
        } break;
        case DTYPE_UINT64: {
            return multiply_helper<DTYPE_UINT64>(x, y);
        } break;
        case DTYPE_INT8: {
            return multiply_helper<DTYPE_INT8>(x, y);
        } break;
        case DTYPE_INT16: {
            return multiply_helper<DTYPE_INT16>(x, y);
        } break;
        case DTYPE_INT32: {
            return multiply_helper<DTYPE_INT32>(x, y);
        } break;
        case DTYPE_INT64: {
            return multiply_helper<DTYPE_INT64>(x, y);
        } break;
        case DTYPE_FLOAT32: {
            return multiply_helper<DTYPE_FLOAT32>(x, y);
        } break;
        case DTYPE_FLOAT64: {
            return multiply_helper<DTYPE_FLOAT64>(x, y);
        } break;
        default: {
            return mknone();
        } break;
    }

    return mknone();
}

// Divide

template <>
t_tscalar divide_helper<DTYPE_UINT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {        
        case DTYPE_UINT8: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<uint8_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::uint8_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_UINT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::uint16_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_UINT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::uint32_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_UINT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<uint64_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::uint64_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_INT8>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::int8_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_INT16>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::int16_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_INT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::int32_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_INT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<std::int64_t>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

template <>
t_tscalar divide_helper<DTYPE_FLOAT32>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<float>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<float>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<float>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}


template <>
t_tscalar divide_helper<DTYPE_FLOAT64>(t_tscalar x, t_tscalar y) {
    t_tscalar rval = mknone();

    switch (y.get_dtype()) {
        case DTYPE_UINT8: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::uint8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT16: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::uint16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT32: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::uint32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs); 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_UINT64: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::uint64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT8: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::int8_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT16: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::int16_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT32: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::int32_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_INT64: {
            auto lhs = x.get<double>();
            auto rhs = y.get<std::int64_t>();
            if (rhs != 0) {
                auto r = static_cast<double>(lhs) / static_cast<double>(rhs);
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT32: {
            auto lhs = x.get<double>();
            auto rhs = y.get<float>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        case DTYPE_FLOAT64: {
            auto lhs = x.get<double>();
            auto rhs = y.get<double>();
            if (rhs != 0) {
                auto r = lhs / rhs; 
                rval.set(static_cast<double>(r));
            }
        } break;
        default: break;
    }

    return rval;
}

t_tscalar divide(t_tscalar x, t_tscalar y) {
    t_dtype x_dtype = x.get_dtype();
    t_dtype y_dtype = y.get_dtype();

    switch (x_dtype) {
        case DTYPE_UINT8: {
            return divide_helper<DTYPE_UINT8>(x, y);
        } break;
        case DTYPE_UINT16: {
            return divide_helper<DTYPE_UINT16>(x, y);
        } break;
        case DTYPE_UINT32: {
            return divide_helper<DTYPE_UINT32>(x, y);
        } break;
        case DTYPE_UINT64: {
            return divide_helper<DTYPE_UINT64>(x, y);
        } break;
        case DTYPE_INT8: {
            return divide_helper<DTYPE_INT8>(x, y);
        } break;
        case DTYPE_INT16: {
            return divide_helper<DTYPE_INT16>(x, y);
        } break;
        case DTYPE_INT32: {
            return divide_helper<DTYPE_INT32>(x, y);
        } break;
        case DTYPE_INT64: {
            return divide_helper<DTYPE_INT64>(x, y);
        } break;
        case DTYPE_FLOAT32: {
            return divide_helper<DTYPE_FLOAT32>(x, y);
        } break;
        case DTYPE_FLOAT64: {
            return divide_helper<DTYPE_FLOAT64>(x, y);
        } break;
        default: {
            return mknone();
        } break;
    }

    return t_tscalar();
}

} // end namespace computed_method
} // end namespace perspective