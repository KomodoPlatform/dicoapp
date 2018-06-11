// Tests for the links publications
//
// https://guide.meteor.com/testing.html

import { assert } from 'chai';
import { Transactions } from '../transactions.js';
import { PublicationCollector } from 'meteor/johanbrook:publication-collector';
import './publications.js';

describe('transactions publications', function () {
  beforeEach(function () {
    Transactions.remove({});
    Transactions.insert({
      title: 'meteor homepage',
      url: 'https://www.meteor.com',
    });
  });

  describe('transactions.all', function () {
    it('sends all transactions', function (done) {
      const collector = new PublicationCollector();
      collector.collect('transactions.all', (collections) => {
        assert.equal(collections.transactions.length, 1);
        done();
      });
    });
  });
});
