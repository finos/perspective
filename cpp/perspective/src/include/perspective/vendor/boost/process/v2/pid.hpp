// Copyright (c) 2022 Klemens D. Morgenstern
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
#ifndef BOOST_PROCESS_V2_PID_HPP
#define BOOST_PROCESS_V2_PID_HPP

#include <boost/process/v2/detail/config.hpp>

BOOST_PROCESS_V2_BEGIN_NAMESPACE

#if defined(GENERATING_DOCUMENTATION)

//An integral type representing a process id.
typedef implementation_defined pid_type;


#else

#if defined(BOOST_PROCESS_V2_WINDOWS)

typedef unsigned long pid_type;

#else

typedef int pid_type;

#endif
#endif

/// Get the process id of the current process.
BOOST_PROCESS_V2_DECL pid_type current_pid();

BOOST_PROCESS_V2_END_NAMESPACE

#if defined(BOOST_PROCESS_V2_HEADER_ONLY)
#include <boost/process/v2/impl/pid.ipp>
#endif


#endif //BOOST_PROCESS_V2_PID_HPP
