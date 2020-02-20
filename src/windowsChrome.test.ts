/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { expect } from 'chai';
import { Quality } from '.';
import { WindowsChromeBrowserFinder } from './windowsChrome';

describe('windows: chrome', () => {
  const test = (pathsThatExist: string[]) => {
    const fs = {
      access: (path: string) => {
        if (!pathsThatExist.includes(path)) {
          throw new Error('no access here!');
        }
      },
    };

    return new WindowsChromeBrowserFinder(
      {
        LOCALAPPDATA: '%APPDATA%',
        PROGRAMFILES: '%PROGRAMFILES%',
        'PROGRAMFILES(X86)': '%PROGRAMFILES(X86)%',
        CHROME_PATH: 'C:\\custom\\path\\chrome.exe',
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
        'C:\\custom\\path\\chrome.exe',
        '%PROGRAMFILES%\\Google\\Chrome SxS\\Application\\chrome.exe',
        '%APPDATA%\\Google\\Chrome\\Application\\chrome.exe',
        '%APPDATA%\\Google\\Chrome SxS\\Application\\chrome.exe',
      ]),
    ).to.deep.equal([
      {
        path: 'C:\\custom\\path\\chrome.exe',
        quality: Quality.Custom,
      },
      {
        path: '%APPDATA%\\Google\\Chrome SxS\\Application\\chrome.exe',
        quality: Quality.Canary,
      },
      {
        path: '%APPDATA%\\Google\\Chrome\\Application\\chrome.exe',
        quality: Quality.Stable,
      },
      {
        path: '%PROGRAMFILES%\\Google\\Chrome SxS\\Application\\chrome.exe',
        quality: Quality.Canary,
      },
    ]);
  });
});
