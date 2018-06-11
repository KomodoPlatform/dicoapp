// Definition of the links collection

import { Mongo } from 'meteor/mongo';

const TransactionsRemote = new Mongo.Collection('transactions');
const TransactionsLocal = new Mongo.Collection(null);

export const Transactions = Meteor.isDesktop ? TransactionsLocal : TransactionsRemote;