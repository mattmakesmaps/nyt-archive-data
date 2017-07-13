const expect = require('chai').expect;
const nock = require('nock');
const query_nyt = require('../lib/query_nyt_archive_api.js');

describe('Retry Conditions', function () {
    afterEach(function () {
        nock.cleanAll();
    });

    it('Should Retry after a 429 HTTP Response.', function () {
        let apiSuccessResponse = { "response": { "docs": [{ "test_key": "test_value" }] } };
        let apiRateExceededResponse = {"message":"API rate limit exceeded"};

        // You can chain multiple gets to create different interceptors for the same URL
        nock('http://api.nytimes.com/svc/archive/v1')
            .get(/\/1985\/\d+.json/) //match any number, including nonsensical months
            .query({ 'api-key': 1234 })
            .reply(429, apiRateExceededResponse)
            .get(/\/1985\/\d+.json/) //match any number, including nonsensical months
            .query({ 'api-key': 1234 })
            .reply(200, apiSuccessResponse);

        return query_nyt('1234', 1985, [10]).then((data) => {
            // Check if response is an object
            expect(data).to.be.an('object');
            expect(data['docs']).to.have.lengthOf(1);
        })
    });
})

describe('GET NYT Docs', function () {
    beforeEach(function () {
        // Ripped from API Docs: https://developer.nytimes.com/archive_api.json
        let apiResponse = {
            "response": {
                "docs": [
                    {
                        "web_url": "string",
                        "snippet": "string",
                        "lead_paragraph": "string",
                        "abstract": "string",
                        "print_page": "string",
                        "blog": [
                            ""
                        ],
                        "source": "string",
                        "headline": {
                            "main": "string",
                            "kicker": "string"
                        },
                        "keywords": {
                            "rank": "string",
                            "name": "string",
                            "value": "string"
                        },
                        "pub_date": "string",
                        "document_type": "string",
                        "news_desK": "string",
                        "section_name": "string",
                        "subsection_name": "string",
                        "byline": {
                            "organization": "string",
                            "original": "string",
                            "person": [
                                ""
                            ]
                        },
                        "type_of_material": "string",
                        "_id": "string",
                        "word_count": "string",
                        "slideshow_credits": "string",
                        "multimedia": [
                            {
                                "url": "string",
                                "format": "string",
                                "height": 0,
                                "width": 0,
                                "type": "string",
                                "subtype": "string",
                                "caption": "string",
                                "copyright": "string"
                            }
                        ]
                    }
                ],
                "meta": {
                    "hits": 0,
                    "time": 0,
                    "offset": 0
                }
            }
        };

        nock('http://api.nytimes.com/svc/archive/v1')
            .persist() // allows nock "interceptor" to be reused.
            .get(/\/1985\/\d+.json/) //match any number, including nonsensical months
            .query({ 'api-key': 1234 })
            .reply(200, apiResponse);
    });

    afterEach(function () {
        // reset nocks
        nock.cleanAll();
    });

    this.timeout(120000); //NOTE: Not really needed when mocking response.

    it('Should resolve an object of NYT Articles.', function () {
        return query_nyt('1234', 1985, [10]).then((data) => {
            // Check if response is an object
            expect(data).to.be.an('object');
            expect(data['docs']).to.have.lengthOf(1);
        })
    });

    it('Should default to 12 months if not specified by the user.', function () {
        return query_nyt('1234', 1985).then((data) => {
            expect(data).to.be.an('object');
            // nock-mock should return one article for each month (12 months)
            expect(data['docs']).to.have.lengthOf(12);
        })
    });
});