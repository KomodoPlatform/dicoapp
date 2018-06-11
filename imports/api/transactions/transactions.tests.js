// Tests for the behavior of the transactions collection
//
// https://guide.meteor.com/testing.html

import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Transactions } from './transactions.js';

if (Meteor.isServer) {
  describe('transactions collection', function () {
    it('insert correctly', function () {
      const linkId = Transactions.insert({
        title: 'meteor homepage',
        url: 'https://www.meteor.com',
      });
      const added = Transactions.find({ _id: linkId });
      const collectionName = added._getCollectionName();
      const count = added.count();

      assert.equal(collectionName, 'transactions');
      assert.equal(count, 1);
    });
  });
}
