// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Userdata } from '../userdata.js';

Meteor.publish('userdata.all', function () {
  return Userdata.find();
});
