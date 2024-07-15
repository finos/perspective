cmake_minimum_required(VERSION 3.18.2)
project(perspective-protos CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT DEFINED psp_build_message)
    function(psp_build_message message)
        set(BUILD_MESSAGE "${BUILD_MESSAGE}\n${message}")
    endfunction()
endif()

# Include the FindProtobuf.cmake module
if(NOT DEFINED PSP_CMAKE_MODULE_PATH)
    set(PSP_CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../cmake")
    message(STATUS "PSP_CMAKE_MODULE_PATH not defined, using ${PSP_CMAKE_MODULE_PATH}")
endif()
list(APPEND CMAKE_MODULE_PATH "${PSP_CMAKE_MODULE_PATH}/modules")

find_package(Protoc REQUIRED)
find_package(InstallDependency REQUIRED)

set(protobuf_BUILD_TESTS OFF)
set(protobuf_HAVE_BUILTIN_ATOMICS TRUE)
# https://github.com/open-telemetry/opentelemetry-cpp/issues/2998
psp_build_dep("protobuf" "${PSP_CMAKE_MODULE_PATH}/protobuf.txt.in")

set(PROTO_FILES perspective.proto)

protobuf_generate_cpp(PROTO_SRCS PROTO_HDRS ${PROTO_FILES})
add_library(protos STATIC ${PROTO_SRCS} ${PROTO_HDRS})
target_include_directories(protos PRIVATE ${CMAKE_CURRENT_BINARY_DIR}/protobuf-src/src)
target_include_directories(protos PUBLIC ${CMAKE_BINARY_DIR}/protos-build)
target_link_libraries(protos protobuf::libprotobuf)