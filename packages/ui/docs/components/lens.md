# Scene and Lens (experimental)

This retained experiment copies an owned CSS backdrop and displaces it near a lens edge. It does not refract arbitrary live content and is not the default Crumza material.

```tsx
<Scene backdrop="linear-gradient(120deg, #baccc2, #eee7d9)">
  <Lens className="rounded-2xl p-5">Experimental optical surface</Lens>
</Scene>
```

## API

Scene extends div props and requires backdrop, a CSS background-image value. Lens requires an enclosing Scene and extends div props.

| Prop | Default | Meaning |
| --- | --- | --- |
| strength | 22 | Maximum edge displacement in pixels |
| band | 22 | Edge region in pixels |
| dispersion | 0 | Chromatic offset |
| blur | 10 | Interior blur |
| live | false | Re-align copies every animation frame |
| interactive | false | Stronger bend while pressed |

## Limits

Leave live off for static content. This technique duplicates backdrop rendering and may be expensive. Device-specific optical, motion and accessibility validation remains outstanding; it is not a cross-engine performance guarantee. Do not use it in a long list or over sensitive arbitrary DOM.

For production-oriented chrome use [Glass](/docs/components/glass) with material="frosted" or "liquid". Glass no longer has a refract prop. One clarity setting controls the normal material without a per-frame loop.
