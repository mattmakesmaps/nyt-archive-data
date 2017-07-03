// Literally straight from the docs.
// https://www.npmjs.com/package/request-promise
// http://api.nytimes.com/svc/archive/v1/2016/11.json?api-key={your-api-key}
// https://www.npmjs.com/package/bottleneck

console.time('execution');
const rp = require('request-promise');
const Bottleneck = require('bottleneck');
const util = require('util');
const jsonfile = require('jsonfile');

// This stuff could be wrapped in a cmd-line param or class config
const base_url = 'http://api.nytimes.com/svc/archive/v1'
const api_key = '772925f7d490445fa8a6b1be09ec262a'
const months = [1,2];
const year = 1985;

function makeRequestOptionsObj (base_url, year, month, api_key) {
    let uri_constructed = util.format('%s/%s/%s.json', base_url, year, month);
    return {
        uri: uri_constructed,
        qs: {
            'api-key': api_key // -> uri + '?access_token=xxxxx%20xxxxx' 
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response 
    }
}

let request_options = [];
months.forEach(function(month) {
    request_options.push(makeRequestOptionsObj(base_url, year, month, api_key))
})

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
var limiter = new Bottleneck(10, 3000, null, null, true);

function makeThrottledRequest(option_obj) {
    return limiter.schedule(rp, option_obj);
}

function makeRequests(option_array) {
    // Given an array of promises, return Promise.all()
    console.log('Executing makeRequests');
    return Promise.all(option_array.map(makeThrottledRequest));
}; 

var data = makeRequests(request_options);

// Called after Promise.all() is fufilled
data.then(responses => { 
  // Write out `docs` array for each month to a single json file for the year.
  let path = util.format('./data-by-year/%s.json', year);

  let merged_docs = [];
  responses.forEach(response => {
      console.log(response);
      response['response']['docs'].forEach(doc => {
          merged_docs.push(doc);
      });
    });

  jsonfile.writeFile(path, {"docs": merged_docs}, function (err) {console.error(err)});
  console.timeEnd('execution');
}, reason => {
  console.log(reason)
});