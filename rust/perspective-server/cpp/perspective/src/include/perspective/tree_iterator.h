// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

#pragma once
#include <perspective/raw_types.h>
#include <queue>
#include <vector>

namespace perspective {
template <typename TREE_T, typename CONTAINER_T>
class t_dtiter {

    typedef typename TREE_T::t_tnode t_tnode;

public:
    t_dtiter(const TREE_T* tree, CONTAINER_T* queue, t_uindex count);

    t_dtiter<TREE_T, CONTAINER_T> operator++();
    bool operator!=(const t_dtiter<TREE_T, CONTAINER_T>& other);
    t_index operator*() const;

    t_index pop(std::vector<t_uindex>& q);
    void push(std::vector<t_uindex>& q, t_index idx);
    t_index head(const std::vector<t_uindex>& q) const;
    void enqueue_children(const std::vector<t_uindex>& q, t_index nidx);

    t_index pop(std::queue<t_uindex>& q);
    void push(std::queue<t_uindex>& q, t_index idx);
    t_index head(const std::queue<t_uindex>& q) const;
    void enqueue_children(const std::queue<t_uindex>& q, t_index nidx);

private:
    const TREE_T* m_tree;
    CONTAINER_T* m_queue;
    t_uindex m_count;
};

template <typename TREE_T>
class t_bfs_iter {
    typedef std::queue<t_uindex> t_container;
    typedef t_dtiter<TREE_T, t_container> t_iter;

public:
    t_bfs_iter(const TREE_T* tree);
    t_iter begin();
    t_iter end();

private:
    const TREE_T* m_tree;
    t_container m_queue;
};

template <typename TREE_T>
class t_dfs_iter {
    typedef std::vector<t_uindex> t_container;
    typedef t_dtiter<TREE_T, t_container> t_iter;

public:
    t_dfs_iter(const TREE_T* tree);
    t_iter begin();
    t_iter end();

private:
    const TREE_T* m_tree;
    t_container m_queue;
};

template <typename TREE_T, typename CONTAINER_T>
t_dtiter<TREE_T, CONTAINER_T>::t_dtiter(
    const TREE_T* tree, CONTAINER_T* queue, t_uindex count
) :
    m_tree(tree),
    m_queue(queue),
    m_count(count) {}

template <typename TREE_T, typename CONTAINER_T>
t_dtiter<TREE_T, CONTAINER_T>
t_dtiter<TREE_T, CONTAINER_T>::operator++() {
    t_dtiter<TREE_T, CONTAINER_T> iter(m_tree, m_queue, ++m_count);
    t_index head_ = pop(*m_queue);
    enqueue_children(*m_queue, head_);
    return iter;
}

template <typename TREE_T, typename CONTAINER_T>
bool
t_dtiter<TREE_T, CONTAINER_T>::operator!=(const t_dtiter& other) {
    return m_count != other.m_count;
}

template <typename TREE_T, typename CONTAINER_T>
t_index
t_dtiter<TREE_T, CONTAINER_T>::operator*() const {
    return head(*m_queue);
}

template <typename TREE_T, typename CONTAINER_T>
t_index
t_dtiter<TREE_T, CONTAINER_T>::pop(std::vector<t_uindex>& q) {
    t_index rv = q.back();
    q.pop_back();
    return rv;
}

template <typename TREE_T, typename CONTAINER_T>
void
t_dtiter<TREE_T, CONTAINER_T>::push(std::vector<t_uindex>& q, t_index idx) {
    q.push_back(idx);
}

template <typename TREE_T, typename CONTAINER_T>
t_index
t_dtiter<TREE_T, CONTAINER_T>::head(const std::vector<t_uindex>& q) const {
    return q.back();
}

template <typename TREE_T, typename CONTAINER_T>
void
t_dtiter<TREE_T, CONTAINER_T>::enqueue_children(
    const std::vector<t_uindex>& q, t_index idx
) {
    std::vector<t_index> children;
    m_tree->get_child_indices(idx, children);
    for (auto cidx : children) {
        push(*m_queue, cidx);
    }
}

template <typename TREE_T, typename CONTAINER_T>
t_index
t_dtiter<TREE_T, CONTAINER_T>::pop(std::queue<t_uindex>& q) {
    t_index rv = q.front();
    q.pop();
    return rv;
}

template <typename TREE_T, typename CONTAINER_T>
void
t_dtiter<TREE_T, CONTAINER_T>::push(std::queue<t_uindex>& q, t_index idx) {
    q.push(idx);
}

template <typename TREE_T, typename CONTAINER_T>
t_index
t_dtiter<TREE_T, CONTAINER_T>::head(const std::queue<t_uindex>& q) const {
    return q.front();
}

template <typename TREE_T, typename CONTAINER_T>
void
t_dtiter<TREE_T, CONTAINER_T>::enqueue_children(
    const std::queue<t_uindex>& q, t_index idx
) {
    std::vector<t_index> children;
    m_tree->get_child_indices(idx, children);
    for (auto cidx : children) {
        push(*m_queue, cidx);
    }
}

template <typename TREE_T>
t_bfs_iter<TREE_T>::t_bfs_iter(const TREE_T* tree) : m_tree(tree) {}

template <typename TREE_T>
typename t_bfs_iter<TREE_T>::t_iter
t_bfs_iter<TREE_T>::begin() {
    t_iter rv(m_tree, &m_queue, 0);
    rv.push(m_queue, 0);
    return rv;
}

template <typename TREE_T>
typename t_bfs_iter<TREE_T>::t_iter
t_bfs_iter<TREE_T>::end() {
    return t_iter(m_tree, &m_queue, m_tree->size());
}

template <typename TREE_T>
t_dfs_iter<TREE_T>::t_dfs_iter(const TREE_T* tree) : m_tree(tree) {}

template <typename TREE_T>
typename t_dfs_iter<TREE_T>::t_iter
t_dfs_iter<TREE_T>::begin() {
    t_iter rv(m_tree, &m_queue, 0);
    rv.push(m_queue, 0);
    return rv;
}

template <typename TREE_T>
typename t_dfs_iter<TREE_T>::t_iter
t_dfs_iter<TREE_T>::end() {
    return t_iter(m_tree, &m_queue, m_tree->size());
}

} // end namespace perspective