include(CheckCCompilerFlag)

set(CMAKE_SHARED_LIBRARY_SUFFIX .so)

if(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    check_c_compiler_flag("-arch x86_64" x86_64Supported)
    check_c_compiler_flag("-arch arm64" arm64Supported)

    if(x86_64Supported AND arm64Supported)
        set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64" CACHE STRING "Build universal architecture for OSX" FORCE)
    elseif(x86_64Supported)
        set(CMAKE_REQUIRED_LINK_OPTIONS "-arch;x86_64")
        set(CMAKE_OSX_ARCHITECTURES "x86_64" CACHE STRING "Build universal architecture for OSX" FORCE)
    elseif(arm64Supported)
        set(CMAKE_REQUIRED_LINK_OPTIONS "-arch;arm64")
        set(CMAKE_OSX_ARCHITECTURES "arm64" CACHE STRING "Build universal architecture for OSX" FORCE)
    endif()
endif()

set(ARROW_SRCS

    # Base
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/array_base.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/array_binary.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/array_decimal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/array_dict.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/array_nested.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/array_primitive.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_adaptive.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_base.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_binary.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_decimal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_dict.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_nested.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_primitive.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/builder_union.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/concatenate.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/data.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/diff.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/util.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/array/validate.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/builder.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/buffer.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/chunked_array.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/chunk_resolver.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compare.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/config.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/datum.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/device.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/extension_type.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/memory_pool.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/pretty_print.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/record_batch.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/result.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/scalar.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/sparse_tensor.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/status.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/table.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/table_builder.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor/coo_converter.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor/csf_converter.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor/csx_converter.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/type.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/visitor.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/c/bridge.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/buffered.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/caching.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/compressed.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/file.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/interfaces.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/memory.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/slow.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/stdio.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/transform.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/async_util.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/basic_decimal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bit_block_counter.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bit_run_reader.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bit_util.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bitmap.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bitmap_builders.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bitmap_ops.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/bpacking.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/byte_size.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/cancel.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/compression.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/counting_semaphore.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/cpu_info.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/debug.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/decimal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/delimiting.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/formatting.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/future.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/int_util.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/io_util.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/logging.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/key_value_metadata.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/memory.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/mutex.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/string.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/string_builder.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/task_group.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/tdigest.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/thread_pool.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/time.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/tracing.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/trie.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/unreachable.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/uri.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/utf8.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/value_parsing.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/base64.cpp
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/datetime/tz.cpp
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/bignum.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/double-conversion.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/bignum-dtoa.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/fast-dtoa.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/cached-powers.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/fixed-dtoa.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/diy-fp.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/strtod.cc

    # CSV
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/converter.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/chunker.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/column_builder.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/column_decoder.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/options.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/parser.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/reader.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/csv/writer.cc

    # IPC
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/dictionary.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/feather.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/message.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/metadata_internal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/options.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/reader.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/writer.cc

    # Compute
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/api_aggregate.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/api_scalar.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/api_vector.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/cast.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/aggregate_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/exec_plan.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/expression.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/filter_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/project_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/source_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/sink_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/order_by_impl.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/function.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/function_internal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernel.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/registry.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/aggregate_basic.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/aggregate_mode.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/aggregate_quantile.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/aggregate_tdigest.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/aggregate_var_std.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/codegen_internal.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/hash_aggregate.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_arithmetic.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_boolean.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_boolean.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_dictionary.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_internal.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_nested.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_numeric.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_string.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_cast_temporal.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_compare.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_nested.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_set_lookup.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_string.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_temporal_binary.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_temporal_unary.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_validity.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/scalar_if_else.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/util_internal.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/vector_array_sort.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/vector_hash.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/vector_nested.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/vector_replace.cc
    ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/vector_selection.cc

    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/vector_sort.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/kernels/row_encoder.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/union_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/key_hash.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/key_map.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/key_compare.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/key_encode.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/util.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/hash_join_dict.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/hash_join.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/hash_join_node.cc
    # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/compute/exec/task_util.cc
)

if(PSP_PYTHON_BUILD)
    set(ARROW_SRCS
        ${ARROW_SRCS}
        ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/io/file.cc
        ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor/coo_converter.cc
        ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor/csf_converter.cc
        ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/tensor/csx_converter.cc

        # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/time.cc
        # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/bignum-dtoa.cc
        # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/fast-dtoa.cc
        # ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/double-conversion/fixed-dtoa.cc
    )

    if(WIN32)
        set(ARROW_SRCS
            ${ARROW_SRCS}
            ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/vendored/musl/strptime.c)
    endif()
endif()

set_property(SOURCE util/io_util.cc
    APPEND_STRING
    PROPERTY COMPILE_FLAGS " -Wno-unused-macros -stdlib=libc++")

# # make clean will delete the generated file
# set_source_files_properties(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/Message_generated.h PROPERTIES GENERATED TRUE)
# set_source_files_properties(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/File_generated.h PROPERTIES GENERATED TRUE)
# set_source_files_properties(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/Schema_generated.h PROPERTIES GENERATED TRUE)
# set_source_files_properties(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/Tensor_generated.h PROPERTIES GENERATED TRUE)
# set_source_files_properties(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/SparseTensor_generated.h PROPERTIES GENERATED TRUE)
# set_source_files_properties(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/feather_generated.h PROPERTIES GENERATED TRUE)

# set(FBS_OUTPUT_FILES
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/Message_generated.h
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/File_generated.h
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/Schema_generated.h
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/Tensor_generated.h
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/SparseTensor_generated.h
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/feather_generated.h)

# set(FBS_SRC
# ${CMAKE_BINARY_DIR}/arrow-src/format/Message.fbs
# ${CMAKE_BINARY_DIR}/arrow-src/format/File.fbs
# ${CMAKE_BINARY_DIR}/arrow-src/format/Schema.fbs
# ${CMAKE_BINARY_DIR}/arrow-src/format/Tensor.fbs
# ${CMAKE_BINARY_DIR}/arrow-src/format/SparseTensor.fbs
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/feather.fbs)
include_directories(src)

# Build Arrow as a static library
set(ARROW_BUILD_STATIC ON)

if(PSP_WASM_BUILD)
    set(CMAKE_POSITION_INDEPENDENT_CODE OFF)
elseif(PSP_CPP_BUILD OR PSP_PYTHON_BUILD)
    set(CMAKE_POSITION_INDEPENDENT_CODE ON)
endif()

add_library(arrow STATIC ${ARROW_SRCS})

target_compile_definitions(arrow PUBLIC ARROW_NO_DEPRECATED_API)
target_compile_definitions(arrow PUBLIC ARROW_STATIC)

# will need built boost filesystem and system .lib to work, even though
# perspective itself does not use those dependencies
target_link_libraries(arrow
    ${double-conversion_LIBRARIES}
    ${Boost_FILESYSTEM_LIBRARY}
    ${Boost_SYSTEM_LIBRARY}
    ${ARROW_TEST_LINK_TOOLCHAIN})

# find_package(Flatbuffers)

# add_custom_command(OUTPUT ${FBS_OUTPUT_FILES}
# COMMAND ${FLATBUFFERS_COMPILER}
# -c
# -o
# ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/ipc/
# ${FBS_SRC}
# DEPENDS ${FLATBUFFERS_COMPILER}
# COMMENT "Running flatc compiler on ${FBS_SRC}"
# VERBATIM)
add_custom_target(arrow_fb_files DEPENDS ${FBS_OUTPUT_FILES})
add_dependencies(arrow arrow_fb_files)
