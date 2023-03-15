//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2018-2022. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/container for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_CONTAINER_HASH_TABLE_HPP
#define BOOST_CONTAINER_HASH_TABLE_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif

#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/container/detail/config_begin.hpp>
#include <boost/container/detail/workaround.hpp>
// container
#include <boost/container/allocator_traits.hpp>
#include <boost/container/container_fwd.hpp>
#include <boost/container/options.hpp>
#include <boost/container/node_handle.hpp>
#include <boost/container/vector.hpp>

// container/detail
#include <boost/container/detail/algorithm.hpp> //algo_equal(), algo_lexicographical_compare
#include <boost/container/detail/compare_functors.hpp>
#include <boost/container/detail/destroyers.hpp>
#include <boost/container/detail/iterator.hpp>
#include <boost/container/detail/iterators.hpp>
#include <boost/container/detail/node_alloc_holder.hpp>
#include <boost/container/detail/pair.hpp>
#include <boost/container/detail/type_traits.hpp>

// intrusive
#include <boost/intrusive/pointer_traits.hpp>
#include <boost/intrusive/hashtable.hpp>
// intrusive/detail
#include <boost/intrusive/detail/minimal_pair_header.hpp>   //pair
#include <boost/intrusive/detail/tree_value_compare.hpp>    //tree_value_compare
// move
#include <boost/move/utility_core.hpp>
// move/detail
#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
#include <boost/move/detail/fwd_macros.hpp>
#endif
#include <boost/move/detail/move_helpers.hpp>
#include <boost/move/detail/force_ptr.hpp>
// other
#include <boost/core/no_exceptions_support.hpp>



#include <boost/container/detail/std_fwd.hpp>

namespace boost {
namespace container {
namespace dtl {

static const unsigned hash_default_bucket = 11;

using boost::intrusive::tree_value_compare;

template<class VoidPointer, bool StoreHash>
struct intrusive_hash_table_hook
{
   typedef typename dtl::bi::make_unordered_set_base_hook
      < dtl::bi::void_pointer<VoidPointer>
      , dtl::bi::link_mode<dtl::bi::normal_link>
      , dtl::bi::store_hash<StoreHash>
      >::type  type;
};


//This trait is used to type-pun std::pair because in C++03
//compilers std::pair is useless for C++11 features
template<class T>
struct hash_table_internal_data_type
{
   typedef T type;
};

template<class T1, class T2>
struct hash_table_internal_data_type< std::pair<T1, T2> >
{
   typedef pair<typename boost::move_detail::remove_const<T1>::type, T2> type;
};

template <class T, class VoidPointer, bool StoreHash>
struct iiterator_node_value_type< base_node<T, intrusive_hash_table_hook<VoidPointer, StoreHash>, true > >
{
   typedef T type;
};

template<class Options>
struct get_hash_opt
{
   typedef Options type;
};

template<>
struct get_hash_opt<void>
{
   typedef hash_assoc_defaults type;
};


template<class, class KeyOfValue>
struct hash_key_of_value
{
   typedef KeyOfValue type;
};

template<class T>
struct hash_key_of_value<T, void>
{
   typedef dtl::identity<T> type;
};

template<class T1, class T2>
struct hash_key_of_value<std::pair<T1, T2>, int>
{
   typedef dtl::select1st<T1> type;
};

template<class T1, class T2>
struct hash_key_of_value<boost::container::dtl::pair<T1, T2>, int>
{
   typedef dtl::select1st<T1> type;
};

template<class Node, class Icont>
class hash_insert_equal_end_hint_functor
{
   Icont &icont_;

   public:
   BOOST_CONTAINER_FORCEINLINE hash_insert_equal_end_hint_functor(Icont &icont)
      :  icont_(icont)
   {}

   BOOST_CONTAINER_FORCEINLINE void operator()(Node &n)
   {  this->icont_.insert_equal(n);  }
};

}//namespace dtl {

namespace dtl {

template< class NodeType, class KeyOfNode, class NodeHashType, class NodeCompareType
        , class SizeType,  class HookType, bool CompareHash
        , bool CacheBegin, bool LinearBuckets, bool FastmodBuckets>
struct intrusive_hash_table_dispatch
{
   typedef typename dtl::bi::make_hashtable
      <NodeType
      ,dtl::bi::key_of_value<KeyOfNode>
      ,dtl::bi::hash<NodeHashType>
      ,dtl::bi::equal<NodeCompareType>
      ,dtl::bi::base_hook<HookType>
      ,dtl::bi::constant_time_size<true>
      ,dtl::bi::size_type<SizeType>
      ,dtl::bi::cache_begin<CacheBegin>
      ,dtl::bi::compare_hash<CompareHash>
      ,dtl::bi::linear_buckets<LinearBuckets>
      ,dtl::bi::fastmod_buckets<FastmodBuckets>
      >::type  type;
};

template<class Allocator, class KeyOfValue, class KeyHash, class KeyCompare
        ,bool StoreHash, bool CacheBegin, bool LinearBuckets, bool FastmodBuckets>
struct intrusive_hash_table_type
{
   private:
   typedef typename boost::container::
      allocator_traits<Allocator>::value_type              value_type;
   typedef typename boost::container::
      allocator_traits<Allocator>::void_pointer            void_pointer;
   typedef typename boost::container::
      allocator_traits<Allocator>::size_type               size_type;
   typedef base_node<value_type, intrusive_hash_table_hook
      <void_pointer, StoreHash>, true >                    node_t;
   //Deducing the hook type from node_t (e.g. node_t::hook_type) would
   //provoke an early instantiation of node_t that could ruin recursive
   //hash_table definitions, so retype the complete type to avoid any problem.
   typedef typename intrusive_hash_table_hook
      <void_pointer, StoreHash>::type                       hook_type;

   typedef key_of_node
      <node_t, KeyOfValue>                                  key_of_node_t;

   public:
   typedef typename intrusive_hash_table_dispatch
      < node_t, key_of_node_t, KeyHash, KeyCompare
      , size_type, hook_type, StoreHash
      , CacheBegin, LinearBuckets, FastmodBuckets>::type    type;
};

}  //namespace dtl {

namespace dtl {

//This functor will be used with Intrusive clone functions to obtain
//already allocated nodes from a intrusive container instead of
//allocating new ones. When the intrusive container runs out of nodes
//the node holder is used instead.
template<class AllocHolder, bool DoMove>
class HashRecyclingCloner
{
   typedef typename AllocHolder::intrusive_container  intrusive_container;
   typedef typename AllocHolder::Node                 node_t;
   typedef typename AllocHolder::NodePtr              node_ptr_type;
   typedef dtl::allocator_node_destroyer
      <typename AllocHolder::NodeAlloc>               Destroyer;
   typedef typename AllocHolder::alloc_version        alloc_version;

   public:
   HashRecyclingCloner(AllocHolder &holder, intrusive_container &itree)
      :  m_holder(holder), m_icont(itree)
   {}

   BOOST_CONTAINER_FORCEINLINE static void do_assign(node_ptr_type &p, const node_t &other, bool_<true>)
   {  p->do_move_assign(const_cast<node_t &>(other).m_data);   }

   BOOST_CONTAINER_FORCEINLINE static void do_assign(node_ptr_type &p, const node_t &other, bool_<false>)
   {  p->do_assign(other.m_data);   }

   node_ptr_type operator()(const node_t &other) const
   {
      if(!m_icont.empty())
      {
         typename intrusive_container::const_iterator iit
            = m_icont.iterator_to(other);
         node_ptr_type p = iit.unconst().operator->();
         m_icont.erase(iit);
         //First recycle a node (this can't throw)
         BOOST_TRY{
            //This can throw
            this->do_assign(p, other, bool_<DoMove>());
            return p;
         }
         BOOST_CATCH(...){
            //If there is an exception destroy the whole source
            m_holder.destroy_node(p);
            m_holder.clear(alloc_version());
            BOOST_RETHROW
         }
         BOOST_CATCH_END
      }
      else{
         return m_holder.create_node(other.m_data);
      }
   }

   AllocHolder &m_holder;
   intrusive_container &m_icont;
};

template <class KeyOfValue, class KeyHash, class KeyEqual, class Allocator, class Options>
struct hash_table_types
{
   typedef typename hash_key_of_value
         < typename allocator_traits<Allocator>::value_type
         , KeyOfValue>::type                                key_of_value_t;
   typedef tree_value_compare
      < typename allocator_traits<Allocator>::pointer
      , KeyHash, key_of_value_t, std::size_t>               ValHash;
   typedef tree_value_compare
      < typename allocator_traits<Allocator>::pointer
      , KeyEqual, key_of_value_t, bool>                     ValEqual;
   typedef typename get_hash_opt<Options>::type             options_type;
   typedef typename dtl::intrusive_hash_table_type
      < Allocator, key_of_value_t, KeyHash, ValEqual
      , options_type::store_hash
      , options_type::cache_begin
      , options_type::linear_buckets
      , options_type::fastmod_buckets
      >::type                                               Icont;
   typedef typename Icont::bucket_type                      bucket_type;
   typedef typename Icont::bucket_traits                    bucket_traits;

   typedef typename boost::container::
      allocator_traits<Allocator>::template
         portable_rebind_alloc<bucket_type>::type           bucket_allocator;
   typedef boost::container::vector
      <bucket_type, bucket_allocator>                       bucket_holder_t;
   typedef dtl::node_alloc_holder
      <Allocator, Icont>                                    AllocHolder;
};

template<class Bucket, std::size_t N>
struct static_buckets
{
   static const std::size_t size = N;
   Bucket buckets_[N];
};

const std::size_t SmallestBucketSize = 3u;

template <class T, class KeyOfValue, class KeyHash, class KeyEqual, class Allocator, class Options>
class hash_table
   : public static_buckets< typename hash_table_types<KeyOfValue, KeyHash, KeyEqual, Allocator, Options>::bucket_type
                          , hash_table_types<KeyOfValue, KeyHash, KeyEqual, Allocator, Options>::Icont::bucket_overhead+SmallestBucketSize>
   , public hash_table_types<KeyOfValue, KeyHash, KeyEqual, Allocator, Options>::bucket_holder_t
   , public hash_table_types<KeyOfValue, KeyHash, KeyEqual, Allocator, Options>::AllocHolder
{
   typedef hash_table_types<KeyOfValue, KeyHash, KeyEqual, Allocator, Options> hash_table_types_t;
   typedef typename hash_table_types_t::ValHash             ValHash;
   typedef typename hash_table_types_t::ValEqual            ValEqual;
   typedef typename hash_table_types_t::options_type        options_type;
   typedef typename hash_table_types_t::Icont               Icont;
   typedef typename hash_table_types_t::AllocHolder         AllocHolder;
   typedef typename AllocHolder::NodePtr                    NodePtr;
   typedef hash_table< T, KeyOfValue, KeyHash
                     , KeyEqual, Allocator, Options>        ThisType;
   typedef typename AllocHolder::NodeAlloc                  NodeAlloc;
   typedef boost::container::
      allocator_traits<NodeAlloc>                           allocator_traits_type;
   typedef typename AllocHolder::ValAlloc                   ValAlloc;
   typedef typename AllocHolder::Node                       Node;
   typedef typename Icont::iterator                         iiterator;
   typedef typename Icont::const_iterator                   iconst_iterator;
   typedef typename Icont::local_iterator                   ilocal_iterator;
   typedef typename Icont::const_local_iterator             iconst_local_iterator;
   typedef dtl::allocator_node_destroyer<NodeAlloc>         Destroyer;
   typedef typename AllocHolder::alloc_version              alloc_version;

   typedef typename Icont::bucket_type                      bucket_type;
   typedef typename Icont::bucket_traits                    bucket_traits;
   typedef typename hash_table_types
      <KeyOfValue, KeyHash, KeyEqual, Allocator, Options>
         ::bucket_holder_t                                  bucket_holder_t;
   typedef static_buckets< typename Icont::bucket_type
                         , Icont::bucket_overhead + SmallestBucketSize >   static_buckets_t;


   BOOST_COPYABLE_AND_MOVABLE(hash_table)

   public:

   typedef typename hash_table_types_t::
      key_of_value_t                                  key_of_value_type;
   typedef typename hash_table_types_t::
         key_of_value_t::type                         key_type;
   typedef T                                          value_type;
   typedef Allocator                                  allocator_type;
   typedef KeyHash                                    hasher;
   typedef ValHash                                    value_hasher;
   typedef KeyEqual                                   key_equal;
   typedef ValEqual                                   value_equal;
   typedef typename boost::container::
      allocator_traits<Allocator>::pointer            pointer;
   typedef typename boost::container::
      allocator_traits<Allocator>::const_pointer      const_pointer;
   typedef typename boost::container::
      allocator_traits<Allocator>::reference          reference;
   typedef typename boost::container::
      allocator_traits<Allocator>::const_reference    const_reference;
   typedef typename boost::container::
      allocator_traits<Allocator>::size_type          size_type;
   typedef typename boost::container::
      allocator_traits<Allocator>::difference_type    difference_type;
   typedef dtl::iterator_from_iiterator
      <iiterator, false>                              iterator;
   typedef dtl::iterator_from_iiterator
      <iiterator, true >                              const_iterator;
   typedef dtl::iterator_from_iiterator
      <ilocal_iterator, false>                        local_iterator;
   typedef dtl::iterator_from_iiterator
      <ilocal_iterator, true >                        const_local_iterator;
   typedef node_handle
      < NodeAlloc, void>                              node_type;
   typedef insert_return_type_base
      <iterator, node_type>                           insert_return_type;
   typedef NodeAlloc                                  stored_allocator_type;


   private:

   typedef key_node_pred<key_equal, key_of_value_type, Node> KeyNodeEqual;
   typedef key_node_pred<hasher, key_of_value_type, Node, std::size_t>    KeyNodeHash;

   public:

   BOOST_CONTAINER_FORCEINLINE hash_table()
      : AllocHolder(bucket_traits( ((static_buckets_t&)*this).buckets_, static_buckets_t::size))
   {  this->reserve(0);  }

   BOOST_CONTAINER_FORCEINLINE explicit hash_table(const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(a)
   {  this->reserve(0);  }

   BOOST_CONTAINER_FORCEINLINE explicit hash_table(size_type n)
      : AllocHolder()
   {  this->reserve(n);  }

   BOOST_CONTAINER_FORCEINLINE hash_table(size_type n, const hasher& hf)
      : AllocHolder(value_hasher(hf))
   {  this->reserve(n);  }

   BOOST_CONTAINER_FORCEINLINE hash_table(size_type n, const hasher& hf, const key_equal& eql)
      : AllocHolder(value_hasher(hf), value_equal(eql))
   {  this->reserve(n);  }

   BOOST_CONTAINER_FORCEINLINE hash_table(size_type n, const hasher& hf, const key_equal& eql, const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(value_hasher(hf), value_equal(eql), a)
   {  this->reserve(n);  }

   BOOST_CONTAINER_FORCEINLINE hash_table(size_type n, const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(a)
   {  this->reserve(n);  }

   BOOST_CONTAINER_FORCEINLINE hash_table(size_type n, const hasher& hf, const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(value_hasher(hf), value_equal(), a)
   {  this->reserve(n);  }

   template <class InputIterator>
   hash_table(bool unique_insertion, InputIterator first, InputIterator last)
      : AllocHolder()
   {
      this->reserve(0);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   template <class InputIterator>
   hash_table(bool unique_insertion, InputIterator first, InputIterator last, size_type n)
      : AllocHolder()
   {
      this->reserve(n);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   template <class InputIterator>
   hash_table(bool unique_insertion, InputIterator first, InputIterator last, size_type n, const hasher& hf)
      : AllocHolder(value_hasher(hf))
   {
      this->reserve(n);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   template <class InputIterator>
   hash_table(bool unique_insertion, InputIterator first, InputIterator last, size_type n, const hasher& hf, const key_equal& eql)
      : AllocHolder(value_hasher(hf), value_equal(eql))
   {
      this->reserve(n);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   template <class InputIterator>
   hash_table
      (bool unique_insertion, InputIterator first, InputIterator last
      ,size_type n, const hasher& hf, const key_equal& eql, const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(value_hasher(hf), value_equal(eql), a)
   {
      this->reserve(n);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   template <class InputIterator>
   hash_table
      (bool unique_insertion, InputIterator first, InputIterator last, size_type n, const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(a)
   {
      this->reserve(n);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   //! <b>Effects</b>: Constructs an empty hash_table using at least n buckets
   //!   and specified allocator and hash function.
   //!   Then, inserts elements from the range [first ,last ).
   //!
   //! <b>Complexity</b>: Average case linear, worst case quadratic.
   template <class InputIterator>
   hash_table
      (bool unique_insertion, InputIterator first, InputIterator last, size_type n, const hasher& hf, const allocator_type& a)
      : bucket_holder_t(a), AllocHolder(value_hasher(hf), a)
   {
      this->reserve(n);
      this->hash_table_construct(unique_insertion, first, last);
      //AllocHolder clears in case of exception
   }

   private:

   template <class InputIterator>
   void hash_table_construct(bool unique_insertion, InputIterator first, InputIterator last)
   {
      //Use cend() as hint to achieve linear time for
      //ordered ranges as required by the standard
      //for the constructor
      if(unique_insertion){
         const const_iterator end_it(this->cend());
         for ( ; first != last; ++first){
            this->insert_unique_convertible(end_it, *first);
         }
      }
      else{
         this->hash_table_construct_non_unique(first, last);
      }
   }

   template <class InputIterator>
   void hash_table_construct_non_unique(InputIterator first, InputIterator last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename dtl::enable_if_or
         < void
         , dtl::is_same<alloc_version, version_1>
         , dtl::is_input_iterator<InputIterator>
         >::type * = 0
      #endif
         )
   {
      //Use cend() as hint to achieve linear time for
      //ordered ranges as required by the standard
      //for the constructor
      const const_iterator end_it(this->cend());
      for ( ; first != last; ++first){
         this->insert_equal_convertible(end_it, *first);
      }
   }

   template <class InputIterator>
   void hash_table_construct_non_unique(InputIterator first, InputIterator last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename dtl::disable_if_or
         < void
         , dtl::is_same<alloc_version, version_1>
         , dtl::is_input_iterator<InputIterator>
         >::type * = 0
      #endif
         )
   {
      //Optimized allocation and construction
      this->allocate_many_and_construct
         ( first, boost::container::iterator_udistance(first, last)
         , hash_insert_equal_end_hint_functor<Node, Icont>(this->m_icont));
   }

   public:

   BOOST_CONTAINER_FORCEINLINE hash_table(const hash_table& x)
      :  AllocHolder(x, x.value_hash_function(), x.value_eq())
   {
      this->m_icont.clone_from
         (x.icont(), typename AllocHolder::cloner(*this), Destroyer(this->node_alloc()));
   }

   BOOST_CONTAINER_FORCEINLINE hash_table(BOOST_RV_REF(hash_table) x)
      BOOST_NOEXCEPT_IF(boost::container::dtl::is_nothrow_move_constructible<KeyEqual>::value &&
                        boost::container::dtl::is_nothrow_move_constructible<KeyHash>::value)
      :  AllocHolder(BOOST_MOVE_BASE(AllocHolder, x), x.value_hash_function(), x.value_eq())
   {}

   BOOST_CONTAINER_FORCEINLINE hash_table(const hash_table& x, const allocator_type &a)
      :  AllocHolder(x.value_hash_function(), x.value_eq(), a)
   {
      this->m_icont.clone_from
         (x.icont(), typename AllocHolder::cloner(*this), Destroyer(this->node_alloc()));
      //AllocHolder clears in case of exception
   }

   hash_table(BOOST_RV_REF(hash_table) x, const allocator_type &a)
      :  AllocHolder(x.hash_function(), x.key_eq(), a)
   {
      if(this->node_alloc() == x.node_alloc()){
         this->m_icont.swap(x.icont());
      }
      else{
         this->m_icont.clone_from
            (boost::move(x.icont()), typename AllocHolder::move_cloner(*this), Destroyer(this->node_alloc()));
      }
      //AllocHolder clears in case of exception
   }

   BOOST_CONTAINER_FORCEINLINE ~hash_table()
   {
   } //AllocHolder clears the hash_table

   hash_table& operator=(BOOST_COPY_ASSIGN_REF(hash_table) x)
   {
      if (&x != this){
         NodeAlloc &this_alloc     = this->get_stored_allocator();
         const NodeAlloc &x_alloc  = x.get_stored_allocator();
         dtl::bool_<allocator_traits<NodeAlloc>::
            propagate_on_container_copy_assignment::value> flag;
         if(flag && this_alloc != x_alloc){
            this->clear();
         }
         this->AllocHolder::copy_assign_alloc(x);
         //Transfer all the nodes to a temporary hash_table
         //If anything goes wrong, all the nodes will be destroyed
         //automatically
         Icont other_hash_table(::boost::move(this->m_icont));

         //Now recreate the source hash_table reusing nodes stored by other_hash_table
         this->m_icont.clone_from
            (x.icont()
            , HashRecyclingCloner<AllocHolder, false>(*this, other_hash_table)
            , Destroyer(this->node_alloc()));

         //If there are remaining nodes, destroy them
         other_hash_table.clear_and_dispose(Destroyer(this->node_alloc()));
      }
      return *this;
   }

   hash_table& operator=(BOOST_RV_REF(hash_table) x)
      BOOST_NOEXCEPT_IF( (allocator_traits_type::propagate_on_container_move_assignment::value ||
                          allocator_traits_type::is_always_equal::value) &&
                           boost::container::dtl::is_nothrow_move_assignable<KeyEqual>::value &&
                           boost::container::dtl::is_nothrow_move_assignable<KeyHash>::value)
   {
      BOOST_ASSERT(this != &x);
      NodeAlloc &this_alloc = this->node_alloc();
      NodeAlloc &x_alloc    = x.node_alloc();
      const bool propagate_alloc = allocator_traits<NodeAlloc>::
            propagate_on_container_move_assignment::value;
      const bool allocators_equal = this_alloc == x_alloc; (void)allocators_equal;
      //Resources can be transferred if both allocators are
      //going to be equal after this function (either propagated or already equal)
      if(propagate_alloc || allocators_equal){
         //Destroy
         this->clear();
         //Move allocator if needed
         this->AllocHolder::move_assign_alloc(x);
         //Obtain resources
         this->m_icont = boost::move(x.icont());
      }
      //Else do a one by one move
      else{
         //Transfer all the nodes to a temporary hash_table
         //If anything goes wrong, all the nodes will be destroyed
         //automatically
         Icont other_hash_table(::boost::move(this->m_icont));

         //Now recreate the source hash_table reusing nodes stored by other_hash_table
         this->m_icont.clone_from
            (::boost::move(x.icont())
            , HashRecyclingCloner<AllocHolder, true>(*this, other_hash_table)
            , Destroyer(this->node_alloc()));

         //If there are remaining nodes, destroy them
         other_hash_table.clear_and_dispose(Destroyer(this->node_alloc()));
      }
      return *this;
   }

   public:
   // accessors:
   BOOST_CONTAINER_FORCEINLINE key_equal key_eq() const
   {  return this->m_icont.key_eq(); }

   BOOST_CONTAINER_FORCEINLINE value_equal value_eq() const
   {  return value_equal(this->key_eq());  }

   BOOST_CONTAINER_FORCEINLINE hasher hash_function() const
   {  return this->m_icont.hash_function();  }

   BOOST_CONTAINER_FORCEINLINE value_hasher value_hash_function() const
   {  return value_hasher(this->hash_function());  }

   BOOST_CONTAINER_FORCEINLINE allocator_type get_allocator() const
   {  return allocator_type(this->node_alloc()); }

   BOOST_CONTAINER_FORCEINLINE const stored_allocator_type &get_stored_allocator() const
   {  return this->node_alloc(); }

   BOOST_CONTAINER_FORCEINLINE stored_allocator_type &get_stored_allocator()
   {  return this->node_alloc(); }

   BOOST_CONTAINER_FORCEINLINE iterator begin()
   { return iterator(this->m_icont.begin()); }

   BOOST_CONTAINER_FORCEINLINE const_iterator begin() const
   {  return this->cbegin();  }

   BOOST_CONTAINER_FORCEINLINE iterator end()
   {  return iterator(this->m_icont.end());  }

   BOOST_CONTAINER_FORCEINLINE const_iterator end() const
   {  return this->cend();  }

   //! <b>Effects</b>: Returns a const_iterator to the first element contained in the container.
   //!
   //! <b>Throws</b>: Nothing.
   //!
   //! <b>Complexity</b>: Constant.
   BOOST_CONTAINER_FORCEINLINE const_iterator cbegin() const
   { return const_iterator(this->non_const_icont().begin()); }

   //! <b>Effects</b>: Returns a const_iterator to the end of the container.
   //!
   //! <b>Throws</b>: Nothing.
   //!
   //! <b>Complexity</b>: Constant.
   BOOST_CONTAINER_FORCEINLINE const_iterator cend() const
   { return const_iterator(this->non_const_icont().end()); }

   BOOST_CONTAINER_FORCEINLINE bool empty() const
   {  return !this->size();  }

   BOOST_CONTAINER_FORCEINLINE size_type size() const
   {  return this->m_icont.size();   }

   BOOST_CONTAINER_FORCEINLINE size_type max_size() const
   {  return AllocHolder::max_size();  }

   BOOST_CONTAINER_FORCEINLINE void swap(ThisType& x)
      BOOST_NOEXCEPT_IF(  allocator_traits_type::is_always_equal::value
                                 && boost::container::dtl::is_nothrow_swappable<KeyEqual>::value 
                                 && boost::container::dtl::is_nothrow_swappable<KeyHash>::value )
   {  AllocHolder::swap(x);   }

   public:

   typedef typename Icont::insert_commit_data insert_commit_data;

   // insert/erase
   std::pair<iterator,bool> insert_unique_check
      (const key_type& key, insert_commit_data &data)
   {
      std::pair<iiterator, bool> ret =
         this->m_icont.insert_unique_check
            (key, data);
      return std::pair<iterator, bool>(iterator(ret.first), ret.second);
   }

   std::pair<iterator,bool> insert_unique_check
      (const_iterator hint, const key_type& key, insert_commit_data &data)
   {
      //to-do: take advantage of hint: just check for equality and insert after if equal
      (void)hint;
      BOOST_ASSERT((priv_is_linked)(hint));
      std::pair<iiterator, bool> ret =
         this->m_icont.insert_unique_check
            (key, data);
      return std::pair<iterator, bool>(iterator(ret.first), ret.second);
   }

   template<class MovableConvertible>
   iterator insert_unique_commit
      (BOOST_FWD_REF(MovableConvertible) v, insert_commit_data &data)
   {
      NodePtr tmp = AllocHolder::create_node(boost::forward<MovableConvertible>(v));
      return iterator(this->m_icont.insert_unique_commit(*tmp, data));
   }

   template<class MovableConvertible>
   std::pair<iterator,bool> insert_unique(BOOST_FWD_REF(MovableConvertible) v)
   {
      insert_commit_data data;
      std::pair<iterator,bool> ret =
         this->insert_unique_check(key_of_value_type()(v), data);
      if(ret.second){
         ret.first = this->insert_unique_commit(boost::forward<MovableConvertible>(v), data);
      }
      return ret;
   }

   private:

   template<class KeyConvertible, class M>
   iiterator priv_insert_or_assign_commit
      (BOOST_FWD_REF(KeyConvertible) key, BOOST_FWD_REF(M) obj, insert_commit_data &data)
   {
      NodePtr tmp = AllocHolder::create_node(boost::forward<KeyConvertible>(key), boost::forward<M>(obj));
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());
      iiterator ret(this->m_icont.insert_unique_commit(*tmp, data));
      destroy_deallocator.release();
      return ret;
   }

   bool priv_is_linked(const_iterator const position) const
   {
      iiterator const cur(position.get());
      return   cur == this->m_icont.end() ||
                (++iiterator(cur) != cur &&
                 ++iiterator(cur) != iiterator());
   }

   template<class MovableConvertible>
   void push_back_impl(BOOST_FWD_REF(MovableConvertible) v)
   {
      NodePtr tmp(AllocHolder::create_node(boost::forward<MovableConvertible>(v)));
      //push_back has no-throw guarantee so avoid any deallocator/destroyer
      this->m_icont.push_back(*tmp);
   }

   std::pair<iterator, bool> emplace_unique_impl(NodePtr p)
   {
      value_type &v = p->get_data();
      insert_commit_data data;
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(p, this->node_alloc());
      std::pair<iterator,bool> ret =
         this->insert_unique_check(key_of_value_type()(v), data);
      if(!ret.second){
         return ret;
      }
      //No throw insertion part, release rollback
      destroy_deallocator.release();
      return std::pair<iterator,bool>
         ( iterator(this->m_icont.insert_unique_commit(*p, data))
         , true );
   }

   iterator emplace_unique_hint_impl(const_iterator hint, NodePtr p)
   {
      BOOST_ASSERT((priv_is_linked)(hint));
      value_type &v = p->get_data();
      insert_commit_data data;
      std::pair<iterator,bool> ret =
         this->insert_unique_check(hint, key_of_value_type()(v), data);
      if(!ret.second){
         Destroyer(this->node_alloc())(p);
         return ret.first;
      }
      return iterator(this->m_icont.insert_unique_commit(*p, data));
   }

   public:

   #if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

   template <class... Args>
   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, bool> emplace_unique(BOOST_FWD_REF(Args)... args)
   {  return this->emplace_unique_impl(AllocHolder::create_node(boost::forward<Args>(args)...));   }

   template <class... Args>
   BOOST_CONTAINER_FORCEINLINE iterator emplace_hint_unique(const_iterator hint, BOOST_FWD_REF(Args)... args)
   {  return this->emplace_unique_hint_impl(hint, AllocHolder::create_node(boost::forward<Args>(args)...));   }

   template <class... Args>
   iterator emplace_equal(BOOST_FWD_REF(Args)... args)
   {
      NodePtr tmp(AllocHolder::create_node(boost::forward<Args>(args)...));
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());
      iterator ret(this->m_icont.insert_equal(*tmp));
      destroy_deallocator.release();
      return ret;
   }

   template <class... Args>
   iterator emplace_hint_equal(const_iterator hint, BOOST_FWD_REF(Args)... args)
   {
      BOOST_ASSERT((priv_is_linked)(hint));
      NodePtr tmp(AllocHolder::create_node(boost::forward<Args>(args)...));
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());
      //to-do: take advantage of hint: just check for equality and insert after if equal
      iterator ret(this->m_icont.insert_equal(*tmp));
      destroy_deallocator.release();
      return ret;
   }

   template <class KeyType, class... Args>
   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, bool> try_emplace
      (const_iterator hint, BOOST_FWD_REF(KeyType) key, BOOST_FWD_REF(Args)... args)
   {
      insert_commit_data data;
      const key_type & k = key;  //Support emulated rvalue references
      std::pair<iiterator, bool> ret =
         hint == const_iterator() ? this->m_icont.insert_unique_check\
                                       (k, data)
                                  : this->m_icont.insert_unique_check\
                                       (hint.get(), k, data);
      if(ret.second){
         ret.first = this->m_icont.insert_unique_commit
            (*AllocHolder::create_node(try_emplace_t(), boost::forward<KeyType>(key), boost::forward<Args>(args)...), data);
      }
      return std::pair<iterator, bool>(iterator(ret.first), ret.second);
   }

   #else // !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

   #define BOOST_CONTAINER_TREE_EMPLACE_CODE(N) \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   std::pair<iterator, bool> emplace_unique(BOOST_MOVE_UREF##N)\
   {  return this->emplace_unique_impl(AllocHolder::create_node(BOOST_MOVE_FWD##N));  }\
   \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   iterator emplace_hint_unique(const_iterator hint BOOST_MOVE_I##N BOOST_MOVE_UREF##N)\
   {  return this->emplace_unique_hint_impl(hint, AllocHolder::create_node(BOOST_MOVE_FWD##N)); }\
   \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   iterator emplace_equal(BOOST_MOVE_UREF##N)\
   {\
      NodePtr tmp(AllocHolder::create_node(BOOST_MOVE_FWD##N));\
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());\
      iterator ret(this->m_icont.insert_equal(this->m_icont.end(), *tmp));\
      destroy_deallocator.release();\
      return ret;\
   }\
   \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   iterator emplace_hint_equal(const_iterator hint BOOST_MOVE_I##N BOOST_MOVE_UREF##N)\
   {\
      BOOST_ASSERT((priv_is_linked)(hint));\
      NodePtr tmp(AllocHolder::create_node(BOOST_MOVE_FWD##N));\
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());\
      iterator ret(this->m_icont.insert_equal(hint.get(), *tmp));\
      destroy_deallocator.release();\
      return ret;\
   }\
   \
   template <class KeyType BOOST_MOVE_I##N BOOST_MOVE_CLASS##N>\
   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, bool>\
      try_emplace(const_iterator hint, BOOST_FWD_REF(KeyType) key BOOST_MOVE_I##N BOOST_MOVE_UREF##N)\
   {\
      insert_commit_data data;\
      const key_type & k = key;\
      std::pair<iiterator, bool> ret =\
         hint == const_iterator() ? this->m_icont.insert_unique_check\
                                       (            k, data)\
                                  : this->m_icont.insert_unique_check\
                                       (hint.get(), k, data);\
      if(ret.second){\
         ret.first = this->m_icont.insert_unique_commit\
            (*AllocHolder::create_node(try_emplace_t(), boost::forward<KeyType>(key) BOOST_MOVE_I##N BOOST_MOVE_FWD##N), data);\
      }\
      return std::pair<iterator, bool>(iterator(ret.first), ret.second);\
   }\
   //
   BOOST_MOVE_ITERATE_0TO9(BOOST_CONTAINER_TREE_EMPLACE_CODE)
   #undef BOOST_CONTAINER_TREE_EMPLACE_CODE

   #endif   // !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

   template<class MovableConvertible>
   iterator insert_unique_convertible(const_iterator hint, BOOST_FWD_REF(MovableConvertible) v)
   {
      BOOST_ASSERT((priv_is_linked)(hint));
      insert_commit_data data;
      std::pair<iterator,bool> ret =
         this->insert_unique_check(hint, key_of_value_type()(v), data);
      if(!ret.second)
         return ret.first;
      return this->insert_unique_commit(boost::forward<MovableConvertible>(v), data);
   }

   BOOST_MOVE_CONVERSION_AWARE_CATCH_1ARG(insert_unique, value_type, iterator, this->insert_unique_convertible, const_iterator, const_iterator)

   template <class InputIterator>
   void insert_unique(InputIterator first, InputIterator last)
   {
      for( ; first != last; ++first)
         this->insert_unique(*first);
   }

   iterator insert_equal(const value_type& v)
   {
      NodePtr tmp(AllocHolder::create_node(v));
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());
      //to-do: take advantage of hint: just check for equality and insert after if equal
      iterator ret(this->m_icont.insert_equal(*tmp)); //
      destroy_deallocator.release();
      return ret;
   }

   //IOG temp
   BOOST_CONTAINER_FORCEINLINE iterator insert(const value_type& v)
   {
      if(BOOST_UNLIKELY(this->size() == this->bucket_count()))
         this->reserve(this->size() + 1u);
      return this->insert_unique(v).first;
   }

   template<class MovableConvertible>
   iterator insert_equal(BOOST_FWD_REF(MovableConvertible) v)
   {
      NodePtr tmp(AllocHolder::create_node(boost::forward<MovableConvertible>(v)));
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());
      iterator ret(this->m_icont.insert_equal(*tmp));
      destroy_deallocator.release();
      return ret;
   }

   template<class MovableConvertible>
   iterator insert_equal_convertible(const_iterator hint, BOOST_FWD_REF(MovableConvertible) v)
   {
      BOOST_ASSERT((priv_is_linked)(hint));
      NodePtr tmp(AllocHolder::create_node(boost::forward<MovableConvertible>(v)));
      scoped_node_destroy_deallocator<NodeAlloc> destroy_deallocator(tmp, this->node_alloc());
      //to-do: take advantage of hint: just check for equality and insert after if equal
      (void)hint;
      iterator ret(this->m_icont.insert_equal(*tmp));
      destroy_deallocator.release();
      return ret;
   }

   BOOST_MOVE_CONVERSION_AWARE_CATCH_1ARG(insert_equal, value_type, iterator, this->insert_equal_convertible, const_iterator, const_iterator)

   template <class InputIterator>
   void insert_equal(InputIterator first, InputIterator last)
   {
      for( ; first != last; ++first)
         this->insert_equal(*first);
   }

   template<class KeyType, class M>
   std::pair<iterator, bool> insert_or_assign(const_iterator hint, BOOST_FWD_REF(KeyType) key, BOOST_FWD_REF(M) obj)
   {
      insert_commit_data data;
      const key_type & k = key;  //Support emulated rvalue references
      std::pair<iiterator, bool> ret =
         hint == const_iterator() ? this->m_icont.insert_unique_check\
                                       (k, data)
                                  : this->m_icont.insert_unique_check\
                                       (hint.get(), k, data);
      if(ret.second){
         ret.first = this->priv_insert_or_assign_commit(boost::forward<KeyType>(key), boost::forward<M>(obj), data);
      }
      else{
         ret.first->get_data().second = boost::forward<M>(obj);
      }
      return std::pair<iterator, bool>(iterator(ret.first), ret.second);
   }

   BOOST_CONTAINER_FORCEINLINE void erase(const_iterator position)
   {
      BOOST_ASSERT(position != this->cend() && (priv_is_linked)(position));
      return this->m_icont.erase_and_dispose(position.get(), Destroyer(this->node_alloc()));
   }

   BOOST_CONTAINER_FORCEINLINE size_type erase(const key_type& k)
   {  return AllocHolder::erase_key(k, alloc_version()); }

   iterator erase(const_iterator first, const_iterator last)
   {
      BOOST_ASSERT(first == last || (first != this->cend() && (priv_is_linked)(first)));
      BOOST_ASSERT(first == last || (priv_is_linked)(last));
      return iterator(AllocHolder::erase_range(first.get(), last.get(), alloc_version()));
   }

   node_type extract(const key_type& k)
   {
      iterator const it = this->find(k);
      if(this->end() != it){
         return this->extract(it);
      }
      return node_type();
   }

   node_type extract(const_iterator position)
   {
      BOOST_ASSERT(position != this->cend() && (priv_is_linked)(position));
      iiterator const iit(position.get());
      this->m_icont.erase(iit);
      return node_type(iit.operator->(), this->node_alloc());
   }

   insert_return_type insert_unique_node(BOOST_RV_REF_BEG_IF_CXX11 node_type BOOST_RV_REF_END_IF_CXX11 nh)
   {
      return this->insert_unique_node(this->end(), boost::move(nh));
   }

   insert_return_type insert_unique_node(const_iterator hint, BOOST_RV_REF_BEG_IF_CXX11 node_type BOOST_RV_REF_END_IF_CXX11 nh)
   {
      insert_return_type irt; //inserted == false, node.empty()
      if(!nh.empty()){
         insert_commit_data data;
         std::pair<iterator,bool> ret =
            this->insert_unique_check(hint, key_of_value_type()(nh.value()), data);
         if(ret.second){
            irt.inserted = true;
            irt.position = iterator(this->m_icont.insert_unique_commit(*nh.get(), data));
            nh.release();
         }
         else{
            irt.position = ret.first;
            irt.node = boost::move(nh);
         }
      }
      else{
         irt.position = this->end();
      }
      return BOOST_MOVE_RET(insert_return_type, irt);
   }

   iterator insert_equal_node(BOOST_RV_REF_BEG_IF_CXX11 node_type BOOST_RV_REF_END_IF_CXX11 nh)
   {
      if(nh.empty()){
         return this->end();
      }
      else{
         NodePtr const p(nh.release());
         return iterator(this->m_icont.insert_equal(*p));
      }
   }

   iterator insert_equal_node(const_iterator hint, BOOST_RV_REF_BEG_IF_CXX11 node_type BOOST_RV_REF_END_IF_CXX11 nh)
   {
      if(nh.empty()){
         return this->end();
      }
      else{
         NodePtr const p(nh.release());
         //to-do: take advantage of hint: just check for equality and insert after if equal
         return iterator(this->m_icont.insert_equal(*p)); (void)hint;
      }
   }

   template<class H2, class C2>
   BOOST_CONTAINER_FORCEINLINE void merge_unique(hash_table<T, key_of_value_type, H2, C2, Allocator, Options>& )
   {  assert(0); } //TODO

   template<class H2, class C2>
   BOOST_CONTAINER_FORCEINLINE void merge_equal(hash_table<T, key_of_value_type, H2, C2, Allocator, Options>& )
   {  assert(0); } //TODO

   BOOST_CONTAINER_FORCEINLINE void clear()
   {  this->AllocHolder::clear(alloc_version());  }

   // search operations. Const and non-const overloads even if no iterator is returned
   // so splay implementations can to their rebalancing when searching in non-const versions
   BOOST_CONTAINER_FORCEINLINE iterator find(const key_type& k)
   {  return iterator(this->m_icont.find(k));  }

   BOOST_CONTAINER_FORCEINLINE const_iterator find(const key_type& k) const
   {  return const_iterator(this->non_const_icont().find(k));  }

   BOOST_CONTAINER_FORCEINLINE size_type count(const key_type& k) const
   {  return size_type(this->m_icont.count(k)); }

   BOOST_CONTAINER_FORCEINLINE bool contains(const key_type& x) const
   {  return this->find(x) != this->cend();  }

   std::pair<iterator,iterator> equal_range(const key_type& k)
   {
      std::pair<iiterator, iiterator> ret =
         this->m_icont.equal_range(k);
      return std::pair<iterator,iterator>(iterator(ret.first), iterator(ret.second));
   }

   std::pair<const_iterator, const_iterator> equal_range(const key_type& k) const
   {
      std::pair<iiterator, iiterator> ret =
         this->non_const_icont().equal_range(k);
      return std::pair<const_iterator,const_iterator>
         (const_iterator(ret.first), const_iterator(ret.second));
   }

   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, iterator> equal_range_unique(const key_type& k)
   {  return priv_equal_range_unique<iterator>(*this, k); }

   BOOST_CONTAINER_FORCEINLINE std::pair<const_iterator, const_iterator> equal_range_unique(const key_type& k) const
   {  return priv_equal_range_unique<const_iterator>(*this, k); }

   BOOST_CONTAINER_FORCEINLINE size_type bucket_count() const BOOST_NOEXCEPT
   {  return this->m_icont.bucket_count();  }

   BOOST_CONTAINER_FORCEINLINE size_type max_bucket_count() const BOOST_NOEXCEPT
   {  return this->max_size();   }

   BOOST_CONTAINER_FORCEINLINE size_type bucket_size(size_type n) const
   {  return this->m_icont.bucket_size(n);  }

   BOOST_CONTAINER_FORCEINLINE size_type bucket(const key_type& k) const
   {  return this->m_icont.bucket(k, KeyNodeHash());  }
/*
   BOOST_CONTAINER_FORCEINLINE local_iterator begin(size_type n)
   {  return local_iterator(this->m_icont.begin(n));  }

   BOOST_CONTAINER_FORCEINLINE const_local_iterator begin(size_type n) const
   {  return this->cbegin(n);   }

   BOOST_CONTAINER_FORCEINLINE const_local_iterator cbegin(size_type n) const
   {  return const_local_iterator(this->non_const_icont().begin(n));  }

   BOOST_CONTAINER_FORCEINLINE local_iterator end(size_type n)
   {  return local_iterator(this->m_icont.end(n));  }

   BOOST_CONTAINER_FORCEINLINE const_local_iterator end(size_type n) const
   {  return this->cend(n);   }

   BOOST_CONTAINER_FORCEINLINE const_local_iterator cend(size_type n) const
   {  return const_local_iterator(this->non_const_icont().end(n));  }
*/
   float load_factor() const BOOST_NOEXCEPT
   {
      assert(0);
      return 0.0f;
   }

   float max_load_factor() const BOOST_NOEXCEPT
   {
      assert(0);
      return 0.0f;
   }

   void max_load_factor(float)
   {
      assert(0);
   }

   void rehash(size_type n)
   {
      (void)n;
      //! <b>Effects</b>: bucket_count() >= size() / max_load_factor() and bucket_count() >= n.
      assert(0);
   }

   void reserve(size_type n)
   {
      if (this->bucket_count() < n) {
         std::size_t sc = Icont::suggested_lower_bucket_count(n);
         bucket_holder_t& this_buckets = *this;
         bucket_holder_t new_buckets(sc + Icont::bucket_overhead, this_buckets.get_allocator());
         this->m_icont.rehash(bucket_traits(new_buckets.data(), new_buckets.size()));
         this_buckets.swap(new_buckets);
      }
   }

   BOOST_CONTAINER_FORCEINLINE friend bool operator==(const hash_table& x, const hash_table& y)
   {  return x.size() == y.size() && ::boost::container::algo_equal(x.begin(), x.end(), y.begin());  }

   BOOST_CONTAINER_FORCEINLINE friend bool operator!=(const hash_table& x, const hash_table& y)
   {  return !(x == y);  }

   BOOST_CONTAINER_FORCEINLINE friend void swap(hash_table& x, hash_table& y)
      BOOST_NOEXCEPT_IF(  allocator_traits_type::is_always_equal::value
                                 && boost::container::dtl::is_nothrow_swappable<KeyEqual>::value 
                                 && boost::container::dtl::is_nothrow_swappable<KeyHash>::value )
   {  x.swap(y);  }

   BOOST_CONTAINER_FORCEINLINE friend std::size_t hash_value(const hash_table& x)
   {  return boost::hash_range(x.cbegin(), x.end());   }

   private:
   template <class I, class C, class K>
   BOOST_CONTAINER_FORCEINLINE
   static std::pair<I, I> priv_equal_range_unique(C &c, const K& k)
   {
      I i = c.find(k);
      I j = i;
      if (i != c.end())
         ++j;
      return std::pair<I, I>(i, j);
   }
};

} //namespace dtl {
} //namespace container {

template <class T>
struct has_trivial_destructor_after_move;

//!has_trivial_destructor_after_move<> == true_type
//!specialization for optimizations
template <class T, class KeyOfValue, class KeyHash, class KeyEqual, class Allocator, class Options>
struct has_trivial_destructor_after_move
   < 
      ::boost::container::dtl::hash_table
         <T, KeyOfValue, KeyHash, KeyEqual, Allocator, Options>
   >
{
   typedef typename ::boost::container::allocator_traits<Allocator>::pointer pointer;
   static const bool value = ::boost::has_trivial_destructor_after_move<Allocator>::value &&
                             ::boost::has_trivial_destructor_after_move<pointer>::value &&
                             ::boost::has_trivial_destructor_after_move<KeyHash>::value &&
                             ::boost::has_trivial_destructor_after_move<KeyEqual>::value;
};

} //namespace boost  {

#include <boost/container/detail/config_end.hpp>

#endif //BOOST_CONTAINER_HASH_TABLE_HPP
