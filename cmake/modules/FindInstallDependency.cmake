cmake_minimum_required(VERSION 3.7.2)

# Workaround for: https://gitlab.kitware.com/cmake/cmake/-/issues/22740
set(D "$")

# ##################################################
# Helper to grab dependencies from remote sources #
# ##################################################
function(psp_build_dep name cmake_file)
    if(EXISTS ${CMAKE_BINARY_DIR}/${name}-build AND NOT name STREQUAL "lz4")
        psp_build_message("${Cyan}Dependency found - not rebuilding - ${CMAKE_BINARY_DIR}/${name}-build${ColorReset}")
    else()
        configure_file(${cmake_file} ${CMAKE_BINARY_DIR}/${name}-download/CMakeLists.txt)
        set(_cwd ${CMAKE_BINARY_DIR}/${name}-download)

        message(STATUS "Configuring ${name} in ${_cwd}")

        execute_process(COMMAND ${CMAKE_COMMAND} -G "${CMAKE_GENERATOR}" .
            RESULT_VARIABLE result
            OUTPUT_VARIABLE cmd_output
            ERROR_VARIABLE cmd_error
            WORKING_DIRECTORY ${_cwd})

        if(result)
            message(FATAL_ERROR "CMake step for ${name} failed:\nSTDOUT:${cmd_output}\nSTDERR: ${cmd_error}")
        endif()

        message("${cmd_output}")

        execute_process(COMMAND ${CMAKE_COMMAND} --build .
            RESULT_VARIABLE result
            WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/${name}-download)

        if(result)
            message(FATAL_ERROR "Build step for ${name} failed: ${result}")
        endif()
    endif()

    if(${name} STREQUAL arrow)
        set(ARROW_SIMD_LEVEL "NONE")
        set(ARROW_DEFINE_OPTIONS ON)
        set(ARROW_RUNTIME_SIMD_LEVEL "NONE")
        set(ARROW_BUILD_SHARED OFF)
        set(ARROW_BUILD_STATIC ON)
        set(ARROW_BUILD_INTEGRATION OFF)
        set(ARROW_JEMALLOC OFF)
        set(ARROW_CSV ON)
        set(ARROW_LZ4 ON)
        set(ARROW_WITH_ZSTD ON)
        set(ARROW_WITH_LZ4 ON)
        set(ARROW_NO_EXPORT ON)
        if(PSP_WASM_BUILD)
            set(ARROW_ENABLE_THREADING OFF)
        else()
            set(ARROW_ENABLE_THREADING ON)
            if(WIN32)
                set(ARROW_DEPENDENCY_SOURCE "BUNDLED")
            endif()
        endif()

        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-build/src)
        add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src/cpp/
            ${CMAKE_BINARY_DIR}/${name}-build
            EXCLUDE_FROM_ALL
        )

        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src/cpp/src/)
    elseif(${name} STREQUAL boost)
        add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
            ${CMAKE_BINARY_DIR}/${name}-build
            EXCLUDE_FROM_ALL)
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src/src)
    elseif(${name} STREQUAL exprtk)
        # no cmakelists - just include the header
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src)
    elseif(${name} STREQUAL re2)
        # Overwrite re2's CMakeLists with our custom CMakeLists.
        configure_file(${PSP_CMAKE_MODULE_PATH}/${name}/CMakeLists.txt ${CMAKE_BINARY_DIR}/${name}-src/ COPYONLY)
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src)

        add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
            ${CMAKE_BINARY_DIR}/${name}-build
            EXCLUDE_FROM_ALL)
    elseif(${name} STREQUAL lz4)
        # lz4's CMakeLists.txt is in a subdir, build/cmake
        add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src/build/cmake
            ${CMAKE_BINARY_DIR}/${name}-build
            EXCLUDE_FROM_ALL)
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src/lib)
    elseif(${name} STREQUAL protobuf)
        add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
            ${CMAKE_BINARY_DIR}/${name}-build
            EXCLUDE_FROM_ALL)
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src/src)
    else()
        add_subdirectory(${CMAKE_BINARY_DIR}/${name}-src
            ${CMAKE_BINARY_DIR}/${name}-build
            EXCLUDE_FROM_ALL)

        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src/extras/${name}/include)
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src/include)
        include_directories(SYSTEM ${CMAKE_BINARY_DIR}/${name}-src)
    endif()

    if(NOT PSP_WASM_BUILD AND (MACOS OR NOT MANYLINUX))
        if(${name} STREQUAL arrow_static OR ${name} STREQUAL flatbuffers OR ${name} STREQUAL double-conversion OR ${name} STREQUAL re2)
            target_compile_options(${name} PRIVATE -fvisibility=hidden)
        endif()
    endif()
endfunction()

# #############################
