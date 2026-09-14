# Toast

A brief notice that does not interrupt: saved, exported, failed. Mount `<Toaster />` once near
the root, then call `toast()` from anywhere.

```tsx
<Toaster />

toast('Document saved', { description: 'Q3 planning, 2 seconds ago.' });
toast.success('Exported to PDF', { action: { label: 'Open', onClick: open } });
toast.error('Export failed', { duration: 0 });
const id = toast('Uploading...', { duration: 0 });
toast.dismiss(id);
```

## `toast(title, options)`

| Option | Type | Default |
| --- | --- | --- |
| `description` | `ReactNode` | |
| `variant` | `'default' \| 'success' \| 'error'` | `'default'` |
| `duration` | `number` ms | `5000`; `0` keeps it until dismissed |
| `action` | `{ label, onClick }` | |

Returns the toast id. `toast.success`, `toast.error` and `toast.dismiss(id)` are shortcuts.

## Behaviour

The region is a `popover="manual"` in the top layer and re-raises itself when a toast arrives,
so toasts show above an open dialog. Each toast is `role="status"` (errors are `role="alert"`),
so screen readers announce it. Newest at the bottom, bottom-right corner, each one a floating
glass pane with a dismiss button.
