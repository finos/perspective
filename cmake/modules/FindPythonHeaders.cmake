cmake_minimum_required(VERSION 3.7.2)

# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

#[=======================================================================[.rst:
FindPythonHeaders
--------------

.. deprecated:: 3.12

  Use :module:`FindPython3`, :module:`FindPython2` or :module:`FindPython` instead.

Find python libraries

This module finds if Python is installed and determines where the
include files and libraries are.  It also determines what the name of
the library is.  This code sets the following variables:

::

  PYTHONLIBS_FOUND           - have the Python libs been found
  PYTHON_LIBRARIES           - path to the python library
  PYTHON_INCLUDE_PATH        - path to where Python.h is found (deprecated)
  PYTHON_INCLUDE_DIRS        - path to where Python.h is found
  PYTHON_DEBUG_LIBRARIES     - path to the debug library (deprecated)
  PYTHONLIBS_VERSION_STRING  - version of the Python libs found (since CMake 2.8.8)



The Python_ADDITIONAL_VERSIONS variable can be used to specify a list
of version numbers that should be taken into account when searching
for Python.  You need to set this variable before calling
find_package(PythonLibs).

If you'd like to specify the installation of Python to use, you should
modify the following cache variables:

::

  PYTHON_LIBRARY             - path to the python library
  PYTHON_INCLUDE_DIR         - path to where Python.h is found

If calling both ``find_package(PythonInterp)`` and
``find_package(PythonLibs)``, call ``find_package(PythonInterp)`` first to
get the currently active Python version by default with a consistent version
of PYTHON_LIBRARIES.
#]=======================================================================]

# Use the executable's path as a hint
set(_Python_LIBRARY_PATH_HINT)
if(IS_ABSOLUTE "${Python_EXECUTABLE}")
  if(WIN32)
    get_filename_component(_Python_PREFIX "${Python_EXECUTABLE}" PATH)
    if(_Python_PREFIX)
      set(_Python_LIBRARY_PATH_HINT ${_Python_PREFIX}/libs)
    endif()
    unset(_Python_PREFIX)
  else()
    get_filename_component(_Python_PREFIX "${Python_EXECUTABLE}" PATH)
    get_filename_component(_Python_PREFIX "${_Python_PREFIX}" PATH)
    if(_Python_PREFIX)
      set(_Python_LIBRARY_PATH_HINT ${_Python_PREFIX}/lib)
    endif()
    unset(_Python_PREFIX)
  endif()
endif()

include(CMakeFindFrameworks)
# Search for the python framework on Apple.
CMAKE_FIND_FRAMEWORKS(Python)

# Save CMAKE_FIND_FRAMEWORK
if(DEFINED CMAKE_FIND_FRAMEWORK)
  set(_PythonLibs_CMAKE_FIND_FRAMEWORK ${CMAKE_FIND_FRAMEWORK})
else()
  unset(_PythonLibs_CMAKE_FIND_FRAMEWORK)
endif()
# To avoid picking up the system Python.h pre-maturely.
set(CMAKE_FIND_FRAMEWORK LAST)

set(_PYTHON1_VERSIONS 1.6 1.5)
set(_PYTHON2_VERSIONS 2.7 2.6 2.5 2.4 2.3 2.2 2.1 2.0)
set(_PYTHON3_VERSIONS 3.12 3.11 3.10 3.9 3.8 3.7 3.6 3.5 3.4 3.3 3.2 3.1 3.0)

if(PythonLibs_FIND_VERSION)
    if(PythonLibs_FIND_VERSION_COUNT GREATER 1)
        set(_PYTHON_FIND_MAJ_MIN "${PythonLibs_FIND_VERSION_MAJOR}.${PythonLibs_FIND_VERSION_MINOR}")
        unset(_PYTHON_FIND_OTHER_VERSIONS)
        if(PythonLibs_FIND_VERSION_EXACT)
            if(_PYTHON_FIND_MAJ_MIN STREQUAL PythonLibs_FIND_VERSION)
                set(_PYTHON_FIND_OTHER_VERSIONS "${PythonLibs_FIND_VERSION}")
            else()
                set(_PYTHON_FIND_OTHER_VERSIONS "${PythonLibs_FIND_VERSION}" "${_PYTHON_FIND_MAJ_MIN}")
            endif()
        else()
            foreach(_PYTHON_V ${_PYTHON${PythonLibs_FIND_VERSION_MAJOR}_VERSIONS})
                if(NOT _PYTHON_V VERSION_LESS _PYTHON_FIND_MAJ_MIN)
                    list(APPEND _PYTHON_FIND_OTHER_VERSIONS ${_PYTHON_V})
                endif()
             endforeach()
        endif()
        unset(_PYTHON_FIND_MAJ_MIN)
    else()
        set(_PYTHON_FIND_OTHER_VERSIONS ${_PYTHON${PythonLibs_FIND_VERSION_MAJOR}_VERSIONS})
    endif()
else()
    set(_PYTHON_FIND_OTHER_VERSIONS ${_PYTHON3_VERSIONS} ${_PYTHON2_VERSIONS} ${_PYTHON1_VERSIONS})
endif()

# Set up the versions we know about, in the order we will search. Always add
# the user supplied additional versions to the front.
# If FindPythonInterp has already found the major and minor version,
# insert that version between the user supplied versions and the stock
# version list.
set(_Python_VERSIONS ${Python_ADDITIONAL_VERSIONS})
if(DEFINED PYTHON_VERSION_MAJOR AND DEFINED PYTHON_VERSION_MINOR)
  list(APPEND _Python_VERSIONS ${PYTHON_VERSION_MAJOR}.${PYTHON_VERSION_MINOR})
endif()
list(APPEND _Python_VERSIONS ${_PYTHON_FIND_OTHER_VERSIONS})

unset(_PYTHON_FIND_OTHER_VERSIONS)
unset(_PYTHON1_VERSIONS)
unset(_PYTHON2_VERSIONS)
unset(_PYTHON3_VERSIONS)

# Python distribution: define which architectures can be used
if (CMAKE_SIZEOF_VOID_P)
  # In this case, search only for 64bit or 32bit
  math (EXPR _PYTHON_ARCH "${CMAKE_SIZEOF_VOID_P} * 8")
  set (_PYTHON_ARCH2 _PYTHON_PREFIX_ARCH})
else()
  if (Python_EXECUTABLE)
    # determine interpreter architecture
    execute_process (COMMAND "${Python_EXECUTABLE}" -c "import sys; print(sys.maxsize > 2**32)"
                     RESULT_VARIABLE _PYTHON_RESULT
                     OUTPUT_VARIABLE _PYTHON_IS64BIT
                     ERROR_VARIABLE _PYTHON_IS64BIT)
      if (NOT _PYTHON_RESULT)
        if (_PYTHON_IS64BIT)
          set (_PYTHON_ARCH 64)
          set (_PYTHON_ARCH2 64)
        else()
          set (_PYTHON_ARCH 32)
          set (_PYTHON_ARCH2 32)
        endif()
      endif()
  else()
    # architecture unknown, search for both 64bit and 32bit
    set (_PYTHON_ARCH 64)
    set (_PYTHON_ARCH2 32)
  endif()
endif()

foreach(_CURRENT_VERSION ${_Python_VERSIONS})
  string(REPLACE "." "" _CURRENT_VERSION_NO_DOTS ${_CURRENT_VERSION})
  if(WIN32)
    find_library(PYTHON_DEBUG_LIBRARY
      NAMES python${_CURRENT_VERSION_NO_DOTS}_d python
      NAMES_PER_DIR
      HINTS ${_Python_LIBRARY_PATH_HINT}
      PATHS
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}\\InstallPath]/libs/Debug
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH}\\InstallPath]/libs/Debug
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH2}\\InstallPath]/libs/Debug
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}\\InstallPath]/libs/Debug
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH}\\InstallPath]/libs/Debug
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH2}\\InstallPath]/libs/Debug
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}\\InstallPath]/libs
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH}\\InstallPath]/libs
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH2}\\InstallPath]/libs
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}\\InstallPath]/libs
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH}\\InstallPath]/libs
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH2}\\InstallPath]/libs
      )
  endif()

  set(PYTHON_FRAMEWORK_LIBRARIES)
  if(Python_FRAMEWORKS AND NOT PYTHON_LIBRARY)
    foreach(dir ${Python_FRAMEWORKS})
      list(APPEND PYTHON_FRAMEWORK_LIBRARIES
           ${dir}/Versions/${_CURRENT_VERSION}/lib)
    endforeach()
  endif()
  # Use the library's install prefix as a hint
  set(_Python_INCLUDE_PATH_HINT)
  # PYTHON_LIBRARY may contain a list because of SelectLibraryConfigurations
  # which may have been run previously. If it is the case, the list can be:
  #   optimized;<FILEPATH_TO_RELEASE_LIBRARY>;debug;<FILEPATH_TO_DEBUG_LIBRARY>
  foreach(lib ${PYTHON_LIBRARY} ${PYTHON_DEBUG_LIBRARY})
    if(IS_ABSOLUTE "${lib}")
      get_filename_component(_Python_PREFIX "${lib}" PATH)
      get_filename_component(_Python_PREFIX "${_Python_PREFIX}" PATH)
      if(_Python_PREFIX)
        list(APPEND _Python_INCLUDE_PATH_HINT ${_Python_PREFIX}/include)
      endif()
      unset(_Python_PREFIX)
    endif()
  endforeach()

  # Add framework directories to the search paths
  set(PYTHON_FRAMEWORK_INCLUDES)
  if(Python_FRAMEWORKS AND NOT PYTHON_INCLUDE_DIR)
    foreach(dir ${Python_FRAMEWORKS})
      list(APPEND PYTHON_FRAMEWORK_INCLUDES
        ${dir}/Versions/${_CURRENT_VERSION}/include)
    endforeach()
  endif()

  find_path(PYTHON_INCLUDE_DIR
    NAMES Python.h
    HINTS
      ${_Python_INCLUDE_PATH_HINT}
    PATHS
      ${PYTHON_FRAMEWORK_INCLUDES}
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}\\InstallPath]/include
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH}\\InstallPath]/include
      [HKEY_LOCAL_MACHINE\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH2}\\InstallPath]/include
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}\\InstallPath]/include
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH}\\InstallPath]/include
      [HKEY_CURRENT_USER\\SOFTWARE\\Python\\PythonCore\\${_CURRENT_VERSION}-${_PYTHON_ARCH2}\\InstallPath]/include
    PATH_SUFFIXES
      python${_CURRENT_VERSION}mu
      python${_CURRENT_VERSION}m
      python${_CURRENT_VERSION}u
      python${_CURRENT_VERSION}
  )

  # For backward compatibility, set PYTHON_INCLUDE_PATH.
  set(PYTHON_INCLUDE_PATH "${PYTHON_INCLUDE_DIR}")

  if(PYTHON_INCLUDE_DIR AND EXISTS "${PYTHON_INCLUDE_DIR}/patchlevel.h")
    file(STRINGS "${PYTHON_INCLUDE_DIR}/patchlevel.h" python_version_str
         REGEX "^#define[ \t]+PY_VERSION[ \t]+\"[^\"]+\"")
    string(REGEX REPLACE "^#define[ \t]+PY_VERSION[ \t]+\"([^\"]+)\".*" "\\1"
                         PYTHONLIBS_VERSION_STRING "${python_version_str}")
    unset(python_version_str)
  endif()

  if(PYTHON_INCLUDE_DIR)
    break()
  endif()
endforeach()

unset(_Python_INCLUDE_PATH_HINT)
unset(_Python_LIBRARY_PATH_HINT)

mark_as_advanced(
  PYTHON_INCLUDE_DIR
)

# We use PYTHON_INCLUDE_DIR, PYTHON_LIBRARY and PYTHON_DEBUG_LIBRARY for the
# cache entries because they are meant to specify the location of a single
# library. We now set the variables listed by the documentation for this
# module.
set(Python_INCLUDE_DIRS "${PYTHON_INCLUDE_DIR}")
unset(PYTHON_FOUND)

# Restore CMAKE_FIND_FRAMEWORK
if(DEFINED _PythonLibs_CMAKE_FIND_FRAMEWORK)
  set(CMAKE_FIND_FRAMEWORK ${_PythonLibs_CMAKE_FIND_FRAMEWORK})
  unset(_PythonLibs_CMAKE_FIND_FRAMEWORK)
else()
  unset(CMAKE_FIND_FRAMEWORK)
endif()

include(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(PythonHeaders
                                  REQUIRED_VARS Python_INCLUDE_DIRS
                                  VERSION_VAR PYTHONLIBS_VERSION_STRING)
