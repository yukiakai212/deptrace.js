declare function assertInside(base: string, target: string): void;

declare function isInside(base: string, target: string): boolean;

declare function normalizeRelative(base: string, input: string): string;

declare function resolveInside(base: string, target: string): string;

declare function resolveRelativeInside(base: string, target: string): string;

export { assertInside, isInside, normalizeRelative, resolveInside, resolveRelativeInside };
