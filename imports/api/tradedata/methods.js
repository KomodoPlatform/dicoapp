// Methods related to links

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Tradedata } from './tradedata.js';

Meteor.methods({
  'tradedata.insert'(title, url) {
    check(url, String);
    check(title, String);

    return Tradedata.insert({
      url,
      title,
      createdAt: new Date(),
    });
  },
});
