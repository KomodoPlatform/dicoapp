import './seed.html';

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import Clipboard from 'clipboard';
import '../animations/sloader.html';
import wordlist from '../../../api/config/wordlist.js';
import { Random } from 'meteor/random';
import shajs from 'sha.js';
import bs58 from 'bs58';

Template.seed.onCreated(function () {
  // Meteor.subscribe('userdata.all');
  // Meteor.subscribe('swapdata.all');
  // Session.set("currentcoin", "KMD");
});

Template.seed.onRendered(function() {
  var clipboard = new Clipboard('.copy-seed');
});

Template.registerHelper('loading', function() {
  return Session.get("loading");
});

Template.seed.helpers({
  seed: function(){
    return Session.get("seed");
  },
  wif: function(){
    return Session.get("wif");
  },
});

Template.registerHelper('formatDate', function(date) {
  return moment(date).format('MM-DD-YYYY');
});

Template.seed.events({
"click .btn-seed": function (event, template) {
  var seed = "";
  for(i=0; i<14; i++){
    var buf = Random.choice(wordlist);
    seed+=seed.search(buf) < 0 ? buf + " " : "";
  }
  Session.set("seed", seed.trim());

  function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

  function toByteArray(hexString) {
    var result = [];
    while (hexString.length >= 2) {
      result.push(parseInt(hexString.substring(0, 2), 16));
      hexString = hexString.substring(2, hexString.length);
    }
    return result;
  }

  let seedhash = shajs('sha256').update(seed.trim()).digest('hex');
  var result = [];

  while (seedhash.length >= 2) {
    result.push(parseInt(seedhash.substring(0, 2), 16));
    seedhash = seedhash.substring(2, seedhash.length);
  }

  result[0] &= 248;
  result[31] &= 127;
  result[31] |= 64;

  pre2 = 0xff & 188;
  pre = pre2.toString(16);

  var hash = [];
  for (var i = 0; i < (result.length + 2); i++)
  {
    hash[i] = (i == 0 ? (0xff & 188) : i == (result.length + 1) ? (0xff & 1) : result[i-1]);
  }

  const doublesha = shajs('sha256').update(toByteArray(shajs('sha256').update(hash).digest('hex'))).digest('hex');
  const priv= toHexString(hash) + doublesha.substr(0, 8);
  const wif = bs58.encode(toByteArray(priv));
  Session.set("wif", wif);


 }
});
