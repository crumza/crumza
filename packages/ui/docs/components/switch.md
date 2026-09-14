# Switch

On/off with immediate effect (autosave, dark mode). A native checkbox with `role="switch"`.
Use a [Checkbox](/docs/components/checkbox) when the choice only takes effect on submit.

```tsx
<Switch label="Autosave" defaultChecked />
<Switch label="Reduce transparency" checked={reduce} onCheckedChange={setReduce} />
```

## Props

Extends `ComponentProps<'input'>` minus `type`, `size` and `onChange`.

| Prop | Type | Default |
| --- | --- | --- |
| `label` | `ReactNode` | |
| `checked` | `boolean` | uncontrolled |
| `defaultChecked` | `boolean` | `false` |
| `onCheckedChange` | `(checked: boolean) => void` | |

The switch keeps its own state so `aria-checked` is always correct; pass `checked` to control it.
