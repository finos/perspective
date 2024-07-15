cmake_minimum_required(VERSION 3.18.2)
project(psp CXX)
include(CheckCCompilerFlag)

set(CMAKE_BUILD_TYPE "Release")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

##################
# CMAKE POLICIES #
##################
# option() should use new cmake behavior wrt variable clobbering
# https://cmake.org/cmake/help/latest/policy/CMP0077.html
cmake_policy(SET CMP0077 NEW)
# Allow `BOOST_ROOT` from environment
# https://cmake.org/cmake/help/latest/policy/CMP0074.html
cmake_policy(SET CMP0074 NEW)
# Use first matching python version
# https://cmake.org/cmake/help/latest/policy/CMP0094.html
cmake_policy(SET CMP0094 NEW)
# Set MSVC Runtime Library by global flag
# https://cmake.org/cmake/help/latest/policy/CMP0091.html
cmake_policy(SET CMP0091 NEW)

#################
# CMAKE MODULES #
#################
if(MACOS)
    set(CMAKE_FIND_ROOT_PATH "${CMAKE_FIND_ROOT_PATH};/opt/homebrew;/usr/local/")
endif()
if(NOT DEFINED PSP_CMAKE_MODULE_PATH)
    set(PSP_CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/../../cmake")
endif()
list(PREPEND CMAKE_MODULE_PATH "${PSP_CMAKE_MODULE_PATH}/modules")

##########
# SYSTEM #
##########
if(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
    set(WIN32 ON)
    set(MACOS OFF)
    set(LINUX OFF)
elseif(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    set(WIN32 OFF)
    set(MACOS ON)
    set(LINUX OFF)
elseif(${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    # Emulate MACOS behavior as it will be the same
    # between linux and macos
    set(WIN32 OFF)
    set(MACOS ON)
    set(LINUX OFF)
else()
    set(WIN32 OFF)
    set(MACOS OFF)
    set(LINUX ON)
endif()

###########
# HELPERS #
###########
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

#######################
# BUILD CONFIGURATION #
#######################
find_package(Color)
find_package(InstallDependency)

option(CMAKE_BUILD_TYPE "Release/Debug build" RELEASE)
option(PSP_WASM_BUILD "Build the WebAssembly project" ON)
option(PSP_WASM_EXCEPTIONS "WebAssembly exceptions" ON)

option(PSP_PYTHON_BUILD "Build the Python bindings" OFF)
option(PSP_PYODIDE_BUILD "Build the Python bindings for Pyodide" OFF)
option(PSP_MANYLINUX_BUILD "Build the Python bindings for manylinux" OFF)
option(PSP_SANITIZE "Build with sanitizers" OFF)


if(CMAKE_SYSTEM_NAME STREQUAL "Emscripten")
    set(PSP_WASM_BUILD ON)
else()
    set(PSP_WASM_BUILD OFF)
endif()

if(DEFINED ENV{PSP_DEBUG})
    set(CMAKE_BUILD_TYPE DEBUG)
else()
    if(NOT DEFINED CMAKE_BUILD_TYPE)
        set(CMAKE_BUILD_TYPE RELEASE)
    endif()
endif()

if(DEFINED ENV{PSP_MANYLINUX})
    set(PSP_MANYLINUX_BUILD ON)
else()
    set(PSP_MANYLINUX_BUILD OFF)
endif()

if(DEFINED ENV{PSP_USE_CCACHE})
    set(CMAKE_C_COMPILE_LAUNCHER ccache)
    set(CMAKE_CXX_COMPILER_LAUNCHER ccache)
endif()

if(NOT DEFINED PSP_PYTHON_BUILD)
    set(PSP_PYTHON_BUILD OFF)
elseif(PSP_PYTHON_BUILD)
    if(NOT DEFINED PSP_PYTHON_VERSION)
        set(PSP_PYTHON_VERSION 3.11)
    endif()
    if($ENV{PYODIDE})
        set(PSP_PYODIDE_BUILD ON)
    else()
        set(PSP_PYODIDE_BUILD OFF)
    endif()
endif()

if(NOT DEFINED PSP_WASM_EXCEPTIONS AND NOT PSP_PYTHON_BUILD)
    set(PSP_WASM_EXCEPTIONS ON)
endif()


##################
# PRINT MESSAGES #
##################
if(PSP_WASM_BUILD)
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building WASM binding${ColorReset}")
else()
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Yellow}Skipping WASM binding${ColorReset}")
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
    set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${Cyan}Building Python ${Red}${PSP_PYTHON_VERSION}${Cyan} binding${ColorReset}")
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


##########################
# SYSTEM-SPECIFIC CONFIG #
##########################
if(NOT DEFINED PSP_CPP_SRC)
    set(PSP_CPP_SRC "${CMAKE_CURRENT_SOURCE_DIR}")
endif()

if(PSP_PYTHON_BUILD)
    if(NOT WIN32)
        # Look for the binary using @loader_path (relative to binary location)
        set(CMAKE_MACOSX_RPATH TRUE)
        set(CMAKE_SKIP_BUILD_RPATH FALSE)
        set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
        set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
        set(CMAKE_INSTALL_NAME_DIR "@rpath/")
    endif()
endif()
if(MACOS)
    set(CMAKE_THREAD_LIBS_INIT "-lpthread")
    set(CMAKE_HAVE_THREADS_LIBRARY 1)
    set(CMAKE_USE_WIN32_THREADS_INIT 0)
    set(CMAKE_USE_PTHREADS_INIT 1)
    set(THREADS_PREFER_PTHREAD_FLAG ON)
endif()

find_package(Threads REQUIRED)
set(Threads_FOUND True)

if(PSP_PYTHON_BUILD AND WIN32)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()
if(PSP_WASM_BUILD)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
endif()


##########################
# COMPILE AND LINK FLAGS #
##########################
# Needs to be set early so that all translation units use it.
if (NOT PSP_PYODIDE_BUILD)
    set(CMAKE_CXX_FLAGS " ${CMAKE_CXX_FLAGS} -fexceptions")
endif()

# Common flags for WASM/JS build and Pyodide
set(PSP_WASM_LINKER_FLAGS " \
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
    -s EXPORTED_FUNCTIONS=_js_poll,_js_new_server,_js_free,_js_alloc,_js_handle_request,_js_new_session,_js_close_session \
")

if(PSP_SANITIZE)
    set(PSP_SANITIZE_FLAGS " \
        -sINITIAL_MEMORY=640mb \
        -sTOTAL_MEMORY=640mb \
        -sALLOW_MEMORY_GROWTH=1 \
    ")
else()
    set(PSP_SANITIZE_FLAGS)
endif()

set(CMAKE_CXX_FLAGS_DEBUG "")
set(CMAKE_CXX_FLAGS_RELEASE "")
if(PSP_WASM_BUILD)
    if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
        # WASM DEBUG
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
            -O0 \
            -g3 \
            -Wcast-align \
            -Wover-aligned \
            -Wall \
            -fcolor-diagnostics \
            ")
        if(PSP_SANITIZE)
            set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
                -fsanitize=undefined \
                -fsanitize=address \
            ")
        endif()
    else()
        # WASM RELEASE
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
            -O3 \
            -g0 \
            ")
    endif()

    # Clobber existing linker flags
    set(CMAKE_EXE_LINKER_FLAGS "${PSP_WASM_LINKER_FLAGS}")

elseif(PSP_PYTHON_BUILD)
    if(PSP_PYODIDE_BUILD)
        set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} \
            -s RELOCATABLE=1 \
            -s SIDE_MODULE=2 \
            ${PSP_WASM_LINKER_FLAGS} \
        ")
    endif()
    if(WIN32)
        # WINDOWS PYTHON
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
            /EHsc \
            /MP \
            /MT \
            /c \
            /bigobj \
        ")

        foreach(warning 4244 4251 4267 4275 4290 4786 4305 4996)
            SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /wd${warning}")
        endforeach(warning)

        if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
            # WINDOWS PYTHON DEBUG
            set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
                /DEBUG \
                /Z7 \
                /Zi \
            ")
        else()
            # WINDOWS PYTHON RELEASE
            set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
                /O2 \
            ")
        endif()
    else()
        if(CMAKE_BUILD_TYPE_LOWER STREQUAL debug)
            # PYTHON DEBUG
            set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
                -O0 \
                -fexceptions \
                -g3 \
            ")

            if (PSP_PYODIDE_BUILD)
                # PYODIDE PYTHON DEBUG
                set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
                    -gsource-map \
                    --profiling \
                    -Wcast-align \
                    -Wover-aligned \
                    ")
            endif ()
        else()
            # PYTHON RELEASE
            set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
                -O0 \
                -fexceptions \
                -g1 \
            ")
        endif()
    endif()
endif()

# Wasm Exceptions
if (PSP_WASM_EXCEPTIONS AND (PSP_WASM_BUILD OR PSP_PYODIDE_BUILD))
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} \
        -fwasm-exceptions \
    ")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} \
        -s EXCEPTION_STACK_TRACES=1 \
        -fwasm-exceptions \
    ")
endif()

###############
# DEFINITIONS #
###############
if(PSP_PYTHON_BUILD AND WIN32)
    add_definitions(-DBOOST_UUID_FORCE_AUTO_LINK)
endif()


################
# DEPENDENCIES #
################
if(NOT WIN32)
    # Boost is a system dependency and must be present and built on the system.
    # This makes sure it can be found in user-installed locations, e.g. via
    # node tools/perspective-scripts/install_tools.mjs
    set(CMAKE_FIND_ROOT_PATH "${CMAKE_FIND_ROOT_PATH};/usr/local/;/opt/homebrew")
    find_package(Boost REQUIRED)
endif()


if(PSP_PYTHON_BUILD)
    set(Boost_USE_STATIC_LIBS ON)
    find_package(Boost REQUIRED COMPONENTS system)
endif()

if(NOT Boost_FOUND)
    message(FATAL_ERROR "${Red}Boost could not be located${ColorReset}")
else()
    psp_build_message("${Cyan}Found Boost: `Boost_INCLUDE_DIRS`: ${Boost_INCLUDE_DIRS}, `Boost_LIBRARY_DIRS` - ${Boost_LIBRARY_DIRS} ${ColorReset}")
endif()

set(RAPIDJSON_BUILD_TESTS OFF CACHE BOOL "Disable rapidjson tests")

# Build header-only dependencies from external source
psp_build_dep("date" "${PSP_CMAKE_MODULE_PATH}/date.txt.in")
psp_build_dep("hopscotch" "${PSP_CMAKE_MODULE_PATH}/hopscotch.txt.in")
psp_build_dep("ordered-map" "${PSP_CMAKE_MODULE_PATH}/ordered-map.txt.in")

# Build minimal arrow for both Emscripten and Python
psp_build_message("${Cyan}Building minimal Apache Arrow${ColorReset}")

# Build arrow dependencies
psp_build_dep("rapidjson" "${PSP_CMAKE_MODULE_PATH}/rapidjson.txt.in")
psp_build_dep("double-conversion" "${PSP_CMAKE_MODULE_PATH}/double-conversion.txt.in")
psp_build_dep("flatbuffers" "${PSP_CMAKE_MODULE_PATH}/flatbuffers.txt.in")
psp_build_dep("lz4" "${PSP_CMAKE_MODULE_PATH}/lz4.txt.in")

# Build minimal arrow itself
psp_build_dep("arrow" "${PSP_CMAKE_MODULE_PATH}/arrow.txt.in")

# Build re2 as our regex library
# this is a workaround for some re2-specific weirdness
add_definitions(-DTARGET_OS_OSX=1)
psp_build_dep("re2" "${PSP_CMAKE_MODULE_PATH}/re2.txt.in")

# Build exprtk for expression parsing
psp_build_dep("exprtk" "${PSP_CMAKE_MODULE_PATH}/exprtk.txt.in")

# Protobuf setup
add_subdirectory(${PSP_CMAKE_MODULE_PATH}/../cpp/protos "${CMAKE_BINARY_DIR}/protos-build")

############
# INCLUDES #
############
include_directories("${CMAKE_CURRENT_SOURCE_DIR}/src/include")

if(PSP_WASM_BUILD)
    # Assumes that Boost includes will be in one of these folders.
    include_directories("/usr/local/include")
    include_directories("/opt/homebrew/include/")

    # Include this docker-only directory.
    include_directories(SYSTEM "/boost_includes")
endif()

# On windows we use vcpkg
if(NOT WIN32)
    include_directories(SYSTEM ${Boost_INCLUDE_DIRS})
endif()

################
# SOURCE FILES #
################
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
    ${PSP_CPP_SRC}/src/cpp/proto_api.cpp
)

################
# BUILD ASSETS #
################
message("${BUILD_MESSAGE}\n")


if(PSP_WASM_BUILD)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --pre-js \"${PSP_CPP_SRC}/env.js\" ")

    add_library(psp ${SOURCE_FILES})

    target_compile_definitions(psp PRIVATE PSP_ENABLE_WASM=1)
    set_target_properties(psp PROPERTIES COMPILE_FLAGS "")
    target_link_libraries(psp PRIVATE arrow re2 protos)
    target_include_directories(psp PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src/include)

    add_executable(perspective_esm src/cpp/emscripten_api.cpp)
    target_link_libraries(perspective_esm psp protos)
    target_compile_definitions(perspective_esm PRIVATE PSP_ENABLE_WASM=1)
    target_link_options(perspective_esm PUBLIC -sENVIRONMENT="web" "${PSP_SANITIZE_FLAGS}")

    set_target_properties(perspective_esm PROPERTIES RUNTIME_OUTPUT_DIRECTORY "./web/")
    set_target_properties(perspective_esm PROPERTIES OUTPUT_NAME "perspective-server")

elseif(PSP_PYTHON_BUILD)

    if(PSP_PYODIDE_BUILD)

        # TODO
        add_library(psppy SHARED)
        set(PSP_PYTHON_DEFS PSP_ENABLE_WASM=1)
        target_compile_definitions(psppy PRIVATE ${PSP_PYTHON_DEFS})
        include_directories(${PSP_PYTHON_SRC}/include)
        target_compile_definitions(psppy PRIVATE PSP_ENABLE_PYTHON=1)
        target_compile_options(psppy PRIVATE -fvisibility=hidden)
        target_link_libraries(psppy arrow re2)
        add_custom_command(TARGET psppy POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:psppy> ${PSP_PYTHON_SRC}/table/)

    elseif(PSP_PYTHON_BUILD)

        add_library(psp STATIC ${SOURCE_FILES})
        target_include_directories(psp PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src/include)
        target_compile_definitions(psp PRIVATE PSP_ENABLE_PYTHON=1 PSP_PARALLEL_FOR=1)
        target_link_libraries(psp PRIVATE arrow re2 protos)

        if(WIN32)
            target_compile_definitions(psp PRIVATE PERSPECTIVE_EXPORTS=1)
            target_compile_definitions(psp PRIVATE WIN32=1)
            target_compile_definitions(psp PRIVATE _WIN32=1)
        endif()
    endif()
endif()

# TODO this needs to be omitted when built by `cmake-rs`, because
#`cargo publish --dry-run` complains when this generate `.clangd` in the Rust
# root dir instead of teh `target` dir.
if(NOT DEFINED ENV{PSP_DISABLE_CLANGD})
    include(SetupClangd)
endif()

