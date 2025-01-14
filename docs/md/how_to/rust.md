# Rust

Install via `cargo`:

```bash
cargo add perspective
```

# Example

Initialize a server and client

```rust
let server = Server::default();
let client = server.new_local_client();
```

Load an Arrow

```rust
let mut file = File::open(std::path::Path::new(ROOT_PATH).join(ARROW_FILE_PATH))?;
let mut feather = Vec::with_capacity(file.metadata()?.len() as usize);
file.read_to_end(&mut feather)?;
let data = UpdateData::Arrow(feather.into());
let mut options = TableInitOptions::default();
options.set_name("my_data_source");
client.table(data.into(), options).await?;
```
