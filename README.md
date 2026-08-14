# Design Token Tester

An interactive playground for design system tokens. Adjust color, type, spacing, and radius live, check WCAG contrast, and export the result as CSS variables or JSON.

[Live demo](https://design-token-tester.nostromohq.workers.dev)

## Stack

- Vite + React + TypeScript
- Cloudflare Workers Static Assets

## Architecture and toolchain

This is a local single-page Vite + React + TypeScript app; token calculations and previews run in the browser while Cloudflare Workers Static Assets serves the built `dist` directory. Use Node `24.18.0` and pnpm `11.21.0` exclusively, with pnpm as the sole installer, script entry point, and owner of the single repository-owned `pnpm-lock.yaml`; Oxfmt `0.63.0` formats the project and Oxlint `1.77.0` lints it. Bun has no role here, so there are no Bun scripts, dependencies, or lockfiles. TanStack is intentionally not included; add it only if future scope needs routed, data, or server primitives—not merely for consistency.

## Getting started

```bash
pnpm install
pnpm run dev
```

## Checks and deployment

```bash
pnpm run check
pnpm run build
pnpm audit --audit-level=moderate
pnpm run deploy
```
