const util = require('util');
const request = require('request');
const promiseRetry = require('promise-retry');

const base_url = 'http://localhost:53821/svc/archive/v1'
const api_key = '772925f7d490445fa8a6b1be09ec262a'
const months = [1, 2];
const year = 1985;

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

let request_params = makeRequestOptionsObj(base_url, 1985, 1, api_key);

let response = makeRetryRequest(request_params)
    .then((value) => {
        console.log('Chained response');
    })
    .catch((error) => {
        console.log('in the makeRequest.catch() error');
        console.log(error);
    })

// A pending promise
console.log(response);
