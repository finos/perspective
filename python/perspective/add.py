# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

def abs_sum(nums: [int]) -> int:
	"""
	Aggregator to compute the absolute value of the sum of an array of floats
	"""
	sum_nums = sum(nums)
	abs_sum_nums = abs(sum_nums)
	return abs_sum_nums
