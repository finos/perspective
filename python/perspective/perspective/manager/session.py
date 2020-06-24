################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from random import random


class PerspectiveSession(object):
    '''Encapsulates the actions and resources of a single connection to
    Perspective.
    '''

    def __init__(self, manager):
        '''Create a new session object, keeping track of a unique client_id and
        the manager the session belongs to.

        `PerspectiveSession` should not be constructed directly. Instead, use
        `PerspectiveManager.new_session()` to create a new session.
        '''
        self.client_id = str(random())
        self.manager = manager

    def process(self, message, post_callback):
        '''Pass a message to the manager's `process` method, which passes the
        result to `post_callback`.

        Additionally, intercept calls to `on_update` in order
        to track the callbacks that were created through this session. This
        allows for cleaning up callbacks after a session closes, which may not
        necessarily involve calling `delete()` on associated views.
        '''
        self.manager._process(message, post_callback, client_id=self.client_id)

    def close(self):
        '''Remove the views and callbacks that were created within this session
        when the session ends.
        '''
        self.manager.clear_views(self.client_id)
        self._clear_callbacks()

    def _clear_callbacks(self):
        # remove all callbacks from the view's cache
        for cb in self.manager._callback_cache:
            if cb["client_id"] == self.client_id:
                view = self.manager.get_view(cb["name"])
                if view:
                    view.remove_update(cb["callback"])
        # remove all callbacks from the manager's cache
        self.manager._callback_cache.remove_callbacks(
            lambda cb: cb["client_id"] == self.client_id)
