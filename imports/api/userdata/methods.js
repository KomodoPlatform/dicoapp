// Methods related to links

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Userdata } from './userdata.js';

Meteor.methods({
  'userdata.insert'(title, url) {
    check(url, String);
    check(title, String);

    return Userdata.insert({
      url,
      title,
      createdAt: new Date(),
    });
  },
});
