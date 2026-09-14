import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

// The repo's docs/ folder is the source; the site renders it, it does not copy it.
const docs = defineCollection({
  loader: glob({ pattern: ['*.md', 'components/*.md'], base: '../../packages/ui/docs' }),
  schema: z.object({ title: z.string().optional() }),
});

export const collections = { docs };
