# RadioGroup and Radio

One of several, shown as a list. Native radios sharing one name, so arrow keys move between
them.

```tsx
<RadioGroup defaultValue="a4" orientation="horizontal" aria-label="Paper size">
  <Radio value="a4" label="A4" />
  <Radio value="letter" label="Letter" />
  <Radio value="legal" label="Legal" disabled />
</RadioGroup>
```

## RadioGroup props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` | uncontrolled |
| `defaultValue` | `string` | `''` |
| `onValueChange` | `(value: string) => void` | |
| `name` | `string` | generated |
| `disabled` | `boolean` | `false` |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |
| `className` | `string` | |

## Radio props

Extends `ComponentProps<'input'>` minus `type`, `name`, `checked`, `onChange`, `value`, `size`.

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `string` | required |
| `label` | `ReactNode` | omit for a bare control with `aria-label` |

Give the group an `aria-label` or `aria-labelledby`.
