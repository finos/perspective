Removes all the rows in the [`Table`], but preserves everything else including
the schema, index, and any callbacks or registered [`View`] instances.

Calling [`Table::clear`], like [`Table::update`] and [`Table::remove`], will trigger an update event
to any registered listeners via [`View::on_update`].
