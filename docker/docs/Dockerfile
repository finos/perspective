# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

FROM python:3.7
# use the python one as its needs to be compiled for the docs to generate right

RUN apt-get update
RUN apt-get -y install apt-transport-https libtbb-dev cmake doxygen
RUN apt-get -y remove python3

RUN python3.7 -m pip install numpy pandas

RUN ls -al /usr/local/lib/python3.7/site-packages/numpy

RUN wget https://boostorg.jfrog.io/artifactory/main/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null 2>&1  || echo "wget failed"
RUN tar xfz boost_1_67_0.tar.gz
RUN cd boost_1_67_0 && CPLUS_INCLUDE_PATH="$CPLUS_INCLUDE_PATH:/usr/local/include/python3.7m" C_INCLUDE_PATH="$C_INCLUDE_PATH:/usr/local/include/python3.7m" ./bootstrap.sh --with-python=/usr/local/bin/python3.7  || echo "boostrap failed"
RUN cd boost_1_67_0 && CPLUS_INCLUDE_PATH="$CPLUS_INCLUDE_PATH:/usr/local/include/python3.7m" C_INCLUDE_PATH="$C_INCLUDE_PATH:/usr/local/include/python3.7m" ./b2 -j4 install || echo "build boost failed" 

RUN ln -s /usr/local/lib/libboost_python37.so /usr/local/lib/libboost_python.so
RUN ln -s /usr/local/lib/libboost_numpy37.so /usr/local/lib/libboost_numpy.so
RUN python3 -m pip install 'numpy>=1.13.1' 'pandas>=0.22.0'

# docs dependencies
RUN python3 -m pip install breathe sphinx_rtd_theme sphinx

# install from here from now, waiting on https://github.com/mozilla/sphinx-js/issues/94
RUN python3 -m pip install git+https://github.com/timkpaine/sphinx-js
RUN python3 -m pip install git+https://github.com/texodus/recommonmark

