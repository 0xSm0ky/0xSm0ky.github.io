import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: '~/blog',
    description: 'programming, cyber-security, side quests — en + ar',
    site: context.site ?? 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
      categories: post.data.tags,
      customData: `<xml:lang>${post.data.lang}</xml:lang>`,
    })),
    customData: '<language>en</language>',
  });
}
