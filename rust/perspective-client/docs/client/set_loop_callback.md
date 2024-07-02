Methods such as [`View::on_update`] take a callback function as an argument,
which may be invoked by the Perspective runtime when updates occur. If provided
a _loop callback_ function via [`Client::set_loop_callback`], such callback
function invocations be passed to the _loop callback_ instead.

[`Client::set_loop_callback`] can be used to control scheduling/conflation
(e.g. by adding a delay), as well as executor integration.
