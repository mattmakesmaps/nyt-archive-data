const rp = require('request-promise');
const Bottleneck = require('bottleneck');
const util = require('util');
const jsonfile = require('jsonfile');

// This stuff could be wrapped in a cmd-line param or class config
const base_url = 'http://api.nytimes.com/svc/archive/v1'
// const base_url = 'http://localhost:53821/svc/archive/v1'
const api_key = '772925f7d490445fa8a6b1be09ec262a'
const months = [1, 2, 3,];
const year = 1985;

let months_processed = 0;

function makeRequestOptionsObj(base_url, year, month, api_key) {
    let uri_constructed = util.format('%s/%s/%s.json', base_url, year, month);
    return {
        uri: uri_constructed,
        qs: { 'api-key': api_key },
        headers: { 'User-Agent': 'Request-Promise' },
        json: true
    }
}

let merged_docs = [];

function makeRequest(options) {
    // Function that:
    // - Makes a request
    // - then checks if the response is valid json
    // - retry if response is not valid json 
    return rp(options)
        .then((response) => {
            // Change to === 'number' to force an error
            if (typeof (response) !== 'object') {
                console.log(options.uri + ' request failed, throwing error');
                throw TypeError;
            }
            console.log(options.uri + ' Response contained valid JSON');
            // increment months_processed
            months_processed++;
            // add docs to merged_docs array
            response['response']['docs'].forEach(doc => {
                merged_docs.push(doc);
            });
            return response;
        })
        // This will catch an error `thrown` in the `then` above.
        .catch((error) => {
            console.log('in the rp.catch() error');
            makeThrottledRequest(options);
        });
}

function makeThrottledRequest(options) {
    console.log(options.uri + ' in makeThrottledRequest');
    return limiter.schedule(makeRequest, options)
        .then((value) => {
            console.log('returned from in makeThrottledRequest');

            if (months_processed === months.length) {
                let path = util.format('./data-by-year/%s.json', year);
                jsonfile.writeFile(path, { "docs": merged_docs }, function (err) { console.error(err) });
            }
        })
        .catch(err => { console.log(err) });
}

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
var limiter = new Bottleneck(10, 3000, null, null, true);

// Create a new array with request option objs for each month.
let request_options = months.map(month => makeRequestOptionsObj(base_url, year, month, api_key));
request_options.map(makeThrottledRequest);