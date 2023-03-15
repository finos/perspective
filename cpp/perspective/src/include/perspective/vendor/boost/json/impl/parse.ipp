//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2020 Krystian Stasiowski (sdkrystian@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/json
//

#ifndef BOOST_JSON_IMPL_PARSE_IPP
#define BOOST_JSON_IMPL_PARSE_IPP

#include <boost/json/parse.hpp>
#include <boost/json/parser.hpp>
#include <boost/json/detail/except.hpp>

#include <istream>

BOOST_JSON_NS_BEGIN

value
parse(
    string_view s,
    error_code& ec,
    storage_ptr sp,
    const parse_options& opt)
{
    unsigned char temp[
        BOOST_JSON_STACK_BUFFER_SIZE];
    parser p(storage_ptr(), opt, temp);
    p.reset(std::move(sp));
    p.write(s, ec);
    if(ec)
        return nullptr;
    return p.release();
}

value
parse(
    string_view s,
    std::error_code& ec,
    storage_ptr sp,
    parse_options const& opt)
{
    error_code jec;
    value result = parse(s, jec, std::move(sp), opt);
    ec = jec;
    return result;
}

value
parse(
    string_view s,
    storage_ptr sp,
    const parse_options& opt)
{
    error_code ec;
    auto jv = parse(
        s, ec, std::move(sp), opt);
    if(ec)
        detail::throw_system_error(ec,
            BOOST_CURRENT_LOCATION);
    return jv;
}

value
parse(
    std::istream& is,
    error_code& ec,
    storage_ptr sp,
    parse_options const& opt)
{
    unsigned char parser_buffer[BOOST_JSON_STACK_BUFFER_SIZE / 2];
    stream_parser p(storage_ptr(), opt, parser_buffer);
    p.reset(std::move(sp));

    char read_buffer[BOOST_JSON_STACK_BUFFER_SIZE / 2];
    while( true )
    {
        if( is.rdstate() & std::ios::eofbit )
        {
            p.finish(ec);
            if( ec.failed() )
                return nullptr;
            break;
        }

        if( is.rdstate() != std::ios::goodbit )
        {
            BOOST_JSON_FAIL( ec, error::input_error );
            return nullptr;
        }

        is.read(read_buffer, sizeof(read_buffer));
        auto const consumed = is.gcount();

        p.write(read_buffer, static_cast<std::size_t>(consumed), ec);
        if( ec.failed() )
            return nullptr;
    }

    return p.release();
}

value
parse(
    std::istream& is,
    std::error_code& ec,
    storage_ptr sp,
    parse_options const& opt)
{
    error_code jec;
    value result = parse(is, jec, std::move(sp), opt);
    ec = jec;
    return result;
}

value
parse(
    std::istream& is,
    storage_ptr sp,
    parse_options const& opt)
{
    error_code ec;
    auto jv = parse(
        is, ec, std::move(sp), opt);
    if(ec)
        detail::throw_system_error(ec,
            BOOST_CURRENT_LOCATION);
    return jv;
}

BOOST_JSON_NS_END

#endif
