add_executable(psp_test psp.cpp)
target_link_libraries(psp_test gtest_main tbb tbbmalloc psp)
add_test(NAME psptest COMMAND psp_test)