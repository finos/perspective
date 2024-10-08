cmake_minimum_required(VERSION 3.18.2)
project(psp)
include(CheckCCompilerFlag)

set(CMAKE_BUILD_TYPE "Release")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
# CMAKE POLICIES
# option() should use new cmake behavior wrt variable clobbering
cmake_policy(SET CMP0077 NEW)

# BOOST_ROOT has been removed on Windows VMs in Azure:
#
# - https://github.com/actions/virtual-environments/issues/687
# - https://github.com/actions/virtual-environments/issues/319
#
# `BOOST_ROOT` must be set in the environment, and policy CMP0074
# must be set to `NEW` to allow BOOST_ROOT to be defined by env var
cmake_policy(SET CMP0074 NEW)

# Set CMP0094 to NEW - find the first version that matches constraints,
# instead of the latest version installed.
cmake_policy(SET CMP0094 NEW)

if(NOT DEFINED PSP_CMAKE_MODULE_PATH)
    set(PSP_CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../cmake")
endif()

set(CMAKE_MODULE_PATH "${PSP_CMAKE_MODULE_PATH}/modules" ${CMAKE_MODULE_PATH})
set(MSVC_RUNTIME_LIBRARY MultiThreaded)

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

if (WIN32)
    add_compile_options("/EHsc")
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()


if(WIN32)
    set(CMAKE_CXX_FLAGS " /EHsc /MP /MT /c /bigobj")
else()
    # set(CMAKE_CXX_FLAGS " ${CMAKE_CXX_FLAGS}")
endif()

# # Helper function
function(string_starts_with str search)
    string(FIND "${str}" "${search}" out)

    if("${out}" EQUAL 0)
        return(true)
    endif()
    return(false)
endfunction()

set(BUILD_MESSAGE "")

function(psp_build_message message)
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${message}")
endfunction()

# ######################
# BUILD CONFIGURATION #
# ######################
find_package(Color)
find_package(InstallDependency)

# OPTIONS
option(CMAKE_BUILD_TYPE "Release/Debug build" RELEASE)
option(PSP_WASM_BUILD "Build the WebAssembly Project" ON)
option(PSP_CPP_BUILD "Build the C++ Project" OFF)
option(PSP_PYTHON_BUILD "Build the Python Bindings" OFF)
option(PSP_CPP_BUILD_STRICT "Build the C++ with strict warnings" OFF)
option(PSP_SANITIZE "Build with sanitizers" OFF)

if(CMAKE_SYSTEM_NAME STREQUAL "Emscripten")
    set(PSP_WASM_BUILD ON)
    set(PSP_CPP_BUILD OFF)
else()
    set(PSP_WASM_BUILD OFF)
    set(PSP_CPP_BUILD ON)
endif()

if(PSP_WASM_BUILD AND PSP_CPP_BUILD)
    message(FATAL_ERROR "${Red}CPP and Emscripten builds must be done separately${ColorReset}")
endif()

if(DEFINED ENV{PSP_DEBUG})
    set(CMAKE_BUILD_TYPE DEBUG)
else()
    if(NOT DEFINED CMAKE_BUILD_TYPE)
        set(CMAKE_BUILD_TYPE RELEASE)
    endif()
endif()

if(DEFINED ENV{PSP_MANYLINUX})
    set(MANYLINUX ON)
else()
    set(MANYLINUX OFF)
endif()

if(DEFINED ENV{PSP_USE_CCACHE})
    set(CMAKE_C_COMPILE_LAUNCHER ccache)
    set(CMAKE_CXX_COMPILER_LAUNCHER ccache)
endif()

if(NOT DEFINED PSP_CPP_BUILD)
    set(PSP_CPP_BUILD ON)
endif()

if(NOT DEFINED PSP_PYTHON_BUILD)
    set(PSP_PYTHON_BUILD OFF)
elseif(PSP_PYTHON_BUILD)
    if(NOT DEFINED PSP_PYTHON_VERSION)
        set(PSP_PYTHON_VERSION 3.10)
    endif()
    if(PSP_WASM_BUILD)
        set(PSP_PYODIDE 1)
    else()
        set(PSP_PYODIDE 0)
    endif()
endif()

if(NOT DEFINED PSP_CPP_BUILD_STRICT)
    set(PSP_CPP_BUILD_STRICT OFF)
endif()

if(PSP_WASM_BUILD)
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building WASM binding${ColorReset}")
else()
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Yellow}Skipping WASM binding${ColorReset}")
endif()

if(NOT DEFINED PSP_CPP_SRC)
    set(PSP_CPP_SRC "${CMAKE_CURRENT_SOURCE_DIR}")
endif()

if(PSP_CPP_BUILD)
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building C++ binding${ColorReset}")
else()
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Yellow}Skipping C++ binding${ColorReset}")
endif()

if(PSP_PYTHON_BUILD)
    if(NOT DEFINED PSP_PYTHON_SRC)
        set(PSP_PYTHON_SRC "${CMAKE_CURRENT_SOURCE_DIR}/../../python/perspective/perspective")
    endif()

    # set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building Python ${Red}${PSP_PYTHON_VERSION}${Cyan} binding${ColorReset}")
else()
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Yellow}Skipping Python binding${ColorReset}")
endif()

if(PSP_CPP_BUILD AND NOT PSP_CPP_BUILD_STRICT)
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Yellow}Building C++ without strict warnings${ColorReset}")
else()
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building C++ with strict warnings${ColorReset}")
endif()

string(TOLOWER "${CMAKE_BUILD_TYPE}" CMAKE_BUILD_TYPE_LOWER)

if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Red}Building DEBUG${ColorReset}")
    add_definitions(-DPSP_DEBUG)
else()
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building RELEASE${ColorReset}")
endif()

if(PSP_PYTHON_BUILD AND MACOS)
    # fix for threads on osx
    # assume built-in pthreads on MacOS
    set(CMAKE_THREAD_LIBS_INIT "-lpthread")
    set(CMAKE_HAVE_THREADS_LIBRARY 1)
    set(CMAKE_USE_WIN32_THREADS_INIT 0)
    set(CMAKE_USE_PTHREADS_INIT 1)
    set(THREADS_PREFER_PTHREAD_FLAG ON)

    # don't link against build python
    # https://blog.tim-smith.us/2015/09/python-extension-modules-os-x/
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -undefined dynamic_lookup")
endif()

# ######################
include_directories("${CMAKE_CURRENT_SOURCE_DIR}/src/include")

if(NOT DEFINED PSP_WASM_EXCEPTIONS AND NOT PSP_PYTHON_BUILD)
    set(PSP_WASM_EXCEPTIONS ON)
endif()

if(PSP_WASM_BUILD)
    # ###################
    # EMSCRIPTEN BUILD #
    # ###################
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    list(APPEND CMAKE_PREFIX_PATH /usr/local)

    # Assumes that Boost includes will be in this folder.
    include_directories(SYSTEM "/usr/local/include")

    # Include this docker-only directory.
    include_directories(SYSTEM "/boost_includes")

    set(EXTENDED_FLAGS " \
        -Wall \
        -fcolor-diagnostics \
        ")

    if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
        # Pyodide DEBUG block
        set(OPT_FLAGS " \
            -O0 \
            -g3 \
            -Wcast-align \
            -Wover-aligned \
            ")
        if (PSP_WASM_EXCEPTIONS)
            set(OPT_FLAGS "${OPT_FLAGS} -fwasm-exceptions ")
        endif()
        if(PSP_SANITIZE)
            set(OPT_FLAGS "${OPT_FLAGS} \
                -fsanitize=undefined \
                -fsanitize=address \
            ")
        endif()
    else()
        # Pyodide RELEASE block
        set(OPT_FLAGS " \
            -O3 \
            -g0 \
            ")
        if (PSP_WASM_EXCEPTIONS)
            set(OPT_FLAGS "${OPT_FLAGS} -fwasm-exceptions ")
        endif()
    endif()

    set(ASYNC_MODE_FLAGS "")
elseif(PSP_CPP_BUILD OR PSP_PYTHON_BUILD)
    if(WIN32)
        if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
            set(OPT_FLAGS " \
                /DEBUG \
                /Z7 \
                /Zi
                ")
        else()
            set(OPT_FLAGS " \
                /NDEBUG \
                /O2 \
                ")
        endif()
    else()
        if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
            if (PSP_PYODIDE)
                set(OPT_FLAGS " \
                    -O0 \
                    -g3 \
                    -gsource-map \
                    --profiling \
                    -Wcast-align \
                    -Wover-aligned \
                    ")
            else ()
                 set(OPT_FLAGS " \
                    -O0 \
                    -fexceptions \
                    -g3 \
                    ")
                if (PSP_WASM_EXCEPTIONS)
                    set(OPT_FLAGS "${OPT_FLAGS} -fwasm-exceptions ")
                endif()
            endif ()
        else()
            set(OPT_FLAGS " \
                -O3 \
                -fexceptions \
                -g1 \
                ")
            if (PSP_WASM_EXCEPTIONS)
                set(OPT_FLAGS "${OPT_FLAGS} -fwasm-exceptions ")
            endif()
        endif()
    endif()

    set(ASYNC_MODE_FLAGS "")

    # Boost is a system dependency and must be present and built on the system.
    if(PSP_PYODIDE)
        set(CMAKE_FIND_ROOT_PATH "${CMAKE_FIND_ROOT_PATH};/usr/local/")
        find_package(Boost REQUIRED)
    elseif(NOT WIN32)
        set(Boost_USE_STATIC_LIBS ON)
        find_package(Boost REQUIRED COMPONENTS system)
    endif()

    if(WIN32)
        foreach(warning 4244 4251 4267 4275 4290 4786 4305 4996)
            SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd${warning}")
        endforeach(warning)

    # When linking against Boost on Azure, bcrypt fails to link:
    # - https://github.com/microsoft/vcpkg/issues/4481
    # - https://github.com/boostorg/uuid/issues/68
    # add_definitions("-DBOOST_UUID_FORCE_AUTO_LINK")
    else()
        include_directories("/usr/local/include")
    endif()

    if(PSP_PYTHON_BUILD)
        set(CMAKE_POSITION_INDEPENDENT_CODE ON)
        include_directories("${PSP_PYTHON_SRC}/perspective/include")
    endif()
endif()

set(RAPIDJSON_BUILD_TESTS OFF CACHE BOOL "Disable rapidjson tests")


set(CMAKE_C_FLAGS "  \
-O3 \
")
if (PSP_WASM_EXCEPTIONS)
set(CMAKE_CXX_FLAGS " -fwasm-exceptions \
-O3 \
-g0 \
")
else()
set(CMAKE_CXX_FLAGS " \
-O3 \
")

endif()

if(PSP_PYODIDE)
    set(RELOCATABLE_FLAGS "-sRELOCATABLE=1 -sSIDE_MODULE=2 -sWASM_BIGINT=1")

    string(APPEND CMAKE_EXE_LINKER_FLAGS "${RELOCATABLE_FLAGS}")
    string(APPEND CMAKE_C_FLAGS "${RELOCATABLE_FLAGS}")
    string(APPEND CMAKE_CXX_FLAGS "${RELOCATABLE_FLAGS}")
endif()


# Build header-only dependencies from external source
psp_build_dep("date" "${PSP_CMAKE_MODULE_PATH}/date.txt.in")
psp_build_dep("hopscotch" "${PSP_CMAKE_MODULE_PATH}/hopscotch.txt.in")
psp_build_dep("ordered-map" "${PSP_CMAKE_MODULE_PATH}/ordered-map.txt.in")

# ExternalProject_Add was not working for zstd, SOURCE_SUBDIR was not being honored.
include(FetchContent)

set(ZSTD_BUILD_STATIC ON)
set(ZSTD_BUILD_SHARED OFF)
set(ZSTD_BUILD_COMPRESSION OFF)

FetchContent_Declare(
    zstd
    URL "https://github.com/facebook/zstd/releases/download/v1.5.5/zstd-1.5.5.tar.gz"
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    SOURCE_SUBDIR build/cmake
)

FetchContent_MakeAvailable(zstd)

# Build minimal arrow for both Emscripten and Python
psp_build_message("${Cyan}Building minimal Apache Arrow${ColorReset}")

# Build arrow dependencies
psp_build_dep("rapidjson" "${PSP_CMAKE_MODULE_PATH}/rapidjson.txt.in")
psp_build_dep("double-conversion" "${PSP_CMAKE_MODULE_PATH}/double-conversion.txt.in")
psp_build_dep("flatbuffers" "${PSP_CMAKE_MODULE_PATH}/flatbuffers.txt.in")
psp_build_dep("lz4" "${PSP_CMAKE_MODULE_PATH}/lz4.txt.in")

# Build minimal arrow itself
psp_build_dep("arrow" "${PSP_CMAKE_MODULE_PATH}/arrow.txt.in")

if(PSP_PYTHON_BUILD AND NOT PSP_PYODIDE)
    # Boost must be added after arrow to prevent linking bug on Windows.
    if(WIN32)
        set(Boost_USE_STATIC_LIBS ON)
        find_package(Boost REQUIRED COMPONENTS system)
    endif()
    if(NOT Boost_FOUND)
        message(FATAL_ERROR "${Red}Boost could not be located${ColorReset}")
    else()
        psp_build_message("${Cyan}Found Boost: `Boost_INCLUDE_DIRS`: ${Boost_INCLUDE_DIRS}, `Boost_LIBRARY_DIRS` - ${Boost_LIBRARY_DIRS} ${ColorReset}")
        if(WIN32)
            include_directories(SYSTEM ${Boost_INCLUDE_DIRS})
            add_definitions(-DBOOST_UUID_FORCE_AUTO_LINK)
        endif()
    endif()
endif()


# Build re2 as our regex library
# this is a workaround for some re2-specific weirdness
add_definitions(-DTARGET_OS_OSX=1)
psp_build_dep("re2" "${PSP_CMAKE_MODULE_PATH}/re2.txt.in")

# Build exprtk for expression parsing
psp_build_dep("exprtk" "${PSP_CMAKE_MODULE_PATH}/exprtk.txt.in")

# Protobuf setup
add_subdirectory(${PSP_CMAKE_MODULE_PATH}/../cpp/protos "${CMAKE_BINARY_DIR}/protos-build")

# ####################
set(CMAKE_C_FLAGS_DEBUG "")
set(CMAKE_C_FLAGS_RELEASE "")
set(CMAKE_C_FLAGS " \
    ${CMAKE_C_FLAGS} \
    ${EXTENDED_FLAGS} \
    ${OPT_FLAGS} \
    ")

# prevents the default debug flags from overriding the debug flags we
# set in OPT_FLAGS
set(CMAKE_CXX_FLAGS_DEBUG "")
set(CMAKE_CXX_FLAGS_RELEASE "")
set(CMAKE_CXX_FLAGS " \
    ${CMAKE_CXX_FLAGS} \
    ${EXTENDED_FLAGS} \
    ${OPT_FLAGS} \
    ")

if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=c++1y")
endif()

set(SOURCE_FILES
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
    # ${PSP_CPP_SRC}/src/cpp/binding.cpp

    # ${PSP_CPP_SRC}/src/cpp/build_filter.cpp
    # ${PSP_CPP_SRC}/src/cpp/calc_agg_dtype.cpp
    ${PSP_CPP_SRC}/src/cpp/column.cpp
    ${PSP_CPP_SRC}/src/cpp/comparators.cpp
    ${PSP_CPP_SRC}/src/cpp/compat.cpp
    ${PSP_CPP_SRC}/src/cpp/compat_impl_linux.cpp
    ${PSP_CPP_SRC}/src/cpp/compat_impl_osx.cpp
    ${PSP_CPP_SRC}/src/cpp/compat_impl_wasm.cpp
    ${PSP_CPP_SRC}/src/cpp/compat_impl_win.cpp
    ${PSP_CPP_SRC}/src/cpp/computed_expression.cpp
    ${PSP_CPP_SRC}/src/cpp/computed_function.cpp
    ${PSP_CPP_SRC}/src/cpp/config.cpp
    ${PSP_CPP_SRC}/src/cpp/context_base.cpp
    ${PSP_CPP_SRC}/src/cpp/context_grouped_pkey.cpp
    ${PSP_CPP_SRC}/src/cpp/context_handle.cpp
    ${PSP_CPP_SRC}/src/cpp/context_one.cpp
    ${PSP_CPP_SRC}/src/cpp/context_two.cpp
    ${PSP_CPP_SRC}/src/cpp/context_zero.cpp
    ${PSP_CPP_SRC}/src/cpp/context_unit.cpp
    ${PSP_CPP_SRC}/src/cpp/data.cpp
    ${PSP_CPP_SRC}/src/cpp/data_slice.cpp
    ${PSP_CPP_SRC}/src/cpp/data_table.cpp
    ${PSP_CPP_SRC}/src/cpp/date.cpp
    ${PSP_CPP_SRC}/src/cpp/dense_nodes.cpp
    ${PSP_CPP_SRC}/src/cpp/dense_tree_context.cpp
    ${PSP_CPP_SRC}/src/cpp/dense_tree.cpp
    ${PSP_CPP_SRC}/src/cpp/dependency.cpp
    ${PSP_CPP_SRC}/src/cpp/expression_tables.cpp
    ${PSP_CPP_SRC}/src/cpp/expression_vocab.cpp
    ${PSP_CPP_SRC}/src/cpp/extract_aggregate.cpp
    ${PSP_CPP_SRC}/src/cpp/filter.cpp
    ${PSP_CPP_SRC}/src/cpp/flat_traversal.cpp
    ${PSP_CPP_SRC}/src/cpp/get_data_extents.cpp
    ${PSP_CPP_SRC}/src/cpp/gnode.cpp
    ${PSP_CPP_SRC}/src/cpp/gnode_state.cpp
    ${PSP_CPP_SRC}/src/cpp/mask.cpp
    ${PSP_CPP_SRC}/src/cpp/multi_sort.cpp
    ${PSP_CPP_SRC}/src/cpp/none.cpp
    ${PSP_CPP_SRC}/src/cpp/path.cpp
    ${PSP_CPP_SRC}/src/cpp/pivot.cpp
    ${PSP_CPP_SRC}/src/cpp/pool.cpp
    ${PSP_CPP_SRC}/src/cpp/port.cpp
    ${PSP_CPP_SRC}/src/cpp/process_state.cpp
    ${PSP_CPP_SRC}/src/cpp/pyutils.cpp
    ${PSP_CPP_SRC}/src/cpp/raii.cpp
    ${PSP_CPP_SRC}/src/cpp/raii_impl_linux.cpp
    ${PSP_CPP_SRC}/src/cpp/raii_impl_osx.cpp
    ${PSP_CPP_SRC}/src/cpp/raii_impl_win.cpp
    ${PSP_CPP_SRC}/src/cpp/range.cpp
    ${PSP_CPP_SRC}/src/cpp/regex.cpp
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
    ${PSP_CPP_SRC}/src/cpp/arrow_csv.cpp
    ${PSP_CPP_SRC}/src/cpp/server.cpp
    ${PSP_CPP_SRC}/src/cpp/binding_api.cpp
)

set(PYTHON_SOURCE_FILES ${SOURCE_FILES})
set(WASM_SOURCE_FILES ${SOURCE_FILES})

message("${BUILD_MESSAGE}\n")

if(WIN32)
    set(CMAKE_CXX_FLAGS " /EHsc /MP /MT /c /bigobj")
else()
    # set(CMAKE_CXX_FLAGS " ${CMAKE_CXX_FLAGS}")
endif()

# Common flags for WASM/JS build and Pyodide
if(PSP_PYODIDE)
    set(PSP_WASM_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} \
        --no-entry \
        -s EXPORTED_FUNCTIONS=_psp_poll,_psp_new_server,_psp_free,_psp_alloc,_psp_handle_request,_psp_new_session,_psp_close_session,_psp_delete_server \
        -s SIDE_MODULE=2 \
    ")
else()
    set(PSP_WASM_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} \
        --no-entry \
        --closure=1 \
        -s NO_FILESYSTEM=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s MODULARIZE=1 \
        -s WASM_BIGINT=1 \
        -s INCOMING_MODULE_JS_API=locateFile,psp_heap_size,psp_stack_trace,HEAPU8,HEAPU32,instantiateWasm \
        -s TEXTDECODER=2 \
        -s STANDALONE_WASM=1 \
        -s DYNAMIC_EXECUTION=0 \
        -s BINARYEN_EXTRA_PASSES=--one-caller-inline-max-function-size=19306 \
        -s EXPORT_NAME=\"load_perspective\" \
        -s MAXIMUM_MEMORY=4gb \
        -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
        -s NODEJS_CATCH_EXIT=0 \
        -s NODEJS_CATCH_REJECTION=0 \
        -s USE_ES6_IMPORT_META=1 \
        -s EXPORT_ES6=1 \
        -s EXPORTED_FUNCTIONS=_psp_poll,_psp_new_server,_psp_free,_psp_alloc,_psp_handle_request,_psp_new_session,_psp_close_session,_psp_delete_server \
    ")
endif()

if (PSP_WASM_EXCEPTIONS)
    set(PSP_WASM_LINKER_FLAGS "${PSP_WASM_LINKER_FLAGS} -s EXCEPTION_STACK_TRACES=1 ")
endif()

if(PSP_SANITIZE)
    set(PSP_SANITIZE_FLAGS
        -sINITIAL_MEMORY=640mb
        -sTOTAL_MEMORY=640mb
        -sALLOW_MEMORY_GROWTH=1
    )
else()
    set(PSP_SANITIZE_FLAGS)
endif()

if(PSP_WASM_BUILD AND NOT PSP_PYTHON_BUILD)
    set(CMAKE_EXE_LINKER_FLAGS "${PSP_WASM_LINKER_FLAGS} --pre-js \"${PSP_CPP_SRC}/env.js\" ")

    add_library(psp ${WASM_SOURCE_FILES})
    target_compile_definitions(psp PRIVATE PSP_ENABLE_WASM=1)
    set_target_properties(psp PROPERTIES COMPILE_FLAGS "")
    target_link_libraries(psp PRIVATE arrow_static re2 protos)

    add_executable(perspective_esm src/cpp/binding_api.cpp)
    target_link_libraries(perspective_esm psp protos)
    target_compile_definitions(perspective_esm PRIVATE PSP_ENABLE_WASM=1)
    target_link_options(perspective_esm PUBLIC -sENVIRONMENT="web"  ${PSP_SANITIZE_FLAGS})
    set_target_properties(perspective_esm PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./web/")
    set_target_properties(perspective_esm PROPERTIES OUTPUT_NAME "perspective-server")
elseif(PSP_CPP_BUILD OR PSP_PYTHON_BUILD)
    if(NOT WIN32)
        set(CMAKE_SHARED_LIBRARY_SUFFIX .so)

        # Look for the binary using @loader_path (relative to binary location)
        set(CMAKE_MACOSX_RPATH TRUE)
        set(CMAKE_SKIP_BUILD_RPATH FALSE)
        set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
        set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
        set(CMAKE_INSTALL_NAME_DIR "@rpath/")

        # module_origin_path is the location of the binary
        if(MACOS)
            set(module_origin_path "@loader_path/")
        else()
            set(module_origin_path "\$ORIGIN")
        endif()
    else()
        set(CMAKE_SHARED_LIBRARY_PREFIX lib)
    endif()

    if(PSP_PYTHON_BUILD)
        # #######################
        # Python extra targets #
        # #######################
        if(PSP_WASM_BUILD)
            # Pyodide
            set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
            set(CMAKE_EXE_LINKER_FLAGS "${PSP_WASM_LINKER_FLAGS} --pre-js \"${PSP_CPP_SRC}/env.js\" ")
            add_library(psp STATIC ${PYTHON_SOURCE_FILES})
            target_compile_definitions(psp PRIVATE PSP_ENABLE_PYTHON=1 PSP_ENABLE_WASM=1)
            # support for emscripten exceptions https://emscripten.org/docs/porting/exceptions.html#emscripten-javascript-based-exception-support
            target_compile_options(psp PUBLIC -fexceptions -fvisibility=hidden)
            target_compile_options(arrow_static PUBLIC -fexceptions -fvisibility=hidden)
            target_compile_options(re2 PUBLIC -fexceptions -fvisibility=hidden)
            target_compile_options(protos PUBLIC -fexceptions -fvisibility=hidden)
        else()
            # Cpython
            add_library(psp STATIC ${PYTHON_SOURCE_FILES})
            target_compile_definitions(psp PRIVATE PSP_ENABLE_PYTHON=1 PSP_PARALLEL_FOR=1)
        endif()

        include_directories(${PSP_PYTHON_SRC}/include)

        if(MACOS OR NOT MANYLINUX)
            set_property(TARGET psp PROPERTY INSTALL_RPATH ${CMAKE_INSTALL_RPATH} ${module_origin_path})

            target_compile_options(psp PRIVATE -fvisibility=hidden)
        elseif(MANYLINUX)
            # intentionally blank
        else()
            target_compile_options(psp PRIVATE -fvisibility=hidden)
        endif()

        # Link against minimal arrow static library
        target_link_libraries(psp PRIVATE arrow_static re2 protos lz4_static libzstd_static)
    else()
        add_library(psp STATIC ${WASM_SOURCE_FILES})
        target_compile_options(psp PRIVATE -fvisibility=hidden)
        target_link_libraries(psp PRIVATE arrow_static re2 protos)
    endif()

    if(PSP_CPP_BUILD_STRICT AND NOT WIN32)
        target_compile_options(psp PRIVATE -Wall -Werror)
        target_compile_options(psp PRIVATE $<$<CONFIG:DEBUG>:-fPIC -O0>)
        if(PSP_PYTHON_BUILD)
            target_compile_options(psppy PRIVATE $<$<CONFIG:DEBUG>:-fPIC -O0>)
        endif()
    elseif(WIN32)
        target_compile_definitions(psp PRIVATE PERSPECTIVE_EXPORTS=1)
        target_compile_definitions(psp PRIVATE WIN32=1)
        target_compile_definitions(psp PRIVATE _WIN32=1)
    endif()
endif()

# TODO this needs to be omitted when built by `cmake-rs`, because
#`cargo publish --dry-run` complains when this generate `.clangd` in the Rust
# root dir instead of teh `target` dir.
if(NOT DEFINED ENV{PSP_DISABLE_CLANGD})
    include(SetupClangd)
endif()

if(NOT WIN32)
    include_directories(SYSTEM ${Boost_INCLUDE_DIRS})
endif()
