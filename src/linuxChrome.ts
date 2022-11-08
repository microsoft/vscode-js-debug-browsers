/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { posix } from 'path';
import { sort, canAccess, escapeRegexSpecialChars } from './util';
import { execSync, execFileSync } from 'child_process';
import { homedir } from 'os';
import { IBrowserFinder, Quality, IExecutable } from './index';
import { promises as fsPromises } from 'fs';

const newLineRegex = /\r?\n/;

/**
 * Finds the Chrome browser on Windows.
 */
export class LinuxChromeBrowserFinder implements IBrowserFinder {
  constructor(
    protected readonly env: NodeJS.ProcessEnv,
    protected readonly fs: typeof fsPromises,
  ) {}

  protected readonly pathEnvironmentVar: string = 'CHROME_PATH';

  protected readonly priorities = [
    { regex: /chrome-wrapper$/, weight: 54, quality: Quality.Custom },
    { regex: /google-chrome-dev$/, weight: 53, quality: Quality.Dev },
    { regex: /google-chrome-canary$/, weight: 52, quality: Quality.Canary },
    { regex: /google-chrome-unstable$/, weight: 51, quality: Quality.Canary },
    { regex: /google-chrome-canary$/, weight: 51, quality: Quality.Canary },
    { regex: /google-chrome-stable$/, weight: 50, quality: Quality.Stable },
    { regex: /google-chrome$/, weight: 49, quality: Quality.Stable },
    { regex: /chromium-browser$/, weight: 48, quality: Quality.Custom },
    { regex: /chromium$/, weight: 47, quality: Quality.Custom },
  ];

  protected readonly executablesOnPath = [
    'google-chrome-unstable',
    'google-chrome-dev',
    'google-chrome-beta',
    'google-chrome-canary',
    'google-chrome-stable',
    'google-chrome',
    'chromium-browser',
    'chromium',
  ];

  public async findWhere(predicate: (exe: IExecutable) => boolean) {
    return (await this.findAll()).find(predicate);
  }

  public async findAll() {
    const installations = new Set<string>();

    // 1. Look into CHROME_PATH env variable
    const envPath = this.env[this.pathEnvironmentVar];
    const customChromePath = envPath && (await canAccess(this.fs, envPath));
    if (customChromePath) {
      installations.add(envPath);
    }

    // 2. Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
      posix.join(homedir(), '.local/share/applications/'),
      '/usr/share/applications/',
      '/usr/bin',
    ];
    desktopInstallationFolders.forEach((folder) => {
      for (const bin in this.findChromeExecutables(folder)) {
        installations.add(bin);
      }
    });

    // 3. Look for google-chrome & chromium executables by using the which command
    await Promise.all(
      this.executablesOnPath.map(async (executable) => {
        try {
          const chromePath = execFileSync('which', [executable], { stdio: 'pipe' })
            .toString()
            .split(newLineRegex)[0];

          if (await canAccess(this.fs, chromePath)) {
            installations.add(chromePath);
          }
        } catch (e) {
          // Not installed.
        }
      }),
    );

    const priorities = envPath
      ? [
          {
            regex: new RegExp(escapeRegexSpecialChars(envPath)),
            weight: 101,
            quality: Quality.Custom,
          },
        ].concat(this.priorities)
      : this.priorities;

    return sort(installations, priorities);
  }

  private async findChromeExecutables(folder: string) {
    const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
    const chromeExecRegex = `^Exec=/.*/(${this.executablesOnPath.join('|')})-.*`;

    const installations: string[] = [];
    if (await canAccess(this.fs, folder)) {
      // Output of the grep & print looks like:
      //    /opt/google/chrome/google-chrome --profile-directory
      //    /home/user/Downloads/chrome-linux/chrome-wrapper %U

      // Some systems do not support grep -R so fallback to -r.
      // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
      let execResult: Buffer;
      try {
        execResult = execSync(`grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`);
      } catch (e) {
        execResult = execSync(`grep -Er "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`);
      }

      const execPaths = execResult
        .toString()
        .split(newLineRegex)
        .map((execPath) => execPath.replace(argumentsRegex, '$1'));

      await Promise.all(
        execPaths.map(async (execPath) => {
          if (await canAccess(this.fs, execPath)) {
            installations.push(execPath);
          }
        }),
      );
    }

    return installations;
  }
}
