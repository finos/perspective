////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::perspective::*;
use crate::js::perspective_viewer::JsPerspectiveViewerPlugin;
use crate::*;

#[cfg(test)]
use {
    crate::utils::*, wasm_bindgen::JsCast, wasm_bindgen_futures::future_to_promise,
    wasm_bindgen_test::*,
};

pub async fn get_row_and_col_limits(
    view: &JsPerspectiveView,
    plugin: &JsPerspectiveViewerPlugin,
) -> Result<(usize, usize, Option<usize>, Option<usize>), JsValue> {
    let num_cols = view.num_columns().await? as usize;
    let num_rows = view.num_rows().await? as usize;
    // if !limit {
    //     Ok((num_cols, num_rows, None, None))
    // } else {
    match (plugin.max_columns(), plugin.render_warning()) {
        (Some(_), Some(false)) => Ok((num_cols, num_rows, None, None)),
        (max_columns, _) => {
            let schema = view.schema().await?;
            let num_schema_columns =
                std::cmp::max(1, js_sys::Object::keys(&schema).length() as usize);
            let max_cols = max_columns.and_then(|max_columns| {
                let column_group_diff = max_columns % num_schema_columns;
                let column_limit = max_columns + column_group_diff;
                if column_limit < num_cols {
                    Some(column_limit)
                } else {
                    None
                }
            });

            let max_rows = plugin.max_cells().map(|max_cells| {
                match max_cols {
                    Some(max_cols) => max_cells as f64 / max_cols as f64,
                    None => max_cells as f64 / num_cols as f64,
                }
                .ceil() as usize
            });

            Ok((num_cols, num_rows, max_cols, max_rows))
        }
    }
    // }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn closure_helper<T>(x: T) -> Closure<dyn Fn(JsValue) -> js_sys::Promise>
    where
        T: Into<JsValue>,
    {
        let val = x.into();
        (move |_: JsValue| {
            clone!(val);
            future_to_promise(async move { Ok(val.clone()) })
        })
        .to_closure()
    }

    #[wasm_bindgen_test]
    pub async fn test_emtpy_schema_no_columns() {
        let closure = closure_helper(0);
        let closure2 = closure_helper(js_object!());
        let view = js_object!(
            "num_columns", closure.as_ref().unchecked_ref::<JsValue>();
            "num_rows", closure.as_ref().unchecked_ref::<JsValue>();
            "schema", closure2.as_ref().unchecked_ref::<JsValue>()
        )
        .unchecked_into::<JsPerspectiveView>();

        let plugin = js_object!().unchecked_into::<JsPerspectiveViewerPlugin>();
        let (_, _, max_cols, max_rows) =
            get_row_and_col_limits(&view, &plugin).await.unwrap();
        assert_eq!(max_cols, None);
        assert_eq!(max_rows, None);
    }

    #[wasm_bindgen_test]
    pub async fn test_columns_do_not_exceed_max_columns() {
        let closure = closure_helper(1);
        let closure2 = closure_helper(0);
        let closure3 = closure_helper(js_object!());
        let view = js_object!(
            "num_columns", closure.as_ref().unchecked_ref::<JsValue>();
            "num_rows", closure2.as_ref().unchecked_ref::<JsValue>();
            "schema", closure3.as_ref().unchecked_ref::<JsValue>()
        )
        .unchecked_into::<JsPerspectiveView>();

        let plugin =
            js_object!("max_columns", 2).unchecked_into::<JsPerspectiveViewerPlugin>();
        let (_, _, max_cols, max_rows) =
            get_row_and_col_limits(&view, &plugin).await.unwrap();
        assert_eq!(max_cols, None);
        assert_eq!(max_rows, None);
    }

    #[wasm_bindgen_test]
    pub async fn test_columns_exceed_max_columns() {
        let closure = closure_helper(2);
        let closure2 = closure_helper(0);
        let closure3 = closure_helper(js_object!());
        let view = js_object!(
            "num_columns", closure.as_ref().unchecked_ref::<JsValue>();
            "num_rows", closure2.as_ref().unchecked_ref::<JsValue>();
            "schema", closure3.as_ref().unchecked_ref::<JsValue>()
        )
        .unchecked_into::<JsPerspectiveView>();

        let plugin =
            js_object!("max_columns", 1).unchecked_into::<JsPerspectiveViewerPlugin>();
        let (_, _, max_cols, max_rows) =
            get_row_and_col_limits(&view, &plugin).await.unwrap();
        assert_eq!(max_cols, Some(1));
        assert_eq!(max_rows, None);
    }

    #[wasm_bindgen_test]
    pub async fn test_when_schema_columns_are_present() {
        let closure = closure_helper(100);
        let closure2 = closure_helper(0);
        let closure3 = closure_helper(js_object!("x", "string"; "y", "string"));
        let view = js_object!(
            "num_columns", closure.as_ref().unchecked_ref::<JsValue>();
            "num_rows", closure2.as_ref().unchecked_ref::<JsValue>();
            "schema", closure3.as_ref().unchecked_ref::<JsValue>()
        )
        .unchecked_into::<JsPerspectiveView>();

        let plugin =
            js_object!("max_columns", 3).unchecked_into::<JsPerspectiveViewerPlugin>();
        let (_, _, max_cols, max_rows) =
            get_row_and_col_limits(&view, &plugin).await.unwrap();
        assert_eq!(max_cols, Some(4));
        assert_eq!(max_rows, None);
    }

    #[wasm_bindgen_test]
    pub async fn test_when_max_cells_exits() {
        let closure = closure_helper(1);
        let closure2 = closure_helper(0);
        let closure3 = closure_helper(js_object!());
        let view = js_object!(
            "num_columns", closure.as_ref().unchecked_ref::<JsValue>();
            "num_rows", closure2.as_ref().unchecked_ref::<JsValue>();
            "schema", closure3.as_ref().unchecked_ref::<JsValue>()
        )
        .unchecked_into::<JsPerspectiveView>();

        let plugin =
            js_object!("max_cells", 2).unchecked_into::<JsPerspectiveViewerPlugin>();
        let (_, _, max_cols, max_rows) =
            get_row_and_col_limits(&view, &plugin).await.unwrap();
        assert_eq!(max_cols, None);
        assert_eq!(max_rows, Some(2));
    }

    #[wasm_bindgen_test]
    pub async fn test_when_columns_exceed_max_columns_and_max_cells_exists() {
        let closure = closure_helper(4);
        let closure2 = closure_helper(0);
        let closure3 = closure_helper(js_object!());
        let view = js_object!(
            "num_columns", closure.as_ref().unchecked_ref::<JsValue>();
            "num_rows", closure2.as_ref().unchecked_ref::<JsValue>();
            "schema", closure3.as_ref().unchecked_ref::<JsValue>()
        )
        .unchecked_into::<JsPerspectiveView>();

        let plugin = js_object!("max_cells", 10; "max_columns", 2)
            .unchecked_into::<JsPerspectiveViewerPlugin>();
        let (_, _, max_cols, max_rows) =
            get_row_and_col_limits(&view, &plugin).await.unwrap();
        assert_eq!(max_cols, Some(2));
        assert_eq!(max_rows, Some(5));
    }
}
