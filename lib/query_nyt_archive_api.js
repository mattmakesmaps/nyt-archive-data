const Bottleneck = require('bottleneck');
const promiseRetry = require('promise-retry');
const request = require('request');
const util = require('util');

const base_url = 'http://api.nytimes.com/svc/archive/v1'
// const base_url = 'http://localhost:53821/svc/archive/v1'
const months = [1,2];

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
                // console.log(options.uri + ' request failed, throwing error');
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
    return limiter.schedule(makeRetryRequest, options)
}

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
var limiter = new Bottleneck(10, 5000, null, null, true);

module.exports = function queryNYTArchiveAPI(year, api_key) {
    // Create a new array with request option objs for each month.
    let request_options = months.map(month => makeRequestOptionsObj(base_url, year, month, api_key));

    return Promise.all(request_options.map(makeThrottledRequest))
    .then((resolved_responses) => {
        return new Promise((resolve, reject) => {
            let merged_docs = [];
            resolved_responses.forEach(response => {
                response['response']['docs'].forEach(doc => {
                    merged_docs.push(doc);
                });
            });
            resolve({"docs": merged_docs});
        });
    })
    .catch((error) => console.log(error));
}