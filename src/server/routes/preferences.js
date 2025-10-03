/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Preferences = require('../models/Preferences');
const { log } = require('../log');
const { adminAuthMiddleware, optionalAuthMiddleware } = require('./authenticator');
const validate = require('jsonschema').validate;
const { getConnection } = require('../db');

const router = express.Router();

/**
 * Route for getting the preferences
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
	const conn = getConnection();
	try {
		const rows = await Preferences.get(conn);
		res.json(rows);
	} catch (err) {
		log.error(`Error while performing GET all preferences query: ${err}`, err);
	}
});


/**
 * Route for updating the preferences
 * @param user_id
 */
router.post('/', adminAuthMiddleware('edit site preferences'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['preferences'],
		properties: {
			preferences: {
				type: 'object',
				additionalProperties: false,
				properties: {
					displayTitle: {
						type: 'string',
						maxLength: 100
					},
					defaultChartToRender: {
						type: 'string',
						maxLength: 50
					},
					defaultBarStacking: {
						type: 'boolean'
					},
					defaultLanguage: {
						type: 'string',
						maxLength: 10
					},
					defaultTimezone: {
						oneOf: [
							{ type: 'string', maxLength: 50 },
							{ type: 'null' }
						]
					},
					defaultWarningFileSize: {
						type: 'number',
						minimum: 0,
						maximum: 1000000000
					},
					defaultFileSizeLimit: {
						type: 'number',
						minimum: 0,
						maximum: 1000000000
					},
					defaultAreaNormalization: {
						type: 'boolean'
					},
					defaultMeterReadingFrequency: {
						type: 'string',
						maxLength: 50
					},
					defaultMeterMinimumDate: {
						type: 'string',
						maxLength: 100
					},
					defaultMeterMaximumDate: {
						type: 'string',
						maxLength: 100
					},
					defaultMeterReadingGap: {
						type: 'number',
						minimum: 0,
						maximum: 86400
					},
					defaultMeterMaximumErrors: {
						type: 'number',
						minimum: 0,
						maximum: 10000
					},
					defaultHelpUrl: {
						type: 'string',
						maxLength: 500
					}
				}
			}
		}
	};
	if (!validate(req.body, validParams).valid) {
		res.sendStatus(400);
	} else {
		const conn = getConnection();
		try {
			const rows = await Preferences.update(req.body.preferences, conn);
			res.json(rows);
		} catch (err) {
			log.error(`Error while performing POST update preferences: ${err}`, err);
			res.sendStatus(500);
		}
	}
});

module.exports = router;

