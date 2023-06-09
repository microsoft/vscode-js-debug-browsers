/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import execa from 'execa';
import { promises as fs } from 'fs';
import { DarwinChromeBrowserFinder } from './darwinChrome';
import { DarwinEdgeBrowserFinder } from './darwinEdge';
import { DarwinFirefoxBrowserFinder } from './darwinFirefox';
import { LinuxChromeBrowserFinder } from './linuxChrome';
import { LinuxEdgeBrowserFinder } from './linuxEdge';
import { LinuxFirefoxBrowserFinder } from './linuxFirefox';
import { WindowsChromeBrowserFinder } from './windowsChrome';
import { WindowsEdgeBrowserFinder } from './windowsEdge';
import { WindowsFirefoxBrowserFinder } from './windowsFirefox';

/**
 * Quality (i.e. release channel) of discovered binary.
 */
export const enum Quality {
  Canary = 'canary',
  Stable = 'stable',
  Beta = 'beta',
  Dev = 'dev',
  Custom = 'custom', // environment-configured quality
}

// constructing it this way makes sure we can't forget to add a type:
const qualities: { [K in Quality]: null } = {
  [Quality.Canary]: null,
  [Quality.Stable]: null,
  [Quality.Beta]: null,
  [Quality.Dev]: null,
  [Quality.Custom]: null,
};

/**
 * All known qualities.
 */
export const allQualities: ReadonlySet<Quality> = new Set(Object.keys(qualities) as Quality[]);

/**
 * Gets whether given string is a known Quality.
 */
export const isQuality = (input: string): input is Quality => allQualities.has(input as Quality);

/**
 * Discovered browser binary.
 */
export interface IExecutable {
  path: string;
  quality: Quality;
}

export interface IBrowserFinder {
  /**
   * Finds the first browser on the platform where the predicate matches.
   * May return early.
   */
  findWhere(predicate: (exe: IExecutable) => boolean): Promise<IExecutable | undefined>;

  /**
   * Finds all browser executables available on the current platform.
   */
  findAll(): Promise<IExecutable[]>;
}

export type BrowserFinderCtor = new (
  env: NodeJS.ProcessEnv,
  _fs: typeof fs,
  _execa: typeof execa,
) => IBrowserFinder;

/**
 * Chrome finder class for the current platform.
 */
export const ChromeBrowserFinder: BrowserFinderCtor =
  process.platform === 'win32'
    ? WindowsChromeBrowserFinder
    : process.platform === 'darwin'
    ? DarwinChromeBrowserFinder
    : LinuxChromeBrowserFinder;

/**
 * Edge finder class for the current platform.
 */
export const EdgeBrowserFinder: BrowserFinderCtor =
  process.platform === 'win32'
    ? WindowsEdgeBrowserFinder
    : process.platform === 'darwin'
    ? DarwinEdgeBrowserFinder
    : LinuxEdgeBrowserFinder;

/**
 * Firefox finder class for the current platform.
 */
export const FirefoxBrowserFinder: BrowserFinderCtor =
  process.platform === 'win32'
    ? WindowsFirefoxBrowserFinder
    : process.platform === 'darwin'
    ? DarwinFirefoxBrowserFinder
    : LinuxFirefoxBrowserFinder;
