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

  const setup = (options: { lsreturn: string[]; pathsThatExist: string[] }) => {
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

    return finder;
  };

  it('does not return when paths dont exist', async () => {
    expect(
      await setup({
        lsreturn,
        pathsThatExist: [],
      }).findAll(),
    ).to.be.empty;
  });

  it('returns and orders correctly', async () => {
    expect(
      await setup({
        lsreturn,
        pathsThatExist: [
          '/custom/path/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ],
      }).findAll(),
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
        path: '/Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app/Contents/MacOS/Google Chrome',
        quality: Quality.Dev,
      },
    ]);
  });

  it('finds well-known paths', async () => {
    const s = setup({
      lsreturn,
      pathsThatExist: [
        '/custom/path/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      ],
    });

    let calls = 0;
    expect(
      await s.findWhere((exe) => {
        calls++;
        return exe.quality === Quality.Stable;
      }),
    ).to.deep.equal({
      path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      quality: Quality.Stable,
    });

    expect(calls).to.equal(1);

    expect(
      await s.findWhere((exe) => {
        calls++;
        return exe.quality === Quality.Dev;
      }),
    ).to.deep.equal({
      path: '/Users/foo/Applications (Parallels)/{f5861500-b6d1-4929-b85d-d920e2656184} Applications.localized/Google Chrome.app/Contents/MacOS/Google Chrome',
      quality: Quality.Dev,
    });
  });
});
