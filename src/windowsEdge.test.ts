/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { expect } from 'chai';
import { Quality } from '.';
import { WindowsEdgeBrowserFinder } from './windowsEdge';

describe('windows: edge', () => {
  const test = (pathsThatExist: string[]) => {
    const fs = {
      access: (path: string) => {
        if (!pathsThatExist.includes(path)) {
          throw new Error('no access here!');
        }
      },
    };

    return new WindowsEdgeBrowserFinder(
      {
        LOCALAPPDATA: '%APPDATA%',
        PROGRAMFILES: '%PROGRAMFILES%',
        'PROGRAMFILES(X86)': '%PROGRAMFILES(X86)%',
        EDGE_PATH: 'C:\\custom\\path\\edge.exe',
      },
      fs as any,
    ).findAll();
  };

  it('does not return when paths dont exist', async () => {
    expect(await test([])).to.be.empty;
  });

  it('returns and orders correctly', async () => {
    expect(
      await test([
        'C:\\custom\\path\\edge.exe',
        '%PROGRAMFILES%\\Microsoft\\Edge SxS\\Application\\msedge.exe',
        '%PROGRAMFILES%\\Microsoft\\Edge Dev\\Application\\msedge.exe',
        '%APPDATA%\\Microsoft\\Edge\\Application\\msedge.exe',
        '%APPDATA%\\Microsoft\\Edge SxS\\Application\\msedge.exe',
      ]),
    ).to.deep.equal([
      {
        path: 'C:\\custom\\path\\edge.exe',
        quality: Quality.Custom,
      },
      {
        path: '%APPDATA%\\Microsoft\\Edge SxS\\Application\\msedge.exe',
        quality: Quality.Canary,
      },
      {
        path: '%APPDATA%\\Microsoft\\Edge\\Application\\msedge.exe',
        quality: Quality.Stable,
      },
      {
        path: '%PROGRAMFILES%\\Microsoft\\Edge SxS\\Application\\msedge.exe',
        quality: Quality.Canary,
      },
      {
        path: '%PROGRAMFILES%\\Microsoft\\Edge Dev\\Application\\msedge.exe',
        quality: Quality.Dev,
      },
    ]);
  });
});
