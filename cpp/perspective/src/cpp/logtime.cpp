/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/logtime.h>
#include <perspective/env_vars.h>
#include <iomanip>
#include <thread>
#include <sstream>

PSP_THR_LOCAL perspective::t_uindex th_curtime;
PSP_THR_LOCAL perspective::t_uindex th_curtime_origin;
PSP_THR_LOCAL perspective::t_uindex th_curmem;
PSP_THR_LOCAL perspective::t_uindex th_curmem_origin;
PSP_THR_LOCAL bool th_curtime_initialized;

namespace perspective {
void
psp_log_time(const std::string& s) {
    if (!t_env::log_time()) {
        return;
    }

    if (!th_curtime_initialized) {
        th_curtime_origin = psp_curtime();
        th_curmem_origin = psp_curmem();
        th_curtime_initialized = true;
    }

    auto prev_time = th_curtime / 1000000000.0;
    auto ns_curtime = psp_curtime() - th_curtime_origin;
    auto curtime = ns_curtime / 1000000000.0;
    auto curmem = psp_curmem();
    auto prev_curmem = static_cast<t_index>(th_curmem);
    th_curmem = curmem;
    th_curtime = ns_curtime;
    std::stringstream ss;
    ss << std::fixed << std::setprecision(3) << "stat tid " << std::this_thread::get_id()
       << " gt" << std::setw(10) << curtime << " dt " << std::setw(10) << curtime - prev_time
       << " gm " << std::setw(6) << curmem << " dm " << std::setw(6) << curmem - prev_curmem
       << " msg: " << s;
    std::cout << ss.str() << std::endl;
}

} // end namespace perspective
