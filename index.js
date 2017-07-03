// Literally straight from the docs.
// https://www.npmjs.com/package/request-promise
// http://api.nytimes.com/svc/archive/v1/2016/11.json?api-key={your-api-key}

// LET'S TRY THIS: https://www.npmjs.com/package/bottleneck
const rp = require('request-promise');
const throttle = require('promise-ratelimit')(5000);

var options = {
    uri: 'http://api.nytimes.com/svc/archive/v1/1984/8.json',
    qs: {
        'api-key': '772925f7d490445fa8a6b1be09ec262a' // -> uri + '?access_token=xxxxx%20xxxxx' 
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response 
};

var options2 = {
    uri: 'http://api.nytimes.com/svc/archive/v1/1909/8.json',
    qs: {
        'api-key': '772925f7d490445fa8a6b1be09ec262a' // -> uri + '?access_token=xxxxx%20xxxxx' 
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response 
};

function makeThrottledRequest(option_obj) {
    // I think what is happening here is that
    // both requests are going off at nearly the same time,
    // just after a 5 second delay.
    return throttle().then(rp(option_obj));
}


function makeRequests(option_array) {
    // Given an array of promises, return Promise.all()
    console.log('Executing makeRequests');
    return Promise.all(option_array.map(makeThrottledRequest));
}; 

var data = makeRequests([options, options2]);
console.log(data);

data.then(values => { 
  console.log(values);
}, reason => {
  console.log(reason)
});

// rp(options2)
//     .then(function (response) {
//         console.log('1901 Response Fin');
//     })
//     .catch(function (err) {
//         // API call failed... 
//     });
// rp(options)
//     .then(function (response) {
//         console.log('1986 Response Fin');
//     })
//     .catch(function (err) {
//         // API call failed... 
//     });
