/* This file provides a clean, promise-based wrapper for the CloudSploit engine
 * and an HTTP handler to deploy it as a Google Cloud Function.
 */

// engine.js is the core CloudSploit scanner.
const { request } = require('http');
const engine = require('./engine.js');
const pluginNames = require('./pluginNames.js')
const fs = require('fs').promises;

/**
 * Executes a CloudSploit scan by wrapping the callback-based engine in a Promise.
 * It also handles filtering of "OK" results if specified in the settings.
 *
 * @param {object} cloudConfig - The cloud credentials object (i.e., the service account key).
 * @param {object} settings - The scan settings object.
 * @returns {Promise<Array>} A promise that resolves with the array of scan results.
 */
function runScan(cloudConfig, settings) {
    // Define default settings and merge them with user-provided settings.
    // User settings will override the defaults.
    const finalSettings = {
        cloud: 'google',
        console: 'none',
        ignore_ok: false,
        ...settings
    };


    // This is the portion of code that handles the callback.
    // We return a new Promise, which allows us to use async/await.
    return new Promise((resolve, reject) => {

        // The engine function expects a callback as its third argument.
        // This callback is what we will define right here.
        const callback = (err, results) => {
            // This code block is executed ONLY when the engine has
            // finished its work and calls the callback.

            if (err) {
                // If the engine reports an error, we reject the promise.
                console.error('Error reported from CloudSploit engine:', err);
                return reject(err);
            }

            console.log('Engine callback received successfully. Processing results...');

            // If ignore_ok is true, filter the results before resolving.
            if (finalSettings.ignore_ok) {
                const filteredResults = {};
                for (const pluginName in results) {
                    const pluginResults = results[pluginName];
                    // A result status of 0 means "OK". We keep everything that is NOT 0.
                    const nonOkResults = pluginResults.filter(result => result.status !== 0);
                    
                    // Only add the plugin to the final object if it has non-OK results left.
                    if (nonOkResults.length > 0) {
                        filteredResults[pluginName] = nonOkResults;
                    }
                }
                // Resolve the promise with the filtered results.
                resolve(filteredResults);
            } else {
                // If ignore_ok is not set, resolve with the original results.
                resolve(results);
            }
        };

        // Now, we call the engine and pass our configuration and the callback
        // function we just defined. The engine will run, and when it is done,
        // it will execute our callback.
        console.log('Calling the CloudSploit engine...');
        engine(cloudConfig, finalSettings, callback);
    });
}

/**
 * Main HTTP Cloud Function handler.
 * This is the entry point for the deployed function.
 */
exports.cloudsploitScanner = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }


    // --- Simplified Request Handling ---
    // We pass the serviceAccount object and settings directly to the scanner.
    // The service account key MUST contain a project_id.
    if (!req.body || !req.body.serviceAccount || !req.body.serviceAccount.project_id) {
        return res.status(400).send('Bad Request: "serviceAccount" key missing or it does not contain a "project_id" field.');
    }

    console.log(req.body.settings.product)
    const cloudConfig = req.body.serviceAccount;
    const product = req.body.settings.product;
    var receivedProductList = [];

    if (product){
        receivedProductList = pluginNames[product];
    }

    // The engine requires a `project` property. We add it here.
    cloudConfig.project = cloudConfig.project_id;
    var settings = req.body.settings || {};
    settings = {...settings, list_of_plugins: receivedProductList}


    try {
        const results = await runScan(cloudConfig, settings);
        res.status(200).json(results);
    } catch (error) {
        console.error('An error occurred during the CloudSploit scan:', error);
        res.status(500).send(`Internal Server Error: ${error.message || error}`);
    }
};


// --- LOCAL TESTING EXAMPLE ---
// This block demonstrates how to test the cloudsploitScanner function locally.
if (require.main === module) {
    (async () => {
        console.log('--- RUNNING IN LOCAL TEST MODE ---');

        const testKeyPath = './key.json';
        let serviceAccountKey;

        try {
            const keyData = await fs.readFile(testKeyPath, 'utf8');
            serviceAccountKey = JSON.parse(keyData);
            
            if (!serviceAccountKey.project_id) {
                throw new Error('The key.json file is missing the required "project_id" field.');
            }
            console.log(`Successfully loaded service account key for project: ${serviceAccountKey.project_id}`);

        } catch (err) {
            console.error(`\nError: Could not read or parse "${testKeyPath}".`);
            console.error(err.message);
            process.exit(1);
        }
        
        // 1. Simulate the request object (req) that the Cloud Function would receive.
        const mockReq = {
            method: 'POST',
            body: {
                serviceAccount: serviceAccountKey,
                // You can test the "product" feature by uncommenting the line below
                product: 'compute', 
                settings: {
                    // You can add specific settings here to test them
                    ignore_ok: true,
                    // product: 'compute'
                }
            }
        };

        // 2. Simulate the response object (res) to capture the output.
        const mockRes = {
            _status: 200,
            _json: null,
            _sent: null,
            status: function(code) {
                this._status = code;
                return this; // Allow chaining e.g., res.status(400).send()
            },
            send: function(data) {
                this._sent = data;
                console.log('\n--- MOCK RESPONSE (SENT) ---');
                console.log(`Status: ${this._status}`);
                console.log('Body:', this._sent);
            },
            json: function(data) {
                this._json = data;
                console.log('\n--- MOCK RESPONSE (JSON) ---');
                console.log(`Status: ${this._status}`);
                console.log('Body:');
                console.log(JSON.stringify(this._json, null, 2)); // Pretty-print JSON
            }
        };

        try {
            console.log(`\nAttempting to run cloudsploitScanner function...`);
            // 3. Call the exported handler function with the mock objects.
            await exports.cloudsploitScanner(mockReq, mockRes);
        } catch (error) {
            console.error('\n--- SCAN FAILED ---');
            console.error('The cloudsploitScanner function encountered an unhandled error:', error);
        }

        console.log('\n--- LOCAL TEST MODE FINISHED ---');
    })();
}