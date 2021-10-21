/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/expression_vocab.h>

namespace perspective {

t_expression_vocab::t_expression_vocab()
    : m_empty_string("") {
    // at an assumed 64 bytes per string, we will either hit 1000 unique strings
    // or 6400 bytes per vocab, whichever comes first.
    m_max_vocab_num_strings = 100;
    m_max_vocab_size = m_max_vocab_num_strings * 64;

    // Always start with one vocab
    allocate_new_vocab();
}

const char*
t_expression_vocab::intern(const char* str) {
    std::size_t bytelength = strlen(str);

    if (m_current_vocab_size + bytelength + 1 > m_max_vocab_size
        || m_current_vocab_num_strings + 1 > m_max_vocab_num_strings) {
        allocate_new_vocab();
    }

    t_vocab& current_vocab = *(m_vocabs[0]);
    t_uindex interned_idx = current_vocab.get_interned(str);
    return current_vocab.unintern_c(interned_idx);
}

const char*
t_expression_vocab::intern(const std::string& str) {
    return intern(str.c_str());
}

void
t_expression_vocab::clear() {
    m_vocabs.clear();
}

const char*
t_expression_vocab::get_empty_string() const {
    return m_empty_string.c_str();
}

void
t_expression_vocab::pprint() const {
    for (const std::shared_ptr<t_vocab>& vocab : m_vocabs) {
        vocab->pprint_vocabulary();
    }
}

void
t_expression_vocab::allocate_new_vocab() {
    std::shared_ptr<t_vocab> vocab = std::make_shared<t_vocab>();
    vocab->init(false);
    vocab->reserve(m_max_vocab_size, m_max_vocab_num_strings);
    m_vocabs.insert(m_vocabs.begin(), vocab);

    // set the size counters back to 0
    m_current_vocab_size = 0;
    m_current_vocab_num_strings = 0;
}

} // end namespace perspective