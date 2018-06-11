// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Tradedata } from '../tradedata.js';

Meteor.publish('tradedata.all', function () {
  return Tradedata.find();
});
