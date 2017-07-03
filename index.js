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
        }
    }
}

let request_options = [];
months.forEach(function (month) {
    request_options.push(makeRequestOptionsObj(base_url, year, month, api_key))
})

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
var limiter = new Bottleneck(10, 3000, null, null, true);

function makeThrottledRequest(option_obj) {
    console.log('in makeThrottledRequest');
    console.log(option_obj);
    function rp2 (option_obj) {
        console.log('in rp2');
        return rp(option_obj).catch(err => {console.log('rp2 rp error')});
    };
    return limiter.schedule(rp2, option_obj).catch(err => {console.log('schedule error')});
}

function makeRequests(option_array) {
    // Given an array of promises, return Promise.all()
    console.log('Executing makeRequests');
    return Promise.all(option_array.map(makeThrottledRequest));
};

makeRequests(request_options).then(responses => {
    // Write out `docs` array for each month to a single json file for the year.
    let path = util.format('./data-by-year/%s.json', year);

    let merged_docs = [];
    // responses.forEach(response => {
    //     let response_json = JSON.parse(response);
    //     response_json['response']['docs'].forEach(doc => {
    //         merged_docs.push(doc);
    //     });
    // });

    // jsonfile.writeFile(path, { "docs": merged_docs }, function (err) { console.error(err) });
    fs.writeFile(path, responses);
    console.timeEnd('execution');
}).catch(err => {
    console.log(err);
});