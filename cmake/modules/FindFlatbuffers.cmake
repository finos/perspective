cmake_minimum_required(VERSION 3.7.2)

##############################################################################
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
##############################################################################

# Find FLATBUFFERS (flatbuffers/include, libflatbuffers.a, flatc)
# This module defines:
# FLATBUFFERS_INCLUDE_DIR, directory containing headers
# FLATBUFFERS_STATIC_LIB, path to flatbuffers's static library
# FLATBUFFERS_COMPILER, path to flatc compiler
#
# TODO: [01-15-2021] now that we use Flatbuffers on all platforms, it might be
# a good time to figure out how we can install Flatbuffers as a dependency
# inside our CMakeLists (we would just need to build the flatc executable
# before our Arrow build starts). Right now, I've put in some hacks to make
# sure our Windows build works on Azure by pre-installing flatc (like we do on
# all other platforms), and then pulling down the headers for Windows so they
# can be included.

# this might fail
# https://gitlab.kitware.com/cmake/cmake/issues/19120
#
# find_path(FLATBUFFERS_INCLUDE_DIR flatbuffers/flatbuffers.h
#   PATHS ${FLATBUFFERS_ROOT}/include
#   HINTS /usr/local /usr/local/flatbuffers /usr/local/Homebrew /usr ~/homebrew/ /usr/local/include /usr/local/flatbuffers/include /usr/include ~/homebrew/include /opt/homebrew/include  ${CMAKE_SOURCE_DIR}/../../vcpkg/installed/x64-windows/include
#   NO_CMAKE_SYSTEM_PATH
#   NO_SYSTEM_ENVIRONMENT_PATH)

# find_program(FLATBUFFERS_COMPILER flatc
#   PATHS ${FLATBUFFERS_ROOT}/bin
#   HINTS /usr/local/bin /usr/bin /usr/local/Homebrew/bin ~/homebrew/bin /opt/homebrew/bin ${CMAKE_SOURCE_DIR}/../../vcpkg/installed/x64-windows/tools/flatbuffers
#   NO_CMAKE_SYSTEM_PATH
#   NO_SYSTEM_ENVIRONMENT_PATH)

# if(NOT ${FLATBUFFERS_INCLUDE_DIR})
#   # HACK
#   set(FLATBUFFERS_INCLUDE_DIR /usr/local/include)
# endif()

# include(FindPackageHandleStandardArgs)

# if (WIN32)
#   find_package_handle_standard_args(Flatbuffers REQUIRED_VARS
#     FLATBUFFERS_INCLUDE_DIR FLATBUFFERS_COMPILER)
# else()
#   find_package_handle_standard_args(FLATBUFFERS REQUIRED_VARS
#     FLATBUFFERS_INCLUDE_DIR FLATBUFFERS_COMPILER)
# endif()