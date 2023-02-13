use wasm_bindgen::JsValue;

pub trait JsValueSerdeExt {
    fn from_serde_ext<T>(t: &T) -> Result<JsValue, serde_wasm_bindgen::Error>
    where
        T: serde::ser::Serialize + ?Sized;

    fn into_serde_ext<T>(self) -> Result<T, serde_wasm_bindgen::Error>
    where
        T: for<'a> serde::de::Deserialize<'a>;
}

impl<U> JsValueSerdeExt for U
where
    U: Into<JsValue>,
{
    fn from_serde_ext<T>(t: &T) -> Result<JsValue, serde_wasm_bindgen::Error>
    where
        T: serde::ser::Serialize + ?Sized,
    {
        t.serialize(
            &serde_wasm_bindgen::Serializer::new()
                .serialize_maps_as_objects(true)
                .serialize_missing_as_null(true),
        )
    }

    fn into_serde_ext<T>(self) -> Result<T, serde_wasm_bindgen::Error>
    where
        T: for<'a> serde::de::Deserialize<'a>,
    {
        serde_wasm_bindgen::from_value(self.into())
    }
}
