//TODO: Need to implement a re-try if the response is not JSON Object, but string

console.time('execution');
const rp = require('request-promise');
const Bottleneck = require('bottleneck');
const util = require('util');
const jsonfile = require('jsonfile');
const Promise = require("bluebird");
const fs = require('fs');

Promise.longStackTraces();
// This stuff could be wrapped in a cmd-line param or class config
const base_url = 'http://api.nytimes.com/svc/archive/v1'
// const base_url = 'http://localhost:53821/svc/archive/v1'
const api_key = '772925f7d490445fa8a6b1be09ec262a'
const months = [1,2,3,4,5,6,7,8,9,10,11,12];
const year = 1985;

let months_processed = 0;


function makeRequestOptionsObj(base_url, year, month, api_key) {
    let uri_constructed = util.format('%s/%s/%s.json', base_url, year, month);
    return {
        uri: uri_constructed,
        qs: {
            'api-key': api_key // -> uri + '?access_token=xxxxx%20xxxxx' 
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    }
}

let request_options = [];
months.forEach(function (month) {
    request_options.push(makeRequestOptionsObj(base_url, year, month, api_key))
})

let merged_docs = [];

function makeRequest(options) {
// Function that:
// - Makes a request
// - then checks if the response is valid json
// - retry if response is not valid json 
    return rp(options)
    .then((response) => {
        // Change to === 'number' to force an error
        if (typeof(response) === 'object') {
            console.log(options.uri + 'Reponse contained valid JSON');
            // increment months_processed
            months_processed++;
            // add docs to merged_docs array
            response['response']['docs'].forEach(doc => {
                merged_docs.push(doc);
            });
            // this can probably go into a separate function
            if (months_processed === months.length) {
                let path = util.format('./data-by-year/%s.json', year);
                jsonfile.writeFile(path, { "docs": merged_docs }, function (err) { console.error(err) });
            }
            return response;
        } else {
            console.log(options.uri + ' request failed, retrying');
            limiter.schedule(makeRequest, options);
        }
    })
    // This will catch an error `thrown` in the `then` above.
    .catch((error) => {
        console.log('in the rp.catch() error');
        throw error;
    });
}

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
var limiter = new Bottleneck(10, 3000, null, null, true);

function makeThrottledRequest(options) {
    console.log(options.uri + ' in makeThrottledRequest');
    return limiter.schedule(makeRequest, options).catch(err => {console.log(err)});
}


// function makeRequests(option_array) {
//     // Given an array of promises, return Promise.all()
//     console.log('Executing makeRequests');
//     return Promise.all(option_array.map(makeThrottledRequest));
// };

request_options.map(makeThrottledRequest);
// makeRequests(request_options).then(responses => {
//     // MK NOTE: So yeah, if new requests are going to be added using makeRequest method,
//     // they will complete after all of the original requests have fulfilled their promises,
//     // therefore the finished JSON will not be written since this has already executed.

//     // Write out `docs` array for each month to a single json file for the year.
//     let path = util.format('./data-by-year/%s.json', year);

//     // responses.forEach(response => {
//     // });

//     // jsonfile.writeFile(path, { "docs": merged_docs }, function (err) { console.error(err) });
//     fs.writeFile(path, responses);
//     console.timeEnd('execution');
// }).catch(err => {
//     console.log(err);
// });