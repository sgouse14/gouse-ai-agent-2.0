import { realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';

/**
 * Resolve the existing prefix of a path through realpath, then append any
 * not-yet-created path segments. This makes overlap checks account for symlink
 * aliases even when the staging directory does not exist yet.
 */
export async function canonicalizePathForSafety(path: string): Promise<string> {
  if (!path?.trim()) throw new Error('Filesystem path is required.');

  let candidate = resolve(path);
  const missingSegments: string[] = [];

  for (;;) {
    try {
      const realPrefix = await realpath(candidate);
      return resolve(realPrefix, ...missingSegments);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      // Only a missing component can be safely handled by walking to an
      // existing parent. Permission errors and malformed paths fail closed.
      if (code !== 'ENOENT') throw new Error('Unable to safely resolve filesystem path.');

      const parent = dirname(candidate);
      if (parent === candidate) throw new Error('Unable to safely resolve filesystem path.');
      missingSegments.unshift(basename(candidate));
      candidate = parent;
    }
  }
}

/** True when either resolved path is the same as or nested under the other. */
export function pathsOverlapByResolvedLocation(left: string, right: string): boolean {
  const within = (parent: string, child: string): boolean => {
    const rel = relative(parent, child);
    return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel));
  };
  return within(left, right) || within(right, left);
}
