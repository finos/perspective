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
#include <perspective/raw_types.h>
#include <queue>
#include <vector>

namespace perspective {
template <typename DTREE_T, typename CONTAINER_T>
class t_dtiter {

    typedef typename DTREE_T::t_tnode t_tnode;

public:
    t_dtiter(const DTREE_T* tree, CONTAINER_T* queue, t_uindex count);

    t_dtiter<DTREE_T, CONTAINER_T> operator++();
    t_bool operator!=(const t_dtiter<DTREE_T, CONTAINER_T>& other);
    t_ptidx operator*() const;

    t_ptidx pop(std::vector<t_uindex>& q);
    void push(std::vector<t_uindex>& q, t_ptidx idx);
    t_ptidx head(const std::vector<t_uindex>& q) const;
    void enqueue_children(const std::vector<t_uindex>& q, const t_tnode* nptr);

    t_ptidx pop(std::queue<t_uindex>& q);
    void push(std::queue<t_uindex>& q, t_ptidx idx);
    t_ptidx head(const std::queue<t_uindex>& q) const;
    void enqueue_children(const std::queue<t_uindex>& q, const t_tnode* nptr);

private:
    const DTREE_T* m_tree;
    CONTAINER_T* m_queue;
    t_uindex m_count;
};

template <typename DTREE_T>
class t_bfs_iter {
    typedef std::queue<t_uindex> t_container;
    typedef t_dtiter<DTREE_T, t_container> t_iter;

public:
    t_bfs_iter(const DTREE_T* tree);
    t_iter begin();
    t_iter end();

private:
    const DTREE_T* m_tree;
    t_container m_queue;
};

template <typename DTREE_T>
class t_dfs_iter {
    typedef std::vector<t_uindex> t_container;
    typedef t_dtiter<DTREE_T, t_container> t_iter;

public:
    t_dfs_iter(const DTREE_T* tree);
    t_iter begin();
    t_iter end();

private:
    const DTREE_T* m_tree;
    t_container m_queue;
};

template <typename DTREE_T, typename CONTAINER_T>
t_dtiter<DTREE_T, CONTAINER_T>::t_dtiter(
    const DTREE_T* tree, CONTAINER_T* queue, t_uindex count)
    : m_tree(tree)
    , m_queue(queue)
    , m_count(count) {}

template <typename DTREE_T, typename CONTAINER_T>
t_dtiter<DTREE_T, CONTAINER_T>
t_dtiter<DTREE_T, CONTAINER_T>::operator++() {
    t_dtiter<DTREE_T, CONTAINER_T> iter(m_tree, m_queue, ++m_count);

    t_ptidx head_ = pop(*m_queue);

    const t_tnode* nptr = m_tree->get_node_ptr(head_);
    enqueue_children(*m_queue, nptr);
    return iter;
}

template <typename DTREE_T, typename CONTAINER_T>
t_bool
t_dtiter<DTREE_T, CONTAINER_T>::operator!=(const t_dtiter& other) {
    return m_count != other.m_count;
}

template <typename DTREE_T, typename CONTAINER_T>
t_ptidx t_dtiter<DTREE_T, CONTAINER_T>::operator*() const {
    return head(*m_queue);
}

template <typename DTREE_T, typename CONTAINER_T>
t_ptidx
t_dtiter<DTREE_T, CONTAINER_T>::pop(std::vector<t_uindex>& q) {
    t_ptidx rv = q.back();
    q.pop_back();
    return rv;
}

template <typename DTREE_T, typename CONTAINER_T>
void
t_dtiter<DTREE_T, CONTAINER_T>::push(std::vector<t_uindex>& q, t_ptidx idx) {
    q.push_back(idx);
}

template <typename DTREE_T, typename CONTAINER_T>
t_ptidx
t_dtiter<DTREE_T, CONTAINER_T>::head(const std::vector<t_uindex>& q) const {
    return q.back();
}

template <typename DTREE_T, typename CONTAINER_T>
void
t_dtiter<DTREE_T, CONTAINER_T>::enqueue_children(
    const std::vector<t_uindex>& q, const t_tnode* nptr) {
    for (t_index idx = nptr->m_fcidx + nptr->m_nchild - 1, loop_end = nptr->m_fcidx;
         idx >= loop_end; --idx) {
        push(*m_queue, idx);
    }
}

template <typename DTREE_T, typename CONTAINER_T>
t_ptidx
t_dtiter<DTREE_T, CONTAINER_T>::pop(std::queue<t_uindex>& q) {
    t_ptidx rv = q.front();
    q.pop();
    return rv;
}

template <typename DTREE_T, typename CONTAINER_T>
void
t_dtiter<DTREE_T, CONTAINER_T>::push(std::queue<t_uindex>& q, t_ptidx idx) {
    q.push(idx);
}

template <typename DTREE_T, typename CONTAINER_T>
t_ptidx
t_dtiter<DTREE_T, CONTAINER_T>::head(const std::queue<t_uindex>& q) const {
    return q.front();
}

template <typename DTREE_T, typename CONTAINER_T>
void
t_dtiter<DTREE_T, CONTAINER_T>::enqueue_children(
    const std::queue<t_uindex>& q, const t_tnode* nptr) {
    for (t_uindex idx = nptr->m_fcidx, loop_end = nptr->m_fcidx + nptr->m_nchild;
         idx < loop_end; ++idx) {
        push(*m_queue, idx);
    }
}

template <typename DTREE_T>
t_bfs_iter<DTREE_T>::t_bfs_iter(const DTREE_T* tree)
    : m_tree(tree) {}

template <typename DTREE_T>
typename t_bfs_iter<DTREE_T>::t_iter
t_bfs_iter<DTREE_T>::begin() {
    t_iter rv(m_tree, &m_queue, 0);
    rv.push(m_queue, 0);
    return rv;
}

template <typename DTREE_T>
typename t_bfs_iter<DTREE_T>::t_iter
t_bfs_iter<DTREE_T>::end() {
    return t_iter(m_tree, &m_queue, m_tree->size());
}

template <typename DTREE_T>
t_dfs_iter<DTREE_T>::t_dfs_iter(const DTREE_T* tree)
    : m_tree(tree) {}

template <typename DTREE_T>
typename t_dfs_iter<DTREE_T>::t_iter
t_dfs_iter<DTREE_T>::begin() {
    t_iter rv(m_tree, &m_queue, 0);
    rv.push(m_queue, 0);
    return rv;
}

template <typename DTREE_T>
typename t_dfs_iter<DTREE_T>::t_iter
t_dfs_iter<DTREE_T>::end() {
    return t_iter(m_tree, &m_queue, m_tree->size());
}

} // end namespace perspective
