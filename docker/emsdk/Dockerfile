# Liberally copied from trzeci/emscripten

FROM trzeci/emscripten-slim:sdk-tag-1.38.20-64bit

RUN apt-get -qq -y update 
RUN apt-get -qq install -y --no-install-recommends \
wget \
curl \
zip \
unzip \
git \
ssh-client \
ca-certificates \
build-essential \
libboost-all-dev \
make \
ant \
libidn11 


RUN echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list
RUN apt-get -qq -y update && apt-get -qq install -y --no-install-recommends -t jessie-backports openjdk-8-jre-headless

RUN wget https://cmake.org/files/v3.7/cmake-3.7.2-Linux-x86_64.sh -q
RUN mkdir /opt/cmake
RUN printf "y\nn\n" | sh cmake-3.7.2-Linux-x86_64.sh --prefix=/opt/cmake > /dev/null
RUN rm -fr cmake*.sh /opt/cmake/doc
RUN rm -fr /opt/cmake/bin/cmake-gui
RUN rm -fr /opt/cmake/bin/ccmake
RUN rm -fr /opt/cmake/bin/cpack
RUN ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake
RUN ln -s /opt/cmake/bin/ctest /usr/local/bin/ctest

RUN printf "JAVA='$(which java)'\n" >> $EM_CONFIG

RUN sleep 2
RUN touch ${EM_CONFIG}_sanity 

RUN emcc --version

RUN emcc --clear-cache --clear-ports

RUN mkdir -p /tmp/emscripten_test
RUN cd /tmp/emscripten_test
RUN printf '#include <iostream>\nint main(){std::cout<<"HELLO FROM DOCKER C++"<<std::endl;return 0;}' > test.cpp

RUN em++ -O2 test.cpp -o test.js
RUN node test.js

RUN em++ test.cpp -o test.js
RUN node test.js

RUN em++ test.cpp -o test.js --closure 1
RUN node test.js

RUN cd /
RUN rm -fr /tmp/emscripten_test

RUN mkdir /boost_includes
RUN cp -r /usr/include/boost /boost_includes/

RUN	apt-mark manual make openjdk-8-jre-headless wget gcc git
RUN	apt-get -y remove openjdk-7-jre-headless
RUN	apt-get -y clean
RUN	apt-get -y autoclean
RUN	apt-get -y autoremove

RUN	rm -rf /var/lib/apt/lists/*
RUN	rm -rf /var/cache/debconf/*-old
RUN	rm -rf /usr/share/doc/*
RUN	rm -rf /usr/share/man/??
RUN	rm -rf /usr/share/man/??_*
RUN	cp -R /usr/share/locale/en\@* /tmp/ 
RUN rm -rf /usr/share/locale/* 
RUN mv /tmp/en\@* /usr/share/locale/

RUN chmod -R 777 ${EM_DATA}

ENV PATH="/emsdk_portable/node/bin:${PATH}"
RUN npm install --global yarn
RUN yarn --version

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/jre