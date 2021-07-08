////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use async_std::sync::Mutex;
use async_std::sync::MutexGuard;

use std::cell::Cell;
use std::rc::Rc;

pub struct DebounceMutexData {
    id: Cell<u64>,
    mutex: Mutex<()>,
}

#[derive(Clone)]
pub struct DebounceMutex(Rc<DebounceMutexData>);

impl Default for DebounceMutex {
    fn default() -> DebounceMutex {
        DebounceMutex(Rc::new(DebounceMutexData {
            id: Cell::new(0),
            mutex: Mutex::new(()),
        }))
    }
}

impl DebounceMutex {
    pub async fn lock(&self) -> MutexGuard<'_, ()> {
        let guard = self.0.mutex.lock().await;
        self.0.id.set(self.0.id.get() + 1);
        guard
    }

    pub async fn debounce(&self) -> Option<MutexGuard<'_, ()>> {
        let id = self.0.id.get() + 1;
        let guard = self.0.mutex.lock().await;
        if self.0.id.get() > id {
            None
        } else {
            self.0.id.set(self.0.id.get() + 1);
            Some(guard)
        }
    }
}
