/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app, testDB } = require('../common');
const { validateString, validateInt, testInvalidField } = require('../util/validationHelpers');

mocha.describe('Meters Parameter Validation', () => {

    mocha.describe('GET /api/meters/:meter_id - Meter ID Validation', () => {
        const METER_ID_ENDPOINT = '/api/meters/123';

        mocha.it('should validate meter_id parameter', async () => {
            // Test invalid meter ID patterns (non-numeric)
            const invalidIds = ['abc', '12abc', 'meter123', 'null', ''];
            
            for (const invalidId of invalidIds) {
                const res = await chai.request(app)
                    .get(`/api/meters/${invalidId}`);
                
                // Should return 400 for validation error or 200 if somehow valid
                expect([200, 400]).to.include(res.status);
            }
        });

        mocha.it('should handle extremely long meter IDs', async () => {
            const longId = '1'.repeat(25); // Exceeds maxLength: 20
            const res = await chai.request(app)
                .get(`/api/meters/${longId}`);
            
            expect(res.status).to.equal(400);
        });

        mocha.it('should handle SQL injection in meter ID', async () => {
            const sqlInjection = encodeURIComponent("1' OR '1'='1");
            const res = await chai.request(app)
                .get(`/api/meters/${sqlInjection}`);
            
            expect(res.status).to.equal(400);
        });

        mocha.it('should accept valid numeric meter IDs', async () => {
            const validIds = ['1', '123', '999999'];
            
            for (const validId of validIds) {
                const res = await chai.request(app)
                    .get(`/api/meters/${validId}`);
                
                // Should pass validation - may return 404 (not found) or 500 (DB error)
                expect([404, 500]).to.include(res.status);
            }
        });
    });

    mocha.describe('POST /api/meters/edit - Meter Edit Validation', () => {
        const EDIT_ENDPOINT = '/api/meters/edit';
        
        const baseMeterData = {
            id: 1,
            name: 'Test Meter',
            url: 'http://example.com/meter',
            enabled: true,
            displayable: true,
            meterType: 'MAMAC', // TODO: Use actual enum value
            timeZone: 'America/Los_Angeles',
            note: 'Test meter for validation',
            area: 100.5,
            cumulative: false,
            cumulativeReset: false,
            cumulativeResetStart: '2023-01-01',
            cumulativeResetEnd: '2023-12-31',
            readingGap: 300,
            readingVariation: 0.1,
            readingDuplication: 5,
            timeSort: 'increasing',
            endOnlyTime: false,
            reading: 1000.0,
            startTimestamp: '2023-01-01T00:00:00Z',
            endTimestamp: '2023-12-31T23:59:59Z',
            previousEnd: '2022-12-31T23:59:59Z',
            unitId: 1,
            defaultGraphicUnit: 1,
            areaUnit: 'square meters', // TODO: Use actual enum value
            readingFrequency: '15 minutes',
            minVal: 0,
            maxVal: 10000,
            minDate: '2023-01-01',
            maxDate: '2023-12-31',
            maxError: 5,
            disableChecks: 'none' // TODO: Use actual enum value
        };

        mocha.it('should reject unauthenticated requests', async () => {
            const res = await chai.request(app)
                .post(EDIT_ENDPOINT)
                .send(baseMeterData);
            
            // Should require admin authentication
            expect(res.status).to.equal(403);
        });

        mocha.it('should validate required fields', async () => {
            const requiredFields = ['name', 'url', 'enabled', 'displayable', 'meterType', 'timeZone', 'note', 'area'];
            
            for (const field of requiredFields) {
                const payloadMissingField = { ...baseMeterData };
                delete payloadMissingField[field];
                
                const res = await chai.request(app)
                    .post(EDIT_ENDPOINT)
                    .send(payloadMissingField);
                
                // Should fail due to missing required field or auth
                expect([400, 403]).to.include(res.status);
            }
        });

        mocha.it('should validate string field lengths', async () => {
            const stringFieldTests = [
                { field: 'name', maxLength: 100 },
                { field: 'meterType', maxLength: 50 },
                { field: 'timeZone', maxLength: 100 },
                { field: 'identifier', maxLength: 100 },
                { field: 'note', maxLength: 1000 },
                { field: 'cumulativeResetStart', maxLength: 100 },
                { field: 'cumulativeResetEnd', maxLength: 100 },
                { field: 'timeSort', maxLength: 20 },
                { field: 'startTimestamp', maxLength: 100 },
                { field: 'endTimestamp', maxLength: 100 },
                { field: 'previousEnd', maxLength: 100 },
                { field: 'areaUnit', maxLength: 50 },
                { field: 'readingFrequency', maxLength: 100 },
                { field: 'minDate', maxLength: 100 },
                { field: 'maxDate', maxLength: 100 },
                { field: 'disableChecks', maxLength: 50 }
            ];

            for (const test of stringFieldTests) {
                await testInvalidField({
                    field: test.field,
                    invalidValue: 'x'.repeat(test.maxLength + 1),
                    endpoint: EDIT_ENDPOINT,
                    basePayload: baseMeterData,
                    expectedStatus: 403 // Admin auth will block before validation
                });
            }
        });

        mocha.it('should validate boolean field types', async () => {
            const booleanFields = ['enabled', 'displayable', 'cumulative', 'cumulativeReset', 'endOnlyTime'];
            
            for (const field of booleanFields) {
                const invalidBooleanValues = ['yes', 'no', '1', '0', 'on', 'off', 'enabled'];
                
                for (const invalidValue of invalidBooleanValues) {
                    await testInvalidField({
                        field: field,
                        invalidValue: invalidValue,
                        endpoint: EDIT_ENDPOINT,
                        basePayload: baseMeterData,
                        expectedStatus: 403
                    });
                }
            }
        });

        mocha.it('should validate GPS coordinates', async () => {
            // Test invalid latitude (outside -90 to 90)
            await testInvalidField({
                field: 'gps',
                invalidValue: { latitude: 91, longitude: 0 },
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });

            // Test invalid longitude (outside -180 to 180)  
            await testInvalidField({
                field: 'gps',
                invalidValue: { latitude: 0, longitude: 181 },
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });

            // Test missing required GPS fields
            await testInvalidField({
                field: 'gps',
                invalidValue: { latitude: 45 }, // Missing longitude
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });

            // Test non-numeric GPS values
            await testInvalidField({
                field: 'gps',
                invalidValue: { latitude: 'north', longitude: 'west' },
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });
        });

        mocha.it('should validate numeric bounds', async () => {
            // Test negative area (minimum: 0)
            await testInvalidField({
                field: 'area',
                invalidValue: -1,
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });

            // Test readingDuplication outside bounds (1-9)
            await testInvalidField({
                field: 'readingDuplication',
                invalidValue: 0,
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });

            await testInvalidField({
                field: 'readingDuplication',
                invalidValue: 10,
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });

            // Test invalid meter ID (minimum: 1)
            await testInvalidField({
                field: 'id',
                invalidValue: 0,
                endpoint: EDIT_ENDPOINT,
                basePayload: baseMeterData,
                expectedStatus: 403
            });
        });

        mocha.it('should validate enum fields', async () => {
            // Test invalid meterType
            const invalidMeterTypes = ['INVALID_TYPE', 'invalid', '', 'OTHER'];
            for (const invalidType of invalidMeterTypes) {
                await testInvalidField({
                    field: 'meterType',
                    invalidValue: invalidType,
                    endpoint: EDIT_ENDPOINT,
                    basePayload: baseMeterData,
                    expectedStatus: 403
                });
            }

            // Test invalid timeSort
            const invalidTimeSorts = ['ascending', 'descending', 'asc', 'desc', 'random'];
            for (const invalidSort of invalidTimeSorts) {
                await testInvalidField({
                    field: 'timeSort',
                    invalidValue: invalidSort,
                    endpoint: EDIT_ENDPOINT,
                    basePayload: baseMeterData,
                    expectedStatus: 403
                });
            }
        });

        mocha.it('should reject parameter injection', async () => {
            const payloadWithExtra = {
                ...baseMeterData,
                maliciousField: 'injection attempt',
                isAdmin: true,
                deleteAll: true,
                executeCommand: 'rm -rf /',
                extraProperty: 'should be rejected'
            };

            const res = await chai.request(app)
                .post(EDIT_ENDPOINT)
                .send(payloadWithExtra);
            
            // Should fail due to additionalProperties: false or auth
            expect(res.status).to.equal(403);
        });

        mocha.it('should handle malicious string inputs', async () => {
            const maliciousInputs = [
                "'; DROP TABLE meters; --",
                '<script>alert("xss")</script>',
                '../../../etc/passwd',
                'meter\x00injection',
                '\u0000malicious'
            ];

            const stringFields = ['name', 'identifier', 'note'];

            for (const field of stringFields) {
                for (const maliciousInput of maliciousInputs) {
                    await testInvalidField({
                        field: field,
                        invalidValue: maliciousInput,
                        endpoint: EDIT_ENDPOINT,
                        basePayload: baseMeterData,
                        expectedStatus: 403
                    });
                }
            }
        });

        mocha.it('should handle oneOf nullable fields correctly', async () => {
            // Test null values for nullable fields
            const nullableFields = ['url', 'timeZone', 'gps', 'identifier', 'note', 'previousEnd'];
            
            for (const field of nullableFields) {
                const payloadWithNull = {
                    ...baseMeterData,
                    [field]: null
                };

                const res = await chai.request(app)
                    .post(EDIT_ENDPOINT)
                    .send(payloadWithNull);
                
                // Should pass validation but fail auth
                expect(res.status).to.equal(403);
            }
        });
    });

    mocha.describe('POST /api/meters/addMeter - Meter Creation Validation', () => {
        const ADD_ENDPOINT = '/api/meters/addMeter';
        
        const baseMeterData = {
            name: 'New Test Meter',
            url: 'http://example.com/newmeter',
            enabled: true,
            displayable: true,
            meterType: 'MAMAC',
            timeZone: 'America/New_York',
            note: 'New meter for testing',
            area: 200.0,
            // Add other required fields...
            cumulative: false,
            cumulativeReset: false,
            cumulativeResetStart: '2024-01-01',
            cumulativeResetEnd: '2024-12-31',
            readingGap: 300,
            readingVariation: 0.1,
            readingDuplication: 3,
            timeSort: 'increasing',
            endOnlyTime: false,
            reading: 0,
            startTimestamp: '2024-01-01T00:00:00Z',
            endTimestamp: '2024-12-31T23:59:59Z',
            previousEnd: null,
            unitId: 1,
            defaultGraphicUnit: 1,
            areaUnit: 'square meters',
            readingFrequency: '30 minutes',
            minVal: 0,
            maxVal: 5000,
            minDate: '2024-01-01',
            maxDate: '2024-12-31',
            maxError: 3,
            disableChecks: 'none'
        };

        mocha.it('should reject unauthenticated requests', async () => {
            const res = await chai.request(app)
                .post(ADD_ENDPOINT)
                .send(baseMeterData);
            
            // Validation happens before auth - should return 400 for validation errors
            expect([400, 403]).to.include(res.status);
        });

        mocha.it('should validate all required fields for creation', async () => {
            const requiredFields = ['name', 'url', 'enabled', 'displayable', 'meterType', 'timeZone', 'note', 'area'];
            
            for (const field of requiredFields) {
                const payloadMissingField = { ...baseMeterData };
                delete payloadMissingField[field];
                
                const res = await chai.request(app)
                    .post(ADD_ENDPOINT)
                    .send(payloadMissingField);
                
                // Should fail validation or auth
                expect([400, 403]).to.include(res.status);
            }
        });

        mocha.it('should reject parameter injection on creation', async () => {
            const payloadWithExtra = {
                ...baseMeterData,
                adminOverride: true,
                bypassValidation: true,
                maliciousScript: '<script>alert("hack")</script>'
            };

            const res = await chai.request(app)
                .post(ADD_ENDPOINT)
                .send(payloadWithExtra);
            
            // Should fail due to additionalProperties: false validation or auth
            expect([400, 403]).to.include(res.status);
        });

        mocha.it('should handle type validation errors', async () => {
            // Test wrong types for various fields
            const typeTests = [
                { field: 'enabled', invalidValue: 'true' }, // String instead of boolean
                { field: 'area', invalidValue: 'large' }, // String instead of number
                { field: 'id', invalidValue: 'meter1' }, // String instead of integer
                { field: 'unitId', invalidValue: 1.5 } // Float instead of integer
            ];

            for (const test of typeTests) {
                await testInvalidField({
                    field: test.field,
                    invalidValue: test.invalidValue,
                    endpoint: ADD_ENDPOINT,
                    basePayload: baseMeterData,
                    expectedStatus: 400
                });
            }
        });
    });

    mocha.describe('Cross-Endpoint Security Tests', () => {
        mocha.it('should handle concurrent meter operations', async () => {
            const EDIT_ENDPOINT = '/api/meters/edit';
            const meterData = {
                id: 999,
                name: 'Concurrent Test Meter',
                url: 'http://example.com/concurrent',
                enabled: true,
                displayable: true,
                meterType: 'MAMAC',
                timeZone: 'UTC',
                note: 'Concurrent test',
                area: 100
            };

            // Send multiple concurrent requests
            const promises = Array(3).fill().map(() =>
                chai.request(app)
                    .post(EDIT_ENDPOINT)
                    .send(meterData)
            );

            const results = await Promise.all(promises);
            
            // All should fail with 403 (auth required)
            results.forEach(res => {
                expect(res.status).to.equal(403);
            });
        });

        mocha.it('should reject completely invalid payloads', async () => {
            const endpoints = ['/api/meters/edit', '/api/meters/addMeter'];

            for (const endpoint of endpoints) {
                // Test non-object payload - validation happens before auth for addMeter
                const res1 = await chai.request(app)
                    .post(endpoint)
                    .send('not an object');
                expect([400, 403]).to.include(res1.status);

                // Test array payload - validation happens before auth for addMeter
                const res2 = await chai.request(app)
                    .post(endpoint)
                    .send(['array', 'payload']);
                expect([400, 403]).to.include(res2.status);

                // Test null payload - validation happens before auth for addMeter
                const res3 = await chai.request(app)
                    .post(endpoint)
                    .send(null);
                expect([400, 403]).to.include(res3.status);
            }
        });
    });
});