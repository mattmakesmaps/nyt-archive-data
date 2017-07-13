const Bottleneck = require('bottleneck');
const promiseRetry = require('promise-retry');
const request = require('request');
const util = require('util');

const baseURL = 'http://api.nytimes.com/svc/archive/v1';
// const baseURL = 'http://localhost:53821/svc/archive/v1';

function makeRequestOptionsObj(apiURL, year, month, apiKey) {
  const uriConstructed = util.format('%s/%s/%s.json', baseURL, year, month);
  return {
    uri: uriConstructed,
    qs: { 'api-key': apiKey },
    headers: { 'User-Agent': 'Request-Promise' },
    json: true,
  };
}

function makeRequest(options) {
    // Returns request wrapped in Promise
  return new Promise((resolve, reject) => {
    request.get(options, (error, response, body) => {
      if (error || typeof (body) !== 'object' || response.statusCode !== 200) {
        // console.log(options.uri + ' request failed, throwing error');
        reject(error);
      }
      resolve(body);
    });
  });
}

function makeRetryRequest(options) {
    // Returns makeRequest Promise wrapped in Retry Promise
  return promiseRetry(retry => makeRequest(options).catch(retry));
}

// 10 concurrent requests, 3000ms between requests, rejectOnDrop is true
const limiter = new Bottleneck(10, 5000, null, null, true);

function makeThrottledRequest(options) {
  return limiter.schedule(makeRetryRequest, options);
}


// Defaults to all months if not specified
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
module.exports = function queryNYTArchiveAPI(apiKey, year, monthArray = months) {
    // Create a new array with request option objs for each month.
  const requestOpts = monthArray.map(month => makeRequestOptionsObj(baseURL, year, month, apiKey));

  return Promise.all(requestOpts.map(makeThrottledRequest))
        .then(resolvedResponses => new Promise((resolve) => {
          const mergedDocs = [];
          resolvedResponses.forEach((response) => {
            response.response.docs.forEach((doc) => {
              mergedDocs.push(doc);
            });
          });
          resolve({ docs: mergedDocs });
        }))
        .catch(error => console.log(`Error!${error}`));
};
