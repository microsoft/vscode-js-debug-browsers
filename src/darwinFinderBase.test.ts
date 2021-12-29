/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { promises as fs } from 'fs';
import { resolve } from 'path';
import execa from 'execa';
import { DarwinEdgeBrowserFinder } from './darwinEdge';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';

describe('DarwinFinderBase', () => {
  const validPaths = new Set([
    '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
    '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
  ]);

  let accessStub: SinonStub;
  beforeEach(() => {
    accessStub = stub(fs, 'access').callsFake((path) =>
      validPaths.has(path.toString()) ? Promise.resolve() : Promise.reject('no acccess'),
    );
  });

  afterEach(() => {
    accessStub.restore();
  });

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
