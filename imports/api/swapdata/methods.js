// Methods related to links

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Swapdata } from './swapdata.js';

Meteor.methods({
  'swapdata.insert'(title, url) {
    check(url, String);
    check(title, String);

    return Swapdata.insert({
      url,
      title,
      createdAt: new Date(),
    });
  },
});
