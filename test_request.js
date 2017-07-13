const query_nyt = require('./lib/query_nyt_archive_api.js');
const jsonfile = require('jsonfile');
const util = require('util');
const api_key = '772925f7d490445fa8a6b1be09ec262a';
// const year = 1985;

years = [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999];

years.forEach((year) => {
    let q = query_nyt(api_key, year);
    q.then((data) => {
        console.log('Done!');
        let path = util.format('./data-by-year/%s.json', year);
        jsonfile.writeFile(path, data, function (err) { console.error(err) });
    }).catch((error) => { console.log(error) });
});