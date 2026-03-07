/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Functions to return a code and comment from an Express request.
const { HTTP_CODE } = require('../util/readingsUtils');

/**
 * Inform the client of a success (200 OK).
 *
 * @param res The Express response object
 * @param comment Any additional data to be returned to the client as a string
 *
 */
function success(res, comment = '') {
	res.status(HTTP_CODE.OK)
		.send(comment);
}

/**
 * Inform the client of a failure with provided code or 500.
 *
 * @param res The Express response object
 * @param code The code number to send back for request
 * @param comment Any additional data to be returned to the client as a string
 *
 */
function failure(res, code = HTTP_CODE.INTERNAL_SERVER_ERROR, comment = '') {
	res.status(code)
		.send(comment);

}

module.exports = { success, failure };
