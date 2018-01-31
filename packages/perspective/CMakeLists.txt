cmake_minimum_required (VERSION 2.8)
project (psp)
add_definitions(-DPSP_ENABLE_WASM)
set(CMAKE_C_COMPILER emcc)
set(CMAKE_CXX_COMPILER em++)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_TOOLCHAIN_FILE "$ENV{EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake")
set(CMAKE_AR emar)
set(CMAKE_RANLIB emranlib)
set(CMAKE_EXECUTABLE_SUFFIX ".js")

list(APPEND CMAKE_PREFIX_PATH /usr/local)

include_directories("${CMAKE_SOURCE_DIR}/src/include")
include_directories("/usr/local/include")
include_directories("/src/boost_includes")


set(EXTENDED_FLAGS " \
	--bind \
	--memory-init-file 1 \
	-s NO_EXIT_RUNTIME=1 \
	-s NO_FILESYSTEM=1 \
        -s NO_DYNAMIC_EXECUTION=1 \
	-s EXPORTED_FUNCTIONS=\"['_main']\" \
")

if(DEFINED ENV{WASM_OPTIMIZE})
    set(OPT_FLAGS " \
		-O3 \
		-g0 \
		-s ALLOW_MEMORY_GROWTH=1 \
	")
else()
	set(OPT_FLAGS " \
		-Os \
		-g4 \
	    -s SAFE_HEAP=1 \
		-s DISABLE_EXCEPTION_CATCHING=0 \
		-s ALLOW_MEMORY_GROWTH=1 \
	    -s ASSERTIONS=2 \
		-s DEMANGLE_SUPPORT=1 \
	")
endif()

if(DEFINED ENV{WASM_BUILD})
	if(DEFINED ENV{SYNC_BUILD})
		set(MODE_FLAGS "-s BINARYEN_ASYNC_COMPILATION=0 -s BINARYEN_METHOD='\"native-wasm\"' -s WASM=1")
	else()
		set(MODE_FLAGS "-s BINARYEN_ASYNC_COMPILATION=1 -s BINARYEN_METHOD='\"native-wasm\"' -s WASM=1")
	endif()
else()
	set(MODE_FLAGS "-s BINARYEN_ASYNC_COMPILATION=0 -s BINARYEN_METHOD='\"asmjs\"' -Wno-almost-asm")
endif()

set(CMAKE_C_FLAGS " \
	${CMAKE_C_FLAGS} \
	${EXTENDED_FLAGS} \
	${OPT_FLAGS} \
	${MODE_FLAGS} \
")

set(CMAKE_CXX_FLAGS " -std=c++0x ${CMAKE_CXX_FLAGS} ${CMAKE_C_FLAGS}")

set (SOURCE_FILES
src/cpp/aggregate.cpp
src/cpp/aggspec.cpp
src/cpp/arg_sort.cpp
src/cpp/base.cpp
src/cpp/base_impl_linux.cpp
src/cpp/base_impl_win.cpp
src/cpp/build_filter.cpp
src/cpp/calc_agg_dtype.cpp
src/cpp/column.cpp
src/cpp/comparators.cpp
src/cpp/compat.cpp
src/cpp/compat_impl_linux.cpp
src/cpp/compat_impl_win.cpp
src/cpp/config.cpp
src/cpp/context_base.cpp
src/cpp/context_grouped_pkey.cpp
src/cpp/context_handle.cpp
src/cpp/context_one.cpp
src/cpp/context_two.cpp
src/cpp/context_zero.cpp
src/cpp/custom_column.cpp
src/cpp/date.cpp
src/cpp/dense_nodes.cpp
src/cpp/dense_tree_context.cpp
src/cpp/dense_tree.cpp
src/cpp/dependency.cpp
src/cpp/extract_aggregate.cpp
src/cpp/filter.cpp
src/cpp/flat_traversal.cpp
src/cpp/gnode.cpp
src/cpp/gnode_state.cpp
src/cpp/histogram.cpp
src/cpp/logtime.cpp
src/cpp/main.cpp
src/cpp/mask.cpp
src/cpp/min_max.cpp
src/cpp/multi_sort.cpp
src/cpp/none.cpp
src/cpp/path.cpp
src/cpp/pivot.cpp
src/cpp/pool.cpp
src/cpp/port.cpp
src/cpp/query.cpp
src/cpp/raii.cpp
src/cpp/raii_impl_linux.cpp
src/cpp/raii_impl_win.cpp
src/cpp/range.cpp
src/cpp/rlookup.cpp
src/cpp/scalar.cpp
src/cpp/schema_column.cpp
src/cpp/schema.cpp
src/cpp/slice.cpp
src/cpp/sort_specification.cpp
src/cpp/sparse_tree.cpp
src/cpp/sparse_tree_node.cpp
src/cpp/step_delta.cpp
src/cpp/storage.cpp
src/cpp/storage_impl_linux.cpp
src/cpp/storage_impl_win.cpp
src/cpp/sym_table.cpp
src/cpp/table.cpp
src/cpp/time.cpp
src/cpp/traversal.cpp
src/cpp/traversal_nodes.cpp
src/cpp/tree_context_common.cpp
src/cpp/utils.cpp
src/cpp/update_task.cpp
src/cpp/vocab.cpp
)

add_executable(psp ${SOURCE_FILES})
