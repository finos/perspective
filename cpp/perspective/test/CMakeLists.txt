set (TEST_FILES
    cpp/psp.cpp
    cpp/simple.cpp
)

include_directories("include")
add_executable(psp_test ${TEST_FILES})

if(WIN32)
	target_compile_definitions(psp_test PRIVATE WIN32=1)
endif()

target_link_libraries(psp_test psp gtest_main tbb )
add_test(NAME psptest COMMAND psp_test)
