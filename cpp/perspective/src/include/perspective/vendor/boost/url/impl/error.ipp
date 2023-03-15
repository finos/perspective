//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_IMPL_ERROR_IPP
#define BOOST_URL_IMPL_ERROR_IPP

#include <boost/url/error.hpp>

namespace boost {
namespace urls {

error_code
make_error_code(error e)
{
    struct codes : error_category
    {
        virtual ~codes() = default;

        codes() noexcept
            : error_category(
                0xbc15399d7a4ce829)
        {
        }

        const char*
        name() const noexcept override
        {
            return "boost.url";
        }

        std::string
        message(int ev) const override
        {
            switch(static_cast<error>(ev))
            {
case error::success: return "success";
case error::illegal_null: return "illegal null";
case error::illegal_reserved_char: return "illegal reserved char";
case error::non_canonical: return "non canonical";

case error::bad_pct_hexdig: return "bad hexdig in pct-encoding";
case error::incomplete_encoding: return "incomplete pct-encoding";
case error::missing_pct_hexdig: return "missing hexdig in pct-encoding";
case error::no_space: return "no space";
case error::not_a_base: return "not a base";
            }
            return "";
        }

        error_condition
        default_error_condition(
            int ev) const noexcept override
        {
            switch(static_cast<error>(ev))
            {
            default:
                return {ev, *this};

case error::bad_pct_hexdig:
case error::incomplete_encoding:
case error::missing_pct_hexdig:
    return grammar::condition::fatal;
            }
        }
    };

    static codes const cat{};
    return error_code{static_cast<
        std::underlying_type<error>::type>(e), cat};
}

} // urls
} // boost

#endif
