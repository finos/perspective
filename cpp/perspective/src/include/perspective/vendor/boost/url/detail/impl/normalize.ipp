//
// Copyright (c) 2016-2019 Vinnie Falco (vinnie dot falco at gmail dot com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_IMPL_NORMALIZE_IPP
#define BOOST_URL_DETAIL_IMPL_NORMALIZE_IPP

#include <boost/url/detail/normalize.hpp>
#include <boost/url/segments_encoded_view.hpp>
#include <boost/assert.hpp>
#include <cstring>

namespace boost {
namespace urls {
namespace detail {

void
pop_encoded_front(
    string_view& s,
    char& c,
    std::size_t& n) noexcept
{
    if(s.front() != '%')
    {
        c = s.front();
        s.remove_prefix(1);
    }
    else
    {
        detail::decode_unsafe(
            &c,
            &c + 1,
            s.substr(0, 3));
        s.remove_prefix(3);
    }
    ++n;
}

int
compare_encoded(
    string_view lhs,
    string_view rhs) noexcept
{
    std::size_t n0 = 0;
    std::size_t n1 = 0;
    char c0 = 0;
    char c1 = 0;
    while(
        !lhs.empty() &&
        !rhs.empty())
    {
        pop_encoded_front(lhs, c0, n0);
        pop_encoded_front(rhs, c1, n1);
        if (c0 < c1)
            return -1;
        if (c1 < c0)
            return 1;
    }
    n0 += detail::decode_bytes_unsafe(lhs);
    n1 += detail::decode_bytes_unsafe(rhs);
    if (n0 == n1)
        return 0;
    if (n0 < n1)
        return -1;
    return 1;
}

void
digest_encoded(
    string_view s,
    fnv_1a& hasher) noexcept
{
    char c = 0;
    std::size_t n = 0;
    while(!s.empty())
    {
        pop_encoded_front(s, c, n);
        hasher.put(c);
    }
}

int
ci_compare_encoded(
    string_view lhs,
    string_view rhs) noexcept
{
    std::size_t n0 = 0;
    std::size_t n1 = 0;
    char c0 = 0;
    char c1 = 0;
    while (
        !lhs.empty() &&
        !rhs.empty())
    {
        pop_encoded_front(lhs, c0, n0);
        pop_encoded_front(rhs, c1, n1);
        c0 = grammar::to_lower(c0);
        c1 = grammar::to_lower(c1);
        if (c0 < c1)
            return -1;
        if (c1 < c0)
            return 1;
    }
    n0 += detail::decode_bytes_unsafe(lhs);
    n1 += detail::decode_bytes_unsafe(rhs);
    if (n0 == n1)
        return 0;
    if (n0 < n1)
        return -1;
    return 1;
}

void
ci_digest_encoded(
    string_view s,
    fnv_1a& hasher) noexcept
{
    char c = 0;
    std::size_t n = 0;
    while(!s.empty())
    {
        pop_encoded_front(s, c, n);
        c = grammar::to_lower(c);
        hasher.put(c);
    }
}

int
compare(
    string_view lhs,
    string_view rhs) noexcept
{
    auto rlen = (std::min)(lhs.size(), rhs.size());
    for (std::size_t i = 0; i < rlen; ++i)
    {
        char c0 = lhs[i];
        char c1 = rhs[i];
        if (c0 < c1)
            return -1;
        if (c1 < c0)
            return 1;
    }
    if ( lhs.size() == rhs.size() )
        return 0;
    if ( lhs.size() < rhs.size() )
        return -1;
    return 1;
}

int
ci_compare(
    string_view lhs,
    string_view rhs) noexcept
{
    auto rlen = (std::min)(lhs.size(), rhs.size());
    for (std::size_t i = 0; i < rlen; ++i)
    {
        char c0 = grammar::to_lower(lhs[i]);
        char c1 = grammar::to_lower(rhs[i]);
        if (c0 < c1)
            return -1;
        if (c1 < c0)
            return 1;
    }
    if ( lhs.size() == rhs.size() )
        return 0;
    if ( lhs.size() < rhs.size() )
        return -1;
    return 1;
}

void
ci_digest(
    string_view s,
    fnv_1a& hasher) noexcept
{
    for (char c: s)
    {
        c = grammar::to_lower(c);
        hasher.put(c);
    }
}

std::size_t
path_starts_with(
    string_view lhs,
    string_view rhs) noexcept
{
    auto consume_one = [](
        string_view::iterator& it,
        char &c)
    {
        if(*it != '%')
        {
            c = *it;
            ++it;
            return;
        }
        detail::decode_unsafe(
            &c,
            &c + 1,
            string_view(it, 3));
        if (c != '/')
        {
            it += 3;
            return;
        }
        c = *it;
        ++it;
    };

    auto it0 = lhs.begin();
    auto it1 = rhs.begin();
    auto end0 = lhs.end();
    auto end1 = rhs.end();
    char c0 = 0;
    char c1 = 0;
    while (
        it0 < end0 &&
        it1 < end1)
    {
        consume_one(it0, c0);
        consume_one(it1, c1);
        if (c0 != c1)
            return 0;
    }
    if (it1 == end1)
        return it0 - lhs.begin();
    return 0;
}

std::size_t
path_ends_with(
    string_view lhs,
    string_view rhs) noexcept
{
    auto consume_last = [](
        string_view::iterator& it,
        string_view::iterator& end,
        char& c)
    {
        if ((end - it) < 3 ||
            *(std::prev(end, 3)) != '%')
        {
            c = *--end;
            return;
        }
        detail::decode_unsafe(
            &c,
            &c + 1,
            string_view(std::prev(
                end, 3), 3));
        if (c != '/')
        {
            end -= 3;
            return;
        }
        c = *--end;
    };

    auto it0 = lhs.begin();
    auto it1 = rhs.begin();
    auto end0 = lhs.end();
    auto end1 = rhs.end();
    char c0 = 0;
    char c1 = 0;
    while(
        it0 < end0 &&
        it1 < end1)
    {
        consume_last(it0, end0, c0);
        consume_last(it1, end1, c1);
        if (c0 != c1)
            return 0;
    }
    if (it1 == end1)
        return lhs.end() - end0;
    return 0;
}

std::size_t
remove_dot_segments(
    char* dest0,
    char const* end,
    string_view s) noexcept
{
    // 1. The input buffer `s` is initialized with
    // the now-appended path components and the
    // output buffer `dest0` is initialized to
    // the empty string.
    char* dest = dest0;

    // Step 2 is a loop through 5 production rules:
    // https://www.rfc-editor.org/rfc/rfc3986#section-5.2.4
    //
    // There are no transitions between all rules,
    // which enables some optimizations.
    //
    // Initial:
    // - Rule A: handle initial dots
    // If the input buffer begins with a
    // prefix of "../" or "./", then remove
    // that prefix from the input buffer.
    // Rule A can only happen at the beginning.
    // Errata 4547: Keep "../" in the beginning
    // https://www.rfc-editor.org/errata/eid4547
    //
    // Then:
    // - Rule D: ignore a final ".." or "."
    // if the input buffer consists only  of "."
    // or "..", then remove that from the input
    // buffer.
    // Rule D can only happen after Rule A because:
    // - B and C write "/" to the input
    // - E writes "/" to input or returns
    //
    // Then:
    // - Rule B: ignore ".": write "/" to the input
    // - Rule C: apply "..": remove seg and write "/"
    // - Rule E: copy complete segment
    auto append =
        [](char*& first, char const* last, string_view in)
    {
        // append `in` to `dest`
        BOOST_ASSERT(in.size() <= std::size_t(last - first));
        std::memmove(first, in.data(), in.size());
        first += in.size();
        ignore_unused(last);
    };

    auto dot_starts_with = [](
        string_view str, string_view dots, std::size_t& n)
    {
        // starts_with for encoded/decoded dots
        // or decoded otherwise. return how many
        // chars in str match the dots
        n = 0;
        for (char c: dots)
        {
            if (str.empty())
            {
                n = 0;
                return false;
            }
            else if (str.starts_with(c))
            {
                str.remove_prefix(1);
                ++n;
            }
            else if (str.size() > 2 &&
                     str[0] == '%' &&
                     str[1] == '2' &&
                     (str[2] == 'e' ||
                      str[2] == 'E'))
            {
                str.remove_prefix(3);
                n += 3;
            }
            else
            {
                n = 0;
                return false;
            }
        }
        return true;
    };

    auto dot_equal = [&dot_starts_with](
        string_view str, string_view dots)
    {
        std::size_t n = 0;
        dot_starts_with(str, dots, n);
        return n == str.size();
    };

    // Rule A
    std::size_t n;
    while (!s.empty())
    {
        if (dot_starts_with(s, "../", n))
        {
            // Errata 4547
            append(dest, end, "../");
            s.remove_prefix(n);
            continue;
        }
        else if (!dot_starts_with(s, "./", n))
        {
            break;
        }
        s.remove_prefix(n);
    }

    // Rule D
    if( dot_equal(s, "."))
    {
        s = {};
    }
    else if( dot_equal(s, "..") )
    {
        // Errata 4547
        append(dest, end, "..");
        s = {};
    }

    // 2. While the input buffer is not empty,
    // loop as follows:
    while (!s.empty())
    {
        // Rule B
        if (dot_starts_with(s, "/./", n))
        {
            s.remove_prefix(n - 1);
            continue;
        }
        if (dot_equal(s, "/."))
        {
            // We can't remove "." from a string_view
            // So what we do here is equivalent to
            // replacing s with '/' as required
            // in Rule B and executing the next
            // iteration, which would append this
            // '/' to  the output, as required by
            // Rule E
            append(dest, end, s.substr(0, 1));
            s = {};
            break;
        }

        // Rule C
        if (dot_starts_with(s, "/../", n))
        {
            std::size_t p = string_view(
                dest0, dest - dest0).find_last_of('/');
            if (p != string_view::npos)
            {
                // output has multiple segments
                // "erase" [p, end] if not "/.."
                string_view last_seg(dest0 + p, dest - (dest0 + p));
                if (!dot_equal(last_seg, "/.."))
                    dest = dest0 + p;
                else
                    append(dest, end, "/..");
            }
            else if (dest0 != dest)
            {
                // one segment in the output
                dest = dest0;
                s.remove_prefix(1);
            }
            else
            {
                // output is empty
                append(dest, end, "/..");
            }
            s.remove_prefix(n-1);
            continue;
        }
        if (dot_equal(s, "/.."))
        {
            std::size_t p = string_view(
                dest0, dest - dest0).find_last_of('/');
            if (p != string_view::npos)
            {
                // erase [p, end]
                dest = dest0 + p;
                append(dest, end, "/");
            }
            else if (dest0 != dest)
            {
                dest = dest0;
            }
            else
            {
                append(dest, end, "/..");
            }
            s = {};
            break;
        }

        // Rule E
        std::size_t p = s.find_first_of('/', 1);
        if (p != string_view::npos)
        {
            append(dest, end, s.substr(0, p));
            s.remove_prefix(p);
        }
        else
        {
            append(dest, end, s);
            s = {};
        }
    }

    // 3. Finally, the output buffer is set
    // as the result of remove_dot_segments,
    // and we return its size
    return dest - dest0;
}

char
path_pop_back( string_view& s )
{
    if (s.size() < 3 ||
        *std::prev(s.end(), 3) != '%')
    {
        char c = s.back();
        s.remove_suffix(1);
        return c;
    }
    char c = 0;
    detail::decode_unsafe(
        &c, &c + 1, s.substr(s.size() - 3));
    if (c != '/')
    {
        s.remove_suffix(3);
        return c;
    }
    c = s.back();
    s.remove_suffix(1);
    return c;
};

void
pop_last_segment(
    string_view& s,
    string_view& c,
    std::size_t& level,
    bool r) noexcept
{
    c = {};
    std::size_t n = 0;
    while (!s.empty())
    {
        // B.  if the input buffer begins with a
        // prefix of "/./" or "/.", where "." is
        // a complete path segment, then replace
        // that prefix with "/" in the input
        // buffer; otherwise,
        n = detail::path_ends_with(s, "/./");
        if (n)
        {
            c = s.substr(s.size() - n);
            s.remove_suffix(n);
            continue;
        }
        n = detail::path_ends_with(s, "/.");
        if (n)
        {
            c = s.substr(s.size() - n, 1);
            s.remove_suffix(n);
            continue;
        }

        // C. if the input buffer begins with a
        // prefix of "/../" or "/..", where ".."
        // is a complete path segment, then
        // replace that prefix with "/" in the
        // input buffer and remove the last
        // segment and its preceding "/"
        // (if any) from the output buffer
        // otherwise,
        n = detail::path_ends_with(s, "/../");
        if (n)
        {
            c = s.substr(s.size() - n);
            s.remove_suffix(n);
            ++level;
            continue;
        }
        n = detail::path_ends_with(s, "/..");
        if (n)
        {
            c = s.substr(s.size() - n);
            s.remove_suffix(n);
            ++level;
            continue;
        }

        // E.  move the first path segment in the
        // input buffer to the end of the output
        // buffer, including the initial "/"
        // character (if any) and any subsequent
        // characters up to, but not including,
        // the next "/" character or the end of
        // the input buffer.
        std::size_t p = s.size() > 1
            ? s.find_last_of('/', s.size() - 2)
            : string_view::npos;
        if (p != string_view::npos)
        {
            c = s.substr(p + 1);
            s.remove_suffix(c.size());
        }
        else
        {
            c = s;
            s = {};
        }

        if (level == 0)
            return;
        if (!s.empty())
            --level;
    }
    // we still need to skip n_skip + 1
    // but the string is empty
    if (r && level)
    {
        c = "/";
        level = 0;
        return;
    }
    else if (level)
    {
        if (c.empty())
            c = "/..";
        else
            c = "/../";
        --level;
        return;
    }
    c = {};
}

void
normalized_path_digest(
    string_view s,
    bool remove_unmatched,
    fnv_1a& hasher) noexcept
{
    string_view child;
    std::size_t level = 0;
    do
    {
        pop_last_segment(
            s, child, level, remove_unmatched);
        while (!child.empty())
        {
            char c = path_pop_back(child);
            hasher.put(c);
        }
    }
    while (!s.empty());
}

int
segments_compare(
    segments_encoded_view seg0,
    segments_encoded_view seg1) noexcept
{
    auto normalized_size =
        [](segments_encoded_view seg) -> std::size_t
    {
        if (seg.empty())
            return seg.is_absolute();

        std::size_t n = 0;
        std::size_t skip = 0;
        auto begin = seg.begin();
        auto it = seg.end();
        while (it != begin)
        {
            --it;
            decode_view dseg = **it;
            if (dseg == "..")
                ++skip;
            else if (dseg != ".")
            {
                if (skip)
                    --skip;
                else
                    n += dseg.size() + 1;
            }
        }
        n += skip * 3;
        n -= !seg.is_absolute();
        return n;
    };
    std::size_t n0 = normalized_size(seg0);
    std::size_t n1 = normalized_size(seg1);
    std::size_t n00 = n0;
    std::size_t n10 = n1;

    auto consume_last =
        [](
            std::size_t& n,
            decode_view& dseg,
            segments_encoded_view::iterator& begin,
            segments_encoded_view::iterator& it,
            decode_view::iterator& cit,
            std::size_t& skip,
            bool& at_slash) -> char
    {
        if (cit != dseg.begin())
        {
            at_slash = false;
            --cit;
            --n;
            return *cit;
        }
        else
        {
            if (!at_slash || dseg.empty())
            {
                at_slash = true;
                --n;
                return '/';
            }
            at_slash = false;
            while (cit == dseg.begin())
            {
                if (it != begin)
                    --it;
                else
                    break;
                if (**it == "..")
                {
                    ++skip;
                }
                else if (**it != ".")
                {
                    if (skip)
                    {
                        --skip;
                    }
                    else
                    {
                        dseg = **it;
                        cit = dseg.end();
                    }
                }
            }
            --n;
            if (it == begin)
            {
                return "/.."[n];
            }
            if (cit == dseg.begin())
            {
                at_slash = true;
                return '/';
            }
            else
            {
                --cit;
                return *cit;
            }
        }
    };

    auto begin0 = seg0.begin();
    auto it0 = seg0.end();
    decode_view dseg0;
    if (it0 != seg0.begin())
    {
        --it0;
        dseg0 = **it0;
    }
    decode_view::iterator cit0 = dseg0.end();
    std::size_t skip0 = 0;
    bool at_slash0 = true;
    while (n0 > n1)
    {
        consume_last(n0, dseg0, begin0,it0, cit0, skip0, at_slash0);
    }

    auto begin1 = seg1.begin();
    auto it1 = seg1.end();
    decode_view dseg1;
    if (it1 != seg1.begin())
    {
        --it1;
        dseg1 = **it1;
    }
    decode_view::iterator cit1 = dseg1.end();
    std::size_t skip1 = 0;
    bool at_slash1 = true;
    while (n1 > n0)
    {
        consume_last(n1, dseg1, begin1,it1, cit1, skip1, at_slash1);
    }

    int cmp = 0;
    while (n0)
    {
        char c0 = consume_last(
            n0, dseg0, begin0, it0, cit0, skip0, at_slash0);
        char c1 = consume_last(
            n1, dseg1, begin1, it1, cit1, skip1, at_slash1);
        if (c0 < c1)
            cmp = -1;
        else if (c1 < c0)
            cmp = +1;
    }

    if (cmp != 0)
        return cmp;
    if ( n00 == n10 )
        return 0;
    if ( n00 < n10 )
        return -1;
    return 1;
}

} // detail
} // urls
} // boost

#endif
