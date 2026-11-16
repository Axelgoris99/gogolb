import rss from '@astrojs/rss';
import { getPublishedPosts } from '../utils/posts';

export async function GET(context) {
  const sortedPosts = await getPublishedPosts();

  return rss({
    title: 'GoGolb',
    description: 'Homelab and self-hosting notes by Axel Goris: Proxmox, NixOS, WireGuard, and the bugs I hit along the way.',
    site: context.site,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
