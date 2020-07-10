/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { Quality, IBrowserFinder, IExecutable } from './index';
import { win32 } from 'path';
import { preferredChromePath, findWindowsCandidates } from './util';
import { promises as fsPromises } from 'fs';

/**
 * Finds the Chrome browser on Windows.
 */
export class WindowsChromeBrowserFinder implements IBrowserFinder {
  constructor(private readonly env: NodeJS.ProcessEnv, private readonly fs: typeof fsPromises) {}

  public async findWhere(predicate: (exe: IExecutable) => boolean) {
    return (await this.findAll()).find(predicate);
  }

  public async findAll() {
    const sep = win32.sep;
    const suffixes = [
      {
        name: `${sep}Google${sep}Chrome SxS${sep}Application${sep}chrome.exe`,
        type: Quality.Canary,
      },
      {
        name: `${sep}Google${sep}Chrome${sep}Application${sep}chrome.exe`,
        type: Quality.Stable,
      },
    ];

    const installations = await findWindowsCandidates(this.env, this.fs, suffixes);
    const customChromePath = await preferredChromePath(this.fs, this.env);
    if (customChromePath) {
      installations.unshift({ path: customChromePath, quality: Quality.Custom });
    }

    return installations;
  }
}
