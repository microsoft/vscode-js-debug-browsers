/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { expect } from 'chai';
import { Quality } from '.';
import { WindowsFirefoxBrowserFinder } from './windowsFirefox';

describe('windows: firefox', () => {
  const test = (pathsThatExist: string[]) => {
    const fs = {
      access: (path: string) => {
        if (!pathsThatExist.includes(path)) {
          throw new Error('no access here!');
        }
      },
    };

    return new WindowsFirefoxBrowserFinder(
      {
        LOCALAPPDATA: '%APPDATA%',
        PROGRAMFILES: '%PROGRAMFILES%',
        'PROGRAMFILES(X86)': '%PROGRAMFILES(X86)%',
        FIREFOX_PATH: 'C:\\custom\\path\\firefox.exe',
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
        'C:\\custom\\path\\firefox.exe',
        '%PROGRAMFILES%\\Firefox Developer Edition\\firefox.exe',
        '%PROGRAMFILES%\\Firefox Nightly\\firefox.exe',
        '%APPDATA%\\Mozilla Firefox\\firefox.exe',
      ]),
    ).to.deep.equal([
      {
        path: 'C:\\custom\\path\\firefox.exe',
        quality: Quality.Custom,
      },
      {
        path: '%APPDATA%\\Mozilla Firefox\\firefox.exe',
        quality: Quality.Stable,
      },
      {
        path: '%PROGRAMFILES%\\Firefox Developer Edition\\firefox.exe',
        quality: Quality.Dev,
      },
      {
        path: '%PROGRAMFILES%\\Firefox Nightly\\firefox.exe',
        quality: Quality.Nightly,
      },
    ]);
  });
});
