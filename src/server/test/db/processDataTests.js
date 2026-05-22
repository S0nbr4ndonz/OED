/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const moment = require('moment');
const mocha = require('mocha');
const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const Reading = require('../../models/Reading');
const processData = require('../../services/pipeline-in-progress/processData');
const { log } = require('../../log');

mocha.describe('PIPELINE: processData logging', () => {
	mocha.beforeEach(() => {
		log.logToDb = false;
		log.logToConsole = false;
	});

	mocha.it('includes newer pipeline options in logStatus output', () => {
		const prevReading = new Reading(undefined, 1, moment.utc('2020-01-01T00:00:00Z'), moment.utc('2020-01-01T01:00:00Z'));
		const currentReading = new Reading(undefined, 2, moment.utc('2020-01-01T01:00:00Z'), moment.utc('2020-01-01T02:00:00Z'));
		const logSpy = sinon.spy(log, 'info');

		const message = processData.logStatus(
			'test-meter',
			2,
			prevReading,
			currentReading,
			'increasing',
			1,
			false,
			false,
			'00:00:00.000',
			'23:59:99.999',
			0,
			0,
			false,
			true,
			true,
			true,
			true,
			true,
			60
		);

		expect(message).to.include('; honorDst true');
		expect(message).to.include('; relaxedParsing true');
		expect(message).to.include('; useMeterZone true');
		expect(message).to.include('; warnOnCumulativeReset true');
		expect(message).to.include('; useMeterFrequency true');
		expect(message).to.include('; useMeterFrequencyVariation 60');
		expect(logSpy.calledOnceWithExactly(message)).to.equal(true);

		logSpy.restore();
	});
});
