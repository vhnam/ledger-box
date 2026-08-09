# @vhnam/landing

The Ledger Box marketing/landing page. Astro, with `@astrojs/react` for the mobile nav
island only — the rest of the page is static markup.

Design tokens (colour, radius, typography) are imported from `@vhnam/ui`'s
`globals.css`; this app does not import `@vhnam/ui` components.

```bash
vp run dev      # http://localhost:4321
vp run build
vp run preview
```

Real product screenshots (wallet page, shared statement) still need to be dropped into
the "how it works" section on the homepage — see the `TODO` comment in
`src/pages/index.astro`.
