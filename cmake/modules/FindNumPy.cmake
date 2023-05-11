# Find the Python NumPy package
# PYTHON_NUMPY_INCLUDE_DIR
# PYTHON_NUMPY_FOUND
# will be set by this script

cmake_minimum_required(VERSION 3.7.2)

find_package( PythonInterp ${PSP_PYTHON_VERSION} EXACT REQUIRED )

# Find out the include path
execute_process(
  COMMAND "${Python_EXECUTABLE}" -c
          "from __future__ import print_function;import numpy;print(numpy.get_include(), end='')"
          OUTPUT_VARIABLE __numpy_path)
# And the version
execute_process(
  COMMAND "${Python_EXECUTABLE}" -c
          "from __future__ import print_function;import numpy;print(numpy.__version__, end='')"
  OUTPUT_VARIABLE __numpy_version)

find_path(PYTHON_NUMPY_INCLUDE_DIR numpy/arrayobject.h
  HINTS "${__numpy_path}" "${PYTHON_INCLUDE_PATH}" NO_DEFAULT_PATH)
# TODO(tom): find_path() should be setting PYTHON_NUMPY_INCLUDE_DIR but is not.
# the file exists, as proved by the following execute_process() call
execute_process (COMMAND bash -c "ls -l ${__numpy_path}/numpy/arrayobject.h")
set(PYTHON_NUMPY_INCLUDE_DIR "${__numpy_path}")

if(PYTHON_NUMPY_INCLUDE_DIR)
  set(PYTHON_NUMPY_FOUND 1 CACHE INTERNAL "Python numpy found")
endif(PYTHON_NUMPY_INCLUDE_DIR)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(NumPy REQUIRED_VARS PYTHON_NUMPY_INCLUDE_DIR
                                        VERSION_VAR __numpy_version)
