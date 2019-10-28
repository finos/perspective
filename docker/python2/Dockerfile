# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

FROM python:2.7

RUN apt-get update
RUN apt-get -y install apt-transport-https libtbb-dev rapidjson-dev cmake sudo
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
RUN apt-get -y install npm
RUN apt-get -y remove python

RUN python2.7 -m pip install numpy pandas

RUN ls -al /usr/local/lib/python2.7/site-packages/numpy

RUN wget https://dl.bintray.com/boostorg/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null 2>&1  || echo "wget failed"
RUN tar xfz boost_1_71_0.tar.gz
# https://github.com/boostorg/build/issues/468
RUN cd boost_1_71_0 && CPLUS_INCLUDE_PATH="/usr/local/include/python2.7m" C_INCLUDE_PATH="$C_INCLUDE_PATH:/usr/local/include/python2.7m" ./bootstrap.sh --with-python=/usr/local/bin/python2.7 || echo "boostrap failed"
RUN cd boost_1_71_0 && CPLUS_INCLUDE_PATH="$CPLUS_INCLUDE_PATH:/usr/local/include/python2.7m" C_INCLUDE_PATH="$C_INCLUDE_PATH:/usr/local/include/python2.7m" ./b2 -j4 install || echo "build boost failed" 

RUN ln -s /usr/local/lib/libboost_python27.so /usr/local/lib/libboost_python.so
RUN ln -s /usr/local/lib/libboost_numpy27.so /usr/local/lib/libboost_numpy.so

RUN python2.7 -m pip install 'mock==2.0.0' codecov nose2 flake8 pytest pytest-cov traitlets ipywidgets faker psutil zerorpc 'backports.shutil_which'
RUN python2.7 -m pip install 'numpy>=1.13.1' 'pandas>=0.22.0' 'pyarrow==0.15.0'

RUN curl -o- -L https://yarnpkg.com/install.sh | bash
RUN yarn --version

RUN mkdir -p /usr/local \
    && cd /usr/local \
    && git clone https://github.com/google/flatbuffers.git \
    && cd flatbuffers \
    && cmake -G "Unix Makefiles" \
    && make \
    && cp -r /usr/local/flatbuffers/include/flatbuffers /usr/local/include \
    && ln -s /usr/local/flatbuffers/flatc /usr/local/bin/flatc \
    && chmod +x /usr/local/flatbuffers/flatc
