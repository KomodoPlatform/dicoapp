// Tests for the links publications
//
// https://guide.meteor.com/testing.html

import { assert } from 'chai';
import { Swapdata } from '../swapdata.js';
import { PublicationCollector } from 'meteor/johanbrook:publication-collector';
import './publications.js';

describe('swapdata publications', function () {
  beforeEach(function () {
    Swapdata.remove({});
    Swapdata.insert({
      title: 'meteor homepage',
      url: 'https://www.meteor.com',
    });
  });

  describe('swapdata.all', function () {
    it('sends all tradedata', function (done) {
      const collector = new PublicationCollector();
      collector.collect('swapdata.all', (collections) => {
        assert.equal(collections.swapdata.length, 1);
        done();
      });
    });
  });
});
