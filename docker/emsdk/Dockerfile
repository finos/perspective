

# Liberally copied from trzeci/emscripten, extended to support llvm-upstream
# https://github.com/trzecieu/emscripten-docker/

FROM debian:stretch AS stage_build

# ------------------------------ ABOUT THIS IMAGE  -----------------------------
# This Dockerfile has two major sections:
# * STAGE BUILD: Which uses required tools to build a static version of Emscripten SDK
# * STAGE DEPLOY: Which copies folder of Emscripten (/emsd_portable) from previous stage, and installs very based tools to make Emscripten work.
#
# Compiled Emscripten SDK meant to be ready to go out of the shelf. That is `/emsdk_portable`:
# - contains every required part of Emscripten SDK
# - contains entrypoint that should be used for derived images
# - is able to work with further changes coming from SDK updates (`emsdk install ...`, etc)
# - contains some useful symbolic links that makes sure you can use Emscripten SDK in the same way, regardless of version that it holds
# Created symbolic links:
# - `/emsdk_portable/emscripten/sdk`: Points to folder that holds Emscripten SDK tools like `emcc`, (example: `/emsdk_portable/emscripten/tag-1.38.31`)
# - `/emsdk_portable/binaryen/bin`: (example: `/emsdk_portable/tag-1.38.31_64bit_binaryen/bin`)
# - `/emsdk_portable/llvm/clang`: Emscripten version of Clang (example: `/emsdk_portable/clang/tag-1.38.31/build_tag-1.38.31_64`)
# - `/emsdk_portable/node/current`: Embedded version of NodeJS (example: `/emsdk_portable/node/8.9.1_64bit`)

# ------------------------------------------------------------------------------
# -------------------------------- STAGE BUILD  --------------------------------
# ------------------------------------------------------------------------------

ENV EMSCRIPTEN_SDK 1.39.12
ENV EMSDK_CHANGESET master

# ------------------------------------------------------------------------------
# Following variables are important to tell Emscripten to use pre-defined locations
# for loading config file and place cache files. Otherwise SDK will use own folders under `/root/` folder
ENV EMSDK /emsdk_portable
ENV EM_DATA ${EMSDK}/.data
ENV EM_CONFIG ${EMSDK}/.emscripten
ENV EM_CACHE ${EM_DATA}/cache
ENV EM_PORTS ${EM_DATA}/ports
# ------------------------------------------------------------------------------

RUN echo "## Update and install packages" \
&&  apt-get -qq -y update && apt-get -qq install -y --no-install-recommends \
        wget \
        git-core \
        ca-certificates \
        build-essential \
        file \
        python \
        python-pip \
        libxml2-dev \
&&  echo "## Done"


RUN  echo "## Installing CMake" \
    &&  wget https://cmake.org/files/v3.6/cmake-3.6.3-Linux-x86_64.sh -q \
    &&  mkdir /opt/cmake \
    &&  printf "y\nn\n" | sh cmake-3.6.3-Linux-x86_64.sh --prefix=/opt/cmake > /dev/null \
    &&  ln -s /opt/cmake/bin/cmake /usr/local/bin/cmake \
&&  echo "## Done"

RUN  echo "## Get EMSDK" \
    &&  git clone https://github.com/emscripten-core/emsdk.git ${EMSDK} && cd ${EMSDK} && git reset --hard ${EMSDK_CHANGESET} \
        \
    # Update emscripten-tags.txt file manually with request version, this will tell emsdk that wanted version to compile is available
    &&  echo ${EMSCRIPTEN_SDK} | sed  's/.\+-\([0-9]\+\.[0-9]\+\.[0-9]\+\).\+/\1/g' > emscripten-tags.txt \
&&  echo "## Done"

RUN echo "## Compile Emscripten" \
    &&  cd ${EMSDK} \
        \
    &&  ./emsdk install node-8.9.1-64bit > /dev/null \
    # Compile llvm with dynamic libs support
    # This will create local shared objects that are used on all LLVM tool.
    # It significantly reduces final size of image.
    &&  LLVM_CMAKE_ARGS=-DLLVM_LINK_LLVM_DYLIB=ON,-DLLVM_LINK_LLVM_DYLIB=ON \
        ./emsdk install --build=MinSizeRel ${EMSCRIPTEN_SDK} \
        \
&&  echo "## Done"

# This generates configuration that contains all valid paths according to installed SDK
RUN cd ${EMSDK} \
    &&  echo "## Generate standard configuration" \
        \
    &&  ./emsdk activate ${EMSCRIPTEN_SDK} --embedded \
    &&  ./emsdk construct_env > /dev/null \
        \
    # remove wrongly created entry with EM_CACHE, variable will be picked up from ENV
    &&  sed -i -e "/EM_CACHE/d" ${EMSDK}/emsdk_set_env.sh \
        \
&&  echo "## Done"

# Create a structure and make mutable folders accessible for r/w
RUN cd ${EMSDK} \
    &&  echo "## Create .data structure" \
    &&  for mutable_dir in ${EM_DATA} ${EM_PORTS} ${EM_CACHE} ${EMSDK}/zips ${EMSDK}/tmp; do \
            mkdir -p ${mutable_dir}; \
            chmod -R 777 ${mutable_dir}; \
        done \
        \
&&  echo "## Done"

# Step uses some bashizm
SHELL ["/bin/bash", "-c"]
RUN cd ${EMSDK} \
    &&  echo "## Clean-up Emscripten Installation" \
    # Allow to use ** for recursive wildcard - bash only!
    &&  shopt -s globstar \
        \
    # Issue #34: emcc.txt file is essential for error free execution of emcc
    &&  _file=`echo ./upstream/emscripten/site/build/text/docs/tools_reference/emcc.txt` \
    &&  _content=`cat ${_file}` \
    &&  rm -fr \
            ./upstream/emscripten/docs \
            ./upstream/emscripten/media \
            ./upstream/emscripten/site \
    &&  mkdir -p `dirname ${_file}` \
    &&  echo ${_content} >> ${_file} \
        \
    # emscripten-version.txt is crucial to make emcc work
    # &&  _file=`echo clang/*/src/emscripten-version.txt` \
    # &&  _content=`cat ${_file}` \
    &&  rm -fr clang/*/src \
    # &&  mkdir -p `dirname ${_file}` \
    # &&  echo ${_content} >> ${_file} \
    \
    # will clean both: bin and src folder
    &&  rm -fr binaryen/*/src \
    &&  rm -fr binaryen/**/test \
    &&  rm -fr binaryen/**/*.cmake \
    &&  rm -fr binaryen/**/Makefile \
    \
    &&  rm -fr clang/*/*/docs \
    &&  rm -fr clang/*/*/tools \
    &&  rm -fr clang/*/*/projects \
    &&  rm -fr clang/*/*/cmake \
    &&  rm -fr clang/**/*.cmake \
    &&  rm -fr clang/**/Makefile \
        \
    &&  find . -name "*.pyc" -exec rm {} \; \
    &&  find . -name "CMakeFiles" -type d -prune -exec rm -fr {} \; \
    &&  find . -name "CMakeCache.txt" -exec rm {} \; \
        \
    &&  find . -name "*.o" -exec rm {} \; \
    &&  find . -name "*.a" -exec rm {} \; \
   # &&  find . -name "*.inc*" -exec rm {} \; \
    &&  find . -name "*.gen.tmp" -exec rm {} \; \
        \
    # remove empty folders
    # &&  find clang -type d -depth -empty -exec rmdir "{}" \; \
    # &&  find binaryen -type d -depth -empty -exec rmdir "{}" \; \
        \
    &&  rm -fr **/*_32bit \
    &&  rm -rf **/.git \
    &&  rm -rf **/tests \
    &&  rm -fr zips/* \
        \
    &&  rm -fr /opt/cmake /usr/local/bin/cmake /cmake* \
        \
    # sleep will make sure that created cache will be stored correctly
    &&  sleep 2 \
&&  echo "## Done"

RUN apt-get -qq -y update && apt-get -qq install -y --no-install-recommends \
        binutils \
    && . ${EMSDK}/emsdk_set_env.sh \
    # Remove debugging symbols from embedded node (extra 7MB)
    && strip -s `which node` \
    # && strip -s `which asm2wasm` \ # extra just 1 MB, not worth to do it in favor of better bugtracking
    # strip out symbols from clang (extra 50MB!)
    # && find $(dirname $(which clang-6.0)) -type f -exec strip -s {} + || true \
&&  echo "## Done"

# ------------------------------------------------------------------------------

RUN echo "## Create transferable entrypoint" \
    &&  printf '#!/bin/sh\n'                                            >  ${EMSDK}/entrypoint \
    # In case when mapped user id by `docker run -u` is not created inside docker image
    # The `$HOME` variable points to `/` - which prevents any tool to write to, as it requires root access
    # In such case we set `$HOME` to `/tmp` as it should r/w for everyone
    &&  printf 'if [ "$HOME" = "/" ] ; then\n'                          >> ${EMSDK}/entrypoint \
    &&  printf '    export HOME=/tmp\n'                                 >> ${EMSDK}/entrypoint \
    &&  printf 'fi\n'                                                   >> ${EMSDK}/entrypoint \
    &&  printf '\n'                                                     >> ${EMSDK}/entrypoint \
    # In case of running as root, use `umask` to reduce problem of file permission on host
    &&  printf 'if [ "$(id -g)" = "0" ] && [ "$(id -u)" = "0" ] ;\n'    >> ${EMSDK}/entrypoint \
    &&  printf 'then\n'                                                 >> ${EMSDK}/entrypoint \
    &&  printf '    umask 0000\n'                                       >> ${EMSDK}/entrypoint \
    &&  printf 'fi\n'                                                   >> ${EMSDK}/entrypoint \
    # Export this image specific Environment variables
    # Those variables are important to use dedicated folder for all cache and predefined config file
    &&  printf "export EMSDK=${EMSDK}\n"                                >> ${EMSDK}/entrypoint \
    &&  printf "export EM_DATA=${EM_DATA}\n"                            >> ${EMSDK}/entrypoint \
    &&  printf "export EM_CONFIG=${EM_CONFIG}\n"                        >> ${EMSDK}/entrypoint \
    &&  printf "export EM_CACHE=${EM_CACHE}\n"                          >> ${EMSDK}/entrypoint \
    &&  printf "export EM_PORTS=${EM_PORTS}\n"                          >> ${EMSDK}/entrypoint \
    # Activate Emscripten SDK
    &&  printf '. ${EMSDK}/emsdk_set_env.sh > /dev/null\n'              >> ${EMSDK}/entrypoint \
    &&  printf 'export PATH=/emsdk_portable/upstream/bin:$PATH\n'       >> ${EMSDK}/entrypoint \
    # Evaluate a command that's coming after `docker run` / `docker exec`
    &&  printf '"$@"\n'                                                 >> ${EMSDK}/entrypoint \
    \
    &&  chmod +x ${EMSDK}/entrypoint \
    \
&&  echo "## Done"


# Populate Emscripten SDK cache with libc++, to improve further compilation times.
RUN echo "## Pre-populate cache" \
    &&  . ${EMSDK}/emsdk_set_env.sh \
    \
    &&  mkdir -p /tmp/emscripten_test \
    &&  cd /tmp/emscripten_test \
    \
        &&  printf '#include <iostream>\nint main(){std::cout << "HELLO FROM DOCKER C++"<<std::endl;return 0;}' > test.cpp \
        # &&  em++ --std=c++11 test.cpp -o test.js -s WASM=0 &&  node test.js \
        # &&  em++ --std=c++11 -g4 test.cpp -o test.js -s WASM=0 &&  node test.js \
        &&  em++ --std=c++14 test.cpp -o test.js -s WASM=1 &&  node test.js \
    \
    &&  cd / \
    &&  rm -fr /tmp/emscripten_test \
    \
    # some files were created, and we need to make sure that those can be accessed by non-root people
    &&  chmod -R 777 ${EM_DATA} \
    \
    # cleanup
    &&  find ${EMSDK} -name "*.pyc" -exec rm {} \; \
    \
    &&  echo "## Done"


# Create symbolic links for critical Emscripten Tools
# This is important for letting people using Emscripten in Dockerfiles without activation
# As each Emscripten release is placed to a different folder (i.e. /emsdk_portable/emscripten/tag-1.38.31)
# We need to somehow make it fixed. An old solution was to move folders around but it has some drawbacks.
# Current solution is to create symlinks that matches old solution: which maintains compatibility
# The ultimate goal is to simplify a way to use Emscripten SDK without a need to activate it.
RUN echo "## Create symbolic links" \
    &&  . ${EMSDK}/emsdk_set_env.sh \
    && export PATH=/emsdk_portable/upstream/bin:$PATH \
    \
    &&  mkdir -p ${EMSDK}/llvm \
    &&  mkdir -p ${EMSDK}/binaryen \
    \
    &&  ln -s $(dirname $(which node))/..       ${EMSDK}/node/current \
    &&  ln -s $(dirname $(which clang))/..      ${EMSDK}/llvm/clang \
    &&  ln -s $(dirname $(which emcc))          ${EMSDK}/upstream/emscripten/sdk \
    &&  ln -s $(dirname $(which asm2wasm))      ${EMSDK}/binaryen/bin \
    \
    &&  echo "## Done"

# ------------------------------------------------------------------------------
# -------------------------------- STAGE DEPLOY --------------------------------
# ------------------------------------------------------------------------------
FROM debian:stretch-slim AS stage_deploy

COPY --from=stage_build /emsdk_portable /emsdk_portable

# Fallback in case Emscripten isn't activated.
# This will let use tools offered by this image inside other Docker images (sub-stages) or with custom / no entrypoint
ENV EMSDK /emsdk_portable
ENV EMSCRIPTEN=${EMSDK}/upstream/emscripten/sdk

ENV EM_DATA ${EMSDK}/.data
ENV EM_CONFIG ${EMSDK}/.emscripten
ENV EM_CACHE ${EM_DATA}/cache
ENV EM_PORTS ${EM_DATA}/ports

# Fallback in case Emscripten isn't activated
# Expose Major tools to system PATH, so that emcc, node, asm2wasm etc can be used without activation
ENV PATH="${EMSDK}:${EMSDK}/bin:${EMSDK}/upstream/emscripten/sdk:${EMSDK}/upstream/bin:${EMSDK}/llvm/clang/bin:${EMSDK}/node/current/bin:${EMSDK}/binaryen/bin:${PATH}"

# Use entrypoint that's coming from emscripten-slim image. It sets all required system paths and variables
ENTRYPOINT ["/emsdk_portable/entrypoint"]

# ------------------------------------------------------------------------------

# Create a 'standard` 1000:1000 user
# Thanks to that this image can be executed as non-root user and created files will not require root access level on host machine
# Please note that this solution even if widely spread (even node Dockerimages use that) is far from perfect as user 1000:1000 might not exist on
# host machine, and in this case running any docker image will cause other random problems (mostly due `$HOME` pointing to `/`)
# This extra user works nicely with entrypoint provided in `/emsdk_portable/entrypoint` as it detects case explained before.
RUN echo "## Create emscripten user (1000:1000)" \
    &&  groupadd --gid 1000 emscripten \
    &&  useradd --uid 1000 --gid emscripten --shell /bin/bash --create-home emscripten \
    \
&&  echo "## Done"


RUN echo "## Update and install packages" \
&&  apt-get -qq -y update && apt-get -qq install -y --no-install-recommends \
        ca-certificates \
        python \
        python-pip \
    \
    # Standard Cleanup on Debian images
    &&  apt-get -y clean \
    &&  apt-get -y autoclean \
    &&  apt-get -y autoremove \
    &&  rm -rf /var/lib/apt/lists/* \
    &&  rm -rf /var/cache/debconf/*-old \
    &&  rm -rf /usr/share/doc/* \
    &&  rm -rf /usr/share/man/?? \
    &&  rm -rf /usr/share/man/??_* \
&&  echo "## Done"

# Docker's convention is to create entrypoint in /entrypoint path.
# Let's create this entrypoint for compatibility and to keep tradition, which forward command to the real entrypoint
# Main intentions is to keep compatibility with previous images
RUN echo "## Create standard docker entrypoint" \
    &&  printf '#!/bin/bash\n'                  >  /entrypoint \
    &&  printf ". ${EMSDK}/entrypoint \"$@\"\n"     >> /entrypoint \
    \
    &&  chmod +x /entrypoint \
    \
&&  echo "## Done"

# Arbitrary folder, nothing special here
WORKDIR /src

# ------------------------------------------------------------------------------
# Copy this Dockerimage into image, so that it will be possible to recreate it later
COPY Dockerfile /emsdk_portable/dockerfiles/trzeci/emscripten-slim/

LABEL maintainer="kontakt@trzeci.eu" \
      org.label-schema.name="emscripten-slim" \
      org.label-schema.description="This image includes EMSDK, Emscripten and WebAssembly compiler and tools that are very required to compile sources." \
      org.label-schema.url="https://trzeci.eu" \
      org.label-schema.vcs-url="https://github.com/trzecieu/emscripten-docker" \
      org.label-schema.docker.dockerfile="/docker/trzeci/emscripten-slim/Dockerfile"

# ------------------------- POST BUILD IN-PLACE TESTING ------------------------
RUN ${EMSDK}/emsdk activate sdk-1.38.42-upstream
RUN echo "## Internal Testing of image (activated)" \
    &&  . ${EMSDK}/emsdk_set_env.sh \
    && export PATH=/emsdk_portable/upstream/bin:$PATH \
    &&  set -x \
    # binaryen
    &&  which asm2wasm \
    # clang
    &&  which llvm-ar \
    # emscritpen
    &&  which emsdk \
    \
    &&  node --version \
    &&  npm --version \
    &&  python --version \
    &&  pip --version \
    \
    &&  em++ --version \
    &&  emcc --version \
    \
    &&  find ${EMSDK} -name "*.pyc" -exec rm {} \; \
    \
&&  echo "## Done"

RUN echo "## Internal Testing of image (no activation)" \
    &&  set -x \
    # binaryen
    &&  which asm2wasm \
    # clang
    &&  which llvm-ar \
    # emscritpen
    &&  which emsdk \
    \
    &&  node --version \
    &&  npm --version \
    &&  python --version \
    &&  pip --version \
    \
    &&  em++ --version \
    &&  emcc --version \
    \
    &&  find ${EMSDK} -name "*.pyc" -exec rm {} \; \
    \
&&  echo "## Done"

# ------------------------------------------------------------------------------


RUN mkdir -p /usr/share/man/man1
RUN touch /usr/share/man/man1/rmid.1.gz.dpkg-tmp

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
gnupg2 \
dirmngr \
make \
ant \
libidn11 

RUN apt-get -qq update && apt-get install -q -y software-properties-common
RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys BA9EF27F
RUN add-apt-repository ppa:ubuntu-toolchain-r/test -y
RUN apt-get -qq update && apt-get install -qy g++ gcc git wget
RUN wget --quiet --max-redirect 3 https://dl.bintray.com/boostorg/release/1.71.0/source/boost_1_71_0.tar.gz
RUN mkdir -p /usr/include/boost && tar zxf boost_1_71_0.tar.gz -C /usr/include/boost --strip-components=1

RUN mkdir -p /usr/share/man/man1
RUN touch /usr/share/man/man1/rmid.1.gz.dpkg-tmp
RUN apt-get -qq -y update && apt-get -qq install -y --no-install-recommends openjdk-8-jre-headless

RUN wget https://cmake.org/files/v3.15/cmake-3.15.4-Linux-x86_64.sh -q
RUN mkdir /opt/cmake
RUN printf "y\nn\n" | sh cmake-3.15.4-Linux-x86_64.sh --prefix=/opt/cmake > /dev/null
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
RUN printf '#include <iostream>\n#include <emscripten.h>\n#include <emscripten/bind.h>\n#include <sstream>\n#include <csignal>\n#include <iostream>\n#include <cstring>\n#include <cstdint>\n#include <memory>\n#include <functional>\n#include <algorithm>\n#include <iomanip>\n#include <chrono>\n#include <fstream>\nint main(){std::cout<<"HELLO FROM DOCKER C++"<<std::endl;return 0;}' > test.cpp

RUN em++ --std=c++14 -O3 test.cpp -o test.js --closure 1
RUN node test.js

RUN cd /
RUN rm -fr /tmp/emscripten_test

RUN mkdir /boost_includes
RUN cp -r /usr/include/boost/boost /boost_includes/

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
RUN rm -rf /usr/share/locale/* 

RUN chmod -R 777 ${EM_DATA}

ENV PATH="/emsdk_portable/node/bin:${PATH}"
RUN npm install --global yarn
RUN yarn --version

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/jre

RUN mkdir -p /usr/local \
    && cd /usr/local \
    && git clone https://github.com/google/flatbuffers.git \
    && cd flatbuffers \
    && cmake -G "Unix Makefiles" \
    && make \
    && cp -r /usr/local/flatbuffers/include/flatbuffers /usr/local/include \
    && ln -s /usr/local/flatbuffers/flatc /usr/local/bin/flatc \
    && chmod +x /usr/local/flatbuffers/flatc