// Definition of the links collection

import { Mongo } from 'meteor/mongo';

const TradedataRemote = new Mongo.Collection('tradedata');
const TradedataLocal = new Mongo.Collection(null);
export const Tradedata = Meteor.isDesktop ? TradedataLocal : TradedataRemote;