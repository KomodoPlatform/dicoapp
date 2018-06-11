// Tests for the behavior of the Userdata collection
//
// https://guide.meteor.com/testing.html

import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Userdata } from './userdata.js';


if (Meteor.isServer) {
  describe('userdata collection', function () {
    it('insert correctly', function () {
      const linkId = Userdata.insert({
        title: 'meteor homepage',
        url: 'https://www.meteor.com',
      });
      const added = Userdata.find({ _id: linkId });
      const collectionName = added._getCollectionName();
      const count = added.count();

      assert.equal(collectionName, 'userdata');
      assert.equal(count, 1);
    });
  });
}
