/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { Quality } from '.';
import { LinuxChromeBrowserFinder } from './linuxChrome';

export class LinuxFirefoxBrowserFinder extends LinuxChromeBrowserFinder {
  protected override pathEnvironmentVar = 'FIREFOX_PATH';

  protected override executablesOnPath = [
    'firefox-aurora',
    'firefox-dev',
    'firefox-developer',
    'firefox-trunk',
    'firefox-nightly',
    'firefox',
  ];

  protected override priorities = [
    { regex: /firefox\-aurora$/, weight: 51, quality: Quality.Dev },
    { regex: /firefox\-dev$/, weight: 51, quality: Quality.Dev },
    { regex: /firefox\-developer$/, weight: 51, quality: Quality.Dev },
    { regex: /firefox\-trunk'$/, weight: 50, quality: Quality.Canary },
    { regex: /firefox\-nightly'$/, weight: 50, quality: Quality.Canary },
    { regex: /firefox$/, weight: 49, quality: Quality.Stable },
  ];
}
