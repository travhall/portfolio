// Stub for the `server-only` package, used only by Vitest's module resolution
// (see vitest.config.ts's resolve.alias) — Next.js's own bundler already
// neutralizes `server-only`'s import-time guard in genuine server contexts,
// but plain Node/Vitest has no such interception, so importing anything from
// lib/case-studies.ts (which does `import "server-only"`) throws outside
// Next's build. This empty module satisfies the import with no side effects,
// for tests only — it does not change server-only's real behavior in the
// actual Next.js app.
export {};
