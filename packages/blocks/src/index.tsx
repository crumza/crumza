import type { ComponentProps, ReactElement, ReactNode } from "react";

export interface HeroBlockProps extends ComponentProps<"section"> {
  readonly heading: string;
  readonly description: string;
  readonly actions?: ReactNode | undefined;
  readonly eyebrow?: string | undefined;
}
export function HeroBlock({
  heading,
  description,
  actions,
  eyebrow,
  className,
  ...props
}: HeroBlockProps): ReactElement {
  return (
    <section
      data-slot="hero-block"
      className={`crumza-block crumza-hero ${className ?? ""}`}
      {...props}
    >
      {eyebrow && <p className="crumza-eyebrow">{eyebrow}</p>}
      <h2>{heading}</h2>
      <p>{description}</p>
      {actions && <div className="crumza-actions">{actions}</div>}
    </section>
  );
}
export interface FeatureItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}
export interface FeatureGridProps extends ComponentProps<"section"> {
  readonly heading: string;
  readonly items: readonly FeatureItem[];
}
export function FeatureGrid({
  heading,
  items,
  className,
  ...props
}: FeatureGridProps): ReactElement {
  return (
    <section data-slot="feature-grid" className={`crumza-block ${className ?? ""}`} {...props}>
      <h2>{heading}</h2>
      <div className="crumza-feature-grid">
        {items.map((item) => (
          <article key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export interface PricingBlockProps extends ComponentProps<"section"> {
  readonly heading: string;
  readonly price: string;
  readonly cadence?: string | undefined;
  readonly features: readonly string[];
  readonly action: ReactNode;
}
export function PricingBlock({
  heading,
  price,
  cadence,
  features,
  action,
  className,
  ...props
}: PricingBlockProps): ReactElement {
  return (
    <section
      data-slot="pricing-block"
      className={`crumza-block crumza-pricing ${className ?? ""}`}
      {...props}
    >
      <h2>{heading}</h2>
      <p className="crumza-price">
        {price}
        {cadence && <span> {cadence}</span>}
      </p>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="crumza-actions">{action}</div>
    </section>
  );
}
export interface FAQItem {
  readonly id: string;
  readonly question: string;
  readonly answer: ReactNode;
}
export interface FAQBlockProps extends ComponentProps<"section"> {
  readonly heading: string;
  readonly items: readonly FAQItem[];
}
export function FAQBlock({ heading, items, className, ...props }: FAQBlockProps): ReactElement {
  return (
    <section data-slot="faq-block" className={`crumza-block ${className ?? ""}`} {...props}>
      <h2>{heading}</h2>
      <div className="crumza-faq">
        {items.map((item) => (
          <details key={item.id}>
            <summary>{item.question}</summary>
            <div>{item.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
