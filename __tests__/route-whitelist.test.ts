import fs from 'node:fs';
import path from 'node:path';

/**
 * contracts/local/routes.md is the single route whitelist. This test guards
 * both registration (files under app/) and navigation literals, so a
 * table-outside path (terminal, files, AI, "new" flows, ...) cannot slip in.
 */

const repoRoot = path.resolve(__dirname, '..');
const appDir = path.join(repoRoot, 'app');
const srcDir = path.join(repoRoot, 'src');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readWhitelist(): string[] {
  const markdown = fs.readFileSync(path.join(repoRoot, 'contracts/local/routes.md'), 'utf8');
  const paths = Array.from(markdown.matchAll(/^\|\s*\d+[a-z]?\s*\|\s*`([^`]+)`\s*\|/gm)).map(
    (match) => match[1]!,
  );
  return Array.from(new Set(paths));
}

const whitelist = readWhitelist();

function patternMatches(pattern: string, route: string): boolean {
  const expression = pattern
    .split('/')
    .map((segment) => (/^\[[^\]]+\]$/.test(segment) ? '[^/]+' : escapeRegExp(segment)))
    .join('/');
  return new RegExp(`^${expression}$`).test(route);
}

function normalizeRoute(route: string): string {
  if (route.length > 1 && route.endsWith('/')) {
    return route.slice(0, -1);
  }
  return route;
}

function isWhitelisted(route: string): boolean {
  const normalized = normalizeRoute(route);
  // Group segments such as `/(tabs)` are containers, not leaf routes.
  return (
    whitelist.some((pattern) => patternMatches(pattern, normalized)) ||
    whitelist.some((pattern) => pattern.startsWith(`${normalized}/`))
  );
}

function walk(directory: string, predicate: (file: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(absolute, predicate));
    } else if (predicate(absolute)) {
      results.push(absolute);
    }
  }
  return results;
}

function routeFromFile(file: string): string {
  const relative = path.relative(appDir, file).replace(/\.(tsx?|jsx?)$/, '');
  const segments = relative.split(path.sep);
  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }
  return normalizeRoute(`/${segments.join('/')}`);
}

describe('route whitelist (contracts/local/routes.md)', () => {
  it('parses the whitelist table', () => {
    expect(whitelist).toContain('/servers');
    expect(whitelist).toContain('/(tabs)/overview');
    expect(whitelist).toHaveLength(16);
  });

  it('rejects every Phase-2 path listed in the contract', () => {
    const banned = [
      '/terminal',
      '/files',
      '/ai',
      '/websites/new',
      '/websites/abc/edit',
      '/containers/new',
      '/compose/new',
      '/tasks/new',
    ];

    for (const route of banned) {
      expect(isWhitelisted(route)).toBe(false);
    }
  });

  it('registers no route file outside the whitelist', () => {
    const routeFiles = walk(appDir, (file) => {
      const base = path.basename(file);
      return /\.(tsx?|jsx?)$/.test(base) && !base.startsWith('_') && !base.startsWith('+');
    });

    const offenders: string[] = [];
    for (const file of routeFiles) {
      const route = routeFromFile(file);
      // `app/index.tsx` is the framework boot entry, not a product screen.
      if (route === '/') {
        continue;
      }
      if (!isWhitelisted(route)) {
        offenders.push(`${path.relative(repoRoot, file)} -> ${route}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('registers no explicit screen outside the whitelist in layouts', () => {
    const layouts = walk(appDir, (file) => path.basename(file) === '_layout.tsx');
    const offenders: string[] = [];

    for (const layout of layouts) {
      const source = fs.readFileSync(layout, 'utf8');
      const layoutRoute = routeFromFile(layout).replace(/\/_layout$/, '') || '/';
      for (const match of source.matchAll(
        /<(?:Stack|Tabs|Drawer)\.Screen\s+name=["']([^"']+)["']/g,
      )) {
        const name = match[1]!;
        const route = normalizeRoute(`${layoutRoute === '/' ? '' : layoutRoute}/${name}`);
        if (!isWhitelisted(route)) {
          offenders.push(`${path.relative(repoRoot, layout)} -> ${route}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('navigates only to whitelisted paths', () => {
    const sources = [
      ...walk(appDir, (file) => /\.(tsx?|jsx?)$/.test(file)),
      ...walk(srcDir, (file) => /\.(tsx?|jsx?)$/.test(file) && !file.includes('__tests__')),
    ];

    const navigationPatterns = [
      /router\.(?:push|replace|navigate)\(\s*(['"`])([^'"`]+)\1/g,
      /<Redirect[^>]*\bhref=(['"])([^'"]+)\1/g,
      /<Link[^>]*\bhref=(['"])([^'"]+)\1/g,
    ];

    const offenders: string[] = [];
    for (const file of sources) {
      const source = fs.readFileSync(file, 'utf8');
      for (const pattern of navigationPatterns) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
          const target = match[2]!;
          // Dynamic and external targets are out of scope for this static scan.
          if (target.includes('${') || /^[a-z]+:\/\//i.test(target)) {
            continue;
          }
          const route = normalizeRoute(target.split(/[?#]/, 1)[0] ?? target);
          if (!isWhitelisted(route)) {
            offenders.push(`${path.relative(repoRoot, file)} -> ${route}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
