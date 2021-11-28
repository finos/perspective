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

# - Find re2 headers and lib.
# RE2_ROOT hints the location
# This module defines
#  RE2_INCLUDE_DIR, directory containing headers
#  RE2_STATIC_LIB, path to libsnappy.a

set(RE2_SEARCH_HEADER_PATHS ${RE2_ROOT}/include)

set(RE2_SEARCH_LIB_PATHS ${RE2_ROOT}/lib)

find_path(RE2_INCLUDE_DIR re2/re2.h
  PATHS ${RE2_SEARCH_HEADER_PATHS}
        NO_DEFAULT_PATH
  DOC  "Google's re2 regex header path"
)

find_library(RE2_LIBS NAMES re2
  PATHS ${RE2_SEARCH_LIB_PATHS}
        NO_DEFAULT_PATH
  DOC   "Google's re2 regex library"
)

find_library(RE2_STATIC_LIB NAMES libre2.a
  PATHS ${RE2_SEARCH_LIB_PATHS}
        NO_DEFAULT_PATH
  DOC   "Google's re2 regex static library"
)

message(STATUS ${RE2_INCLUDE_DIR})

if (NOT RE2_INCLUDE_DIR OR NOT RE2_LIBS OR
    NOT RE2_STATIC_LIB)
  set(RE2_FOUND FALSE)
  message(FATAL_ERROR "Re2 includes and libraries NOT found. "
    "Looked for headers in ${RE2_SEARCH_HEADER_PATH}, "
    "and for libs in ${RE2_SEARCH_LIB_PATH}")
else()
  set(RE2_FOUND TRUE)
endif ()

mark_as_advanced(
  RE2_INCLUDE_DIR
  RE2_LIBS
  RE2_STATIC_LIB
)