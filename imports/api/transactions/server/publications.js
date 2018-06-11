// All links-related publications

import { Meteor } from 'meteor/meteor';
import { Transactions } from '../transactions.js';

Meteor.publish('transactions.all', function () {
  return Transactions.find();
});
