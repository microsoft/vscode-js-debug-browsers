/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { sort } from './util';
import { Quality } from './index';
import { DarwinFinderBase } from './darwinFinderBase';

/**
 * Finds the Edge browser on OS X.
 */
export class DarwinEdgeBrowserFinder extends DarwinFinderBase {
  /**
   * @override
   */
  protected wellKnownPaths = [
    {
      path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      quality: Quality.Stable,
    },
    {
      path: '/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary',
      quality: Quality.Canary,
    },
    {
      path: '/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta',
      quality: Quality.Beta,
    },
    {
      path: '/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev',
      quality: Quality.Dev,
    },
  ];

  protected override async findAllInner() {
    const suffixes = [
      '/Contents/MacOS/Microsoft Edge Canary',
      '/Contents/MacOS/Microsoft Edge Beta',
      '/Contents/MacOS/Microsoft Edge Dev',
      '/Contents/MacOS/Microsoft Edge',
    ];

    const defaultPaths = ['/Applications/Microsoft Edge.app'];
    const installations = await this.findLaunchRegisteredApps(
      'Microsoft Edge[A-Za-z ]*.app',
      defaultPaths,
      suffixes,
    );

    return sort(
      installations,
      this.createPriorities([
        {
          name: 'Microsoft Edge.app',
          weight: 0,
          quality: Quality.Stable,
        },
        {
          name: 'Microsoft Edge Canary.app',
          weight: 1,
          quality: Quality.Canary,
        },
        {
          name: 'Microsoft Edge Beta.app',
          weight: 2,
          quality: Quality.Beta,
        },
        {
          name: 'Microsoft Edge Dev.app',
          weight: 3,
          quality: Quality.Dev,
        },
      ]),
    );
  }

  protected getPreferredPath() {
    return this.env.EDGE_PATH;
  }
}
