// Tests for the links publications
//
// https://guide.meteor.com/testing.html

import { assert } from 'chai';
import { Userdata } from '../userdata.js';
import { PublicationCollector } from 'meteor/johanbrook:publication-collector';
import './publications.js';

describe('userdata publications', function () {
  beforeEach(function () {
    Userdata.remove({});
    Userdata.insert({
      title: 'meteor homepage',
      url: 'https://www.meteor.com',
    });
  });

  describe('userdata.all', function () {
    it('sends all userdata', function (done) {
      const collector = new PublicationCollector();
      collector.collect('userdata.all', (collections) => {
        assert.equal(collections.userdata.length, 1);
        done();
      });
    });
  });
});
