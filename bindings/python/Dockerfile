FROM python:3.7

WORKDIR /usr/src/app
ADD . /usr/src/app

RUN apt-get update
RUN apt-get -y install apt-transport-https libtbb-dev cmake
RUN apt-get -y remove python3

RUN python3.7 -m pip install numpy

RUN ls -al /usr/local/lib/python3.7/site-packages/numpy

RUN wget https://dl.bintray.com/boostorg/release/1.67.0/source/boost_1_67_0.tar.gz >/dev/null 2>&1  || echo "wget failed"
RUN tar xfz boost_1_67_0.tar.gz
RUN cd boost_1_67_0 && CPLUS_INCLUDE_PATH="$CPLUS_INCLUDE_PATH:/usr/local/include/python3.7m" C_INCLUDE_PATH="$C_INCLUDE_PATH:/usr/local/include/python3.7m" ./bootstrap.sh --with-python=/usr/local/bin/python3.7  || echo "boostrap failed"
RUN cd boost_1_67_0 && CPLUS_INCLUDE_PATH="$CPLUS_INCLUDE_PATH:/usr/local/include/python3.7m" C_INCLUDE_PATH="$C_INCLUDE_PATH:/usr/local/include/python3.7m" ./b2 -j4 install || echo "build boost failed" 

RUN ln -s /usr/local/lib/libboost_python37.so /usr/local/lib/libboost_python.so
RUN ln -s /usr/local/lib/libboost_numpy37.so /usr/local/lib/libboost_numpy.so

RUN python3 -m pip install codecov nose mock
RUN python3 -m pip install -r requirements.txt

RUN DOCKER=true make test
RUN codecov --token d33ecf96-a51f-43b6-8429-c11f83b961ad
