// Tests for links methods
//
// https://guide.meteor.com/testing.html

import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Swapdata } from './swapdata.js';
import './methods.js';

if (Meteor.isServer) {
  describe('swapdata methods', function () {
    beforeEach(function () {
      Swapdata.remove({});
    });

    it('can add a new swapdata', function () {
      const addTradedata = Meteor.server.method_handlers['swapdata.insert'];

      addTradedata.apply({}, ['meteor.com', 'https://www.meteor.com']);

      assert.equal(Swapdata.find().count(), 1);
    });
  });
}
