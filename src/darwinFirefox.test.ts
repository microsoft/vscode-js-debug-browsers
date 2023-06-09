/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { stub } from 'sinon';
import { expect } from 'chai';
import { Quality } from '.';
import { DarwinFirefoxBrowserFinder } from './darwinFirefox';

describe('darwin: firefox', () => {
  const lsreturn = [
    '/Applications/Firefox.app',
    ' /Applications/Firefox Developer Edition.app',
    ' /Applications/Firefox Nightly.app',
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

    const finder = new DarwinFirefoxBrowserFinder(
      { FIREFOX_PATH: '/custom/path' },
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
          '/custom/path/Contents/MacOS/firefox',
          '/Applications/Firefox.app/Contents/MacOS/firefox',
          '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
          '/Applications/Firefox Nightly.app/Contents/MacOS/firefox',
        ],
      }).findAll(),
    ).to.deep.equal([
      {
        path: '/custom/path/Contents/MacOS/firefox',
        quality: Quality.Custom,
      },
      {
        path: '/Applications/Firefox Nightly.app/Contents/MacOS/firefox',
        quality: Quality.Canary,
      },
      {
        path: '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
        quality: Quality.Dev,
      },
      {
        path: '/Applications/Firefox.app/Contents/MacOS/firefox',
        quality: Quality.Stable,
      },
    ]);
  });

  it('finds well-known paths', async () => {
    const s = setup({
      lsreturn,
      pathsThatExist: [
        '/custom/path/Contents/MacOS/firefox',
        '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
        '/Applications/Firefox.app/Contents/MacOS/firefox',
      ],
    });

    let calls = 0;
    expect(
      await s.findWhere((exe) => {
        calls++;
        return exe.quality === Quality.Stable;
      }),
    ).to.deep.equal({
      path: '/Applications/Firefox.app/Contents/MacOS/firefox',
      quality: Quality.Stable,
    });

    expect(calls).to.equal(1);

    expect(
      await s.findWhere((exe) => {
        calls++;
        return exe.quality === Quality.Canary;
      }),
    ).to.be.undefined;
  });
});
