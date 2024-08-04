The schema of this [`View`].

The [`View`] schema differs from the `schema` returned by [`Table::schema`]; it
may have different column names due to `expressions` or `columns` configs, or it
maye have _different column types_ due to the application og `group_by` and
`aggregates` config. You can think of [`Table::schema`] as the _input_ schema
and [`View::schema`] as the _output_ schema of a Perspective pipeline.

<div class="javascript">

# JavaScript Examples

```javascript
const [`View`] = await table.view({ columns: ["a", "b"] });
const schema = await view.schema(); // {a: "float", b: "string"}
```

</div>
