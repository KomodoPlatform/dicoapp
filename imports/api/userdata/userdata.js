// Definition of the links collection

import { Mongo } from 'meteor/mongo';

const UserdataRemote = new Mongo.Collection('userdata');
const UserdataLocal = new Mongo.Collection(null);

export const Userdata = Meteor.isDesktop ? UserdataLocal : UserdataRemote;