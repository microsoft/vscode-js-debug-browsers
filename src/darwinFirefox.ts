/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { sort } from './util';
import { Quality } from './index';
import { DarwinFinderBase } from './darwinFinderBase';

/**
 * Finds the Edege browser on OS X.
 */
export class DarwinFirefoxBrowserFinder extends DarwinFinderBase {
  /**
   * @override
   */
  protected wellKnownPaths = [
    {
      path: '/Applications/Firefox.app/Contents/MacOS/firefox',
      quality: Quality.Stable,
    },
    {
      path: '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
      quality: Quality.Dev,
    },
    {
      path: '/Applications/Firefox Nightly.app/Contents/MacOS/firefox',
      quality: Quality.Nightly,
    },
  ];

  protected override async findAllInner() {
    const suffixes = [
      '/Contents/MacOS/firefox',
    ];

    const defaultPaths = ['/Applications/Firefox.app'];
    const installations = await this.findLaunchRegisteredApps(
      'Firefox[A-Za-z ]*.app',
      defaultPaths,
      suffixes,
    );

    return sort(
      installations,
      this.createPriorities([
        {
          name: 'Firefox.app',
          weight: 0,
          quality: Quality.Stable,
        },
        {
          name: 'Firefox Developer Edition.app',
          weight: 1,
          quality: Quality.Dev,
        },
        {
          name: 'Firefox Nightly.app',
          weight: 2,
          quality: Quality.Nightly,
        }
      ]),
    );
  }

  protected getPreferredPath() {
    return this.env.FIREFOX_PATH;
  }
}
