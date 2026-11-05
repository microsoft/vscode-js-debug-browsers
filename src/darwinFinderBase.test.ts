/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { promises as fs } from 'fs';
import { resolve } from 'path';
import execa from 'execa';
import { DarwinChromeBrowserFinder } from './darwinChrome';
import { DarwinEdgeBrowserFinder } from './darwinEdge';
import { DarwinFirefoxBrowserFinder } from './darwinFirefox';
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

  for (const Finder of [
    DarwinChromeBrowserFinder,
    DarwinEdgeBrowserFinder,
    DarwinFirefoxBrowserFinder,
  ]) {
    describe(Finder.name, () => {
      const constructors = {
        'with no arguments': () => new Finder(),
        'without execa': () => new Finder({}, fs),
        'with undefined execa': () => new Finder({}, fs, undefined),
        'with injected execa': () => new Finder({}, fs, execa),
      };

      for (const [description, createFinder] of Object.entries(constructors)) {
        it(`uses execa ${description}`, async () => {
          const commandStub = stub(execa, 'command').callsFake(stub().resolves({ stdout: '' }));
          try {
            expect(await createFinder().findAll()).to.deep.equal([]);
            expect(commandStub.calledOnce).to.be.true;
          } finally {
            commandStub.restore();
          }
        });
      }
    });
  }

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
