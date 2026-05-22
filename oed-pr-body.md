Resolves #1618

Adds the newer pipeline flags to `logStatus()` and updates each call site so they appear in the standardized logging output.

Also adds a focused server-side test for the expanded log message.

### Verification

- `node --check src/server/services/pipeline-in-progress/processData.js`
- `node --check src/server/test/db/processDataTests.js`
- `./node_modules/.bin/mocha --timeout 15000 "src/server/test/db/processDataTests.js"`
