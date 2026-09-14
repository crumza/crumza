# Field

Label, control, then a description or an error.

```tsx
<Field label="Summary" htmlFor="summary" error="Keep it under 280 characters." required>
  <Textarea id="summary" aria-invalid="true" />
</Field>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `ReactNode` | | |
| `htmlFor` | `string` | | the control's `id` |
| `description` | `ReactNode` | | hidden while `error` is set |
| `error` | `ReactNode` | | rendered with `role="alert"` |
| `required` | `boolean` | `false` | adds the asterisk; also set `required` on the control |
| `className` | `string` | | |

Set `aria-invalid="true"` on the control yourself when passing `error`; the field does not reach
into its children.
