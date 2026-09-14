import { HeroBlock, FeatureGrid, PricingBlock, FAQBlock } from "@crumza/blocks";

export default function BlockCollection() {
  return (
    <div className="collection-grid">
      <article>
        <HeroBlock
          eyebrow="A starting point"
          heading="Make room for good work."
          description="A considered introduction, a little context, and one clear next step."
          actions={<a href="/docs/blocks">Use this block</a>}
        />
        <div className="tile-label">
          <strong>Introduction</strong>
          <span>HeroBlock</span>
        </div>
      </article>
      <article>
        <FeatureGrid
          heading="Good foundations."
          items={[
            { id: "open", title: "Open source", description: "Read it, use it, make it yours." },
            {
              id: "quiet",
              title: "Quietly useful",
              description: "Native controls. Considered details.",
            },
          ]}
        />
        <div className="tile-label">
          <strong>At a glance</strong>
          <span>FeatureGrid</span>
        </div>
      </article>
      <article>
        <PricingBlock
          heading="The essentials"
          price="Free"
          features={["Open-source UI", "Solid, frosted and liquid", "Four starter blocks"]}
          action={<a href="/docs/getting-started">Get started</a>}
        />
        <div className="tile-label">
          <strong>A clear offer</strong>
          <span>PricingBlock</span>
        </div>
      </article>
      <article>
        <FAQBlock
          heading="A few good questions."
          items={[
            {
              id: "use",
              question: "Can I change the design?",
              answer: "Yes. Scope brand colors, radius and material with Theme.",
            },
            {
              id: "license",
              question: "Can I use it commercially?",
              answer:
                "The UI and these starter blocks use the MIT license. Keep its notice with copies.",
            },
          ]}
        />
        <div className="tile-label">
          <strong>Nothing left unclear</strong>
          <span>FAQBlock</span>
        </div>
      </article>
    </div>
  );
}
