const rp = require('request-promise');
const util = require('util');

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
// Function that:
// - Makes a request
// - then checks if the response is valid json
// - if not, throw an error
    return rp(options)
    .then((response) => {
        // Change to === 'number' to force an error
        if (typeof(response) === 'number') {
            console.log('Reponse contained valid JSON');
            return response;
        } else {
            console.log('in rp.then() error');
            throw "this is the error";
        }
    })
    // This will catch an error `thrown` in the `then` above.
    .catch((error) => {
        // Place this request back into the queue.
        console.log('in the rp.catch() error');
        throw error;
    });
}

let request_params = makeRequestOptionsObj(base_url, 1985, 1, api_key);

let response = makeRequest(request_params)
    .then((value) => {
        console.log('Chained response');
    })
    .catch((error) => {
        console.log('in the makeRequest.catch() error');
        console.log(error);
    })

// This prints:
// in rp.then() error
// in the rp.catch() error
// in the makeRequest.catch() error
// this is the error