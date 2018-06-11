// Tests for the behavior of the tradedata collection
//
// https://guide.meteor.com/testing.html

import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Tradedata } from './tradedata.js';

if (Meteor.isServer) {
  describe('tradedata collection', function () {
    it('insert correctly', function () {
      const linkId = Tradedata.insert({
        title: 'meteor homepage',
        url: 'https://www.meteor.com',
      });
      const added = Tradedata.find({ _id: linkId });
      const collectionName = added._getCollectionName();
      const count = added.count();

      assert.equal(collectionName, 'tradedata');
      assert.equal(count, 1);
    });
  });
}
