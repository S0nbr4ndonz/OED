/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { chai, mocha, app, testDB } = require('../common');
const { validateString, testInvalidField } = require('../util/validationHelpers');

mocha.describe('Compare Readings Parameter Validation', () => {

    mocha.describe('GET /api/compareReadings/meters/:meter_ids - Meter Compare Readings', () => {
        const BASE_METER_ENDPOINT = '/api/compareReadings/meters';
        
        const validQuery = {
            curr_start: '2023-01-01T00:00:00.000Z',
            curr_end: '2023-01-02T00:00:00.000Z',
            shift: 'P1D',
            graphicUnitId: '1'
        };

        mocha.describe('URL Parameter Validation - meter_ids', () => {
            mocha.it('should accept valid single meter ID', async () => {
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/1`)
                    .query(validQuery);
                
                // Should return 200 or 500 (DB error) - no auth required for reading
                expect([200, 500]).to.include(res.status);
            });

            mocha.it('should accept valid comma-separated meter IDs', async () => {
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/1,2,3`)
                    .query(validQuery);
                
                expect([200, 500]).to.include(res.status);
            });

            mocha.it('should reject invalid meter ID patterns', async () => {
                const invalidPatterns = [
                    'abc',           // Non-numeric
                    '1,',            // Trailing comma
                    ',1',            // Leading comma
                    '1,,2',          // Double comma
                    '1;2',           // Wrong separator
                    '1.5',           // Decimal
                    '-1',            // Negative
                    '1 2',           // Space separator
                ];

                for (const invalidPattern of invalidPatterns) {
                    const res = await chai.request(app)
                        .get(`${BASE_METER_ENDPOINT}/${invalidPattern}`)
                        .query(validQuery);
                    
                    expect(res.status).to.equal(400);
                }
            });

            mocha.it('should reject extremely long meter ID strings (DoS prevention)', async () => {
                const longMeterIds = '1,'.repeat(1000) + '1'; // Creates very long comma-separated list
                
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/${longMeterIds}`)
                    .query(validQuery);
                
                expect(res.status).to.equal(400);
            });
        });

        mocha.describe('Query Parameter Validation', () => {
            mocha.it('should require all query parameters', async () => {
                const requiredParams = ['curr_start', 'curr_end', 'shift', 'graphicUnitId'];
                
                for (const param of requiredParams) {
                    const incompleteQuery = { ...validQuery };
                    delete incompleteQuery[param];
                    
                    const res = await chai.request(app)
                        .get(`${BASE_METER_ENDPOINT}/1`)
                        .query(incompleteQuery);
                    
                    expect(res.status).to.equal(400);
                }
            });

            mocha.it('should reject extra query parameters (parameter injection prevention)', async () => {
                const queryWithExtra = {
                    ...validQuery,
                    maliciousParam: 'injection_attempt'
                };
                
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/1`)
                    .query(queryWithExtra);
                
                expect(res.status).to.equal(400);
            });

            mocha.it('should validate curr_start parameter', async () => {
                // Test extremely long date string (DoS prevention)
                const longDateString = '2023-01-01T00:00:00.000Z' + 'x'.repeat(200);
                
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/1`)
                    .query({
                        ...validQuery,
                        curr_start: longDateString
                    });
                
                expect(res.status).to.equal(400);
            });

            mocha.it('should validate curr_end parameter', async () => {
                // Test extremely long date string (DoS prevention)
                const longDateString = 'x'.repeat(150);
                
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/1`)
                    .query({
                        ...validQuery,
                        curr_end: longDateString
                    });
                
                expect(res.status).to.equal(400);
            });

            mocha.it('should validate shift parameter', async () => {
                // Test extremely long duration string (DoS prevention)
                const longDurationString = 'P1D' + 'x'.repeat(150);
                
                const res = await chai.request(app)
                    .get(`${BASE_METER_ENDPOINT}/1`)
                    .query({
                        ...validQuery,
                        shift: longDurationString
                    });
                
                expect(res.status).to.equal(400);
            });

            mocha.it('should validate graphicUnitId parameter', async () => {
                const invalidUnitIds = [
                    'abc',              // Non-numeric
                    '1.5',              // Decimal
                    '-1',               // Negative
                    '1a',               // Mixed alphanumeric
                    'x'.repeat(30),     // Extremely long string (DoS prevention)
                ];

                for (const invalidId of invalidUnitIds) {
                    const res = await chai.request(app)
                        .get(`${BASE_METER_ENDPOINT}/1`)
                        .query({
                            ...validQuery,
                            graphicUnitId: invalidId
                        });
                    
                    expect(res.status).to.equal(400);
                }
            });
        });
    });

    mocha.describe('GET /api/compareReadings/groups/:group_ids - Group Compare Readings', () => {
        const BASE_GROUP_ENDPOINT = '/api/compareReadings/groups';
        
        const validQuery = {
            curr_start: '2023-01-01T00:00:00.000Z',
            curr_end: '2023-01-02T00:00:00.000Z',
            shift: 'P1D',
            graphicUnitId: '1'
        };

        mocha.describe('URL Parameter Validation - group_ids', () => {
            mocha.it('should accept valid single group ID', async () => {
                const res = await chai.request(app)
                    .get(`${BASE_GROUP_ENDPOINT}/1`)
                    .query(validQuery);
                
                // Should return 200 or 500 (DB error) - no auth required for reading
                expect([200, 500]).to.include(res.status);
            });

            mocha.it('should accept valid comma-separated group IDs', async () => {
                const res = await chai.request(app)
                    .get(`${BASE_GROUP_ENDPOINT}/1,2,3`)
                    .query(validQuery);
                
                expect([200, 500]).to.include(res.status);
            });

            mocha.it('should reject invalid group ID patterns', async () => {
                const invalidPatterns = [
                    'abc',           // Non-numeric
                    '1,',            // Trailing comma
                    ',1',            // Leading comma
                    '1,,2',          // Double comma
                    '1;2',           // Wrong separator
                    '1.5',           // Decimal
                    '-1',            // Negative
                    '1 2',           // Space separator
                ];

                for (const invalidPattern of invalidPatterns) {
                    const res = await chai.request(app)
                        .get(`${BASE_GROUP_ENDPOINT}/${invalidPattern}`)
                        .query(validQuery);
                    
                    expect(res.status).to.equal(400);
                }
            });

            mocha.it('should reject extremely long group ID strings (DoS prevention)', async () => {
                const longGroupIds = '1,'.repeat(1000) + '1'; // Creates very long comma-separated list
                
                const res = await chai.request(app)
                    .get(`${BASE_GROUP_ENDPOINT}/${longGroupIds}`)
                    .query(validQuery);
                
                expect(res.status).to.equal(400);
            });
        });

        mocha.describe('Query Parameter Validation', () => {
            mocha.it('should require all query parameters', async () => {
                const requiredParams = ['curr_start', 'curr_end', 'shift', 'graphicUnitId'];
                
                for (const param of requiredParams) {
                    const incompleteQuery = { ...validQuery };
                    delete incompleteQuery[param];
                    
                    const res = await chai.request(app)
                        .get(`${BASE_GROUP_ENDPOINT}/1`)
                        .query(incompleteQuery);
                    
                    expect(res.status).to.equal(400);
                }
            });

            mocha.it('should reject extra query parameters (parameter injection prevention)', async () => {
                const queryWithExtra = {
                    ...validQuery,
                    maliciousParam: 'injection_attempt'
                };
                
                const res = await chai.request(app)
                    .get(`${BASE_GROUP_ENDPOINT}/1`)
                    .query(queryWithExtra);
                
                expect(res.status).to.equal(400);
            });

            // Query parameter validation is identical for both endpoints, 
            // so we don't need to repeat all the tests
        });
    });

    mocha.describe('Security Attack Prevention', () => {
        const validQuery = {
            curr_start: '2023-01-01T00:00:00.000Z',
            curr_end: '2023-01-02T00:00:00.000Z',
            shift: 'P1D',
            graphicUnitId: '1'
        };

        mocha.it('should prevent parameter injection attacks via extra fields', async () => {
            const maliciousQueries = [
                { ...validQuery, sqlInjection: "'; DROP TABLE meters; --" },
                { ...validQuery, xss: '<script>alert("xss")</script>' },
                { ...validQuery, prototype污染: '__proto__' },
                { ...validQuery, unexpectedField: 'value' },
            ];

            for (const maliciousQuery of maliciousQueries) {
                const res1 = await chai.request(app)
                    .get('/api/compareReadings/meters/1')
                    .query(maliciousQuery);
                
                const res2 = await chai.request(app)
                    .get('/api/compareReadings/groups/1')
                    .query(maliciousQuery);
                
                expect(res1.status).to.equal(400);
                expect(res2.status).to.equal(400);
            }
        });

        mocha.it('should prevent DoS attacks via oversized parameters', async () => {
            const oversizedTests = [
                {
                    name: 'oversized date strings',
                    query: { ...validQuery, curr_start: 'x'.repeat(200) }
                },
                {
                    name: 'oversized duration strings', 
                    query: { ...validQuery, shift: 'x'.repeat(200) }
                },
                {
                    name: 'oversized unit ID',
                    query: { ...validQuery, graphicUnitId: 'x'.repeat(50) }
                }
            ];

            for (const test of oversizedTests) {
                const res1 = await chai.request(app)
                    .get('/api/compareReadings/meters/1')
                    .query(test.query);
                
                const res2 = await chai.request(app)
                    .get('/api/compareReadings/groups/1')
                    .query(test.query);
                
                expect(res1.status).to.equal(400);
                expect(res2.status).to.equal(400);
            }
        });
    });
});