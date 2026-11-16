# GoGolb

My blog, live at [blog.goris.live](https://blog.goris.live). Built with Astro.

It shares its look with my portfolio ([goris.live](https://goris.live), repo `personal_website`):
same navigation, theme toggle and skin picker. The blog starts on the **minimal** skin.

## Commands

Node comes from the Nix dev shell (`flake.nix`); with direnv it loads when you `cd` in
(run `direnv allow` once), otherwise use `nix develop`.

```bash
npm run dev      # localhost:4321, drafts included
npm run build    # type-check + build to dist/
./deploy.sh      # build + rsync dist/ to the OVH VPS
```

## Writing

Posts are Markdown files in `src/content/posts/` (`title`, `date`, `excerpt`, `tags`,
optional `image`). Add `draft: true` to keep a post out of the live site: drafts only show
in `npm run dev`.

## Skins

The skin system belongs to the portfolio. `scripts/sync-skins.sh` copies it over
(`src/styles/global.css`, `src/styles/skins/`, `src/skins.ts`, `public/assets/skins/` and
`public/assets/backgrounds/`); re-run it after changing skins there. Don't edit those
files here.

Blog-only styles (post text, code blocks, post cards) live in `src/styles/blog.css` and use
the same tokens, so every skin restyles them. Code blocks stay dark (Shiki `github-dark`)
because some skins are dark even in light mode.
