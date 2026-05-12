import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    lang: z.enum(['en', 'ar']).default('en'),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    aliases: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
