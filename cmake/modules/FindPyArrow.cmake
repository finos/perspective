# Find the Python PyArrow package
# PYTHON_PYARROW_INCLUDE_DIR
# PYTHON_PYARROW_FOUND
# PYTHON_PYARROW_LIBRARY_DIR
# PYTHON_PYARROW_LIBRARIES
# will be set by this script

cmake_minimum_required(VERSION 2.6)

if(NOT PYTHON_EXECUTABLE)
  if(PyArrow_FIND_QUIETLY)
    find_package( PythonInterp 3.7 REQUIRED )
  else()
    find_package( PythonInterp 3.7 REQUIRED )
    set(__numpy_out 1)
  endif()
endif()

if (PYTHON_EXECUTABLE)
  # Find out the include path
  execute_process(
    COMMAND "${PYTHON_EXECUTABLE}" -c
            "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.get_include(), end='')\nexcept:pass"
            OUTPUT_VARIABLE __pyarrow_path)
  # And the lib dirs
  execute_process(
    COMMAND "${PYTHON_EXECUTABLE}" -c
            "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.get_library_dirs()[0], end='')\nexcept:pass"
    OUTPUT_VARIABLE __pyarrow_library_dirs)

  # And the lib dirs
  execute_process(
    COMMAND "${PYTHON_EXECUTABLE}" -c
            "from __future__ import print_function\ntry: import pyarrow; print(' '.join(pyarrow.get_libraries()), end='')\nexcept:pass"
    OUTPUT_VARIABLE __pyarrow_libraries)

  # And the version
  execute_process(
    COMMAND "${PYTHON_EXECUTABLE}" -c
            "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.__version__, end='')\nexcept:pass"
    OUTPUT_VARIABLE __pyarrow_version)
elseif(__pyarrow_out)
  message(STATUS "Python executable not found.")
endif(PYTHON_EXECUTABLE)

find_path(PYTHON_PYARROW_INCLUDE_DIR arrow/python/api.h
  HINTS "${__pyarrow_path}" "${PYTHON_INCLUDE_PATH}" NO_DEFAULT_PATH)

set(PYTHON_PYARROW_LIBRARY_DIR ${__pyarrow_library_dirs})

if (CMAKE_SYSTEM_NAME MATCHES "Darwin")
  # Link against pre-built libarrow on MacOS
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${__pyarrow_library_dirs}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python.15${CMAKE_SHARED_LIBRARY_SUFFIX})
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${__pyarrow_library_dirs}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow.15${CMAKE_SHARED_LIBRARY_SUFFIX})
else()
  # linux
  set(PYTHON_PYARROW_PYTHON_SHARED_LIBRARY ${__pyarrow_library_dirs}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow_python${CMAKE_SHARED_LIBRARY_SUFFIX}.15)
  set(PYTHON_PYARROW_ARROW_SHARED_LIBRARY ${__pyarrow_library_dirs}/${CMAKE_SHARED_LIBRARY_PREFIX}arrow${CMAKE_SHARED_LIBRARY_SUFFIX}.15)
endif()

set(PYTHON_PYARROW_LIBRARIES ${__pyarrow_libraries})

if(PYTHON_PYARROW_INCLUDE_DIR AND PYTHON_PYARROW_LIBRARIES)
  set(PYTHON_PYARROW_FOUND 1 CACHE INTERNAL "Python pyarrow found")
endif()

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(PyArrow REQUIRED_VARS PYTHON_PYARROW_INCLUDE_DIR PYTHON_PYARROW_LIBRARIES
                                        VERSION_VAR __pyarrow_version)
