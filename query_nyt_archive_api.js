const Bottleneck = require('bottleneck');
const util = require('util');
const jsonfile = require('jsonfile');
const request = require('request');
const promiseRetry = require('promise-retry');

// This stuff could be wrapped in a cmd-line param or class config
const base_url = 'http://api.nytimes.com/svc/archive/v1'
// const base_url = 'http://localhost:53821/svc/archive/v1'
const api_key = '772925f7d490445fa8a6b1be09ec262a'
const months = [1,2];
const year = 1985;

function makeRequestOptionsObj(base_url, year, month, api_key) {
    let uri_constructed = util.format('%s/%s/%s.json', base_url, year, month);
    return {
        uri: uri_constructed,
        qs: { 'api-key': api_key },
        headers: { 'User-Agent': 'Request-Promise' },
        json: true
    }
}

function makeRequest(options) {
    // Returns request wrapped in Promise
    return new Promise((resolve, reject) => {
        request.get(options, (error, response, body) => {
            if (error || typeof (body) !== 'object') {
                console.log(options.uri + ' request failed, throwing error');
                reject(error);
            }
            resolve(body);
        })
    });
}

function makeRetryRequest(options) {
    // Returns makeRequest Promise wrapped in Retry Promise
    return promiseRetry(function(retry) {
        return makeRequest(options).catch(retry);
    });
}

function makeThrottledRequest(options) {
    console.log(options.uri + ' in makeThrottledRequest');
    return limiter.schedule(makeRetryRequest, options)
}

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
var limiter = new Bottleneck(10, 3000, null, null, true);

function queryYearOfData(year, api_key) {
    // Create a new array with request option objs for each month.
    let request_options = months.map(month => makeRequestOptionsObj(base_url, year, month, api_key));

    return Promise.all(request_options.map(makeThrottledRequest))
    .then((resolved_responses) => {
        console.log('Promise.all() Has resolved.');
        console.log(resolved_responses.length);
        let merged_docs = [];
        resolved_responses.forEach(response => {
            response['response']['docs'].forEach(doc => {
                merged_docs.push(doc);
            });
        });
        return(merged_docs);
    })
    .catch((error) => console.log(error));
}

docs1985 = queryYearOfData(1985, api_key);
docs1985.then(docs => console.log(docs))