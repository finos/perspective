# *****************************************************************************
#
# Copyright (c) 2020, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

FROM quay.io/pypa/manylinux2014_x86_64
RUN yum -y install rapidjson-devel sudo wget

# Build new cmake
RUN wget https://cmake.org/files/v3.15/cmake-3.15.4-Linux-x86_64.sh -q
RUN mkdir /opt/cmake
RUN printf "y\nn\n" | sh cmake-3.15.4-Linux-x86_64.sh --prefix=/opt/cmake > /dev/null
RUN rm -fr cmake*.sh /opt/cmake/doc
RUN rm -fr /opt/cmake/bin/cmake-gui
RUN rm -fr /opt/cmake/bin/ccmake
RUN rm -fr /opt/cmake/bin/cpack
RUN ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake
RUN ln -s /opt/cmake/bin/ctest /usr/local/bin/ctest

# Remove auditwheel for reinstall
RUN rm -rf /opt/python/cp36-cp36m/bin/auditwheel
RUN rm -rf /opt/python/cp37-cp37m/bin/auditwheel
RUN rm -rf /opt/python/cp38-cp38/bin/auditwheel


# Copy assets
RUN cp -arf /opt/python/cp36-cp36m/* /usr/local/
RUN cp -arf /opt/python/cp37-cp37m/* /usr/local/
RUN cp -arf /opt/python/cp38-cp38/* /usr/local/

ENV PATH=/usr/local/bin:$PATH

# Install dependencies
RUN python3.6 -m pip install numpy scipy pybind11 cython codecov mock flake8 pytest pytest-cov traitlets ipywidgets faker psutil
RUN python3.7 -m pip install numpy scipy pybind11 cython codecov mock flake8 pytest pytest-cov traitlets ipywidgets faker psutil
RUN python3.8 -m pip install numpy scipy pybind11 cython codecov mock flake8 pytest pytest-cov traitlets ipywidgets faker psutil

# Force reinstall auditwheel from Git master, as it does not overwrite
# rpaths - this was breaking manylinux wheels.
# https://github.com/pypa/auditwheel/pull/245#issuecomment-648132311
RUN git clone https://github.com/pypa/auditwheel.git ./auditwheel \
    && cd auditwheel \
    && python3.6 -m pip install --ignore-installed . \
    && python3.7 -m pip install --ignore-installed . \
    && python3.8 -m pip install --ignore-installed .

# install boost
RUN wget https://dl.bintray.com/boostorg/release/1.71.0/source/boost_1_71_0.tar.gz >/dev/null 2>&1
RUN tar xfz boost_1_71_0.tar.gz
# https://github.com/boostorg/build/issues/468
RUN cd boost_1_71_0 && ./bootstrap.sh
RUN cd boost_1_71_0 && ./b2 -j8 --with-program_options --with-filesystem --with-system install 

RUN python3.6 -m pip install 'numpy>=1.13.1' 'pandas>=0.22.0'
RUN python3.7 -m pip install 'numpy>=1.13.1' 'pandas>=0.22.0'
RUN python3.8 -m pip install 'numpy>=1.13.1' 'pandas>=0.22.0'

# install pyarrow
RUN wget https://github.com/apache/arrow/archive/apache-arrow-0.16.0.tar.gz >/dev/null 2>&1  || echo "wget arrow failed"
RUN tar xfz apache-arrow-0.16.0.tar.gz
RUN cd arrow-apache-arrow-0.16.0 && mkdir build && cd build && cmake ../cpp/ -DPython_ADDITIONAL_VERSIONS=3.7 -DARROW_RPATH_ORIGIN=ON -DARROW_PYTHON=ON -DARROW_FLIGHT=OFF -DARROW_IPC=ON -DARROW_COMPUTE=ON -DCMAKE_INSTALL_PREFIX=/usr -DARROW_DATASET=OFF -DARROW_BUILD_UTILITIES=OFF -DARROW_JEMALLOC=OFF -DARROW_DEPENDENCY_SOURCE=BUNDLED -DARROW_HDFS=OFF -DARROW_WITH_BACKTRACE=OFF -DARROW_WITH_BROTLI=OFF -DARROW_WITH_BZ2=OFF -DARROW_WITH_LZ4=OFF -DARROW_WITH_SNAPPY=OFF -DARROW_WITH_ZLIB=OFF -DARROW_WITH_ZSTD=OFF && make -j2 && sudo make install && cd ../python && PYARROW_BUNDLE_ARROW_CPP=1 sudo python3.7 setup.py install --single-version-externally-managed --record RECORD 
RUN cd arrow-apache-arrow-0.16.0 && rm -rf build && mkdir build && cd build && cmake ../cpp/ -DPython_ADDITIONAL_VERSIONS=3.6 -DARROW_RPATH_ORIGIN=ON -DARROW_PYTHON=ON -DARROW_FLIGHT=OFF -DARROW_IPC=ON -DARROW_COMPUTE=ON -DCMAKE_INSTALL_PREFIX=/usr -DARROW_DATASET=OFF -DARROW_BUILD_UTILITIES=OFF -DARROW_JEMALLOC=OFF -DARROW_DEPENDENCY_SOURCE=BUNDLED -DARROW_HDFS=OFF -DARROW_WITH_BACKTRACE=OFF -DARROW_WITH_BROTLI=OFF -DARROW_WITH_BZ2=OFF -DARROW_WITH_LZ4=OFF -DARROW_WITH_SNAPPY=OFF -DARROW_WITH_ZLIB=OFF -DARROW_WITH_ZSTD=OFF && make -j2 && sudo make install && cd ../python && PYARROW_BUNDLE_ARROW_CPP=1 sudo python3.6 setup.py install --single-version-externally-managed --record RECORD 
RUN cd arrow-apache-arrow-0.16.0 && rm -rf build && mkdir build && cd build && cmake ../cpp/ -DPython_ADDITIONAL_VERSIONS=3.8 -DARROW_RPATH_ORIGIN=ON -DARROW_PYTHON=ON -DARROW_FLIGHT=OFF -DARROW_IPC=ON -DARROW_COMPUTE=ON -DCMAKE_INSTALL_PREFIX=/usr -DARROW_DATASET=OFF -DARROW_BUILD_UTILITIES=OFF -DARROW_JEMALLOC=OFF -DARROW_DEPENDENCY_SOURCE=BUNDLED -DARROW_HDFS=OFF -DARROW_WITH_BACKTRACE=OFF -DARROW_WITH_BROTLI=OFF -DARROW_WITH_BZ2=OFF -DARROW_WITH_LZ4=OFF -DARROW_WITH_SNAPPY=OFF -DARROW_WITH_ZLIB=OFF -DARROW_WITH_ZSTD=OFF && make -j2 && sudo make install && cd ../python && PYARROW_BUNDLE_ARROW_CPP=1 sudo python3.8 setup.py install --single-version-externally-managed --record RECORD 

# install node
RUN curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
RUN yum install -y nodejs

RUN npm install --global yarn
RUN yarn --version

# install flatbuffers
RUN mkdir -p /usr/local \
    && cd /usr/local \
    && git clone https://github.com/google/flatbuffers.git \
    && cd flatbuffers \
    && cmake -G "Unix Makefiles" \
    && make \
    && cp -r /usr/local/flatbuffers/include/flatbuffers /usr/local/include \
    && ln -s /usr/local/flatbuffers/flatc /usr/local/bin/flatc \
    && chmod +x /usr/local/flatbuffers/flatc
