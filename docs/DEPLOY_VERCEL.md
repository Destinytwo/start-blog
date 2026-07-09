# Deploy To Vercel

## Vercel Settings

- Framework Preset: `Astro`
- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output Directory: `dist`

These values are also defined in `vercel.json`.

## Environment Variables

After the first deployment, set the production site URL:

```text
SITE_URL=https://your-project.vercel.app/
```

If you bind a custom domain later, change `SITE_URL` to that domain, for example:

```text
SITE_URL=https://example.com/
```

This keeps RSS, Atom, sitemap, and Open Graph URLs correct.

## Notes

- Original 4K video sources are kept in `source-assets/` and are excluded from deployment.
- Deployable cover videos and posters live in `public/blog-assets/`.
- Run `pnpm check` and `pnpm build` before publishing.
