// Methods related to links

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Transactions } from './transactions.js';

Meteor.methods({
  'transactions.insert'(title, url) {
    check(url, String);
    check(title, String);

    return Transactions.insert({
      url,
      title,
      createdAt: new Date(),
    });
  },
});
