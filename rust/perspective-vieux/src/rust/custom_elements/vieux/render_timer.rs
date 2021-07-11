////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::cell::RefCell;
use std::collections::VecDeque;
use std::future::Future;
use std::rc::Rc;
use web_sys::*;

#[derive(Default, Clone)]
pub struct MovingWindowRenderTimer(Rc<RefCell<RenderTimerType>>);

enum RenderTimerType {
    Moving(VecDeque<f64>),
    Constant(f64),
}

impl Default for RenderTimerType {
    fn default() -> RenderTimerType {
        RenderTimerType::Moving(VecDeque::new())
    }
}

impl MovingWindowRenderTimer {
    pub async fn capture_time<T>(&self, f: impl Future<Output = T>) -> T {
        let perf = window().unwrap().performance().unwrap();
        let start = match *self.0.borrow() {
            RenderTimerType::Constant(_) => 0_f64,
            RenderTimerType::Moving(_) => perf.now(),
        };

        let result = f.await;
        match &mut *self.0.borrow_mut() {
            RenderTimerType::Moving(timings) => {
                timings.push_back(perf.now() - start);
                if timings.len() > 5 {
                    timings.pop_front();
                }
            }
            RenderTimerType::Constant(_) => (),
        };

        result
    }

    pub fn set_render_time(&mut self, val: Option<f64>) {
        match val {
            None => {
                *self.0.borrow_mut() = RenderTimerType::default();
            }
            Some(val) => {
                *self.0.borrow_mut() = RenderTimerType::Constant(val);
            }
        }
    }

    pub fn get_avg(&self) -> f64 {
        match &*self.0.borrow() {
            RenderTimerType::Constant(constant) => *constant,
            RenderTimerType::Moving(timings) => {
                let len = timings.len();
                if len < 5 {
                    0_f64
                } else {
                    let sum = timings.iter().sum::<f64>();
                    let avg: f64 = sum / len as f64;
                    f64::min(5000_f64, avg.floor())
                }
            }
        }
    }
}
