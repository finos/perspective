cmake_minimum_required (VERSION 2.8.11)
project (psp)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/../../cmake/modules/" ${CMAKE_MODULE_PATH} )

if(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
	set(WIN32 ON)
endif()

##############################
# helper to grab gtest et al #
##############################
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
	add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
		${CMAKE_BINARY_DIR}/${name}-build
		EXCLUDE_FROM_ALL)

	include_directories(${CMAKE_BINARY_DIR}/${name}-src/extras/${name}/include)
	include_directories(${CMAKE_BINARY_DIR}/${name}-src/include)
	include_directories(${CMAKE_BINARY_DIR}/${name}-src)
endfunction()
##############################


#######################
# BUILD CONFIGURATION #
#######################
find_package(Color)

option(CMAKE_BUILD_TYPE "Release/Debug build" RELEASE)
option(PSP_WASM_BUILD "Build the WebAssembly Project" ON)
option(PSP_CPP_BUILD "Build the C++ Project" OFF)
option(PSP_CPP_BUILD_TESTS "Build the C++ Tests" OFF)
option(PSP_PYTHON_BUILD "Build the Python Bindings" OFF)
option(PSP_CPP_BUILD_STRICT "Build the C++ with strict warnings" OFF)
option(PSP_BUILD_DOCS "Build the Perspective documentation" OFF)


if (NOT DEFINED PSP_WASM_BUILD)
	set(PSP_WASM_BUILD ON)
	set(PSP_CPP_BUILD OFF)
	set(PSP_CPP_BUILD_TESTS OFF)
	set(PSP_PYTHON_BUILD OFF)
endif()

if (PSP_WASM_BUILD AND PSP_CPP_BUILD)
	message(FATAL_ERROR "${Red}CPP and Emscripten builds must be done separately${ColorReset}")
endif()


if(DEFINED ENV{PSP_DEBUG})
	set(CMAKE_BUILD_TYPE DEBUG)
else()
	if (NOT DEFINED CMAKE_BUILD_TYPE)
		set(CMAKE_BUILD_TYPE RELEASE)
	endif()
endif()

if (NOT DEFINED PSP_CPP_BUILD)
	set(PSP_CPP_BUILD ON)
endif()

if (NOT DEFINED PSP_PYTHON_BUILD)
	set(PSP_PYTHON_BUILD OFF)
elseif(PSP_PYTHON_BUILD)
	set(PSP_CPP_BUILD ON)
endif()

if (NOT DEFINED PSP_CPP_BUILD_TESTS)
	set(PSP_CPP_BUILD_TESTS ON)
endif()

if (NOT DEFINED PSP_CPP_BUILD_STRICT)
	set(PSP_CPP_BUILD_STRICT OFF)
endif()

if(PSP_WASM_BUILD)
	message(WARNING "${Cyan}Building WASM binding${ColorReset}")
else()
	message(WARNING "${Cyan}Skipping WASM binding${ColorReset}")
endif()

if(PSP_CPP_BUILD)
	message(WARNING "${Cyan}Building C++ binding${ColorReset}")
else()
	message(WARNING "${Cyan}Skipping C++ binding${ColorReset}")
endif()

if (PSP_PYTHON_BUILD)
	message(WARNING "${Cyan}Building Python binding${ColorReset}")
else()
	message(WARNING "${Cyan}Skipping Python binding${ColorReset}")
endif()

if (PSP_CPP_BUILD_TESTS)
	message(WARNING "${Cyan}Building C++ tests${ColorReset}")
else()
	message(WARNING "${Cyan}Skipping C++ tests${ColorReset}")
endif()

if (PSP_CPP_BUILD AND NOT PSP_CPP_BUILD_STRICT)
	message(WARNING "${Cyan}Building C++ without strict warnings${ColorReset}")
else()
	message(WARNING "${Cyan}Building C++ with strict warnings${ColorReset}")
endif()

string(TOLOWER "${CMAKE_BUILD_TYPE}" CMAKE_BUILD_TYPE_LOWER )
if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
	message(WARNING "${Red}Building DEBUG${ColorReset}")
	add_definitions(-DPSP_DEBUG)
else()
	message(WARNING "${Cyan}Building RELEASE${ColorReset}")
endif()

if(PSP_BUILD_DOCS)
	message(WARNING "${Cyan}Building Perspective Documentation${ColorReset}")
else()
	message(WARNING "${Cyan}Skipping Perspective Documentation${ColorReset}")
endif()
#######################
include_directories("${CMAKE_SOURCE_DIR}/src/include")


if (PSP_WASM_BUILD)
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
	include_directories("/usr/local/include")
	include_directories("/boost_includes")

	set(EXTENDED_FLAGS " \
		--bind \
		--source-map-base ./build/ \
		--memory-init-file 0 \
		-s NO_EXIT_RUNTIME=1 \
		-s NO_FILESYSTEM=1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s MODULARIZE=1 \
		-s EXPORT_NAME=\"load_perspective\" \
		-s EXPORT_ES6=1 \
		-s EXPORTED_FUNCTIONS=\"['_main']\" \
		")

	if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
		set(OPT_FLAGS " \
			-O0 \
			-g4 \
			--profiling \
			-s SAFE_HEAP=1 \
			-s DISABLE_EXCEPTION_CATCHING=0 \
			-s ASSERTIONS=2 \
			-s DEMANGLE_SUPPORT=1 \
			")
	else()
		set(OPT_FLAGS " \
			-O3 \
			-g0 \
			-s WASM_OBJECT_FILES=0 \
			--llvm-lto 3 \
			--closure 1 \
			-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
			")
	endif()

	set(ASYNC_MODE_FLAGS "-s -s BINARYEN_ASYNC_COMPILATION=1 -s WASM=1")
elseif(PSP_CPP_BUILD OR PSP_PYTHON_BUILD)
	#####################
	# VANILLA CPP BUILD #
	#####################
	if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
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

	find_package(Boost)
	if(NOT Boost_FOUND)
		message("${Red}Boost could not be located${ColorReset}")
	else()
		message("${Cyan}Found boost in ${Boost_INCLUDE_DIRS} ${Boost_LIBRARY_DIRS} ${ColorReset}")
	endif()
	include_directories( ${Boost_INCLUDE_DIRS} )

	find_package(TBB)
	if(NOT TBB_FOUND)
		message("${Red}TBB could not be located${ColorReset}")
		psp_build_dep("tbb" "../../cmake/TBB.txt.in")
	else()
		message("${Cyan}Found tbb in ${TBB_INCLUDE_DIRS} ${TBB_LIBRARY_DIRS} ${ColorReset}")
		include_directories( ${TBB_INCLUDE_DIRS} )
	endif()

	if(WIN32)
		foreach(warning 4244 4251 4267 4275 4290 4786 4305 4996)
			SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd${warning}")
		endforeach(warning)
	else()
		include_directories("/usr/local/include")
	endif()

	if(PSP_PYTHON_BUILD)
		#########################
		# PYTHON BINDINGS BUILD #
		#########################
		include_directories("/usr/local/include/python3.7m")  # FIXME
		include_directories("${CMAKE_SOURCE_DIR}/../../python/table/perspective/include")
		find_package( PythonInterp 3.7 REQUIRED )
		find_package( PythonLibs 3.7 REQUIRED )
		include_directories( ${PYTHON_INCLUDE_DIRS} )

		find_package(pybind11)
		if(NOT pybind11_FOUND)
		    message("${Red}PyBind11 could not be located${ColorReset}")
			psp_build_dep("pybind11" "../../cmake/Pybind.txt.in")
		else()
		    message("${Cyan}Found PyBind11 in ${pybind11_INCLUDE_DIRS}${ColorReset}")
		endif()
		include_directories( ${pybind11_INCLUDE_DIRS} )

		find_package(NumPy)
		include_directories( ${PYTHON_NUMPY_INCLUDE_DIR})

		#####################
	endif()
endif()

psp_build_dep("hopscotch" "../../cmake/hopscotch.txt.in")
psp_build_dep("ordered-map" "../../cmake/ordered-map.txt.in")

#####################


set(CMAKE_C_FLAGS " \
	${CMAKE_C_FLAGS} \
	${EXTENDED_FLAGS} \
	${OPT_FLAGS} \
	")

set (SOURCE_FILES
	src/cpp/aggregate.cpp
	src/cpp/aggspec.cpp
	src/cpp/arg_sort.cpp
	src/cpp/base.cpp
	src/cpp/base_impl_linux.cpp
	src/cpp/base_impl_osx.cpp
	src/cpp/base_impl_wasm.cpp
	src/cpp/base_impl_win.cpp
	src/cpp/binding.cpp
	src/cpp/build_filter.cpp
	#src/cpp/calc_agg_dtype.cpp
	src/cpp/column.cpp
	src/cpp/comparators.cpp
	src/cpp/compat.cpp
	src/cpp/compat_impl_linux.cpp
	src/cpp/compat_impl_osx.cpp
	src/cpp/compat_impl_win.cpp
	src/cpp/config.cpp
	src/cpp/context_base.cpp
	src/cpp/context_grouped_pkey.cpp
	src/cpp/context_handle.cpp
	src/cpp/context_one.cpp
	src/cpp/context_two.cpp
	src/cpp/context_zero.cpp
	src/cpp/custom_column.cpp
	src/cpp/data.cpp
	src/cpp/data_slice.cpp
	src/cpp/data_table.cpp
	src/cpp/date.cpp
	src/cpp/dense_nodes.cpp
	src/cpp/dense_tree_context.cpp
	src/cpp/dense_tree.cpp
	src/cpp/dependency.cpp
	src/cpp/extract_aggregate.cpp
	src/cpp/filter.cpp
	src/cpp/flat_traversal.cpp
	src/cpp/get_data_extents.cpp
	src/cpp/gnode.cpp
	src/cpp/gnode_state.cpp
	src/cpp/histogram.cpp
	src/cpp/logtime.cpp
	src/cpp/mask.cpp
	src/cpp/min_max.cpp
	src/cpp/multi_sort.cpp
	src/cpp/none.cpp
	src/cpp/path.cpp
	src/cpp/pivot.cpp
	src/cpp/pool.cpp
	src/cpp/port.cpp
	src/cpp/raii.cpp
	src/cpp/raii_impl_linux.cpp
	src/cpp/raii_impl_osx.cpp
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
	src/cpp/storage_impl_osx.cpp
	src/cpp/storage_impl_win.cpp
	src/cpp/sym_table.cpp
	src/cpp/table.cpp
	src/cpp/time.cpp
	src/cpp/traversal.cpp
	src/cpp/traversal_nodes.cpp
	src/cpp/tree_context_common.cpp
	src/cpp/utils.cpp
	src/cpp/update_task.cpp
	src/cpp/view.cpp
	src/cpp/view_config.cpp
	src/cpp/vocab.cpp
	)

set (PYTHON_SOURCE_FILES
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/accessor.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/context.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/fill.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/python.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/serialization.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/table.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/utils.cpp
	${CMAKE_SOURCE_DIR}/../../python/table/perspective/src/view.cpp
	)

if (WIN32)
	set(CMAKE_CXX_FLAGS " /EHsc")
else()
	set(CMAKE_CXX_FLAGS " -std=c++0x ${CMAKE_CXX_FLAGS} ${CMAKE_C_FLAGS}")
endif()

if (PSP_WASM_BUILD)
	add_library(psp ${SOURCE_FILES})
	target_compile_definitions(psp PRIVATE PSP_ENABLE_WASM=1)
	set_target_properties(psp PROPERTIES COMPILE_FLAGS "${ASYNC_MODE_FLAGS}")

	add_executable(perspective.async src/cpp/emscripten.cpp)
	target_link_libraries(perspective.async psp "${ASYNC_MODE_FLAGS}")
	target_compile_definitions(perspective.async PRIVATE PSP_ENABLE_WASM=1)
	set_target_properties(perspective.async PROPERTIES COMPILE_FLAGS "${ASYNC_MODE_FLAGS}")
	set_target_properties(perspective.async PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./build/")
	set_target_properties(perspective.async PROPERTIES OUTPUT_NAME "psp.async")
elseif(PSP_CPP_BUILD OR PSP_PYTHON_BUILD)
	if(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
		set(CMAKE_SHARED_LIBRARY_SUFFIX .dylib)
	endif()

	if(PSP_PYTHON_BUILD)
		########################
		# Python extra targets #
		########################
		add_library(psp SHARED ${SOURCE_FILES} ${HEADER_FILES})

		target_compile_definitions(psp PRIVATE PSP_ENABLE_PYTHON=1)
		target_link_libraries(psp ${PYTHON_LIBRARIES})
		set(CMAKE_SHARED_LIBRARY_SUFFIX .so)

		add_library(binding SHARED ${PYTHON_SOURCE_FILES})

		target_compile_definitions(binding PRIVATE PSP_ENABLE_PYTHON=1)
		target_compile_options(binding PRIVATE -Wdeprecated-declarations)
		target_link_libraries(binding psp)
		target_link_libraries(binding tbb)
		target_link_libraries(binding ${PYTHON_LIBRARIES})
		########################
	else()
		add_library(psp SHARED ${SOURCE_FILES} ${HEADER_FILES})
	endif()

	if(PSP_CPP_BUILD_STRICT AND NOT WIN32)
		target_compile_options(psp PRIVATE -Wall -Werror)
		target_compile_options(psp PRIVATE $<$<CONFIG:DEBUG>:-fPIC -O0>)
		if(PSP_PYTHON_BUILD)
			target_compile_options(binding PRIVATE $<$<CONFIG:DEBUG>:-fPIC -O0>)
		endif()
	elseif(WIN32)
		target_compile_definitions(psp PRIVATE PERSPECTIVE_EXPORTS=1)
		target_compile_definitions(psp PRIVATE WIN32=1)
	endif()

	target_link_libraries(psp tbb)
	set(CMAKE_LIBRARY_PATH ${CMAKE_LIBRARY_PATH} ${TBB_LIBRARY})
endif()


#############
# CPP TESTS #
#############
if (PSP_CPP_BUILD_TESTS)
	if (WIN32)
	  set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
	endif()
	psp_build_dep("googletest" "../../cmake/GTest.txt.in")

	add_subdirectory(test)
	add_custom_target(gcov
		COMMAND mkdir -p ${CMAKE_BINARY_DIR}/coverage
		WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
	)
	add_custom_command(TARGET gcov
		COMMAND echo "=================== GCOV ===================="
		COMMAND gcovr -r ../ --html --html-details -o coverage/index.html
		COMMAND xdg-open coverage/index.html
		WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
	)
endif()
#############

########
# Docs #
########
if(PSP_BUILD_DOCS)
	add_custom_target(doxygen)
	add_custom_command(TARGET doxygen
	    COMMAND doxygen doxygen.conf
	    WORKING_DIRECTORY ../../docs
	    COMMENT "Build doxygen xml files used by sphinx/breathe."
	)

	add_custom_target(docs-html ALL)
	add_custom_command(TARGET docs-html
		COMMAND sphinx-build -b html . build/html
			WORKING_DIRECTORY ../../docs
			COMMENT "Build html documentation"
		)
	add_dependencies(docs-html doxygen)

	# add_custom_target(docs-markdown ALL)
	# add_custom_command(TARGET docs-html
	# 	COMMAND sphinx-build -M markdown . build/
	# 		WORKING_DIRECTORY ../../docs
	# 		COMMENT "Build markdown documentation"
	# 	)
	# add_dependencies(docs-html doxygen)

endif()
##########
