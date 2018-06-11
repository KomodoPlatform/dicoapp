// Definition of the links collection

import { Mongo } from 'meteor/mongo';

const SwapdataRemote = new Mongo.Collection('swapdata');
const SwapdataLocal = new Mongo.Collection(null);
export const Swapdata = Meteor.isDesktop ? SwapdataLocal : SwapdataRemote;

