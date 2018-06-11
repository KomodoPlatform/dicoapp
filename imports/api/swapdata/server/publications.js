// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Swapdata } from '../swapdata.js';

Meteor.publish('swapdata.all', function () {
  return Swapdata.find();
});
