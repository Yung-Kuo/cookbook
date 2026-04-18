# Performance baseline (Cookbook frontend)

Use this document to compare before/after when changing data-fetching, bundles, or rendering.

## Routes to profile

- `/` — public catalog
- `/users/[userId]` — profile (tabs, lists, pinned)
- `/users/[userId]/recipes/[id]` — recipe detail

## Core Web Vitals (manual)

1. Run the production build: `npm run build && npm start`
2. Open Chrome DevTools → Lighthouse → Performance (desktop + mobile) or use the Web Vitals extension
3. Record **LCP**, **INP**, **CLS** for the routes above and paste results with date/commit here

## Bundle size

```bash
cd next-frontend
ANALYZE=true npm run build
```

Opens an interactive bundle treemap after build (when `@next/bundle-analyzer` is configured). Save a screenshot or note first-load JS for `/_app` and route chunks.

## Repeatable checklist

- [ ] Lighthouse scores noted (Performance, Accessibility)
- [ ] Bundle analyzer output reviewed for largest client chunks
- [ ] Network tab: count of API calls on first load per route (compare after TanStack Query / prefetch work)
