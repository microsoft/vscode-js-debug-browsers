/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { IBrowserFinder } from './index';

/**
 * A no-op browser finder used to stub unsupported browsers/platforms (like
 * Edge on Linux).
 */
export class NoopFinder implements IBrowserFinder {
  public findAll() {
    return Promise.resolve([]);
  }
}
