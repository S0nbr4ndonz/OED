/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const VALIDATION_CONSTANTS = {
	// String length limits
	PASSWORD_MAX_LENGTH: 1000,
	TOKEN_MAX_LENGTH: 2000,
	GENERAL_STRING_MAX_LENGTH: 1000,
	SHORT_STRING_MAX_LENGTH: 256,
	NUMERIC_ID_MAX_LENGTH: 20,
	USERNAME_MIN_LENGTH: 3,
	USERNAME_MAX_LENGTH: 254,
	PASSWORD_MIN_LENGTH: 8
};

module.exports = VALIDATION_CONSTANTS;
