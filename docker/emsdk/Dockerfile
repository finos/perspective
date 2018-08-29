# Liberally copied from trzeci/emscripten

ARG EMSCRIPTEN_SDK=sdk-tag-1.38.11-64bit
FROM trzeci/emscripten-slim:${EMSCRIPTEN_SDK}

# ------------------------------------------------------------------------------

ARG VCS_REF
ARG BUILD_DATE
ARG EMSCRIPTEN_SDK

# ------------------------------------------------------------------------------

RUN echo "\n## Start building" \
    \
&&	echo "\n## Update and install packages" \
&&	apt-get -qq -y update && apt-get -qq install -y --no-install-recommends \
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
        libidn11 \
    \
&&	echo "\n## Installing JRE 8" \
&&	echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list \
&&	apt-get -qq -y update && apt-get -qq install -y --no-install-recommends -t jessie-backports openjdk-8-jre-headless \
    \
&&	echo "\n## Installing CMake" \
&&	wget https://cmake.org/files/v3.7/cmake-3.7.2-Linux-x86_64.sh -q \
&&	mkdir /opt/cmake \
&&	printf "y\nn\n" | sh cmake-3.7.2-Linux-x86_64.sh --prefix=/opt/cmake > /dev/null \
&&		rm -fr cmake*.sh /opt/cmake/doc \
&&		rm -fr /opt/cmake/bin/cmake-gui \
&&		rm -fr /opt/cmake/bin/ccmake \
&&		rm -fr /opt/cmake/bin/cpack \
&&	ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake \
&&	ln -s /opt/cmake/bin/ctest /usr/local/bin/ctest \
    \
&&	printf "JAVA='$(which java)'\n" >> $EM_CONFIG \
    \
&&	sleep 2 \
&&	touch ${EM_CONFIG}_sanity \
    \
&&	emcc --version \
    \
&&	emcc --clear-cache --clear-ports \
    \
&&	echo "\n## Compile sample code" \
&&	mkdir -p /tmp/emscripten_test && cd /tmp/emscripten_test \
&&	printf '#include <iostream>\nint main(){std::cout<<"HELLO FROM DOCKER C++"<<std::endl;return 0;}' > test.cpp \
&&	em++ -O2 test.cpp -o test.js && nodejs test.js \
&&	em++ test.cpp -o test.js && nodejs test.js \
&&	em++ test.cpp -o test.js --closure 1 && nodejs test.js \
    \
&&	cd / \
&&	rm -fr /tmp/emscripten_test \
    \
&&  echo "\n## Moving Boost locally" \
    \
&&  mkdir /boost_includes \
&&  cp -r /usr/include/boost /boost_includes/ \
    \
&&	echo "\n## Cleaning up" \
&&	apt-mark manual make openjdk-8-jre-headless wget gcc git \
&&	apt-get -y remove openjdk-7-jre-headless \
&&	apt-get -y clean \
&&	apt-get -y autoclean \
&&	apt-get -y autoremove \
    \
&&	rm -rf /var/lib/apt/lists/* \
&&	rm -rf /var/cache/debconf/*-old \
&&	rm -rf /usr/share/doc/* \
&&	rm -rf /usr/share/man/?? \
&&	rm -rf /usr/share/man/??_* \
&&	cp -R /usr/share/locale/en\@* /tmp/ && rm -rf /usr/share/locale/* && mv /tmp/en\@* /usr/share/locale/ \
    \
&&	echo "\n## Installed packages:" \
&&	apt-mark showmanual | xargs -I % sh -c 'echo "  * \`%\` : **"$(xargs dpkg -s % | grep Version | sed  "s/Version: //")"**"' \
    \
&&  chmod -R 777 ${EM_DATA} \
&&	echo "\n## Done"

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/jre