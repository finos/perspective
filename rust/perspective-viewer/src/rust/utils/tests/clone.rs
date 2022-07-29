use crate::*;

#[derive(Clone)]
struct X {
    x: i32,
}

impl X {
    fn test(&self) -> i32 {
        1
    }
}

#[derive(Clone)]
struct Y {
    y: X,
}

#[test]
fn test_one_ident() {
    let x = 0;
    clone!(x);
    assert_eq!(x, 0);
}

#[test]
fn test_two_idents() {
    let x = 0;
    let y = 1;
    clone!(x, y);
    assert_eq!(x, 0);
    assert_eq!(y, 1);
}

#[test]
fn test_struct_field() {
    let x = X { x: 0 };
    clone!(x.x);
    assert_eq!(x, 0);
}

#[test]
fn test_struct_struct_field() {
    let x = Y { y: X { x: 0 } };
    clone!(x.y.x);
    assert_eq!(x, 0);
}

#[test]
fn test_tuple() {
    let x = (0, 1);
    clone!(x.0);
    assert_eq!(x, 0);
}

#[test]
fn test_alias() {
    let x = 0;
    clone!(y = x);
    assert_eq!(y, 0);
}

#[test]
fn test_complex() {
    let x = Y { y: X { x: 0 } };
    let w = (0, x.clone());
    clone!(z = x.y.x, x.y.test(), w.1.y.x);
    assert_eq!(z, 0);
    assert_eq!(x, 0);
    assert_eq!(test, 1);
}
