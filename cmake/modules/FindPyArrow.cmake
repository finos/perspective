# Find the Python PyArrow package
# PYTHON_PYARROW_INCLUDE_DIR
# PYTHON_PYARROW_FOUND
# PYTHON_PYARROW_LIBRARY_DIR
# PYTHON_PYARROW_LIBRARIES
# will be set by this script
cmake_minimum_required(VERSION 2.6)

# Find out the include path
execute_process(
  COMMAND "${Python_EXECUTABLE}" -c
          "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.get_include(), end='')\nexcept:pass"
          OUTPUT_VARIABLE __pyarrow_path)

# And the lib dirs
execute_process(
  COMMAND "${Python_EXECUTABLE}" -c
          "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.get_library_dirs()[0], end='')\nexcept:pass"
  OUTPUT_VARIABLE __pyarrow_library_dirs)

# And the lib dirs
execute_process(
  COMMAND "${Python_EXECUTABLE}" -c
          "from __future__ import print_function\ntry: import pyarrow; print(' '.join(pyarrow.get_libraries()), end='')\nexcept:pass"
  OUTPUT_VARIABLE __pyarrow_libraries)

  # And the version
execute_process(
  COMMAND "${Python_EXECUTABLE}" -c
          "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.__version__, end='')\nexcept:pass"
  OUTPUT_VARIABLE __pyarrow_version)

  find_path(PYTHON_PYARROW_INCLUDE_DIR arrow/python/api.h
  HINTS "${__pyarrow_path}" "${PYTHON_INCLUDE_PATH}" NO_DEFAULT_PATH)

set(PYTHON_PYARROW_LIBRARY_DIR ${__pyarrow_library_dirs})

# Figure out the major version for the .so/.dylibs
string(REPLACE "." ";" PYARROW_VERSION_LIST ${__pyarrow_version})
list(GET PYARROW_VERSION_LIST 0 PYARROW_VERSION_MAJOR)
list(GET PYARROW_VERSION_LIST 1 PYARROW_VERSION_MINOR)
list(GET PYARROW_VERSION_LIST 2 PYARROW_VERSION_PATCH)

if(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
  # windows its just "arrow.dll"
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY "arrow_python")
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY "arrow")
elseif (CMAKE_SYSTEM_NAME MATCHES "Darwin" AND ${PYARROW_VERSION_MAJOR} NOT EQUAL "0")
  # Link against pre-built libarrow on MacOS
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python.${PYARROW_VERSION_MINOR}.dylib)
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow.${PYARROW_VERSION_MINOR}.dylib)
elseif (CMAKE_SYSTEM_NAME MATCHES "Darwin")
  # Link against pre-built libarrow on MacOS
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python.${PYARROW_VERSION_MAJOR}00.dylib)
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow.${PYARROW_VERSION_MAJOR}00.dylib)
elseif (${PYARROW_VERSION_MAJOR} NOT EQUAL "0")
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python${CMAKE_SHARED_LIBRARY_SUFFIX}.${PYARROW_VERSION_MINOR})
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow${CMAKE_SHARED_LIBRARY_SUFFIX}.${PYARROW_VERSION_MINOR})
else()
  # linux
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python${CMAKE_SHARED_LIBRARY_SUFFIX}.${PYARROW_VERSION_MAJOR}00)
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${PYTHON_PYARROW_LIBRARY_DIR}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow${CMAKE_SHARED_LIBRARY_SUFFIX}.${PYARROW_VERSION_MAJOR}00)
endif()

set(PYTHON_PYARROW_LIBRARIES ${PYTHON_PYARROW_PYTHON_SHARED_LIBRARY} ${PYTHON_PYARROW_ARROW_SHARED_LIBRARY})

if(PYTHON_PYARROW_INCLUDE_DIR AND PYTHON_PYARROW_LIBRARIES)
  set(PYTHON_PYARROW_FOUND 1 CACHE INTERNAL "Python pyarrow found")
endif()


# set(PYTHON_PYARROW_LIBRARIES ${PYTHON_PYARROW_PYTHON_SHARED_LIBRARY} ${PYTHON_PYARROW_ARROW_SHARED_LIBRARY})
# else()
# # linux
# set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python${CMAKE_SHARED_LIBRARY_SUFFIX}.${PYARROW_VERSION_MINOR})
# set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${CMAKE_SHARED_LIBRARY_PREFIX}arrow${CMAKE_SHARED_LIBRARY_SUFFIX}.${PYARROW_VERSION_MINOR})



include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(PyArrow REQUIRED_VARS PYTHON_PYARROW_INCLUDE_DIR PYTHON_PYARROW_LIBRARIES PYTHON_PYARROW_LIBRARY_DIR
                                        VERSION_VAR __pyarrow_version)
