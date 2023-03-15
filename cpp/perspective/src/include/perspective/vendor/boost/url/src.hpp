//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_SRC_HPP
#define BOOST_URL_SRC_HPP

/*

This file is meant to be included once,
in a translation unit of the program.

*/

// MUST COME FIRST
#ifndef BOOST_URL_SOURCE
#define BOOST_URL_SOURCE
#endif

// We include this in case someone is
// using src.hpp as their main header file
#include <boost/url.hpp>

//------------------------------------------------
//
// url
//
//------------------------------------------------

#include <boost/url/detail/impl/any_params_iter.ipp>
#include <boost/url/detail/impl/any_segments_iter.ipp>
#include <boost/url/detail/impl/decode.ipp>
#include <boost/url/detail/impl/except.ipp>
#include <boost/url/detail/impl/normalize.ipp>
#include <boost/url/detail/impl/params_iter_impl.ipp>
#include <boost/url/detail/impl/path.ipp>
#include <boost/url/detail/impl/segments_iter_impl.ipp>
#include <boost/url/detail/impl/url_impl.ipp>

#include <boost/url/impl/authority_view.ipp>
#include <boost/url/impl/decode_view.ipp>
#include <boost/url/impl/error.ipp>
#include <boost/url/impl/ipv4_address.ipp>
#include <boost/url/impl/ipv6_address.ipp>
#include <boost/url/impl/params_base.ipp>
#include <boost/url/impl/params_encoded_base.ipp>
#include <boost/url/impl/params_encoded_ref.ipp>
#include <boost/url/impl/params_encoded_view.ipp>
#include <boost/url/impl/params_ref.ipp>
#include <boost/url/impl/params_view.ipp>
#include <boost/url/impl/parse.ipp>
#include <boost/url/impl/parse_path.ipp>
#include <boost/url/impl/parse_query.ipp>
#include <boost/url/impl/pct_string_view.ipp>
#include <boost/url/impl/scheme.ipp>
#include <boost/url/impl/segments_base.ipp>
#include <boost/url/impl/segments_encoded_base.ipp>
#include <boost/url/impl/segments_encoded_ref.ipp>
#include <boost/url/impl/segments_encoded_view.ipp>
#include <boost/url/impl/segments_ref.ipp>
#include <boost/url/impl/segments_view.ipp>
#include <boost/url/impl/static_url.ipp>
#include <boost/url/impl/url.ipp>
#include <boost/url/impl/url_base.ipp>
#include <boost/url/impl/url_view.ipp>
#include <boost/url/impl/url_view_base.ipp>

//------------------------------------------------
//
// grammar
//
//------------------------------------------------

#include <boost/url/grammar/detail/impl/recycled.ipp>

#include <boost/url/grammar/impl/ci_string.ipp>
#include <boost/url/grammar/impl/dec_octet_rule.ipp>
#include <boost/url/grammar/impl/delim_rule.ipp>
#include <boost/url/grammar/impl/error.ipp>
#include <boost/url/grammar/impl/literal_rule.ipp>
#include <boost/url/grammar/impl/string_view_base.ipp>

//------------------------------------------------
//
// rfc
//
//------------------------------------------------

#include <boost/url/rfc/detail/impl/h16_rule.ipp>
#include <boost/url/rfc/detail/impl/hier_part_rule.ipp>
#include <boost/url/rfc/detail/impl/host_rule.ipp>
#include <boost/url/rfc/detail/impl/ip_literal_rule.ipp>
#include <boost/url/rfc/detail/impl/ipvfuture_rule.ipp>
#include <boost/url/rfc/detail/impl/port_rule.ipp>
#include <boost/url/rfc/detail/impl/relative_part_rule.ipp>
#include <boost/url/rfc/detail/impl/scheme_rule.ipp>
#include <boost/url/rfc/detail/impl/userinfo_rule.ipp>

#include <boost/url/rfc/impl/absolute_uri_rule.ipp>
#include <boost/url/rfc/impl/authority_rule.ipp>
#include <boost/url/rfc/impl/ipv4_address_rule.ipp>
#include <boost/url/rfc/impl/ipv6_address_rule.ipp>
#include <boost/url/rfc/impl/origin_form_rule.ipp>
#include <boost/url/rfc/impl/query_rule.ipp>
#include <boost/url/rfc/impl/relative_ref_rule.ipp>
#include <boost/url/rfc/impl/uri_rule.ipp>
#include <boost/url/rfc/impl/uri_reference_rule.ipp>

#endif
