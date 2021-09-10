////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::utils::*;

use std::cell::RefCell;
use std::collections::VecDeque;
use std::future::Future;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;

#[derive(Default, Clone)]
pub struct MovingWindowRenderTimer(Rc<RefCell<RenderTimerType>>);

enum RenderTimerType {
    Moving(Closure<dyn Fn(JsValue)>, Rc<RefCell<Option<VecDeque<f64>>>>),
    Constant(f64),
}

impl Drop for RenderTimerType {
    fn drop(&mut self) {
        if let RenderTimerType::Moving(closure, _) = self {
            let document = window().unwrap().document().unwrap();
            document
                .remove_event_listener_with_callback(
                    "visibilitychange",
                    closure.as_ref().unchecked_ref(),
                )
                .unwrap();
        }
    }
}

impl Default for RenderTimerType {
    fn default() -> RenderTimerType {
        let deque: Rc<RefCell<Option<VecDeque<f64>>>> = Default::default();
        RenderTimerType::Moving(register_on_visibility_change(deque.clone()), deque)
    }
}

/// We need to clear the throttle queue when the browser tab is hidden, else
/// the next frame timing will be the time the tab was hidden + render time.
fn register_on_visibility_change(
    deque: Rc<RefCell<Option<VecDeque<f64>>>>,
) -> Closure<dyn Fn(JsValue)> {
    let fun = move |_| {
        *deque.borrow_mut() = None;
    };

    let closure = fun.into_closure();
    let document = window().unwrap().document().unwrap();
    document
        .add_event_listener_with_callback(
            "visibilitychange",
            closure.as_ref().unchecked_ref(),
        )
        .unwrap();

    closure
}

impl MovingWindowRenderTimer {
    pub async fn capture_time<T>(&self, f: impl Future<Output = T>) -> T {
        let perf = window().unwrap().performance().unwrap();
        let start = match *self.0.borrow() {
            RenderTimerType::Constant(_) => 0_f64,
            RenderTimerType::Moving(_, _) => perf.now(),
        };

        let result = f.await;
        match &mut *self.0.borrow_mut() {
            RenderTimerType::Moving(_, timings) => {
                let mut timings = timings.borrow_mut();
                if let Some(timings) = &mut *timings {
                    timings.push_back(perf.now() - start);
                    if timings.len() > 5 {
                        timings.pop_front();
                    }
                } else {
                    *timings = Some(Default::default());
                }
            }
            RenderTimerType::Constant(_) => (),
        };

        result
    }

    pub fn set_throttle(&mut self, val: Option<f64>) {
        match val {
            None => {
                *self.0.borrow_mut() = RenderTimerType::default();
            }
            Some(val) => {
                *self.0.borrow_mut() = RenderTimerType::Constant(val);
            }
        }
    }

    pub fn get_avg(&self) -> i32 {
        match &*self.0.borrow() {
            RenderTimerType::Constant(constant) => *constant as i32,
            RenderTimerType::Moving(_, timings) => {
                if let Some(timings) = &*timings.borrow() {
                    let len = timings.len();
                    if len < 5 {
                        0_i32
                    } else {
                        let sum = timings.iter().sum::<f64>();
                        let avg: f64 = sum / len as f64;
                        f64::min(5000_f64, avg.floor()) as i32
                    }
                } else {
                    0_i32
                }
            }
        }
    }
}
