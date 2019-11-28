cmake_minimum_required(VERSION 3.7.2)
project (psp)

set(CMAKE_BUILD_TYPE "Release")
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
set(CMAKE_C_FLAGS_RELEASE "-O3 -DNDEBUG")

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT DEFINED PSP_CMAKE_MODULE_PATH)
	set(PSP_CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/../../cmake/")
endif()
set(CMAKE_MODULE_PATH "${PSP_CMAKE_MODULE_PATH}/modules" ${CMAKE_MODULE_PATH})

set(PSP_ARROW_VERSION 0.15)
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

	if(${name} STREQUAL arrow)
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
	if(NOT DEFINED PSP_PYTHON_VERSION)
		set(PSP_PYTHON_VERSION 3.7)
	endif()
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

if(NOT DEFINED PSP_CPP_SRC)
	set(PSP_CPP_SRC "${CMAKE_SOURCE_DIR}")
endif()
if(PSP_CPP_BUILD)
	message(WARNING "${Cyan}Building C++ binding${ColorReset}")
else()
	message(WARNING "${Cyan}Skipping C++ binding${ColorReset}")
endif()

if (PSP_PYTHON_BUILD)
	if(NOT DEFINED PSP_PYTHON_SRC)
		set(PSP_PYTHON_SRC "${CMAKE_SOURCE_DIR}/../../python/perspective/perspective")
	endif()
	message(WARNING "${Cyan}Building Python ${Red}${PSP_PYTHON_VERSION}${Cyan} binding${ColorReset}")
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

	include_directories("/usr/local/include" SYSTEM)

    # Include this docker-only directory
	include_directories("/boost_includes")

    # bundle rapidjson for wasm build
	psp_build_dep("rapidjson" "${PSP_CMAKE_MODULE_PATH}/rapidjson.txt.in")

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
			-O0 \
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

	if(PSP_CPP_BUILD)
		# filesystem not required for Python, as we link to prebuilt arrow shared library
		find_package(Boost COMPONENTS filesystem)
		if(NOT Boost_FOUND)
			message("${Red}Boost could not be located${ColorReset}")
		else()
			message("${Cyan}Found boost in ${Boost_INCLUDE_DIRS} ${Boost_LIBRARY_DIRS} ${ColorReset}")
		endif()
		include_directories( ${Boost_INCLUDE_DIRS} )
	endif()

	find_package(TBB)
	if(NOT TBB_FOUND)
		message("${Red}TBB could not be located${ColorReset}")
		psp_build_dep("tbb" "${PSP_CMAKE_MODULE_PATH}/TBB.txt.in")
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
		include_directories("${PSP_PYTHON_SRC}/perspective/include")
		find_package( Python ${PSP_PYTHON_VERSION} REQUIRED Interpreter Development )
		include_directories( ${Python_INCLUDE_DIRS} )

        # already found from before
		find_package(Boost)

		find_package(pybind11)
		if(NOT pybind11_FOUND)
		    message("${Red}PyBind11 could not be located${ColorReset}")
			psp_build_dep("pybind11" "${PSP_CMAKE_MODULE_PATH}/Pybind.txt.in")
		else()
		    message("${Cyan}Found PyBind11 in ${pybind11_INCLUDE_DIRS}${ColorReset}")
		endif()
		include_directories( ${pybind11_INCLUDE_DIRS} )

		find_package(NumPy)
		if(NOT PYTHON_NUMPY_FOUND)
			message(FATAL_ERROR "${Red}Numpy could not be located${ColorReset}")
		else()
			message(WARNING "${Cyan}Numpy found: ${PYTHON_NUMPY_INCLUDE_DIR}${ColorReset}")

		endif()
		include_directories( ${PYTHON_NUMPY_INCLUDE_DIR})

		find_package(PyArrow 0.15 REQUIRED)

		if(NOT PYTHON_PYARROW_FOUND)
			message(FATAL_ERROR "${Red}PyArrow could not be located${ColorReset}")
		else()
			message(WARNING "${Cyan}PyArrow found: ${PYTHON_PYARROW_INCLUDE_DIR}${ColorReset}")
            if (NOT WIN32)
                message(WARNING "${Cyan}Using pre-built ${PYTHON_PYARROW_PYTHON_SHARED_LIBRARY} ${PYTHON_PYARROW_ARROW_SHARED_LIBRARY} from: ${PYTHON_PYARROW_LIBRARY_DIR}${ColorReset}")
			endif()
		endif()
		include_directories(${PYTHON_PYARROW_INCLUDE_DIR})
		link_directories(${PYTHON_PYARROW_LIBRARY_DIR})
		#####################
	endif()
endif()

psp_build_dep("date" "${PSP_CMAKE_MODULE_PATH}/date.txt.in")
psp_build_dep("hopscotch" "${PSP_CMAKE_MODULE_PATH}/hopscotch.txt.in")
psp_build_dep("ordered-map" "${PSP_CMAKE_MODULE_PATH}/ordered-map.txt.in")

# For all non-MacOS and non-linux builds, or if building WASM/CPP, build minimal arrow from source
if (WIN32 OR NOT PSP_PYTHON_BUILD)
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
	${PSP_CPP_SRC}/src/cpp/arrow.cpp
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

set (PYTHON_SOURCE_FILES
	${PSP_PYTHON_SRC}/src/accessor.cpp
	${PSP_PYTHON_SRC}/src/context.cpp
	${PSP_PYTHON_SRC}/src/fill.cpp
	${PSP_PYTHON_SRC}/src/numpy.cpp
	${PSP_PYTHON_SRC}/src/python.cpp
	${PSP_PYTHON_SRC}/src/serialization.cpp
	${PSP_PYTHON_SRC}/src/table.cpp
	${PSP_PYTHON_SRC}/src/utils.cpp
	${PSP_PYTHON_SRC}/src/view.cpp
	)

if (WIN32)
	set(CMAKE_CXX_FLAGS " /EHsc")
else()
	set(CMAKE_CXX_FLAGS " ${CMAKE_CXX_FLAGS} ${CMAKE_C_FLAGS}")
endif()

if (PSP_WASM_BUILD)

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
elseif(PSP_CPP_BUILD OR PSP_PYTHON_BUILD)
    if(NOT WIN32)
		set(CMAKE_SHARED_LIBRARY_SUFFIX .so)
    	
		# Look for the binary using @loader_path (relative to binary location) instead of @rpath
		# and include arrow in @rpath so it can be found by libbinding/libpsp
		set(CMAKE_SKIP_BUILD_RPATH FALSE)
		set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)

        if(MACOS)
			set(CMAKE_MACOSX_RPATH 1)
            set(module_install_rpath "@loader_path/")
	    else()
            set(module_install_rpath "\$ORIGIN")
	    endif()
    endif()

	if(PSP_PYTHON_BUILD)
		########################
		# Python extra targets #
		########################
		add_library(psp SHARED ${SOURCE_FILES} ${HEADER_FILES})
		add_library(binding SHARED ${PYTHON_SOURCE_FILES})

		include_directories(${PSP_PYTHON_SRC}/include)

		target_compile_definitions(psp PRIVATE PSP_ENABLE_PYTHON=1)
		target_compile_definitions(binding PRIVATE PSP_ENABLE_PYTHON=1)
		target_compile_options(binding PRIVATE -Wdeprecated-declarations)

        # Link against libarrow 0.15.0 in pyarrow directory for windows
        if (WIN32)
			target_link_libraries(psp arrow)
			target_link_libraries(binding arrow)
			target_link_libraries(psp ${Boost_FILESYSTEM_LIBRARY})
			target_link_libraries(binding ${Boost_FILESYSTEM_LIBRARY})
		else()
            target_link_libraries(psp ${PYTHON_PYARROW_PYTHON_SHARED_LIBRARY} ${PYTHON_PYARROW_ARROW_SHARED_LIBRARY})
            target_link_libraries(binding ${PYTHON_PYARROW_PYTHON_SHARED_LIBRARY} ${PYTHON_PYARROW_ARROW_SHARED_LIBRARY})
            set_property(TARGET psp PROPERTY INSTALL_RPATH ${CMAKE_INSTALL_RPATH} ${module_install_rpath}  ${PYTHON_PYARROW_LIBRARY_DIR})
            set_property(TARGET binding PROPERTY INSTALL_RPATH ${CMAKE_INSTALL_RPATH} ${module_install_rpath}  ${PYTHON_PYARROW_LIBRARY_DIR})
        endif()

		target_link_libraries(psp ${PYTHON_LIBRARIES})
		target_link_libraries(binding ${PYTHON_LIBRARIES})
		target_link_libraries(binding psp)
		target_link_libraries(binding tbb)

		add_custom_command(TARGET psp POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:psp> ${PSP_PYTHON_SRC}/table/)
		add_custom_command(TARGET binding POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:binding> ${PSP_PYTHON_SRC}/table/)
		########################
	else()
		add_library(psp SHARED ${SOURCE_FILES} ${HEADER_FILES})
		target_link_libraries(psp arrow)
		target_link_libraries(psp ${Boost_FILESYSTEM_LIBRARY})
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

	if (NOT PSP_WASM_BUILD)
		# don't need to build gtest as theres one in rapidjson
		psp_build_dep("googletest" "${PSP_CMAKE_MODULE_PATH}/GTest.txt.in")
	endif()

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
