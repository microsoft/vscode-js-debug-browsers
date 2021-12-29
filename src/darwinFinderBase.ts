/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { posix } from 'path';
import { Quality, IExecutable, IBrowserFinder } from '.';
import _execa from 'execa';
import { promises as fsPromises } from 'fs';
import { escapeRegexSpecialChars, IPriority, canAccess } from './util';

const pathSuffixRe = /( \(0x[a-f0-9]+\))/;

/**
 * Base class providing utilities for the Darwin browser finders.
 */
export abstract class DarwinFinderBase implements IBrowserFinder {
  protected lsRegisterCommand =
    '/System/Library/Frameworks/CoreServices.framework' +
    '/Versions/A/Frameworks/LaunchServices.framework' +
    '/Versions/A/Support/lsregister -dump';

  /**
   * Well-known paths to browsers on Chrome. This is used to make finding fast
   * in the common case, avoiding sometimes-slow launch services.
   * @see https://github.com/microsoft/vscode-js-debug/issues/570
   */
  protected wellKnownPaths: ReadonlyArray<IExecutable> = [];

  constructor(
    protected readonly env: NodeJS.ProcessEnv,
    private readonly fs: typeof fsPromises,
    private readonly execa: typeof _execa,
  ) {}

  /**
   * @inheritdoc
   */
  public async findWhere(predicate: (exe: IExecutable) => boolean) {
    for (const test of this.wellKnownPaths) {
      if (predicate(test) && (await canAccess(this.fs, test.path))) {
        return test;
      }
    }

    return (await this.findAll()).find(predicate);
  }

  /**
   * @inheritdoc
   */
  public abstract findAll(): Promise<IExecutable[]>;

  /**
   * Returns the environment-configured custom path, if any.
   */
  protected abstract getPreferredPath(): string | undefined;

  /**
   * Finds apps matching the given pattern in the launch service register.
   */
  protected async findLaunchRegisteredApps(
    pattern: string,
    defaultPaths: ReadonlyArray<string>,
    suffixes: ReadonlyArray<string>,
  ) {
    const { stdout } = await this.execa.command(
      `${this.lsRegisterCommand} | awk '$0 ~ /${pattern}${pathSuffixRe.source}?$/ { $1=""; print $0 }'`,
      { shell: true, stdio: 'pipe' },
    );

    const paths = [
      ...defaultPaths,
      ...stdout.split('\n').map((l) => l.trim().replace(pathSuffixRe, '')),
    ].filter((l) => !!l);

    const preferred = this.getPreferredPath();
    if (preferred) {
      paths.push(preferred);
    }

    const installations = new Set<string>();
    for (const inst of paths) {
      for (const suffix of suffixes) {
        const execPath = posix.join(inst.trim(), suffix);
        try {
          await this.fs.access(execPath);
          installations.add(execPath);
        } catch (e) {
          // no access => ignored
        }
      }
    }

    return installations;
  }

  /**
   * Creates priorities for the {@link sort} function that places browsers
   * in proper order based on their installed location./
   */
  protected createPriorities(priorities: { name: string; weight: number; quality: Quality }[]) {
    const home = this.env.HOME && escapeRegexSpecialChars(this.env.HOME);
    const preferred = this.getPreferredPath();
    const mapped = priorities.reduce(
      (acc, p) => [
        ...acc,
        {
          regex: new RegExp(`^/Applications/.*${p.name}`),
          weight: p.weight + 100,
          quality: p.quality,
        },
        {
          regex: new RegExp(`^${home}/Applications/.*${p.name}`),
          weight: p.weight,
          quality: p.quality,
        },
        {
          regex: new RegExp(`^/Volumes/.*${p.name}`),
          weight: p.weight - 100,
          quality: p.quality,
        },
      ],
      [] as IPriority[],
    );

    if (preferred) {
      mapped.unshift({
        regex: new RegExp(escapeRegexSpecialChars(preferred)),
        weight: 151,
        quality: Quality.Custom,
      });
    }

    return mapped;
  }
}
