/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { Quality } from '.';
import { LinuxChromeBrowserFinder } from './linuxChrome';

export class LinuxEdgeBrowserFinder extends LinuxChromeBrowserFinder {
  protected override pathEnvironmentVar = 'EDGE_PATH';

  protected override executablesOnPath = [
    'microsoft-edge-dev',
    'microsoft-edge-beta',
    'microsoft-edge-stable',
    'microsoft-edge',
  ];

  protected override priorities = [
    { regex: /microsoft-edge\-wrapper$/, weight: 52, quality: Quality.Custom },
    { regex: /microsoft-edge\-dev$/, weight: 51, quality: Quality.Dev },
    { regex: /microsoft-edge\-beta$/, weight: 51, quality: Quality.Beta },
    { regex: /microsoft-edge\-stable$/, weight: 50, quality: Quality.Stable },
    { regex: /microsoft-edge$/, weight: 49, quality: Quality.Stable },
  ];
}
