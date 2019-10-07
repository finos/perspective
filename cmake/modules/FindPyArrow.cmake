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
            "from __future__ import print_function\ntry: import pyarrow; print(pyarrow.get_libraries()[1], end='')\nexcept:pass"
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

# DONT USE, could conflict on arrow lib
# set(PYTHON_PYARROW_LIBRARIES ${__pyarrow_libraries})
set(PYTHON_PYARROW_LIBRARIES "arrow_python")

if(PYTHON_PYARROW_INCLUDE_DIR)
  set(PYTHON_PYARROW_FOUND 1 CACHE INTERNAL "Python pyarrow found")
endif(PYTHON_PYARROW_INCLUDE_DIR)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(PyArrow REQUIRED_VARS PYTHON_PYARROW_INCLUDE_DIR
                                        VERSION_VAR __pyarrow_version)
