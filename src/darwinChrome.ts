/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { sort } from './util';
import { Quality } from './index';
import { DarwinFinderBase } from './darwinFinderBase';

/**
 * Finds the Chrome browser on OS X.
 */
export class DarwinChromeBrowserFinder extends DarwinFinderBase {
  /**
   * @override
   */
  protected wellKnownPaths = [
    {
      path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      quality: Quality.Stable,
    },
    {
      path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      quality: Quality.Canary,
    },
    {
      path: '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
      quality: Quality.Beta,
    },
    {
      path: '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
      quality: Quality.Dev,
    },
  ];

  /**
   * @override
   */
  public async findAll() {
    const suffixes = ['/Contents/MacOS/Google Chrome Canary', '/Contents/MacOS/Google Chrome'];
    const defaultPaths = [
      '/Applications/Google Chrome.app',
      '/Applications/Google Chrome Canary.app',
    ];
    const installations = await this.findLaunchRegisteredApps(
      'google chrome\\( canary\\)\\?.app',
      defaultPaths,
      suffixes,
    );

    return sort(
      installations,
      this.createPriorities([
        {
          name: 'Chrome.app',
          weight: 0,
          quality: Quality.Stable,
        },
        {
          name: 'Chrome Canary.app',
          weight: 1,
          quality: Quality.Canary,
        },
      ]),
    );
  }

  public getPreferredPath() {
    return this.env.CHROME_PATH;
  }
}
