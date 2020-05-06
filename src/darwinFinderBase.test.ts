/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { promises as fs } from 'fs';
import { resolve } from 'path';
import execa from 'execa';
import { DarwinEdgeBrowserFinder } from './darwinEdge';
import { expect } from 'chai';

describe('DarwinFinderBase', () => {
  class ReplacingRegisterFinder extends DarwinEdgeBrowserFinder {
    constructor(file: string) {
      super({}, fs, execa);
      this.lsRegisterCommand = `cat "${resolve(__dirname, '..', 'fixtures', file)}"`;
    }
  }

  it('greps output on Mojave', async () => {
    const finder = new ReplacingRegisterFinder('edge-mojave-ungrepped.txt');
    expect(await finder.findAll()).to.deep.equal([
      {
        path: '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
        quality: 'dev',
      },
      {
        path: '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
        quality: 'beta',
      },
    ]);
  });

  it('greps output on Catalina', async () => {
    const finder = new ReplacingRegisterFinder('edge-catalina-ungrepped.txt');

    expect(await finder.findAll()).to.deep.equal([
      {
        path: '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
        quality: 'dev',
      },
      {
        path: '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
        quality: 'beta',
      },
    ]);
  });
});
