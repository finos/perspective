cmake_minimum_required (VERSION 2.8)
project (psp)
add_definitions(-DPSP_ENABLE_PYTHON)

set(CMAKE_C_COMPILER gcc)
set(CMAKE_CXX_COMPILER g++)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_AR ar)
set(CMAKE_RANLIB ranlib)
set(CMAKE_EXECUTABLE_SUFFIX ".exe")
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake/modules/")

list(APPEND CMAKE_PREFIX_PATH /usr/local)

include_directories("${CMAKE_SOURCE_DIR}/../../packages/perspective/src/include")
include_directories("${CMAKE_SOURCE_DIR}/perspective/include")
include_directories("/usr/local/include")
include_directories("/usr/local/include/python3.7m")
include_directories("/boost_includes")



find_package( PythonInterp 3.7 REQUIRED )
find_package( PythonLibs 3.7 REQUIRED )
include_directories( ${PYTHON_INCLUDE_DIRS} )
find_package(NumPy)

find_package(TBB)
find_package( Boost COMPONENTS python REQUIRED )
find_library( BOOST_PYTHON boost_python)
find_library( BOOST_NUMPY boost_numpy)
include_directories( ${Boost_INCLUDE_DIR} )

include_directories( ${PYTHON_NUMPY_INCLUDE_DIR})


if(DEFINED ENV{PSP_DEBUG})
    set(OPT_FLAGS "-O0 -g -DPSP_ENABLE_PYTHON")
else()
    set(OPT_FLAGS "-O3 -g -DPSP_ENABLE_PYTHON")
endif()

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${EXTENDED_FLAGS} ${OPT_FLAGS} ")

set (SOURCE_FILES
../../packages/perspective/src/cpp/aggregate.cpp
../../packages/perspective/src/cpp/aggspec.cpp
../../packages/perspective/src/cpp/arg_sort.cpp
../../packages/perspective/src/cpp/base.cpp
../../packages/perspective/src/cpp/base_impl_linux.cpp
../../packages/perspective/src/cpp/base_impl_osx.cpp
../../packages/perspective/src/cpp/base_impl_win.cpp
../../packages/perspective/src/cpp/build_filter.cpp
../../packages/perspective/src/cpp/column.cpp
../../packages/perspective/src/cpp/comparators.cpp
../../packages/perspective/src/cpp/compat.cpp
../../packages/perspective/src/cpp/compat_impl_linux.cpp
../../packages/perspective/src/cpp/compat_impl_osx.cpp
../../packages/perspective/src/cpp/compat_impl_win.cpp
../../packages/perspective/src/cpp/config.cpp
../../packages/perspective/src/cpp/context_base.cpp
../../packages/perspective/src/cpp/context_grouped_pkey.cpp
../../packages/perspective/src/cpp/context_handle.cpp
../../packages/perspective/src/cpp/context_one.cpp
../../packages/perspective/src/cpp/context_two.cpp
../../packages/perspective/src/cpp/context_zero.cpp
../../packages/perspective/src/cpp/custom_column.cpp
../../packages/perspective/src/cpp/date.cpp
../../packages/perspective/src/cpp/dense_nodes.cpp
../../packages/perspective/src/cpp/dense_tree_context.cpp
../../packages/perspective/src/cpp/dense_tree.cpp
../../packages/perspective/src/cpp/dependency.cpp
../../packages/perspective/src/cpp/extract_aggregate.cpp
../../packages/perspective/src/cpp/filter.cpp
../../packages/perspective/src/cpp/flat_traversal.cpp
../../packages/perspective/src/cpp/gnode.cpp
../../packages/perspective/src/cpp/gnode_state.cpp
../../packages/perspective/src/cpp/histogram.cpp
../../packages/perspective/src/cpp/logtime.cpp
../../packages/perspective/src/cpp/mask.cpp
../../packages/perspective/src/cpp/min_max.cpp
../../packages/perspective/src/cpp/multi_sort.cpp
../../packages/perspective/src/cpp/none.cpp
perspective/src/numpy.cpp
../../packages/perspective/src/cpp/path.cpp
../../packages/perspective/src/cpp/pivot.cpp
../../packages/perspective/src/cpp/pool.cpp
../../packages/perspective/src/cpp/port.cpp
../../packages/perspective/src/cpp/raii.cpp
../../packages/perspective/src/cpp/raii_impl_linux.cpp
../../packages/perspective/src/cpp/raii_impl_osx.cpp
../../packages/perspective/src/cpp/raii_impl_win.cpp
../../packages/perspective/src/cpp/range.cpp
../../packages/perspective/src/cpp/rlookup.cpp
../../packages/perspective/src/cpp/scalar.cpp
../../packages/perspective/src/cpp/schema_column.cpp
../../packages/perspective/src/cpp/schema.cpp
../../packages/perspective/src/cpp/slice.cpp
../../packages/perspective/src/cpp/sort_specification.cpp
../../packages/perspective/src/cpp/sparse_tree.cpp
../../packages/perspective/src/cpp/sparse_tree_node.cpp
../../packages/perspective/src/cpp/step_delta.cpp
../../packages/perspective/src/cpp/storage.cpp
../../packages/perspective/src/cpp/storage_impl_linux.cpp
../../packages/perspective/src/cpp/storage_impl_osx.cpp
../../packages/perspective/src/cpp/storage_impl_win.cpp
../../packages/perspective/src/cpp/sym_table.cpp
../../packages/perspective/src/cpp/table.cpp
../../packages/perspective/src/cpp/time.cpp
../../packages/perspective/src/cpp/traversal.cpp
../../packages/perspective/src/cpp/traversal_nodes.cpp
../../packages/perspective/src/cpp/tree_context_common.cpp
../../packages/perspective/src/cpp/utils.cpp
../../packages/perspective/src/cpp/update_task.cpp
../../packages/perspective/src/cpp/vocab.cpp
)

set(CMAKE_CXX_FLAGS " -std=c++0x ${CMAKE_CXX_FLAGS} ${CMAKE_C_FLAGS}")

add_library(psp SHARED ${SOURCE_FILES})
target_link_libraries(psp tbb)
target_link_libraries(psp ${BOOST_PYTHON})
target_link_libraries(psp ${BOOST_NUMPY})
target_link_libraries(psp ${Boost_LIBRARIES} ${PYTHON_LIBRARIES})
add_library(binding SHARED perspective/src/binding.cpp)
target_link_libraries(binding psp)
target_link_libraries(binding tbb)
target_link_libraries(binding ${BOOST_PYTHON})
target_link_libraries(binding ${BOOST_NUMPY})
target_link_libraries(binding ${Boost_LIBRARIES} ${PYTHON_LIBRARIES})
if(APPLE)
    set(CMAKE_SHARED_LIBRARY_SUFFIX ".so")
endif(APPLE)
