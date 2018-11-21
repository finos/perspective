cmake_minimum_required (VERSION 2.8.11)
project (psp)

if (NOT DEFINED PSP_WASM_BUILD)
    set(PSP_WASM_BUILD ON)
endif()

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
include_directories("${CMAKE_SOURCE_DIR}/../src/include")

if (PSP_WASM_BUILD)
	add_definitions(-DPSP_ENABLE_WASM)
	set(CMAKE_C_COMPILER emcc)
	set(CMAKE_CXX_COMPILER em++)
	set(CMAKE_TOOLCHAIN_FILE "$ENV{EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake")
	set(CMAKE_AR emar)
	set(CMAKE_RANLIB emranlib)
	set(CMAKE_EXECUTABLE_SUFFIX ".js")
	list(APPEND CMAKE_PREFIX_PATH /usr/local)
	include_directories("/usr/local/include")
	include_directories("/boost_includes")

	set(EXTENDED_FLAGS " \
		--bind \
		--source-map-base ./build/ \
		--memory-init-file 0 \
		-s NO_EXIT_RUNTIME=1 \
		-s NO_FILESYSTEM=1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s EXPORTED_FUNCTIONS=\"['_main']\" \
	")

	if(DEFINED ENV{PSP_DEBUG})
		set(OPT_FLAGS " \
			-O1 \
			-g4 \
			-s SAFE_HEAP=1 \
			-s DISABLE_EXCEPTION_CATCHING=0 \
			-s ASSERTIONS=2 \
			-s DEMANGLE_SUPPORT=1 \
		")
	else()
		set(OPT_FLAGS " \
			-O3 \
			-g0 \
		")
	endif()

	set(SYNC_MODE_FLAGS "-s ENVIRONMENT=node -s BINARYEN_ASYNC_COMPILATION=0 -s BINARYEN_METHOD='\"native-wasm\"' -s WASM=1")
	set(ASYNC_MODE_FLAGS "-s ENVIRONMENT=worker -s BINARYEN_ASYNC_COMPILATION=1 -s BINARYEN_METHOD='\"native-wasm\"' -s WASM=1")
	set(ASMJS_MODE_FLAGS "-s ENVIRONMENT=worker -s LEGACY_VM_SUPPORT=1 -s BINARYEN_ASYNC_COMPILATION=0 -s BINARYEN_METHOD='\"asmjs\"' -Wno-almost-asm -s WASM=0")
else()
	if(DEFINED ENV{PSP_DEBUG})
		set(OPT_FLAGS " \
			-O1 \
			-g3 \
		")
	else()
		set(OPT_FLAGS " \
			-O3 \
			-g0 \
		")
	endif()
	set(SYNC_MODE_FLAGS "")
	set(ASYNC_MODE_FLAGS "")
	set(ASMJS_MODE_FLAGS "")
endif()

set(CMAKE_C_FLAGS " \
	${CMAKE_C_FLAGS} \
	${EXTENDED_FLAGS} \
	${OPT_FLAGS} \
")

set (SOURCE_FILES
../src/cpp/aggregate.cpp
../src/cpp/aggspec.cpp
../src/cpp/arg_sort.cpp
../src/cpp/base.cpp
../src/cpp/base_impl_linux.cpp
../src/cpp/base_impl_osx.cpp
../src/cpp/base_impl_win.cpp
../src/cpp/build_filter.cpp
#../src/cpp/calc_agg_dtype.cpp
../src/cpp/column.cpp
../src/cpp/comparators.cpp
../src/cpp/compat.cpp
../src/cpp/compat_impl_linux.cpp
../src/cpp/compat_impl_osx.cpp
../src/cpp/compat_impl_win.cpp
../src/cpp/config.cpp
../src/cpp/context_base.cpp
../src/cpp/context_grouped_pkey.cpp
../src/cpp/context_handle.cpp
../src/cpp/context_one.cpp
../src/cpp/context_two.cpp
../src/cpp/context_zero.cpp
../src/cpp/custom_column.cpp
../src/cpp/date.cpp
../src/cpp/dense_nodes.cpp
../src/cpp/dense_tree_context.cpp
../src/cpp/dense_tree.cpp
../src/cpp/dependency.cpp
../src/cpp/extract_aggregate.cpp
../src/cpp/filter.cpp
../src/cpp/flat_traversal.cpp
../src/cpp/gnode.cpp
../src/cpp/gnode_state.cpp
../src/cpp/histogram.cpp
../src/cpp/logtime.cpp
../src/cpp/mask.cpp
../src/cpp/min_max.cpp
../src/cpp/multi_sort.cpp
../src/cpp/none.cpp
../src/cpp/path.cpp
../src/cpp/pivot.cpp
../src/cpp/pool.cpp
../src/cpp/port.cpp
../src/cpp/raii.cpp
../src/cpp/raii_impl_linux.cpp
../src/cpp/raii_impl_osx.cpp
../src/cpp/raii_impl_win.cpp
../src/cpp/range.cpp
../src/cpp/rlookup.cpp
../src/cpp/scalar.cpp
../src/cpp/schema_column.cpp
../src/cpp/schema.cpp
../src/cpp/slice.cpp
../src/cpp/sort_specification.cpp
../src/cpp/sparse_tree.cpp
../src/cpp/sparse_tree_node.cpp
../src/cpp/step_delta.cpp
../src/cpp/storage.cpp
../src/cpp/storage_impl_linux.cpp
../src/cpp/storage_impl_osx.cpp
../src/cpp/storage_impl_win.cpp
../src/cpp/sym_table.cpp
../src/cpp/table.cpp
../src/cpp/time.cpp
../src/cpp/traversal.cpp
../src/cpp/traversal_nodes.cpp
../src/cpp/tree_context_common.cpp
../src/cpp/utils.cpp
../src/cpp/update_task.cpp
../src/cpp/vocab.cpp
)

set(CMAKE_CXX_FLAGS " -std=c++0x ${CMAKE_CXX_FLAGS} ${CMAKE_C_FLAGS}")

add_library(psp ${SOURCE_FILES})
set_target_properties(psp PROPERTIES COMPILE_FLAGS "${ASYNC_MODE_FLAGS}")

if (PSP_WASM_BUILD)
	add_executable(perspective.async ../src/cpp/main.cpp)
	target_link_libraries(perspective.async psp "${ASYNC_MODE_FLAGS}")
	set_target_properties(perspective.async PROPERTIES COMPILE_FLAGS "${ASYNC_MODE_FLAGS}")
	set_target_properties(perspective.async PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./build/")
	set_target_properties(perspective.async PROPERTIES OUTPUT_NAME "psp.async")

	add_executable(perspective.sync ../src/cpp/main.cpp)
	target_link_libraries(perspective.sync psp "${SYNC_MODE_FLAGS}")
	set_target_properties(perspective.sync PROPERTIES COMPILE_FLAGS "${SYNC_MODE_FLAGS}")
	set_target_properties(perspective.sync PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./build/")
	set_target_properties(perspective.sync PROPERTIES OUTPUT_NAME "psp.sync")
	add_dependencies(perspective.sync perspective.async)

	add_executable(perspective.asm ../src/cpp/main.cpp)
	target_link_libraries(perspective.asm psp "${ASMJS_MODE_FLAGS}")
	set_target_properties(perspective.asm PROPERTIES COMPILE_FLAGS "${ASMJS_MODE_FLAGS}")
	set_target_properties(perspective.asm PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./build/")
	set_target_properties(perspective.asm PROPERTIES OUTPUT_NAME "psp.asmjs")
	add_dependencies(perspective.asm perspective.sync)
endif()


function (psp_build_dep name cmake_file)
	configure_file(${cmake_file} ${name}-download/CMakeLists.txt)
	execute_process(COMMAND ${CMAKE_COMMAND} -G "${CMAKE_GENERATOR}" .
			RESULT_VARIABLE result
			WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/${name}-download )
	if(result)
		message(FATAL_ERROR "CMake step for ${name} failed: ${result}")
	endif()
	execute_process(COMMAND ${CMAKE_COMMAND} --build .
			RESULT_VARIABLE result
			WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/${name}-download )
	if(result)
		message(FATAL_ERROR "Build step for ${name} failed: ${result}")
	endif()
	add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
			${CMAKE_BINARY_DIR}/${name}-build
			EXCLUDE_FROM_ALL)
endfunction()

if (NOT PSP_WASM_BUILD)
   ## Build Gtest
   ## Perhaps we need this on windows -> set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
   psp_build_dep("googletest" "GTest.txt.in")
   psp_build_dep("tbb" "TBB.txt.in")
   add_subdirectory(test)
endif()
