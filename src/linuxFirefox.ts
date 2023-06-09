/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { Quality } from '.';
import { LinuxChromeBrowserFinder } from './linuxChrome';

export class LinuxFirefoxBrowserFinder extends LinuxChromeBrowserFinder {
  protected override pathEnvironmentVar = 'FIREFOX_PATH';

  protected override executablesOnPath = [
    'firefox-trunk',
    'firefox-nightly',
    'firefox-aurora',
    'firefox-dev',
    'firefox-developer',
    'firefox',
  ];

  protected override priorities = [
    { regex: /firefox\-trunk'$/, weight: 51, quality: Quality.Canary },
    { regex: /firefox\-nightly'$/, weight: 51, quality: Quality.Canary },
    { regex: /firefox\-aurora$/, weight: 50, quality: Quality.Dev },
    { regex: /firefox\-dev$/, weight: 50, quality: Quality.Dev },
    { regex: /firefox\-developer$/, weight: 50, quality: Quality.Dev },
    { regex: /firefox$/, weight: 49, quality: Quality.Stable },
  ];
}
