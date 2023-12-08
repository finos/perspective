find_program(PROTOC_EXECUTABLE NAMES protoc)

if(NOT PROTOC_EXECUTABLE)
    message(FATAL_ERROR "protoc not found")
    set(Protoc_FOUND FALSE)
else()
    set(Protoc_FOUND TRUE)
    message(STATUS "Found protoc: ${PROTOC_EXECUTABLE}")

    function(CHECK_PROTOC_VERSION)
        execute_process(
            COMMAND ${PROTOC_EXECUTABLE} --version
            OUTPUT_VARIABLE PROTOC_VERSION_OUTPUT
            OUTPUT_STRIP_TRAILING_WHITESPACE
        )

        if(NOT PROTOC_VERSION_OUTPUT MATCHES "^libprotoc ([0-9]+)\\.([0-9]+)(:?\\.([0-9]+))?")
            message(WARNING "Unable to determine protoc version")
            return()
        endif()

        set(PROTOC_VERSION_MAJOR ${CMAKE_MATCH_1})
        set(PROTOC_VERSION_MINOR ${CMAKE_MATCH_2})
        set(PROTOC_VERSION_PATCH ${CMAKE_MATCH_3})

        if (NOT PROTOC_VERSION_PATCH)
            set(FOUND_VERSION "${PROTOC_VERSION_MAJOR}.${PROTOC_VERSION_MINOR}")
        else()
            set(FOUND_VERSION "${PROTOC_VERSION_MAJOR}.${PROTOC_VERSION_MINOR}.${PROTOC_VERSION_PATCH}")
        endif()
        
        # Force the external project to use the same version as our installed protoc CLI
        set(LIBPROTOBUF_VERSION "v${FOUND_VERSION}" PARENT_SCOPE)

        set(MIN_PROTOC_VERSION_MAJOR 24)

        if(PROTOC_VERSION_MAJOR LESS MIN_PROTOC_VERSION_MAJOR)
            message(FATAL_ERROR "protoc version ${FOUND_VERSION} is too old, at least ${MIN_PROTOC_VERSION_MAJOR}.x.x is required")
        else()
            message(STATUS "Found protoc version ${FOUND_VERSION}")
        endif()
    endfunction()

    # Check the version of protoc
    CHECK_PROTOC_VERSION()
endif()

# Function to compile .proto files to C++ with protoc
function(protobuf_generate_cpp SRCS HDRS)
    if(NOT ARGN)
        message(SEND_ERROR "Error: protobuf_generate_cpp() called without any proto files")
        return()
    endif()

    set(_PROTOBUF_GENERATE_CPP_SRCS)
    set(_PROTOBUF_GENERATE_CPP_HDRS)

    foreach(PROTO_FILE ${ARGN})
        get_filename_component(PROTO_NAME ${PROTO_FILE} NAME_WE)
        get_filename_component(PROTO_PATH ${PROTO_FILE} PATH)

        set(GENERATED_SRC "${CMAKE_CURRENT_BINARY_DIR}/${PROTO_NAME}.pb.cc")
        set(GENERATED_HDR "${CMAKE_CURRENT_BINARY_DIR}/${PROTO_NAME}.pb.h")

        execute_process(
            # COMMAND ${PROTOC_EXECUTABLE} --cpp_out ${CMAKE_CURRENT_BINARY_DIR} --proto_path ${PROTO_PATH} ${PROTO_FILE}
            COMMAND ${PROTOC_EXECUTABLE} --cpp_out ${CMAKE_CURRENT_BINARY_DIR} ${PROTO_FILE}
            RESULT_VARIABLE PROTOC_RESULT
            OUTPUT_VARIABLE PROTOC_OUTPUT
            ERROR_VARIABLE PROTOC_ERROR
            WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        )

        if(NOT ${PROTOC_RESULT} EQUAL 0)
            message(FATAL_ERROR "protoc failed: ${PROTOC_ERROR}")
        endif()

        list(APPEND _PROTOBUF_GENERATE_CPP_SRCS "${GENERATED_SRC}")
        list(APPEND _PROTOBUF_GENERATE_CPP_HDRS "${GENERATED_HDR}")
    endforeach()
    set(${SRCS} ${_PROTOBUF_GENERATE_CPP_SRCS} PARENT_SCOPE)
    set(${HDRS} ${_PROTOBUF_GENERATE_CPP_HDRS} PARENT_SCOPE)
endfunction()
