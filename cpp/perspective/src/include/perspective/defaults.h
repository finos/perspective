/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#ifndef WIN32
#include <sys/mman.h>
#include <fcntl.h>
#endif

namespace perspective {
#ifdef WIN32
const t_fflag PSP_DEFAULT_FFLAGS = GENERIC_READ | GENERIC_WRITE;
const t_fflag PSP_DEFAULT_FMODE = FILE_SHARE_READ;
const t_fflag PSP_DEFAULT_CREATION_DISPOSITION = CREATE_ALWAYS;
const t_fflag PSP_DEFAULT_MPROT = PAGE_READWRITE;
const t_fflag PSP_DEFAULT_MFLAGS = FILE_MAP_READ | FILE_MAP_WRITE;

const t_fflag PSP_DEFAULT_SHARED_RO_FFLAGS = GENERIC_READ;
const t_fflag PSP_DEFAULT_SHARED_RO_FMODE = FILE_SHARE_READ | FILE_SHARE_WRITE;
const t_fflag PSP_DEFAULT_SHARED_RO_CREATION_DISPOSITION = OPEN_ALWAYS;
const t_fflag PSP_DEFAULT_SHARED_RO_MPROT = PAGE_READONLY;
const t_fflag PSP_DEFAULT_SHARED_RO_MFLAGS = FILE_MAP_READ;
#else
const t_fflag PSP_DEFAULT_FFLAGS = O_RDWR | O_TRUNC | O_CREAT;
const t_fflag PSP_DEFAULT_FMODE
    = S_IRUSR | S_IWUSR | S_IROTH | S_IRGRP | S_IWGRP;
const t_fflag PSP_DEFAULT_CREATION_DISPOSITION = 0;
const t_fflag PSP_DEFAULT_MPROT = PROT_WRITE | PROT_READ;
const t_fflag PSP_DEFAULT_MFLAGS = MAP_SHARED;

const t_fflag PSP_DEFAULT_SHARED_RO_FFLAGS = O_RDONLY | O_CREAT;
const t_fflag PSP_DEFAULT_SHARED_RO_FMODE = S_IRUSR;
const t_fflag PSP_DEFAULT_SHARED_RO_CREATION_DISPOSITION = 0;
const t_fflag PSP_DEFAULT_SHARED_RO_MPROT = PROT_READ;
const t_fflag PSP_DEFAULT_SHARED_RO_MFLAGS = MAP_SHARED;
#endif
} // end namespace perspective
