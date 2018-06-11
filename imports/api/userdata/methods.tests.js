// Tests for links methods
//
// https://guide.meteor.com/testing.html

import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Userdata } from './userdata.js';
import './methods.js';

if (Meteor.isServer) {
  describe('userdata methods', function () {
    beforeEach(function () {
      Userdata.remove({});
    });

    it('can add new userdata', function () {
      const addUserdata = Meteor.server.method_handlers['userdata.insert'];

      addUserdata.apply({}, ['meteor.com', 'https://www.meteor.com']);

      assert.equal(Userdata.find().count(), 1);
    });
  });
}
