# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

FROM python:3.7
RUN apt-get update
RUN apt-get -y install apt-transport-https libtbb-dev rapidjson-dev sudo
RUN apt-get -y remove python3

RUN wget https://cmake.org/files/v3.15/cmake-3.15.4-Linux-x86_64.sh -q
RUN mkdir /opt/cmake
RUN printf "y\nn\n" | sh cmake-3.15.4-Linux-x86_64.sh --prefix=/opt/cmake > /dev/null
RUN rm -fr cmake*.sh /opt/cmake/doc
RUN rm -fr /opt/cmake/bin/cmake-gui
RUN rm -fr /opt/cmake/bin/ccmake
RUN rm -fr /opt/cmake/bin/cpack
RUN ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake
RUN ln -s /opt/cmake/bin/ctest /usr/local/bin/ctest

RUN python3.7 -m pip install numpy pandas cython codecov nose2 mock flake8 pytest pytest-cov traitlets ipywidgets faker psutil

# install boost
RUN wget https://dl.bintray.com/boostorg/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null 2>&1
RUN tar xfz boost_1_71_0.tar.gz
# https://github.com/boostorg/build/issues/468
RUN cd boost_1_71_0 && ./bootstrap.sh
RUN cd boost_1_71_0 && ./b2 -j8 --with-program_options --with-filesystem --with-system install 

RUN python3 -m pip install 'numpy>=1.13.1' 'pandas>=0.22.0'

# install pyarrow
RUN wget https://github.com/apache/arrow/archive/apache-arrow-0.15.1.tar.gz >/dev/null 2>&1  || echo "wget arrow failed"
RUN tar xfz apache-arrow-0.15.1.tar.gz
RUN cd arrow-apache-arrow-0.15.1 && mkdir build && cd build && cmake ../cpp/ -DARROW_RPATH_ORIGIN=ON -DARROW_PYTHON=ON -DARROW_FLIGHT=OFF -DARROW_IPC=ON -DARROW_COMPUTE=ON -DCMAKE_INSTALL_PREFIX=/usr -DARROW_DATASET=OFF -DARROW_BUILD_UTILITIES=OFF -DARROW_JEMALLOC=OFF -DARROW_DEPENDENCY_SOURCE=BUNDLED -DARROW_HDFS=OFF -DARROW_WITH_BACKTRACE=OFF -DARROW_WITH_BROTLI=OFF -DARROW_WITH_BZ2=OFF -DARROW_WITH_LZ4=OFF -DARROW_WITH_SNAPPY=OFF -DARROW_WITH_ZLIB=OFF -DARROW_WITH_ZSTD=OFF && make -j2 && sudo make install && cd ../python && PYARROW_BUNDLE_ARROW_CPP=1 sudo python3.7 setup.py install --single-version-externally-managed --record RECORD

# install node
RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
RUN apt-get -y install nodejs

RUN npm install --global yarn
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
