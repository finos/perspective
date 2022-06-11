################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from traitlets import HasTraits, Unicode, List, Bool, Dict, validate
from .validate import (
    validate_plugin,
    validate_columns,
    validate_group_by,
    validate_split_by,
    validate_aggregates,
    validate_sort,
    validate_filter,
    validate_expressions,
    validate_plugin_config,
)


class PerspectiveTraitlets(HasTraits):
    """Define the traitlet interface with `PerspectiveJupyterWidget` on the
    front end. Attributes which are set here are synchronized between the
    front-end and back-end.

    Examples:
        >>> widget = perspective.PerspectiveWidget(
        ...     data, group_by=["a", "b", "c"])
        PerspectiveWidget(group_by=["a", "b", "c"])
        >>> widget.split_by=["b"]
        >>> widget
        PerspectiveWidget(group_by=["a", "b", "c"], split_by=["b"])
    """

    # `perspective-viewer` options
    plugin = Unicode("Datagrid").tag(sync=True)
    columns = List(default_value=[]).tag(sync=True)
    group_by = List(trait=Unicode(), default_value=[]).tag(sync=True, o=True)
    split_by = List(trait=Unicode(), default_value=[]).tag(sync=True)
    aggregates = Dict(default_value={}).tag(sync=True)
    sort = List(default_value=[]).tag(sync=True)
    filter = List(default_value=[]).tag(sync=True)
    expressions = List(default_value=[]).tag(sync=True)
    plugin_config = Dict(default_value={}).tag(sync=True)
    settings = Bool(True).tag(sync=True)
    theme = Unicode("Material Light", allow_none=True).tag(sync=True)
    server = Bool(False).tag(sync=True)
    client = Bool(False).tag(sync=True)

    @validate("plugin")
    def _validate_plugin(self, proposal):
        return validate_plugin(proposal.value)

    @validate("columns")
    def _validate_columns(self, proposal):
        return validate_columns(proposal.value)

    @validate("group_by")
    def _validate_group_by(self, proposal):
        return validate_group_by(proposal.value)

    @validate("split_by")
    def _validate_split_by(self, proposal):
        return validate_split_by(proposal.value)

    @validate("aggregates")
    def _validate_aggregates(self, proposal):
        return validate_aggregates(proposal.value)

    @validate("sort")
    def _validate_sort(self, proposal):
        return validate_sort(proposal.value)

    @validate("filter")
    def _validate_filter(self, proposal):
        return validate_filter(proposal.value)

    @validate("expressions")
    def _validate_expressions(self, proposal):
        return validate_expressions(proposal.value)

    @validate("plugin_config")
    def _validate_plugin_config(self, proposal):
        return validate_plugin_config(proposal.value)
