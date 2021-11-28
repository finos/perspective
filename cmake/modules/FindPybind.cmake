# Find the Python PyBind package
# PYTHON_PYBIND_INCLUDE_DIR
# PYTHON_PYBIND_FOUND
# will be set by this script

cmake_minimum_required(VERSION 3.7.2)

if(NOT Python_EXECUTABLE)
  if(PyArrow_FIND_QUIETLY)
    find_package( PythonInterp 3.7 REQUIRED )
  else()
    find_package( PythonInterp 3.7 REQUIRED )
    set(__numpy_out 1)
  endif()
endif()

if (Python_EXECUTABLE)
  # Find out the include path
  execute_process(
    COMMAND "${Python_EXECUTABLE}" -c
            "from __future__ import print_function\ntry: import pybind11; print(pybind11.get_include(), end='')\nexcept:pass"
            OUTPUT_VARIABLE __pybind_path)

  execute_process(
    COMMAND "${Python_EXECUTABLE}" -c
            "from __future__ import print_function\ntry: import pybind11; print('.'.join(str(int(x)) for x in pybind11.version_info), end='')\nexcept:pass"
            OUTPUT_VARIABLE __pybind_version)
elseif(__pybind_out)
  message(STATUS "Python executable not found.")
endif(Python_EXECUTABLE)

find_path(PYTHON_PYBIND_INCLUDE_DIR pybind11/pybind11.h
  HINTS "${__pybind_path}" "${PYTHON_INCLUDE_PATH}" NO_DEFAULT_PATH)

if(PYTHON_PYBIND_INCLUDE_DIR)
  set(PYTHON_PYBIND_FOUND 1 CACHE INTERNAL "Python pybind11 found")
endif()

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(PyBind REQUIRED_VARS PYTHON_PYBIND_INCLUDE_DIR VERSION_VAR __pybind_version)
