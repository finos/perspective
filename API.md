# Perspective API design notes

### Goals
- Make the core C++ library an extensible base for developers to build on using different languages.
- Port features previously segregated to Javascript into C++, thereby removing dependency on JS for the core library.
- Move business logic into C++, thus allowing the purpose of the JS library to act as a bound wrapper rather than a dependent extension.

This document aims to elaborate on the design of the core library API, as well as information designed to aid the core developer in creating new features/extending the library into new language bindings.

### Components
- Table: C++ class that will implement the features previously found in the `perspective.js` table, including all prototype methods and class members.
- t_table: C++ class that manages the underlying operations for `Table`.
- View: C++ class that will implement all features and members previously found in the `perspective.js` view. 
- pool: A collection of `gnode`(s) managed in C++.
- gnode: A "graph node" that contains any number of `t_table`s, although in implementation we only assign one `t_table` to one `gnode`.

### Steps for porting
1. Transliterate JS to C++: liberal use of `embind` and `val` in order to start porting features previously segregated to Javascript into C++.
2. Make C++ functions portable: start removing the use of all JS-dependent data structures, members, and methods in order to allow for C++ portability.
3. Add the translation layer: now that C++ functions expect generic C++ parameters (and not a `val`, on which any number of arbitrary JS-only operations may be called), add the translator layer that converts JS input into what the portable C++ API expects, as well as converts the output into something suitable for JS. 
4. Convert the JS library into simple function calls: though the `perspective.js` API will not change, the underlying implementation for methods will simply return the output of the C++ method, with translation where necessary.

### C++
`View`: class which will implement all methods from the `perspective.js` version of view. 
- Expects C++ data structure input and returns native data structures. 
- Should be as portable and extensible as possible. 
- Should abstract away concepts like pool and gnode.

`Table`: class which implements all methods from the `perspective.js` table. 
- Expects C++ data structure input and returns native data structures. 
- Should be as portable and extensible as possible.

### Translation/Helper layer
`make_view`: helper function in `emscripten.cpp` that returns a `std::shared_ptr<View<CONTEXT_T>>`.
- Should construct the underlying `View` object.
- Should expect native C++ data structures as input.

*TBD: how should we implement the translation layer?*
- As separate methods that are called, which makes `make_view` extremely dependent on side-effects?
- As a layer in `perspective.js`, which makes it harder to create C++ native data structures?
- As a new binding in the C++ `src` folder, allowing for a place for developers to add their own language bindings? 

### Javascript
`View`: the view class on the Javascript side should be a wrapper around calls to the Emscripten `__MODULE__`.
- Should maintain an internal reference to the C++ `View` object created on instantiation.
- Methods should call the corresponding method on the C++ `View`, and return output that is ready for JS consumption.