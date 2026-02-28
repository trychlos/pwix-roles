/*
 * pwix:roles/src/collections/aliases/server/index.js
 */

import { Logger } from 'meteor/pwix:logger';

import './deny.js';
import './methods.js';
import './publish.js';

const logger = Logger.get();

logger.log( 'pwix:roles/src/collections/aliases/server/index.js declaring Aliases collection' );
