// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

/// Trait for polymorphic return value via turbofish-const-generic syntax.
/// The associated type `Output` is a functional dependency of the const generic
/// parameter `N`, so there's typically no need to specify this parameter when
/// invoking, which is what we want - this parameter is quite verbose and
/// repetitive (see below), vs `N` which is a single character.
pub trait TeeInternal<const N: usize> {
    type Output: Clone;
    fn tee_internal(self) -> Self::Output;
}

pub trait Tee {
    /// Extension method to add `tee()` method to all `T: Clone`. This can't be
    /// done directly as part of `TeeInternal` because it makes specifying the
    /// const param at the `tee()` invocation site cumbersome:
    /// `TeeInternal::<N>::tee(&obj)` as opposed to `obj.tee::<N>()`. The
    /// constraint `Self: TeeInternal<N>` collapses the potential `impl` matches
    /// to exactly 1, which makes the call to `tee_internal()` unambiguous.
    /// This constraint is also allowed to contain the generic parameter `N`
    /// because it is specified as a constraint to the method (as opposed to
    /// a constraint on the trait). I'm honestly quite surprised this works ...
    ///
    /// # Examples
    ///
    /// ```
    /// let x = "test".tee::<2>();
    /// assert_eq!(x.0, x.1);
    /// assert_eq!(x.0, "test");
    /// ```
    fn tee<const N: usize>(self) -> <Self as TeeInternal<N>>::Output
    where
        Self: TeeInternal<N>;
}

impl<T: Clone> Tee for T {
    fn tee<const N: usize>(self) -> <Self as TeeInternal<N>>::Output
    where
        Self: TeeInternal<N>,
    {
        self.tee_internal()
    }
}

macro_rules! gen_tee {
    ($($x:ty),*) => {
        impl<T: Clone> TeeInternal<{${count(x)} + 1}> for T {
            type Output = ($($x),*, T);
            fn tee_internal(self) -> Self::Output {
                ($( ${ignore(x)} self.clone() ),*, self)
            }
        }
    };
}

gen_tee!(T);
gen_tee!(T, T);
gen_tee!(T, T, T);
gen_tee!(T, T, T, T);
gen_tee!(T, T, T, T, T);
gen_tee!(T, T, T, T, T, T);
gen_tee!(T, T, T, T, T, T, T);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_test1() {
        let x = "test".tee::<2>();
        assert_eq!(x.0, x.1);
        assert_eq!(x.0, "test");
    }
}
