// Boost.Geometry

// Copyright (c) 2021, Oracle and/or its affiliates.

// Contributed and/or modified by Vissarion Fysikopoulos, on behalf of Oracle

// Licensed under the Boost Software License version 1.0.
// http://www.boost.org/users/license.html

#ifndef BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_CLOSEST_POINTS_CROSS_TRACK_HPP
#define BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_CLOSEST_POINTS_CROSS_TRACK_HPP

#include <algorithm>

#include <boost/tuple/tuple.hpp>
#include <boost/algorithm/minmax.hpp>
#include <boost/config.hpp>
#include <boost/concept_check.hpp>

#include <boost/geometry/core/cs.hpp>
#include <boost/geometry/core/access.hpp>
#include <boost/geometry/core/coordinate_promotion.hpp>
#include <boost/geometry/core/radian_access.hpp>
#include <boost/geometry/core/tags.hpp>

#include <boost/geometry/strategies/distance.hpp>
#include <boost/geometry/strategies/concepts/distance_concept.hpp>
#include <boost/geometry/strategies/spherical/distance_cross_track.hpp>
#include <boost/geometry/strategies/spherical/distance_haversine.hpp>
#include <boost/geometry/strategies/spherical/point_in_point.hpp>
#include <boost/geometry/strategies/geographic/azimuth.hpp>
#include <boost/geometry/strategies/geographic/distance.hpp>
#include <boost/geometry/strategies/geographic/distance_cross_track.hpp>
#include <boost/geometry/strategies/geographic/parameters.hpp>
#include <boost/geometry/strategies/geographic/intersection.hpp>

#include <boost/geometry/util/math.hpp>
#include <boost/geometry/util/select_calculation_type.hpp>
#include <boost/geometry/util/normalize_spheroidal_coordinates.hpp>

#include <boost/geometry/formulas/mean_radius.hpp>
#include <boost/geometry/formulas/result_direct.hpp>
#include <boost/geometry/formulas/spherical.hpp>
#include <boost/geometry/formulas/vincenty_direct.hpp>

#ifdef BOOST_GEOMETRY_DEBUG_GEOGRAPHIC_CROSS_TRACK
#include <boost/geometry/io/dsv/write.hpp>
#endif

#ifndef BOOST_GEOMETRY_DETAIL_POINT_SEGMENT_DISTANCE_MAX_STEPS
#define BOOST_GEOMETRY_DETAIL_POINT_SEGMENT_DISTANCE_MAX_STEPS 100
#endif

#ifdef BOOST_GEOMETRY_DEBUG_GEOGRAPHIC_CROSS_TRACK
#include <iostream>
#endif

namespace boost { namespace geometry
{

namespace strategy { namespace closest_points
{

template
<
    typename FormulaPolicy = geometry::strategy::andoyer,
    typename Spheroid = srs::spheroid<double>,
    typename CalculationType = void
>
class geographic_cross_track
    : public distance::detail::geographic_cross_track
        <
            FormulaPolicy,
            Spheroid,
            CalculationType,
            false,
            true
        >
{
    using base_t = distance::detail::geographic_cross_track
        <
            FormulaPolicy,
            Spheroid,
            CalculationType,
            false,
            true
        >;
    
    template <typename Point, typename PointOfSegment>
    struct calculation_type
        : promote_floating_point
          <
              typename select_calculation_type
                  <
                      Point,
                      PointOfSegment,
                      CalculationType
                  >::type
          >
    {};

public :
    explicit geographic_cross_track(Spheroid const& spheroid = Spheroid())
        : base_t(spheroid)
        {}

        template <typename Point, typename PointOfSegment>
        auto apply(Point const& p,
                   PointOfSegment const& sp1,
                   PointOfSegment const& sp2) const
        {
            auto result = base_t::apply(get_as_radian<0>(sp1), get_as_radian<1>(sp1),
                                        get_as_radian<0>(sp2), get_as_radian<1>(sp2),
                                        get_as_radian<0>(p), get_as_radian<1>(p),
                                        base_t::m_spheroid);

            model::point
                <
                    typename calculation_type<Point, PointOfSegment>::type,
                    dimension<PointOfSegment>::value,
                    typename coordinate_system<PointOfSegment>::type
                > cp;
            
            geometry::set_from_radian<0>(cp, result.lon);
            geometry::set_from_radian<1>(cp, result.lat);

            return cp;
        }
};

}} // namespace strategy::closest_points

}} // namespace boost::geometry
#endif // BOOST_GEOMETRY_STRATEGIES_GEOGRAPHIC_CLOSEST_POINTS_CROSS_TRACK_HPP
