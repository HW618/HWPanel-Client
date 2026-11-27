#!/usr/bin/env node
/**
 * T02 owns the real token pipeline (`scripts/build-tokens.mjs`).
 * T01 keeps the command names stable so package scripts and CI wiring do not
 * change when T02 lands.
 */
const mode = process.argv[2] ?? 'build';

if (mode !== 'build' && mode !== 'check') {
  console.error(`[tokens] unknown mode: ${mode}`);
  process.exit(1);
}

console.log(`[tokens] ${mode}: placeholder only — token pipeline lands in T02.`);
process.exit(0);
