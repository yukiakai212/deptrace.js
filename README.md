# @yukiakai/path-extra

Extra path utilities for Node.js with consistent cross-platform behavior.

Built on top of `pathe` to provide predictable path handling across Windows and POSIX environments.

## Features

- Cross-platform consistent behavior
- Directory traversal protection helpers
- Safe path resolution utilities
- Relative path normalization
- ESM-friendly
- TypeScript support

## Installation

```bash
npm install @yukiakai/path-extra
```

## Usage

```ts
import {
  isInside,
  assertInside,
  resolveInside,
  resolveRelativeInside,
  normalizeRelative,
} from '@yukiakai/path-extras';
```

---

# API

## isInside

Checks whether a target path stays inside a base directory.

```ts
isInside(base: string, target: string): boolean
```

### Example

```ts
isInside('/app', 'src/index.ts');
// true

isInside('/app', '../etc/passwd');
// false
```

---

## assertInside

Throws an error if the target path escapes the base directory.

```ts
assertInside(base: string, target: string): void
```

### Example

```ts
assertInside('/app', 'src/index.ts');

assertInside('/app', '../etc/passwd');
// Error: Path escapes base directory
```

---

## resolveInside

Safely resolves a path inside a base directory.

Returns an absolute normalized path.

```ts
resolveInside(base: string, target: string): string
```

### Example

```ts
resolveInside('/app', 'src/index.ts');
// /app/src/index.ts

resolveInside('/app', '../etc/passwd');
// Error
```

---

## resolveRelativeInside

Safely resolves a path and returns a normalized relative path.

```ts
resolveRelativeInside(base: string, target: string): string
```

### Example

```ts
resolveRelativeInside('/app', 'src/../package.json');
// package.json
```

---

## normalizeRelative

Normalizes a relative path against a base directory.

This function does NOT prevent directory traversal.

```ts
normalizeRelative(base: string, target: string): string
```

### Example

```ts
normalizeRelative('/app', 'src/../package.json');
// package.json

normalizeRelative('/app', '../outside');
// ../outside
```

---

# Why use this package?

Node.js native `path` behavior can vary between operating systems.

This package uses `pathe` internally to provide more predictable and consistent behavior across platforms.

Examples of issues this package helps avoid:

- Windows vs POSIX separator differences
- Path traversal vulnerabilities
- Inconsistent normalization behavior
- Absolute path edge cases

---

# License

MIT