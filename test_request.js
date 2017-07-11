const query_nyt = require('./query_nyt_archive_api.js');
const jsonfile = require('jsonfile');
const util = require('util');
const api_key = '772925f7d490445fa8a6b1be09ec262a';
const year = 1985;

let q = query_nyt(year, api_key);
console.log('q: ' + q);

q.then((data) => {
    console.log('Done!');
    let path = util.format('./data-by-year/%s.json', year);
    jsonfile.writeFile(path, data, function (err) { console.error(err) });
}).catch((error) => {console.log(error)});