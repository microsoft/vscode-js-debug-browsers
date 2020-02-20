/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { DarwinChromeBrowserFinder } from './darwinChrome';
import { stub } from 'sinon';
import { expect } from 'chai';
import { Quality } from '.';

describe('darwin: chrome', () => {
  const lsreturn = [
    ' /Applications/Google Chrome.app',
    ' /Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app',
    '/Applications/Google Chrome.app',
    ' /Applications/Google Chrome Canary.app',
  ];

  const test = (options: { lsreturn: string[]; pathsThatExist: string[] }) => {
    const execa = {
      command: stub().resolves({ stdout: options.lsreturn.join('\n') }),
    };

    const fs = {
      access: (path: string) => {
        if (!options.pathsThatExist.includes(path)) {
          throw new Error('no access here!');
        }
      },
    };

    const finder = new DarwinChromeBrowserFinder(
      { CHROME_PATH: '/custom/path' },
      fs as any,
      execa as any,
    );

    return finder.findAll();
  };

  it('does not return when paths dont exist', async () => {
    expect(
      await test({
        lsreturn,
        pathsThatExist: [],
      }),
    ).to.be.empty;
  });

  it('returns and orders correctly', async () => {
    expect(
      await test({
        lsreturn,
        pathsThatExist: [
          '/custom/path/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ],
      }),
    ).to.deep.equal([
      {
        path: '/custom/path/Contents/MacOS/Google Chrome',
        quality: Quality.Custom,
      },
      {
        path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        quality: Quality.Canary,
      },
      {
        path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        quality: Quality.Stable,
      },
      {
        path:
          '/Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app/Contents/MacOS/Google Chrome',
        quality: Quality.Dev,
      },
    ]);
  });
});
