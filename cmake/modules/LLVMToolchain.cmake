set(LLVM_ROOT $ENV{LLVM_ROOT})

set(CMAKE_C_COMPILER "${LLVM_ROOT}/bin/clang")
set(CMAKE_CXX_COMPILER "${LLVM_ROOT}/bin/clang++")
set(CMAKE_AR "${LLVM_ROOT}/bin/llvm-ar")
set(CMAKE_RANLIB "${LLVM_ROOT}/bin/llvm-ranlib")

# include_directories(BEFORE SYSTEM "${LLVM_ROOT}/include")
# link_directories(BEFORE "${LLVM_ROOT}/lib")