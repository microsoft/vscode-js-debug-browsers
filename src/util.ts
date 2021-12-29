/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { IExecutable, Quality } from './index';
import { win32 } from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Returns whether the user can access the given file path.
 */
export async function canAccess({ access }: typeof fsPromises, file: string | undefined | null) {
  if (!file) {
    return false;
  }

  try {
    await access(file);
    return true;
  } catch (e) {
    return false;
  }
}

const regexChars = '/\\.?*()^${}|[]+';

/**
 * Escape regex special characters from the string.
 */
export function escapeRegexSpecialChars(str: string, except?: string): string {
  const useRegexChars = regexChars
    .split('')
    .filter((c) => !except || except.indexOf(c) < 0)
    .join('')
    .replace(/[\\\]]/g, '\\$&');

  const r = new RegExp(`[${useRegexChars}]`, 'g');
  return str.replace(r, '\\$&');
}

/**
 * Gets the configured Chrome path, if any.
 */
export async function preferredChromePath(
  fs: typeof fsPromises,
  env: NodeJS.ProcessEnv,
): Promise<string | undefined> {
  if (await canAccess(fs, env.CHROME_PATH)) {
    return env.CHROME_PATH;
  }
}

/**
 * Gets the configured Edge path, if any.
 */
export async function preferredEdgePath(
  fs: typeof fsPromises,
  env: NodeJS.ProcessEnv,
): Promise<string | undefined> {
  if (await canAccess(fs, env.EDGE_PATH)) {
    return env.EDGE_PATH;
  }
}

export interface IPriority {
  regex: RegExp;
  weight: number;
  quality: Quality;
}

/**
 * Sorts the set of installations,
 */
export function sort(installations: Iterable<string>, priorities: IPriority[]): IExecutable[] {
  const defaultPriority = 10;
  return (
    [...installations]
      .filter((inst) => !!inst)
      .map((inst) => {
        const priority = priorities.find((p) => p.regex.test(inst));
        return priority
          ? { path: inst, weight: priority.weight, quality: priority.quality }
          : { path: inst, weight: defaultPriority, quality: Quality.Dev };
      })
      // sort based on weight
      .sort((a, b) => b.weight - a.weight)
      // remove weight
      .map((p) => ({ path: p.path, quality: p.quality }))
  );
}

/**
 * Finds binaries for Windows platforms by looking for the given path
 * suffixes in each of the local app data and program files directories
 * on the machine, returning complete absolute paths that match.
 */
export async function findWindowsCandidates(
  env: NodeJS.ProcessEnv,
  fs: typeof fsPromises,
  suffixes: { name: string; type: Quality }[],
) {
  const prefixes = [env.LOCALAPPDATA, env.PROGRAMFILES, env['PROGRAMFILES(X86)']].filter(
    (p): p is string => !!p,
  );

  const todo: Promise<IExecutable | undefined>[] = [];
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      const candidate = win32.join(prefix, suffix.name);
      todo.push(
        canAccess(fs, candidate).then((ok) =>
          ok ? { path: candidate, quality: suffix.type } : undefined,
        ),
      );
    }
  }

  return (await Promise.all(todo)).filter((e): e is IExecutable => !!e);
}
