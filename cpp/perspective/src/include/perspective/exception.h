/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#include <perspective/first.h>

namespace perspective {

class PerspectiveException : public std::exception {
public:
    explicit PerspectiveException(const char* m)
        : message{m} {}
    virtual const char*
    what() const noexcept override {
        return message.c_str();
    }

private:
    std::string message = "";
};

} // namespace perspective