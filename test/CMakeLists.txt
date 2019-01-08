set (TEST_FILES
    cpp/psp.cpp
    cpp/simple.cpp
)

include_directories("include")
add_executable(psp_test ${TEST_FILES})

target_link_libraries(psp_test gtest_main tbb psp)
add_test(NAME psptest COMMAND psp_test)
