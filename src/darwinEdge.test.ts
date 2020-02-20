/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { stub } from 'sinon';
import { expect } from 'chai';
import { Quality } from '.';
import { DarwinEdgeBrowserFinder } from './darwinEdge';

describe('darwin: edge', () => {
  const lsreturn = [
    '/Applications/Microsoft Edge Beta.app',
    ' /Applications/Microsoft Edge Dev.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/77.0.218.4/Helpers/Microsoft Edge Helper.app',
    ' /Applications/Microsoft Edge Dev.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/77.0.197.1/Helpers/Microsoft Edge Helper.app',
    ' /Applications/Microsoft Edge Dev.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/77.0.223.0/Helpers/Microsoft Edge Helper.app',
    ' /Applications/Microsoft Edge Dev.app',
    ' /Applications/Microsoft Edge Beta.localized/Microsoft Edge Beta.app',
    ' /Applications/Microsoft Edge Beta.app',
    ' /Applications/Microsoft Edge Dev.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/77.0.211.2/Helpers/Microsoft Edge Helper.app',
    ' /Applications/Microsoft Edge Dev.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/77.0.211.3/Helpers/Microsoft Edge Helper.app',
    '  /Applications/Microsoft Edge Beta.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/79.0.309.65/Helpers/Microsoft Edge Helper.app',
    ' /Applications/Microsoft Edge Canary.app',
    ' /Applications/Microsoft Edge Beta.app',
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

    const finder = new DarwinEdgeBrowserFinder(
      { EDGE_PATH: '/custom/path' },
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
          '/custom/path/Contents/MacOS/Microsoft Edge Dev',
          '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
          '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ],
      }),
    ).to.deep.equal([
      {
        path: '/custom/path/Contents/MacOS/Microsoft Edge Dev',
        quality: Quality.Custom,
      },
      {
        path: '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
        quality: Quality.Dev,
      },
      {
        path: '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
        quality: Quality.Beta,
      },
      {
        path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        quality: Quality.Stable,
      },
    ]);
  });
});
