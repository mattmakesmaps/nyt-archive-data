const expect = require('chai').expect;
const nock = require('nock');
const query_nyt = require('../lib/query_nyt_archive_api.js');

// TODO: Add in nock mock
describe('GET NYT Docs', function () {
    this.timeout(30000);
    it('Should resolve an object of NYT Articles', function () {
        return query_nyt(1985, '772925f7d490445fa8a6b1be09ec262a').then((data) => {
            // Check if resposne is an object
            expect(data).to.be.an('object');
        })
    })
});