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

use perspective_js::utils::global;
use web_sys::*;

/// Anchor point enum, `ModalCornerTargetCorner`
#[derive(Clone, Copy, Debug, Default)]
pub enum ModalAnchor {
    BottomRightTopLeft,
    BottomRightBottomLeft,
    BottomRightTopRight,
    BottomLeftTopLeft,
    TopRightTopLeft,
    TopRightBottomRight,

    #[default]
    TopLeftBottomLeft,
}

impl ModalAnchor {
    pub const fn is_rev_vert(&self) -> bool {
        matches!(
            self,
            Self::BottomLeftTopLeft
                | Self::BottomRightBottomLeft
                | Self::BottomRightTopLeft
                | Self::BottomRightTopRight
        )
    }
}

/// Pick the anchor that keeps a modal of `modal`'s size on-screen when opened
/// against `target`, from those rects alone so repeated calls agree.
pub fn calc_relative_position(target: &DomRect, modal: &DomRect) -> ModalAnchor {
    let window = global::window();
    let inner_width = window.inner_width().unwrap().as_f64().unwrap();
    let inner_height = window.inner_height().unwrap().as_f64().unwrap();
    let top = target.top();
    let left = target.left();
    let height = target.height();
    let width = target.width();
    let modal_height = modal.height();
    let modal_width = modal.width();

    let elem_over_y = inner_height < top + height - 1.0 + modal_height;
    let elem_over_x = inner_width < left + modal_width;
    let target_over_x = inner_width < left + width;
    let target_over_y = inner_height < top + height;

    // modal/target
    match (elem_over_y, elem_over_x, target_over_x, target_over_y) {
        (true, _, true, true) => ModalAnchor::BottomRightTopLeft,
        (true, _, true, false) => ModalAnchor::BottomRightBottomLeft,
        (true, true, false, _) => {
            if left + width - modal_width > 0.0 {
                ModalAnchor::BottomRightTopRight
            } else {
                ModalAnchor::BottomLeftTopLeft
            }
        },
        (true, false, false, _) => ModalAnchor::BottomLeftTopLeft,
        (false, true, true, _) => ModalAnchor::TopRightTopLeft,
        (false, true, false, _) => {
            if left + width - modal_width > 0.0 {
                ModalAnchor::TopRightBottomRight
            } else {
                ModalAnchor::TopLeftBottomLeft
            }
        },
        _ => ModalAnchor::TopLeftBottomLeft,
    }
}

/// Calculate the (top, left) position for a modal element given an anchor
/// point, target element bounding rect, and the modal element's own bounding
/// rect.
pub fn calc_anchor_position(anchor: ModalAnchor, target: &DomRect, modal: &DomRect) -> (f64, f64) {
    let height = target.height();
    let width = target.width();
    let top = target.top();
    let left = target.left();
    let rect_height = modal.height();
    let rect_width = modal.width();

    match anchor {
        ModalAnchor::BottomRightTopLeft => (top - rect_height, left - rect_width + 1.0),
        ModalAnchor::BottomRightBottomLeft => (top - rect_height + height, left - rect_width + 1.0),
        ModalAnchor::BottomRightTopRight => (top - rect_height + 1.0, left + width - rect_width),
        ModalAnchor::BottomLeftTopLeft => (top - rect_height + 1.0, left),
        ModalAnchor::TopRightTopLeft => (top, left - rect_width + 1.0),
        ModalAnchor::TopRightBottomRight => (top + height - 1.0, left + width - rect_width),
        ModalAnchor::TopLeftBottomLeft => (top + height - 1.0, left),
    }
}
