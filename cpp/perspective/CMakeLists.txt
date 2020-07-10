cmake_minimum_required(VERSION 3.7.2)
project(psp)

set(CMAKE_BUILD_TYPE "Release")

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT DEFINED PSP_CMAKE_MODULE_PATH)
	set(PSP_CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/../../cmake/")
endif()
set(CMAKE_MODULE_PATH "${PSP_CMAKE_MODULE_PATH}/modules" ${CMAKE_MODULE_PATH})

set(PSP_ARROW_VERSION 0.15.1)
if(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
	set(WIN32 ON)
    set(MACOS OFF)
    set(LINUX OFF)
elseif(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    set(WIN32 OFF)
    set(MACOS ON)
    set(LINUX OFF)
else()
    set(WIN32 OFF)
    set(MACOS OFF)
    set(LINUX ON)
endif()


## Helper function
function(string_starts_with str search)
  string(FIND "${str}" "${search}" out)
  if("${out}" EQUAL 0)
    return(true)
  endif()
  return(false)
endfunction()

###############################
# Helper to grab dependencies #
###############################
function (psp_build_dep name cmake_file)
	if(EXISTS ${CMAKE_BINARY_DIR}/${name}-build)
		message(WARNING "${Cyan}Dependency found - not rebuilding - ${CMAKE_BINARY_DIR}/${name}-build${ColorReset}")
	else()
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
	endif()

	if(${name} STREQUAL arrow)
		# Overwrite arrow's CMakeLists with our custom, minimal one
		configure_file(${PSP_CMAKE_MODULE_PATH}/arrow/CMakeLists.txt ${CMAKE_BINARY_DIR}/arrow-src/cpp/ COPYONLY)
		configure_file(${PSP_CMAKE_MODULE_PATH}/arrow/config.h ${CMAKE_BINARY_DIR}/arrow-src/cpp/src/arrow/util/ COPYONLY)
		add_subdirectory(${CMAKE_BINARY_DIR}/arrow-src/cpp/
			${CMAKE_BINARY_DIR}/arrow-build
			EXCLUDE_FROM_ALL)

		include_directories(${CMAKE_BINARY_DIR}/arrow-src/cpp/src/)
	else()
		add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
			${CMAKE_BINARY_DIR}/${name}-build
			EXCLUDE_FROM_ALL)

		include_directories(${CMAKE_BINARY_DIR}/${name}-src/extras/${name}/include)
		include_directories(${CMAKE_BINARY_DIR}/${name}-src/include)
		include_directories(${CMAKE_BINARY_DIR}/${name}-src)
	endif()
endfunction()
##############################


#######################
# BUILD CONFIGURATION #
#######################
find_package(Color)

option(CMAKE_BUILD_TYPE "Release/Debug build" RELEASE)
option(PSP_WASM_BUILD "Build the WebAssembly Project" ON)

if (NOT DEFINED PSP_WASM_BUILD)
	set(PSP_WASM_BUILD ON)
endif()

if(DEFINED ENV{PSP_DEBUG})
	set(CMAKE_BUILD_TYPE DEBUG)
else()
	if (NOT DEFINED CMAKE_BUILD_TYPE)
		set(CMAKE_BUILD_TYPE RELEASE)
	endif()
endif()

set(BUILD_MESSAGE "")
set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building WASM binding${ColorReset}")

if(NOT DEFINED PSP_CPP_SRC)
	set(PSP_CPP_SRC "${CMAKE_SOURCE_DIR}")
endif()

string(TOLOWER "${CMAKE_BUILD_TYPE}" CMAKE_BUILD_TYPE_LOWER )
if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
	set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Red}Building DEBUG${ColorReset}")
	add_definitions(-DPSP_DEBUG)
else()
	set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building RELEASE${ColorReset}")
endif()

message(WARNING "${BUILD_MESSAGE}")

#######################
include_directories("${CMAKE_SOURCE_DIR}/src/include")

if(NOT WIN32)
	set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
	set(CMAKE_C_FLAGS_RELEASE "-O3 -DNDEBUG")
endif()

####################
# EMSCRIPTEN BUILD #
####################
execute_process(COMMAND which emcc OUTPUT_VARIABLE EMCC)
execute_process(COMMAND which em++ OUTPUT_VARIABLE EMPP)
string(STRIP ${EMCC} EMCC)
string(STRIP ${EMPP} EMPP)
set(CMAKE_C_COMPILER ${EMCC})
set(CMAKE_CXX_COMPILER ${EMPP})
set(CMAKE_TOOLCHAIN_FILE "$ENV{EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake")
set(CMAKE_AR emar)
set(CMAKE_RANLIB emranlib)
set(CMAKE_EXECUTABLE_SUFFIX ".js")
list(APPEND CMAKE_PREFIX_PATH /usr/local)

# Assumes that Boost includes will be in this folder.
include_directories("/usr/local/include" SYSTEM)

# Include this docker-only directory.
include_directories("/boost_includes")

# Build Rapidjson as it is used in the minimal arrow to be built later.
psp_build_dep("rapidjson" "${PSP_CMAKE_MODULE_PATH}/rapidjson.txt.in")

set(EXTENDED_FLAGS " \
	--bind \
	--source-map-base ./build/ \
	--memory-init-file 0 \
	-Wall \
	-s NO_EXIT_RUNTIME=1 \
	-s NO_FILESYSTEM=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=\"load_perspective\" \
	-s EXPORT_ES6=1 \
	-s MAXIMUM_MEMORY=-1 \
	-s USE_ES6_IMPORT_META=0 \
	-s EXPORTED_FUNCTIONS=\"['_main']\" \
	")

if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
	set(OPT_FLAGS " \
		-O0 \
		-g4 \
		--profiling \
		-s WARN_UNALIGNED=1 \
		-Wcast-align \
		-Wover-aligned \
		-s DISABLE_EXCEPTION_CATCHING=0 \
		-s ASSERTIONS=2 \
		-s DEMANGLE_SUPPORT=1 \
		")
else()
	set(OPT_FLAGS " \
		-O3 \
		-g0 \
		-flto \
		--closure 1 \
		-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
		")
endif()

set(ASYNC_MODE_FLAGS "-s -s BINARYEN_ASYNC_COMPILATION=1 -s WASM=1")

# Build header-only dependencies from external source
psp_build_dep("date" "${PSP_CMAKE_MODULE_PATH}/date.txt.in")
psp_build_dep("hopscotch" "${PSP_CMAKE_MODULE_PATH}/hopscotch.txt.in")
psp_build_dep("ordered-map" "${PSP_CMAKE_MODULE_PATH}/ordered-map.txt.in")

# For WASM build, build minimal arrow from source
# build arrow + dependencies from source for Emscripten and C++
message("${Cyan}Building minimal Apache Arrow${ColorReset}")

psp_build_dep("double-conversion" "${PSP_CMAKE_MODULE_PATH}/double-conversion.txt.in")
psp_build_dep("arrow" "${PSP_CMAKE_MODULE_PATH}/arrow.txt.in")

find_package(Flatbuffers)
if(NOT FLATBUFFERS_FOUND)
	message(FATAL_ERROR"${Red}Flatbuffers could not be located${ColorReset}")
else()
	message("${Cyan}Found Flatbuffers in ${FLATBUFFERS_INCLUDE_DIR}${ColorReset}")
	include_directories( ${FLATBUFFERS_INCLUDE_DIR} )
endif()

#####################

set(CMAKE_C_FLAGS " \
	${CMAKE_C_FLAGS} \
	${EXTENDED_FLAGS} \
	${OPT_FLAGS} \
	")

if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=c++1y")
endif()

set (SOURCE_FILES
	${PSP_CPP_SRC}/src/cpp/aggregate.cpp
	${PSP_CPP_SRC}/src/cpp/aggspec.cpp
	${PSP_CPP_SRC}/src/cpp/arg_sort.cpp
	${PSP_CPP_SRC}/src/cpp/arrow_loader.cpp
	${PSP_CPP_SRC}/src/cpp/arrow_writer.cpp
	${PSP_CPP_SRC}/src/cpp/base.cpp
	${PSP_CPP_SRC}/src/cpp/base_impl_linux.cpp
	${PSP_CPP_SRC}/src/cpp/base_impl_osx.cpp
	${PSP_CPP_SRC}/src/cpp/base_impl_wasm.cpp
	${PSP_CPP_SRC}/src/cpp/base_impl_win.cpp
	${PSP_CPP_SRC}/src/cpp/binding.cpp
	${PSP_CPP_SRC}/src/cpp/build_filter.cpp
	#${PSP_CPP_SRC}/src/cpp/calc_agg_dtype.cpp
	${PSP_CPP_SRC}/src/cpp/column.cpp
	${PSP_CPP_SRC}/src/cpp/comparators.cpp
	${PSP_CPP_SRC}/src/cpp/compat.cpp
	${PSP_CPP_SRC}/src/cpp/compat_impl_linux.cpp
	${PSP_CPP_SRC}/src/cpp/compat_impl_osx.cpp
	${PSP_CPP_SRC}/src/cpp/compat_impl_win.cpp
	${PSP_CPP_SRC}/src/cpp/computed.cpp
	${PSP_CPP_SRC}/src/cpp/computed_column_map.cpp
	${PSP_CPP_SRC}/src/cpp/computed_function.cpp
	${PSP_CPP_SRC}/src/cpp/config.cpp
	${PSP_CPP_SRC}/src/cpp/context_base.cpp
	${PSP_CPP_SRC}/src/cpp/context_grouped_pkey.cpp
	${PSP_CPP_SRC}/src/cpp/context_handle.cpp
	${PSP_CPP_SRC}/src/cpp/context_one.cpp
	${PSP_CPP_SRC}/src/cpp/context_two.cpp
	${PSP_CPP_SRC}/src/cpp/context_zero.cpp
	${PSP_CPP_SRC}/src/cpp/custom_column.cpp
	${PSP_CPP_SRC}/src/cpp/data.cpp
	${PSP_CPP_SRC}/src/cpp/data_slice.cpp
	${PSP_CPP_SRC}/src/cpp/data_table.cpp
	${PSP_CPP_SRC}/src/cpp/date.cpp
	${PSP_CPP_SRC}/src/cpp/dense_nodes.cpp
	${PSP_CPP_SRC}/src/cpp/dense_tree_context.cpp
	${PSP_CPP_SRC}/src/cpp/dense_tree.cpp
	${PSP_CPP_SRC}/src/cpp/dependency.cpp
	${PSP_CPP_SRC}/src/cpp/extract_aggregate.cpp
	${PSP_CPP_SRC}/src/cpp/filter.cpp
	${PSP_CPP_SRC}/src/cpp/flat_traversal.cpp
	${PSP_CPP_SRC}/src/cpp/get_data_extents.cpp
	${PSP_CPP_SRC}/src/cpp/gnode.cpp
	${PSP_CPP_SRC}/src/cpp/gnode_state.cpp
	${PSP_CPP_SRC}/src/cpp/histogram.cpp
	${PSP_CPP_SRC}/src/cpp/logtime.cpp
	${PSP_CPP_SRC}/src/cpp/mask.cpp
	${PSP_CPP_SRC}/src/cpp/min_max.cpp
	${PSP_CPP_SRC}/src/cpp/multi_sort.cpp
	${PSP_CPP_SRC}/src/cpp/none.cpp
	${PSP_CPP_SRC}/src/cpp/path.cpp
	${PSP_CPP_SRC}/src/cpp/pivot.cpp
	${PSP_CPP_SRC}/src/cpp/pool.cpp
	${PSP_CPP_SRC}/src/cpp/port.cpp
	${PSP_CPP_SRC}/src/cpp/process_state.cpp
	${PSP_CPP_SRC}/src/cpp/raii.cpp
	${PSP_CPP_SRC}/src/cpp/raii_impl_linux.cpp
	${PSP_CPP_SRC}/src/cpp/raii_impl_osx.cpp
	${PSP_CPP_SRC}/src/cpp/raii_impl_win.cpp
	${PSP_CPP_SRC}/src/cpp/range.cpp
	${PSP_CPP_SRC}/src/cpp/rlookup.cpp
	${PSP_CPP_SRC}/src/cpp/scalar.cpp
	${PSP_CPP_SRC}/src/cpp/schema_column.cpp
	${PSP_CPP_SRC}/src/cpp/schema.cpp
	${PSP_CPP_SRC}/src/cpp/slice.cpp
	${PSP_CPP_SRC}/src/cpp/sort_specification.cpp
	${PSP_CPP_SRC}/src/cpp/sparse_tree.cpp
	${PSP_CPP_SRC}/src/cpp/sparse_tree_node.cpp
	${PSP_CPP_SRC}/src/cpp/step_delta.cpp
	${PSP_CPP_SRC}/src/cpp/storage.cpp
	${PSP_CPP_SRC}/src/cpp/storage_impl_linux.cpp
	${PSP_CPP_SRC}/src/cpp/storage_impl_osx.cpp
	${PSP_CPP_SRC}/src/cpp/storage_impl_win.cpp
	${PSP_CPP_SRC}/src/cpp/sym_table.cpp
	${PSP_CPP_SRC}/src/cpp/table.cpp
	${PSP_CPP_SRC}/src/cpp/time.cpp
	${PSP_CPP_SRC}/src/cpp/traversal.cpp
	${PSP_CPP_SRC}/src/cpp/traversal_nodes.cpp
	${PSP_CPP_SRC}/src/cpp/tree_context_common.cpp
	${PSP_CPP_SRC}/src/cpp/utils.cpp
	${PSP_CPP_SRC}/src/cpp/update_task.cpp
	${PSP_CPP_SRC}/src/cpp/view.cpp
	${PSP_CPP_SRC}/src/cpp/view_config.cpp
	${PSP_CPP_SRC}/src/cpp/vocab.cpp
	)


if (WIN32)
	set(CMAKE_CXX_FLAGS " /EHsc /MP")
else()
	set(CMAKE_CXX_FLAGS " ${CMAKE_CXX_FLAGS} ${CMAKE_C_FLAGS}")
endif()

add_library(psp ${SOURCE_FILES})
target_compile_definitions(psp PRIVATE PSP_ENABLE_WASM=1)
set_target_properties(psp PROPERTIES COMPILE_FLAGS "${ASYNC_MODE_FLAGS}")
target_link_libraries(psp arrow)

add_executable(perspective.async src/cpp/emscripten.cpp)
target_link_libraries(perspective.async psp "${ASYNC_MODE_FLAGS}")
target_compile_definitions(perspective.async PRIVATE PSP_ENABLE_WASM=1)
set_target_properties(perspective.async PROPERTIES COMPILE_FLAGS "${ASYNC_MODE_FLAGS}")
set_target_properties(perspective.async PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./build/")
set_target_properties(perspective.async PROPERTIES OUTPUT_NAME "psp.async")