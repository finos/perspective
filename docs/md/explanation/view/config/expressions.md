# Expressions

The `expressions` property specifies _new_ columns in Perspective that are
created using existing column values or arbitary scalar values defined within
the expression. In `<perspective-viewer>`, expressions are added using the "New
Column" button in the side panel.

A custom name can be added to an expression by making the first line a comment:

<div class="javascript">

```javascript
const view = await table.view({
    expressions: { '"a" + "b"': '"a" + "b"' },
});
```

</div>
<div class="python">

```python
view = table.view(expressions=['"a" + "b"'])
```

</div>
<div class="rust">

</div>
