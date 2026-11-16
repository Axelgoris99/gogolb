import { getCollection } from 'astro:content';

/**
 * All posts, newest first. Drafts show up in `astro dev` but are left out
 * of production builds (pages, tags, RSS and sitemap).
 */
export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
