// Copyright (c) 2022 Klemens D. Morgenstern
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
#ifndef BOOST_PROCESS_V2_DETAIL_IMPL_PROCESS_HANDLE_WINDOWS_IPP
#define BOOST_PROCESS_V2_DETAIL_IMPL_PROCESS_HANDLE_WINDOWS_IPP

#include <boost/process/v2/detail/config.hpp>
#include <boost/process/v2/detail/last_error.hpp>
#include <boost/process/v2/detail/throw_error.hpp>
#include <boost/process/v2/detail/process_handle_windows.hpp>

#include <windows.h>

BOOST_PROCESS_V2_BEGIN_NAMESPACE

namespace detail
{

void get_exit_code_(
    HANDLE handle,
    native_exit_code_type & exit_code, 
    error_code & ec)
{
    if (!::GetExitCodeProcess(handle, &exit_code))
        ec = detail::get_last_error();
}


HANDLE open_process_(DWORD pid)
{
    auto proc = OpenProcess(PROCESS_TERMINATE | SYNCHRONIZE, FALSE, pid);
    if (proc == nullptr)
        detail::throw_last_error("open_process()");
    return proc;
}


void terminate_if_running_(HANDLE handle)
{
    DWORD exit_code = 0u;
    if (handle == INVALID_HANDLE_VALUE)
      return ;
    if (::GetExitCodeProcess(handle, &exit_code))
      if (exit_code == STILL_ACTIVE)
        ::TerminateProcess(handle, 260);
}

bool check_handle_(HANDLE handle, error_code & ec)
{
    if (handle == INVALID_HANDLE_VALUE)
    {
        ec.assign(ERROR_INVALID_HANDLE_STATE, system_category());
        return false;
    }
    return true;
}

bool check_pid_(pid_type pid_, error_code & ec)
{
    if (pid_ == 0)
    {
      ec.assign(ERROR_INVALID_HANDLE_STATE, system_category());
      return false;
    }
    return true;
}

struct enum_windows_data_t
{
    error_code &ec;
    pid_type pid;
};

static BOOL CALLBACK enum_window(HWND hwnd, LPARAM param)
  {
    auto data = reinterpret_cast<enum_windows_data_t*>(param);
    DWORD pid{0u};
    GetWindowThreadProcessId(hwnd, &pid);
    if (pid != data->pid)
      return TRUE;
    
    LRESULT res = ::SendMessageW(hwnd, WM_CLOSE, 0, 0);

    if (res)
      data->ec = detail::get_last_error();
    return res == 0;
  }

void request_exit_(pid_type pid_, error_code & ec)
{
    enum_windows_data_t data{ec, pid_};

    if (!::EnumWindows(enum_window, reinterpret_cast<LONG_PTR>(&data)))
        ec = detail::get_last_error();
}

void interrupt_(pid_type pid_, error_code & ec)
{
    if (!::GenerateConsoleCtrlEvent(CTRL_C_EVENT, pid_))
        ec = detail::get_last_error();
}

void terminate_(HANDLE handle, error_code & ec, DWORD & exit_status)
{
    if (!::TerminateProcess(handle, 260))
        ec = detail::get_last_error();
}

void check_running_(HANDLE handle, error_code & ec, DWORD & exit_status)
{
    if (!::GetExitCodeProcess(handle, &exit_status))
        ec = detail::get_last_error();
}


#if !defined(BOOST_PROCESS_V2_HEADER_ONLY)
template struct basic_process_handle_win<>;
#endif

}


BOOST_PROCESS_V2_END_NAMESPACE

#endif //BOOST_PROCESS_V2_DETAIL_IMPL_PROCESS_HANDLE_WINDOWS_IPP
