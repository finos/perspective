# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from random import random


class PerspectiveSession(object):
    '''Encapsulates the actions and resources of a single connection to Perspective.'''

    def __init__(self, manager):
        '''Create a new session object, keeping track of a unique client_id and the manager the session belongs to.

        `PerspectiveSession` should not be constructed directly - use `PerspectiveManager.new_session()` to create.
        '''
        self.client_id = str(random())
        self.manager = manager

    def process(self, message, post_callback):
        '''Pass a message to the manager's `process` method, which passes the result to `post_callback`.'''
        self.manager._process(message, post_callback, client_id=self.client_id)

    def close(self):
        '''Remove the views created within this session when the session ends.'''
        self.manager.clear_views(self.client_id)
